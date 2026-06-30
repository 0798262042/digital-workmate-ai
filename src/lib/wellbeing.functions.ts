import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TranslateInput = z.object({
  text: z.string().min(1).max(8000),
  targetLanguage: z.string().min(1).max(50),
  tone: z.string().max(50).optional(),
});

const Schema = z.object({
  translated: z.string().describe("The translated text"),
  notes: z.string().describe("Brief cultural or register note. Use empty string if none."),
});

export const translateText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => TranslateInput.parse(input))
  .handler(async ({ data }) => {
    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { object: output } = await generateObject({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: `You are a professional workplace translator. Translate accurately while preserving meaning, register, and cultural nuance.`,
      prompt: `Translate the following text into ${data.targetLanguage}${data.tone ? ` in a ${data.tone} tone` : ""}. Add a brief cultural / register note in 'notes'.\n\nText:\n${data.text}`,
      schema: Schema,
    });
    return output;
  });

const MoodInput = z.object({ text: z.string().min(1).max(2000) });
const MoodSchema = z.object({
  stressLevel: z.number().min(1).max(5),
  mood: z.string(),
  advice: z.array(z.string()),
  breakSuggestion: z.string(),
  timeTips: z.array(z.string()),
});

export const checkMood = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MoodInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { object: output } = await generateObject({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: "You are SmartDesk AI's wellbeing co-worker. Be warm, supportive, and practical. Not a medical professional.",
      prompt: `The user wrote about how they're feeling at work:\n"${data.text}"\n\nReturn stress level 1-5, a one-word mood, advice, a break suggestion, and time tips.`,
      schema: MoodSchema,
    });
    await context.supabase.from("productivity_events").insert({
      user_id: context.userId,
      kind: "mood_log",
      value_json: { mood: output.mood, stress: output.stressLevel },
    });
    return output;
  });

const BriefSchema = z.object({
  greeting: z.string(),
  focusOfTheDay: z.string(),
  quote: z.string(),
  reminders: z.array(z.string()),
});

export const dailyBrief = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date();
    const start = new Date(today); start.setHours(0,0,0,0);
    const end = new Date(today); end.setHours(23,59,59,999);

    const [{ data: tasks }, { data: meetings }, { data: profile }] = await Promise.all([
      context.supabase.from("tasks").select("title, priority, status, due_at").eq("user_id", context.userId).neq("status", "done").order("priority", { ascending: false }).limit(8),
      context.supabase.from("meetings").select("title, scheduled_at").eq("user_id", context.userId).gte("scheduled_at", start.toISOString()).lte("scheduled_at", end.toISOString()).order("scheduled_at").limit(5),
      context.supabase.from("profiles").select("full_name").eq("id", context.userId).maybeSingle(),
    ]);

    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { object: output } = await generateObject({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: "You are SmartDesk AI delivering a short, energising daily brief.",
      prompt: `User name: ${profile?.full_name ?? "there"}
Date: ${today.toDateString()}
Tasks today: ${(tasks ?? []).map((t) => `- [${t.priority}] ${t.title}`).join("\n") || "None"}
Meetings: ${(meetings ?? []).map((m) => `- ${m.title} at ${m.scheduled_at}`).join("\n") || "None"}`,
      schema: BriefSchema,
    });
    return output;
  });
