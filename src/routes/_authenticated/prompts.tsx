import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { BookOpen, Copy, Plus, Trash2 } from "lucide-react";
import { copyToClipboard } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/prompts")({
  head: () => ({ meta: [{ title: "Prompt Library · SmartDesk AI" }] }),
  component: PromptsPage,
});

const CATS = ["Email", "Meetings", "Research", "Planner", "Chat", "Translator", "Other"];
const TARGETS = [
  { value: "assistant", label: "AI Assistant" },
  { value: "email", label: "Email Studio" },
  { value: "meetings", label: "Meeting Hub" },
  { value: "planner", label: "Smart Planner" },
  { value: "research", label: "Research Lab" },
  { value: "translator", label: "Translator" },
];

function PromptsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [target, setTarget] = useState("assistant");

  const prompts = useQuery({
    queryKey: ["prompts"],
    queryFn: async () => {
      const { data } = await supabase.from("prompt_library").select("*").order("is_system", { ascending: false }).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function addPrompt() {
    if (!title.trim() || !text.trim()) return toast.error("Title and text required.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("prompt_library").insert({
      user_id: user.id, title, prompt_text: text, category: cat, tool_target: target, is_system: false,
    });
    setTitle(""); setText("");
    qc.invalidateQueries({ queryKey: ["prompts"] });
    toast.success("Added to library");
  }

  async function removePrompt(id: string) {
    await supabase.from("prompt_library").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["prompts"] });
  }

  function usePrompt(p: { prompt_text: string; tool_target: string | null }) {
    copyToClipboard(p.prompt_text);
    toast.success("Prompt copied — pasting into the tool…");
    const map: Record<string, string> = {
      assistant: "/assistant", email: "/email", meetings: "/meetings",
      planner: "/planner", research: "/research", translator: "/translator",
    };
    const dest = map[p.tool_target ?? "assistant"] ?? "/assistant";
    navigate({ to: dest });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary" /> Prompt Library</h1>
        <p className="text-sm text-muted-foreground">Ready-made workplace prompts plus your own.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Add your own</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
            <div>
              <Label>Category</Label>
              <Select value={cat} onValueChange={setCat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
          </div>
          <div>
            <Label>Target tool</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TARGETS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Prompt</Label><Textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} /></div>
          <Button onClick={addPrompt} className="gradient-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Add</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(prompts.data ?? []).map((p) => (
          <Card key={p.id} className="glass">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-sm font-semibold">{p.title}</CardTitle>
                {!p.is_system && <Button size="icon" variant="ghost" onClick={() => removePrompt(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>}
              </div>
              <div className="flex gap-1 text-[10px] uppercase text-muted-foreground">
                <span>{p.category}</span>
                {p.is_system && <span className="rounded bg-primary/15 px-1 text-primary">System</span>}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-muted-foreground line-clamp-3">{p.prompt_text}</p>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" className="flex-1" onClick={() => usePrompt(p)}>Use</Button>
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(p.prompt_text).then(() => toast.success("Copied"))}><Copy className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResponsibleAINote />
    </div>
  );
}
