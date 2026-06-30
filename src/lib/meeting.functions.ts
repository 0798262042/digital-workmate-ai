import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PrepInput = z.object({
  title: z.string().min(1).max(200),
  attendees: z.array(z.string()).max(50),
  goal: z.string().max(500).optional(),
  durationMin: z.number().int().min(5).max(480).optional(),
  scheduledAt: z.string().optional(),
  save: z.boolean().optional(),
});

const PrepSchema = z.object({
  agenda: z.array(z.object({ item: z.string(), minutes: z.number() })),
  discussionPoints: z.array(z.string()),
  questions: z.array(z.string()),
  expectedOutcomes: z.array(z.string()),
  risks: z.array(z.string()),
});

export const prepareMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PrepInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: `You are SmartDesk AI helping prepare a workplace meeting.
Return concise, actionable items. The agenda must sum approximately to ${data.durationMin ?? 30} minutes.`,
      prompt: `Title: ${data.title}
Attendees: ${data.attendees.join(", ") || "Not specified"}
Goal: ${data.goal ?? "Not specified"}
Duration: ${data.durationMin ?? 30} minutes`,
      output: Output.object({ schema: PrepSchema }),
    });

    if (data.save) {
      await context.supabase.from("meetings").insert({
        user_id: context.userId,
        title: data.title,
        attendees: data.attendees,
        goal: data.goal ?? null,
        duration_min: data.durationMin ?? null,
        scheduled_at: data.scheduledAt ?? null,
        prep_json: output,
      });
    }
    return output;
  });

const SummaryInput = z.object({
  meetingId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  notes: z.string().min(20).max(20000),
});

const SummarySchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(z.object({ owner: z.string(), task: z.string(), dueAt: z.string() })),
  deadlines: z.array(z.string()),
});

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SummaryInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { output } = await generateText({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: "You are SmartDesk AI summarizing meeting notes into a clear, actionable summary.",
      prompt: `Meeting: ${data.title}\n\nNotes:\n${data.notes}`,
      output: Output.object({ schema: SummarySchema }),
    });

    if (data.meetingId) {
      await context.supabase.from("meetings").update({
        notes_text: data.notes,
        summary_json: output,
      }).eq("id", data.meetingId);
    } else {
      await context.supabase.from("meetings").insert({
        user_id: context.userId,
        title: data.title,
        notes_text: data.notes,
        summary_json: output,
        attendees: [],
      });
    }
    await context.supabase.from("productivity_events").insert({
      user_id: context.userId,
      kind: "meeting_attended",
      value_json: { title: data.title },
    });
    return output;
  });
