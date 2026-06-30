import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { prepareMeeting, summarizeMeeting } from "@/lib/meeting.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { CalendarDays, Sparkles, Download } from "lucide-react";
import { downloadTextAsPdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/meetings")({
  head: () => ({ meta: [{ title: "Meeting Hub · SmartDesk AI" }] }),
  component: MeetingsPage,
});

function MeetingsPage() {
  const qc = useQueryClient();
  const prepFn = useServerFn(prepareMeeting);
  const sumFn = useServerFn(summarizeMeeting);

  const [title, setTitle] = useState("");
  const [attendees, setAttendees] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("30");
  const [scheduledAt, setScheduledAt] = useState("");
  const [prep, setPrep] = useState<Awaited<ReturnType<ReturnType<typeof useServerFn<typeof prepareMeeting>>>> | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);

  const [sumTitle, setSumTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [summary, setSummary] = useState<Awaited<ReturnType<ReturnType<typeof useServerFn<typeof summarizeMeeting>>>> | null>(null);
  const [sumLoading, setSumLoading] = useState(false);

  const meetings = useQuery({
    queryKey: ["meetings"],
    queryFn: async () => {
      const { data } = await supabase.from("meetings").select("*").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  async function doPrep() {
    if (!title.trim()) return toast.error("Please add a meeting title.");
    setPrepLoading(true);
    try {
      const out = await prepFn({ data: {
        title,
        attendees: attendees.split(",").map((s) => s.trim()).filter(Boolean),
        goal: goal || undefined,
        durationMin: Number(duration) || 30,
        scheduledAt: scheduledAt || undefined,
        save: true,
      }});
      setPrep(out);
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["dashboard-meetings"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setPrepLoading(false); }
  }

  async function doSummarize() {
    if (!sumTitle.trim() || !notes.trim()) return toast.error("Title and notes required.");
    setSumLoading(true);
    try {
      const out = await sumFn({ data: { title: sumTitle, notes }});
      setSummary(out);
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setSumLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><CalendarDays className="h-6 w-6 text-primary" /> Meeting Hub</h1>
        <p className="text-sm text-muted-foreground">Prep before, summarise after.</p>
      </div>

      <Tabs defaultValue="prep">
        <TabsList>
          <TabsTrigger value="prep">Before · Prepare</TabsTrigger>
          <TabsTrigger value="summary">After · Summarise</TabsTrigger>
        </TabsList>

        <TabsContent value="prep">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass">
              <CardHeader><CardTitle className="text-base">Meeting details</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Q3 sales review" /></div>
                <div><Label>Attendees (comma-separated)</Label><Input value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Sarah, Thabo, Lerato" /></div>
                <div><Label>Goal</Label><Textarea rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What success looks like" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div><Label>Duration (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
                  <div><Label>Scheduled at</Label><Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} /></div>
                </div>
                <Button onClick={doPrep} disabled={prepLoading} className="w-full gradient-primary text-primary-foreground"><Sparkles className="mr-2 h-4 w-4" />{prepLoading ? "Preparing…" : "Prepare meeting"}</Button>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Prep brief</CardTitle>
                {prep && <Button size="icon" variant="ghost" onClick={() => downloadTextAsPdf("meeting-prep.pdf", title, JSON.stringify(prep, null, 2))}><Download className="h-4 w-4" /></Button>}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {prep ? (
                  <>
                    <Section title="Agenda"><ul className="ml-4 list-disc text-muted-foreground">{prep.agenda.map((a, i) => <li key={i}>{a.item} <span className="text-xs">({a.minutes}m)</span></li>)}</ul></Section>
                    <Section title="Discussion points"><ul className="ml-4 list-disc text-muted-foreground">{prep.discussionPoints.map((p, i) => <li key={i}>{p}</li>)}</ul></Section>
                    <Section title="Questions to ask"><ul className="ml-4 list-disc text-muted-foreground">{prep.questions.map((p, i) => <li key={i}>{p}</li>)}</ul></Section>
                    <Section title="Expected outcomes"><ul className="ml-4 list-disc text-muted-foreground">{prep.expectedOutcomes.map((p, i) => <li key={i}>{p}</li>)}</ul></Section>
                    <Section title="Risks"><ul className="ml-4 list-disc text-muted-foreground">{prep.risks.map((p, i) => <li key={i}>{p}</li>)}</ul></Section>
                  </>
                ) : <p className="text-muted-foreground">Your meeting prep will appear here.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="summary">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="glass">
              <CardHeader><CardTitle className="text-base">Paste notes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div><Label>Meeting title</Label><Input value={sumTitle} onChange={(e) => setSumTitle(e.target.value)} /></div>
                <div><Label>Notes</Label><Textarea rows={10} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste raw notes…" /></div>
                <Button onClick={doSummarize} disabled={sumLoading} className="w-full gradient-primary text-primary-foreground"><Sparkles className="mr-2 h-4 w-4" />{sumLoading ? "Summarising…" : "Summarise"}</Button>
              </CardContent>
            </Card>
            <Card className="glass">
              <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {summary ? (
                  <>
                    <Section title="Summary"><p className="text-muted-foreground">{summary.summary}</p></Section>
                    <Section title="Decisions"><ul className="ml-4 list-disc text-muted-foreground">{summary.decisions.map((d, i) => <li key={i}>{d}</li>)}</ul></Section>
                    <Section title="Action items"><ul className="ml-4 list-disc text-muted-foreground">{summary.actionItems.map((a, i) => <li key={i}><b>{a.owner}</b> — {a.task} <span className="text-xs">({a.dueAt})</span></li>)}</ul></Section>
                    <Section title="Deadlines"><ul className="ml-4 list-disc text-muted-foreground">{summary.deadlines.map((d, i) => <li key={i}>{d}</li>)}</ul></Section>
                  </>
                ) : <p className="text-muted-foreground">Summary will appear here.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Saved meetings</CardTitle></CardHeader>
        <CardContent>
          {meetings.data && meetings.data.length > 0 ? (
            <ul className="space-y-2">{meetings.data.map((m) => (
              <li key={m.id} className="rounded-lg border bg-background/50 px-3 py-2 text-sm">
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : new Date(m.created_at).toLocaleDateString()}</div>
              </li>
            ))}</ul>
          ) : <p className="text-sm text-muted-foreground">No saved meetings yet.</p>}
        </CardContent>
      </Card>

      <ResponsibleAINote />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      {children}
    </div>
  );
}
