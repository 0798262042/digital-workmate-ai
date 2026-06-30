import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const [tasks, events] = await Promise.all([
      context.supabase.from("tasks").select("status, completed_at, due_at, created_at").eq("user_id", context.userId),
      context.supabase.from("productivity_events").select("kind, occurred_at").eq("user_id", context.userId).gte("occurred_at", since.toISOString()),
    ]);

    const allTasks = tasks.data ?? [];
    const allEvents = events.data ?? [];

    const completed = allTasks.filter(t => t.status === "done").length;
    const total = allTasks.length;
    const overdue = allTasks.filter(t => t.status !== "done" && t.due_at && new Date(t.due_at) < new Date()).length;
    const emails = allEvents.filter(e => e.kind === "email_written").length;
    const meetings = allEvents.filter(e => e.kind === "meeting_attended").length;

    const completionRate = total > 0 ? completed / total : 0;
    const score = Math.round(Math.min(100, completionRate * 60 + Math.min(emails, 10) * 2 + Math.min(meetings, 10) * 2 - overdue * 5));

    // daily series last 7 days
    const days: { date: string; tasks: number; emails: number; meetings: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const next = new Date(d); next.setDate(d.getDate()+1);
      const label = d.toLocaleDateString("en-ZA", { weekday: "short" });
      days.push({
        date: label,
        tasks: allTasks.filter(t => t.completed_at && new Date(t.completed_at) >= d && new Date(t.completed_at) < next).length,
        emails: allEvents.filter(e => e.kind === "email_written" && new Date(e.occurred_at) >= d && new Date(e.occurred_at) < next).length,
        meetings: allEvents.filter(e => e.kind === "meeting_attended" && new Date(e.occurred_at) >= d && new Date(e.occurred_at) < next).length,
      });
    }

    return {
      score: Math.max(0, score),
      completed, total, overdue, emails, meetings,
      series: days,
    };
  });
