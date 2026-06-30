import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EmailInput = z.object({
  mode: z.enum(["generate", "improve", "rewrite", "shorten", "expand", "grammar", "translate"]),
  kind: z.string().min(1).max(50),
  tone: z.string().min(1).max(50),
  recipient: z.string().max(200).optional(),
  context: z.string().min(1).max(4000),
  targetLanguage: z.string().max(50).optional(),
});

export const generateEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => EmailInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);

    const sys = `You are SmartDesk AI, an expert workplace email writer.
Always return a valid JSON object with { "subject": string, "body": string }.
Style: ${data.tone}. Email kind: ${data.kind}. Mode: ${data.mode}.
${data.targetLanguage ? `Target language: ${data.targetLanguage}.` : ""}
Keep the body professional, well-structured with greeting and sign-off, and no longer than needed.`;

    const prompt = data.recipient
      ? `Recipient: ${data.recipient}\n\nContext / instructions:\n${data.context}`
      : data.context;

    const { object: output } = await generateObject({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: sys,
      prompt,
      schema: z.object({
          subject: z.string(),
          body: z.string(),,
      }),
    });

    // persist
    await context.supabase.from("emails").insert({
      user_id: context.userId,
      kind: data.kind,
      tone: data.tone,
      recipient: data.recipient ?? null,
      subject: output.subject,
      body: output.body,
      source_prompt: data.context,
    });
    await context.supabase.from("productivity_events").insert({
      user_id: context.userId,
      kind: "email_written",
      value_json: { kind: data.kind, tone: data.tone },
    });

    return output;
  });
