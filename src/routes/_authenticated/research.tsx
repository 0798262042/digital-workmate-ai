import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeResearch } from "@/lib/research.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { Beaker, Sparkles, Download } from "lucide-react";
import { downloadTextAsPdf } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/research")({
  head: () => ({ meta: [{ title: "Research Lab · SmartDesk AI" }] }),
  component: ResearchPage,
});

function ResearchPage() {
  const qc = useQueryClient();
  const fn = useServerFn(analyzeResearch);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [mode, setMode] = useState<"text" | "url">("text");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<Awaited<ReturnType<ReturnType<typeof useServerFn<typeof analyzeResearch>>>> | null>(null);

  const history = useQuery({
    queryKey: ["research-history"],
    queryFn: async () => {
      const { data } = await supabase.from("research_items").select("*").order("created_at", { ascending: false }).limit(15);
      return data ?? [];
    },
  });

  async function run() {
    if (!title.trim()) return toast.error("Add a title.");
    setLoading(true);
    try {
      const result = await fn({ data: {
        title,
        source: mode === "url" ? { kind: "url", url } : { kind: "text", text },
      }});
      setOut(result);
      qc.invalidateQueries({ queryKey: ["research-history"] });
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Beaker className="h-6 w-6 text-primary" /> Research Lab</h1>
        <p className="text-sm text-muted-foreground">Turn any article, page or report into clear, actionable insight.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What is this about?" /></div>
            <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
              <TabsList>
                <TabsTrigger value="text">Paste text</TabsTrigger>
                <TabsTrigger value="url">From URL</TabsTrigger>
              </TabsList>
              <TabsContent value="text"><Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste an article, report, or paragraph…" /></TabsContent>
              <TabsContent value="url"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/article" /></TabsContent>
            </Tabs>
            <Button onClick={run} disabled={loading} className="w-full gradient-primary text-primary-foreground"><Sparkles className="mr-2 h-4 w-4" />{loading ? "Analysing…" : "Analyse"}</Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Analysis</CardTitle>
            {out && <Button size="icon" variant="ghost" onClick={() => downloadTextAsPdf("research.pdf", title, JSON.stringify(out, null, 2))}><Download className="h-4 w-4" /></Button>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {out ? (
              <>
                <Section title="Summary"><p className="text-muted-foreground">{out.summary}</p></Section>
                <Section title="Key findings"><ul className="ml-4 list-disc text-muted-foreground">{out.keyFindings.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
                <div className="grid grid-cols-2 gap-3">
                  <Section title="Pros"><ul className="ml-4 list-disc text-muted-foreground">{out.pros.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
                  <Section title="Cons"><ul className="ml-4 list-disc text-muted-foreground">{out.cons.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
                </div>
                <Section title="Recommendations"><ul className="ml-4 list-disc text-muted-foreground">{out.recommendations.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
                <Section title="Questions to ask"><ul className="ml-4 list-disc text-muted-foreground">{out.questions.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
                <Section title="Action items"><ul className="ml-4 list-disc text-muted-foreground">{out.actionItems.map((x, i) => <li key={i}>{x}</li>)}</ul></Section>
              </>
            ) : <p className="text-muted-foreground">Analysis will appear here.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Recent research</CardTitle></CardHeader>
        <CardContent>
          {history.data && history.data.length > 0 ? (
            <ul className="space-y-2">{history.data.map((r) => (
              <li key={r.id} className="rounded-lg border bg-background/50 px-3 py-2 text-sm">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-muted-foreground">{r.source_kind} · {new Date(r.created_at).toLocaleDateString()}</div>
              </li>
            ))}</ul>
          ) : <p className="text-sm text-muted-foreground">No research saved yet.</p>}
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
