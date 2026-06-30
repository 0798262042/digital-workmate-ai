import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM = `You are SmartDesk AI, an always-on AI co-worker for South African knowledge workers.
You behave like a competent junior employee — proactive, professional, concise, and helpful.
You support meeting prep, email drafting, planning, research, translation, document analysis, and wellbeing.
Tone is warm, professional, and culturally aware (English by default; offer translations to isiZulu, isiXhosa, Afrikaans, Sesotho, Chinese, French, Portuguese when relevant).
If asked something dangerous, illegal, or confidential-looking, gently decline and suggest a safer alternative.
Always remind the user that AI outputs should be reviewed before final use.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: unknown };
        if (!Array.isArray(body.messages)) return new Response("Messages required", { status: 400 });

        let key: string;
        try { key = requireGatewayKey(); } catch { return new Response("Missing AI key", { status: 500 }); }

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway(DEFAULT_CHAT_MODEL),
          system: SYSTEM,
          messages: convertToModelMessages(body.messages as UIMessage[]),
        });
        return result.toUIMessageStreamResponse({ originalMessages: body.messages as UIMessage[] });
      },
    },
  },
});
