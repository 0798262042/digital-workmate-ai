import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ResearchInput = z.object({
  title: z.string().min(1).max(200),
  source: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("text"), text: z.string().min(20).max(60000) }),
    z.object({ kind: z.literal("url"), url: z.string().url() }),
  ]),
});

const ResearchSchema = z.object({
  summary: z.string(),
  keyFindings: z.array(z.string()),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  recommendations: z.array(z.string()),
  questions: z.array(z.string()),
  actionItems: z.array(z.string()),
});

export const analyzeResearch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ResearchInput.parse(input))
  .handler(async ({ data, context }) => {
    let text: string;
    let sourceRef: string | null = null;
    if (data.source.kind === "url") {
      sourceRef = data.source.url;
      try {
        const res = await fetch(data.source.url, { headers: { "user-agent": "SmartDeskAI/1.0" } });
        const html = await res.text();
        text = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .slice(0, 30000);
      } catch (e) {
        throw new Error(`Could not fetch the URL: ${(e as Error).message}`);
      }
    } else {
      text = data.source.text;
    }

    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { object: output } = await generateObject({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: "You are SmartDesk AI's Research Lab. Provide a sharp, actionable analysis.",
      prompt: `Title: ${data.title}\n\nContent:\n${text}`,
      schema: ResearchSchema,
    });

    await context.supabase.from("research_items").insert({
      user_id: context.userId,
      title: data.title,
      source_kind: data.source.kind,
      source_ref: sourceRef,
      source_text: data.source.kind === "text" ? text.slice(0, 4000) : null,
      analysis_json: output,
    });

    return output;
  });
