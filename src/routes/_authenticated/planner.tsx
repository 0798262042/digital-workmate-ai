import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { buildPlan } from "@/lib/planner.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { toast } from "sonner";
import { ListChecks, Plus, Sparkles, Trash2, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/planner")({
  head: () => ({ meta: [{ title: "Smart Planner · SmartDesk AI" }] }),
  component: PlannerPage,
});

type Plan = Awaited<ReturnType<ReturnType<typeof useServerFn<typeof buildPlan>>>>;

function PlannerPage() {
  const qc = useQueryClient();
  const planFn = useServerFn(buildPlan);
  const [workingHours, setWorkingHours] = useState("08:00 - 17:00");
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high">("medium");
  const [newEstimate, setNewEstimate] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const tasks = useQuery({
    queryKey: ["planner-tasks"],
    queryFn: async () => {
      const { data } = await supabase.from("tasks").select("*").neq("status", "done").order("created_at");
      return data ?? [];
    },
  });

  async function addTask() {
    if (!newTitle.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("tasks").insert({
      user_id: user.id,
      title: newTitle,
      priority: newPriority,
      estimated_minutes: newEstimate ? Number(newEstimate) : null,
    });
    setNewTitle(""); setNewEstimate("");
    qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
  }

  async function completeTask(id: string) {
    await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await supabase.from("productivity_events").insert({ user_id: user.id, kind: "task_done", value_json: { id } });
    qc.invalidateQueries({ queryKey: ["planner-tasks"] });
    qc.invalidateQueries({ queryKey: ["dashboard-tasks"] });
    qc.invalidateQueries({ queryKey: ["insights"] });
  }

  async function deleteTask(id: string) {
    await supabase.from("tasks").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["planner-tasks"] });
  }

  async function generatePlan() {
    const list = tasks.data ?? [];
    if (list.length === 0) return toast.error("Add some tasks first.");
    setLoading(true);
    try {
      const out = await planFn({ data: {
        workingHours,
        tasks: list.map((t) => ({ title: t.title, priority: t.priority, estimatedMinutes: t.estimated_minutes ?? undefined, dueAt: t.due_at ?? undefined })),
      }});
      setPlan(out);
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ListChecks className="h-6 w-6 text-primary" /> Smart Planner</h1>
        <p className="text-sm text-muted-foreground">AI builds your day around priority, deadlines and breaks.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Tasks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px_140px_auto]">
            <Input placeholder="Task title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} />
            <Select value={newPriority} onValueChange={(v) => setNewPriority(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High priority</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Est. minutes" type="number" value={newEstimate} onChange={(e) => setNewEstimate(e.target.value)} />
            <Button onClick={addTask}><Plus className="h-4 w-4" /></Button>
          </div>

          <ul className="space-y-2">
            {(tasks.data ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-lg border bg-background/50 px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.priority}{t.estimated_minutes ? ` · ${t.estimated_minutes}m` : ""}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => completeTask(t.id)} aria-label="Complete"><Check className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteTask(t.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Label>Working hours</Label>
              <Input className="w-40" value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} />
            </div>
            <Button onClick={generatePlan} disabled={loading} className="gradient-primary text-primary-foreground">
              <Sparkles className="mr-2 h-4 w-4" />{loading ? "Building…" : "Build my day"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="glass">
            <CardHeader><CardTitle className="text-base">Morning</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">{plan.morning.map((s, i) => <li key={i} className="flex gap-2"><span className="w-16 text-muted-foreground">{s.time}</span><span>{s.task}</span></li>)}</ul>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader><CardTitle className="text-base">Afternoon</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">{plan.afternoon.map((s, i) => <li key={i} className="flex gap-2"><span className="w-16 text-muted-foreground">{s.time}</span><span>{s.task}</span></li>)}</ul>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader><CardTitle className="text-base">Priority matrix</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-xs">
              <div><div className="font-medium text-destructive">Urgent + Important</div><ul className="ml-4 list-disc text-muted-foreground">{plan.priorityMatrix.urgentImportant.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              <div><div className="font-medium text-primary">Important, not urgent</div><ul className="ml-4 list-disc text-muted-foreground">{plan.priorityMatrix.importantNotUrgent.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              <div><div className="font-medium text-accent">Urgent, not important</div><ul className="ml-4 list-disc text-muted-foreground">{plan.priorityMatrix.urgentNotImportant.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              <div><div className="font-medium text-muted-foreground">Neither</div><ul className="ml-4 list-disc text-muted-foreground">{plan.priorityMatrix.neither.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader><CardTitle className="text-base">Breaks & boost</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ul className="ml-4 list-disc text-muted-foreground">{plan.breaks.map((b, i) => <li key={i}>{b}</li>)}</ul>
              <p className="text-xs text-muted-foreground">Estimated completion: <b>{plan.estimatedCompletion}</b></p>
              <p className="italic text-primary">{plan.motivationalTip}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <ResponsibleAINote />
    </div>
  );
}
