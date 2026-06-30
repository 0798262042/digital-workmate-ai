import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { generateEmail } from "@/lib/email.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { copyToClipboard, downloadTextAsPdf } from "@/lib/pdf";
import { toast } from "sonner";
import { Copy, Download, Mail, Sparkles, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({ meta: [{ title: "Email Studio · SmartDesk AI" }] }),
  component: EmailPage,
});

const KINDS = ["Formal", "Friendly", "Complaint", "Reminder", "Follow-up", "Interview", "Leave request", "Resignation", "Apology", "Promotion"];
const TONES = ["Professional", "Friendly", "Persuasive", "Apologetic", "Direct", "Empathetic"];
const MODES = [
  { value: "generate", label: "Generate" },
  { value: "improve", label: "Improve" },
  { value: "rewrite", label: "Rewrite" },
  { value: "shorten", label: "Shorten" },
  { value: "expand", label: "Expand" },
  { value: "grammar", label: "Grammar fix" },
  { value: "translate", label: "Translate" },
] as const;

function EmailPage() {
  const qc = useQueryClient();
  const emailFn = useServerFn(generateEmail);
  const [mode, setMode] = useState<typeof MODES[number]["value"]>("generate");
  const [kind, setKind] = useState(KINDS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [recipient, setRecipient] = useState("");
  const [context, setContext] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<{ subject: string; body: string } | null>(null);

  const history = useQuery({
    queryKey: ["emails-history"],
    queryFn: async () => {
      const { data } = await supabase.from("emails").select("*").order("created_at", { ascending: false }).limit(15);
      return data ?? [];
    },
  });

  async function handleGenerate() {
    if (!context.trim()) return toast.error("Please describe what the email is about.");
    setLoading(true);
    try {
      const out = await emailFn({ data: { mode, kind, tone, recipient: recipient || undefined, context, targetLanguage: targetLanguage || undefined } });
      setOutput(out);
      qc.invalidateQueries({ queryKey: ["emails-history"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setLoading(false); }
  }

  async function deleteEmail(id: string) {
    await supabase.from("emails").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["emails-history"] });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Mail className="h-6 w-6 text-primary" /> Email Studio</h1>
        <p className="text-sm text-muted-foreground">Generate, improve, rewrite or translate professional emails.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Compose</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Mode</Label>
                <Select value={mode} onValueChange={(v) => setMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MODES.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kind</Label>
                <Select value={kind} onValueChange={setKind}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Recipient (optional)</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Sarah from Marketing" />
              </div>
            </div>
            {mode === "translate" && (
              <div>
                <Label>Target language</Label>
                <Input value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} placeholder="e.g. isiZulu" />
              </div>
            )}
            <div>
              <Label>{mode === "generate" ? "What is the email about?" : "Paste the email or describe changes"}</Label>
              <Textarea rows={7} value={context} onChange={(e) => setContext(e.target.value)} placeholder="Describe what you need…" />
            </div>
            <Button onClick={handleGenerate} disabled={loading} className="w-full gradient-primary text-primary-foreground">
              <Sparkles className="mr-2 h-4 w-4" />{loading ? "Working…" : "Generate"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Output</CardTitle>
            {output && (
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(`Subject: ${output.subject}\n\n${output.body}`).then(() => toast.success("Copied"))}><Copy className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => downloadTextAsPdf("email.pdf", output.subject, output.body)}><Download className="h-4 w-4" /></Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {output ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Subject</Label>
                  <div className="rounded-md border bg-background/50 p-2 text-sm font-medium">{output.subject}</div>
                </div>
                <div>
                  <Label className="text-xs">Body</Label>
                  <div className="whitespace-pre-wrap rounded-md border bg-background/50 p-3 text-sm">{output.body}</div>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground">Your generated email will appear here.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Recent emails</CardTitle></CardHeader>
        <CardContent>
          {history.data && history.data.length > 0 ? (
            <ul className="space-y-2">
              {history.data.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-2 rounded-lg border bg-background/50 p-3">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{e.subject}</div>
                    <div className="text-xs text-muted-foreground">{e.kind} · {e.tone} · {new Date(e.created_at).toLocaleString()}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => setOutput({ subject: e.subject ?? "", body: e.body })}><Copy className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => deleteEmail(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No history yet.</p>}
        </CardContent>
      </Card>

      <ResponsibleAINote />
    </div>
  );
}
