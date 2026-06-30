import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getInsights } from "@/lib/insights.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { LineChart, ListChecks, Mail, CalendarDays } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Insights · SmartDesk AI" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const fn = useServerFn(getInsights);
  const { data, isLoading } = useQuery({ queryKey: ["insights"], queryFn: () => fn() });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><LineChart className="h-6 w-6 text-primary" /> Productivity Insights</h1>
        <p className="text-sm text-muted-foreground">Like a fitness tracker for your work.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={LineChart} label="Score" value={`${data?.score ?? 0}%`} />
        <Stat icon={ListChecks} label="Tasks done" value={data?.completed ?? 0} />
        <Stat icon={Mail} label="Emails (7d)" value={data?.emails ?? 0} />
        <Stat icon={CalendarDays} label="Meetings (7d)" value={data?.meetings ?? 0} />
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Last 7 days</CardTitle></CardHeader>
        <CardContent className="h-72">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.series ?? []}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.22 285)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="oklch(0.65 0.22 285)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="oklch(0.65 0.18 250)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                <Area type="monotone" dataKey="tasks" stroke="oklch(0.65 0.22 285)" fill="url(#g1)" name="Tasks" />
                <Area type="monotone" dataKey="emails" stroke="oklch(0.65 0.18 250)" fill="url(#g2)" name="Emails" />
                <Area type="monotone" dataKey="meetings" stroke="oklch(0.75 0.16 195)" fill="transparent" name="Meetings" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {(data?.overdue ?? 0) > 0 && (
        <Card className="border-destructive/30 bg-destructive/10">
          <CardContent className="pt-4">
            <p className="text-sm"><b>{data?.overdue}</b> overdue task{(data?.overdue ?? 0) > 1 ? "s" : ""} — head to the Smart Planner to reschedule.</p>
          </CardContent>
        </Card>
      )}

      <ResponsibleAINote />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: number | string }) {
  return (
    <Card className="glass">
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-soft text-primary"><Icon className="h-5 w-5" /></div>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
