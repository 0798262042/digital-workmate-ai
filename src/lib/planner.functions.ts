import { createServerFn } from "@tanstack/react-start";
import { generateObject } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider, DEFAULT_CHAT_MODEL, requireGatewayKey } from "./ai-gateway.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlannerInput = z.object({
  workingHours: z.string().min(1).max(50),
  tasks: z.array(z.object({
    title: z.string(),
    priority: z.enum(["low", "medium", "high"]),
    estimatedMinutes: z.number().int().min(5).max(480).optional(),
    dueAt: z.string().optional(),
  })).min(1).max(30),
});

const PlannerSchema = z.object({
  morning: z.array(z.object({ time: z.string(), task: z.string() })),
  afternoon: z.array(z.object({ time: z.string(), task: z.string() })),
  breaks: z.array(z.string()),
  priorityMatrix: z.object({
    urgentImportant: z.array(z.string()),
    importantNotUrgent: z.array(z.string()),
    urgentNotImportant: z.array(z.string()),
    neither: z.array(z.string()),
  }),
  estimatedCompletion: z.string(),
  motivationalTip: z.string(),
});

export const buildPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlannerInput.parse(input))
  .handler(async ({ data }) => {
    const key = requireGatewayKey();
    const gateway = createLovableAiGatewayProvider(key);
    const { object: output } = await generateObject({
      model: gateway(DEFAULT_CHAT_MODEL),
      system: "You are SmartDesk AI building a focused daily plan. Balance priority, deep work, and breaks.",
      prompt: `Working hours: ${data.workingHours}\nTasks:\n${data.tasks.map((t, i) => `${i+1}. [${t.priority}] ${t.title}${t.estimatedMinutes ? ` (~${t.estimatedMinutes}m)` : ""}${t.dueAt ? ` due ${t.dueAt}` : ""}`).join("\n")}`,
      schema: PlannerSchema,
    });
    return output;
  });
