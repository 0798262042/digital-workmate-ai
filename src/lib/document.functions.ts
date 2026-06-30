import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DocInput = z.object({
  documentId: z.string().uuid(),
});

const DocSchema = z.object({
  summary: z.string(),
  importantDates: z.array(z.string()),
  deadlines: z.array(z.string()),
  names: z.array(z.string()),
  tasks: z.array(z.string()),
  keyPoints: z.array(z.string()),
});

export const analyzeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DocInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: doc, error } = await context.supabase
      .from("documents").select("*").eq("id", data.documentId).eq("user_id", context.userId).maybeSingle();
    if (error || !doc) throw new Error("Document not found");

    const { data: signed } = await context.supabase.storage.from("user-documents").createSignedUrl(doc.storage_path, 600);
    if (!signed?.signedUrl) throw new Error("Could not access document");

    const res = await fetch(signed.signedUrl);
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);

    const mime = doc.mime ?? "application/octet-stream";
    let prompt: Parameters<typeof generateText>[0]["messages"];

    if (mime === "application/pdf") {
      const b64 = btoa(String.fromCharCode(...bytes));
      prompt = [{
        role: "user",
        content: [
          { type: "text", text: "Analyse this document. Extract dates, deadlines, names, action items and a summary." },
          { type: "file", data: `data:application/pdf;base64,${b64}`, mediaType: "application/pdf", filename: doc.filename } as any,
        ],
      }];
    } else {
      // text/plain or docx fallback: decode as utf-8 text
      const text = new TextDecoder().decode(bytes).slice(0, 40000);
      prompt = [{ role: "user", content: `Analyse this document:\n\n${text}` }];
    }

    const { output } = await generateText({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: "You are SmartDesk AI's Document Analyzer.",
      messages: prompt as any,
      output: Output.object({ schema: DocSchema }),
    });

    await context.supabase.from("documents").update({ analysis_json: output }).eq("id", data.documentId);
    return output;
  });
