import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { dailyBrief, checkMood } from "@/lib/wellbeing.functions";
import { getInsights } from "@/lib/insights.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { CalendarDays, Mail, ListChecks, AlertTriangle, Mail as MailIcon, MessageSquare, Beaker, Globe, FileText, Heart, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SmartDesk AI" }] }),
  component: Dashboard,
});

const TOOLS = [
  { to: "/assistant", icon: MessageSquare, label: "Ask AI" },
  { to: "/email", icon: MailIcon, label: "Write email" },
  { to: "/planner", icon: ListChecks, label: "Plan day" },
  { to: "/meetings", icon: CalendarDays, label: "Prep meeting" },
  { to: "/research", icon: Beaker, label: "Research" },
  { to: "/translator", icon: Globe, label: "Translate" },
  { to: "/documents", icon: FileText, label: "Analyse doc" },
  { to: "/insights", icon: Sparkles, label: "Insights" },
] as const;

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const [firstName, setFirstName] = useState("there");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
      setFirstName((p?.full_name ?? data.user.email ?? "there").split(" ")[0].split("@")[0]);
    });
  }, []);

  const insightsFn = useServerFn(getInsights);
  const briefFn = useServerFn(dailyBrief);
  const moodFn = useServerFn(checkMood);

  const insights = useQuery({ queryKey: ["insights"], queryFn: () => insightsFn() });

  const tasksQuery = useQuery({
    queryKey: ["dashboard-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").neq("status", "done").order("due_at", { ascending: true, nullsFirst: false }).limit(6);
      return data ?? [];
    },
  });

  const meetingsQuery = useQuery({
    queryKey: ["dashboard-meetings"],
    queryFn: async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const { data } = await supabase.from("meetings").select("*").gte("scheduled_at", today.toISOString()).order("scheduled_at").limit(5);
      return data ?? [];
    },
  });

  const [brief, setBrief] = useState<{ greeting: string; focusOfTheDay: string; quote: string; reminders: string[] } | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  async function runBrief() {
    setBriefLoading(true);
    try { setBrief(await briefFn()); } catch (e) { toast.error((e as Error).message); }
    finally { setBriefLoading(false); }
  }

  const [moodInput, setMoodInput] = useState("");
  const [mood, setMood] = useState<{ stressLevel: number; mood: string; advice: string[]; breakSuggestion: string; timeTips: string[] } | null>(null);
  const [moodLoading, setMoodLoading] = useState(false);
  async function runMood() {
    if (!moodInput.trim()) return;
    setMoodLoading(true);
    try { setMood(await moodFn({ data: { text: moodInput } })); } catch (e) { toast.error((e as Error).message); }
    finally { setMoodLoading(false); }
  }

  const score = insights.data?.score ?? 0;
  const ringStroke = 8;
  const ringR = 40;
  const ringC = 2 * Math.PI * ringR;
  const ringOffset = ringC - (score / 100) * ringC;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">{greetingByHour()}, <span className="text-gradient">{firstName}</span></h1>
        <p className="text-sm text-muted-foreground">Here's how today is shaping up.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Productivity</CardTitle></CardHeader>
          <CardContent className="flex items-center gap-4">
            <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90">
              <circle cx="50" cy="50" r={ringR} stroke="hsl(var(--muted))" strokeWidth={ringStroke} fill="none" className="opacity-30" />
              <circle cx="50" cy="50" r={ringR} stroke="url(#g)" strokeWidth={ringStroke} fill="none" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringOffset} />
              <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stopColor="oklch(0.65 0.22 285)"/><stop offset="100%" stopColor="oklch(0.65 0.18 250)"/></linearGradient></defs>
            </svg>
            <div>
              <div className="text-3xl font-bold">{score}%</div>
              <div className="text-xs text-muted-foreground">Past 7 days</div>
            </div>
          </CardContent>
        </Card>
        {[
          { icon: ListChecks, label: "Tasks done", value: insights.data?.completed ?? 0 },
          { icon: CalendarDays, label: "Meetings", value: insights.data?.meetings ?? 0 },
          { icon: Mail, label: "Emails written", value: insights.data?.emails ?? 0 },
        ].map((s) => (
          <Card key={s.label} className="glass">
            <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-soft text-primary"><s.icon className="h-5 w-5" /></div>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Quick AI tools</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {TOOLS.map((t) => (
              <Link key={t.to} to={t.to} className="group flex flex-col items-center gap-2 rounded-xl border bg-card/60 p-3 text-center transition hover:-translate-y-0.5 hover:shadow-elegant">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground transition group-hover:shadow-glow"><t.icon className="h-5 w-5" /></span>
                <span className="text-xs font-medium">{t.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Today's tasks</CardTitle>
            <Link to="/planner" className="text-xs text-muted-foreground hover:text-foreground">Plan day →</Link>
          </CardHeader>
          <CardContent>
            {tasksQuery.data && tasksQuery.data.length > 0 ? (
              <ul className="space-y-2">
                {tasksQuery.data.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2">
                    <div>
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.due_at && <div className="text-xs text-muted-foreground">Due {new Date(t.due_at).toLocaleString()}</div>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${t.priority === "high" ? "bg-destructive/15 text-destructive" : t.priority === "medium" ? "bg-accent/20 text-accent" : "bg-muted text-muted-foreground"}`}>{t.priority}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted-foreground">No active tasks. Add some in the Smart Planner.</p>}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Daily brief</CardTitle>
            <Button size="sm" variant="ghost" onClick={runBrief} disabled={briefLoading}>{briefLoading ? "Generating…" : "Generate"}</Button>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {brief ? (
              <>
                <p className="font-medium">{brief.greeting}</p>
                <p className="text-muted-foreground"><b>Focus:</b> {brief.focusOfTheDay}</p>
                <p className="italic text-muted-foreground">"{brief.quote}"</p>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">{brief.reminders.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Get an AI summary of your day with one click.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Upcoming meetings</CardTitle></CardHeader>
          <CardContent>
            {meetingsQuery.data && meetingsQuery.data.length > 0 ? (
              <ul className="space-y-2">{meetingsQuery.data.map((m) => (
                <li key={m.id} className="rounded-lg border bg-background/50 px-3 py-2">
                  <div className="text-sm font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : "Time not set"}</div>
                </li>))}</ul>
            ) : <p className="text-sm text-muted-foreground">No meetings scheduled. Use the Meeting Hub.</p>}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Heart className="h-4 w-4 text-destructive" /> Mood check-in</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea placeholder="How are you feeling at work today?" rows={2} value={moodInput} onChange={(e) => setMoodInput(e.target.value)} />
            <Button onClick={runMood} disabled={moodLoading} size="sm" className="gradient-primary text-primary-foreground">{moodLoading ? "Reading…" : "Check in"}</Button>
            {mood && (
              <div className="rounded-lg border bg-background/50 p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{mood.mood}</span>
                  <span className="text-xs text-muted-foreground">Stress {mood.stressLevel}/5</span>
                </div>
                <p className="text-xs text-muted-foreground">{mood.breakSuggestion}</p>
                <ul className="ml-4 list-disc text-xs text-muted-foreground">{mood.advice.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {(insights.data?.overdue ?? 0) > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
          <div>
            <div className="font-medium">{insights.data?.overdue} overdue task{(insights.data?.overdue ?? 0) > 1 ? "s" : ""}</div>
            <div className="text-xs text-muted-foreground">Head to the Smart Planner to reschedule.</div>
          </div>
        </div>
      )}

      <ResponsibleAINote />
    </div>
  );
}
