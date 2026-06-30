import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { analyzeDocument } from "@/lib/document.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { FileText, Upload, Trash2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents · SmartDesk AI" }] }),
  component: DocsPage,
});

function DocsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(analyzeDocument);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const docs = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const up = await supabase.storage.from("user-documents").upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const ins = await supabase.from("documents").insert({
        user_id: user.id, filename: file.name, storage_path: path, mime: file.type,
      }).select().single();
      if (ins.error) throw ins.error;
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Uploaded");
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); e.target.value = ""; }
  }

  async function analyze(id: string) {
    setAnalyzingId(id);
    try {
      await fn({ data: { documentId: id }});
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Analysis complete");
    } catch (e) { toast.error((e as Error).message); }
    finally { setAnalyzingId(null); }
  }

  async function remove(id: string, path: string) {
    await supabase.storage.from("user-documents").remove([path]);
    await supabase.from("documents").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["documents"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Document Analyzer</h1>
        <p className="text-sm text-muted-foreground">Upload PDFs or text files. AI extracts dates, deadlines, names and tasks.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Upload</CardTitle></CardHeader>
        <CardContent>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 px-4 py-10 text-sm text-muted-foreground transition hover:border-primary">
            <Upload className="h-5 w-5" />
            {uploading ? "Uploading…" : "Click to upload PDF, TXT or DOCX"}
            <input type="file" className="hidden" accept=".pdf,.txt,.docx,application/pdf,text/plain" onChange={handleUpload} disabled={uploading} />
          </label>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Your documents</CardTitle></CardHeader>
        <CardContent>
          {docs.data && docs.data.length > 0 ? (
            <ul className="space-y-3">
              {docs.data.map((d) => (
                <li key={d.id} className="rounded-xl border bg-background/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{d.filename}</div>
                      <div className="text-xs text-muted-foreground">{d.mime} · {new Date(d.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => analyze(d.id)} disabled={analyzingId === d.id}>
                        <Sparkles className="mr-1 h-3 w-3" />{analyzingId === d.id ? "Analysing…" : d.analysis_json ? "Re-analyse" : "Analyse"}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(d.id, d.storage_path)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {d.analysis_json && <DocAnalysis a={d.analysis_json as any} />}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
        </CardContent>
      </Card>

      <ResponsibleAINote />
    </div>
  );
}

function DocAnalysis({ a }: { a: { summary: string; importantDates: string[]; deadlines: string[]; names: string[]; tasks: string[]; keyPoints: string[] } }) {
  return (
    <div className="mt-3 space-y-2 text-sm">
      <p className="text-muted-foreground">{a.summary}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Block title="Important dates" items={a.importantDates} />
        <Block title="Deadlines" items={a.deadlines} />
        <Block title="Names" items={a.names} />
        <Block title="Tasks" items={a.tasks} />
      </div>
      {a.keyPoints?.length > 0 && <Block title="Key points" items={a.keyPoints} />}
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{title}</div>
      <ul className="ml-4 list-disc text-xs text-muted-foreground">{items.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </div>
  );
}
