import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { translateText } from "@/lib/wellbeing.functions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { Copy, Globe, Sparkles } from "lucide-react";
import { copyToClipboard } from "@/lib/pdf";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/translator")({
  head: () => ({ meta: [{ title: "Translator · SmartDesk AI" }] }),
  component: TranslatorPage,
});

const LANGS = ["isiZulu", "isiXhosa", "Afrikaans", "Sesotho", "Setswana", "English", "Chinese (Mandarin)", "French", "Portuguese", "Spanish"];
const TONES = ["Professional", "Friendly", "Formal", "Casual"];

function TranslatorPage() {
  const fn = useServerFn(translateText);
  const [text, setText] = useState("");
  const [target, setTarget] = useState(LANGS[0]);
  const [tone, setTone] = useState(TONES[0]);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<{ translated: string; notes: string } | null>(null);

  async function run() {
    if (!text.trim()) return toast.error("Enter some text first.");
    setLoading(true);
    try { setOut(await fn({ data: { text, targetLanguage: target, tone }})); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Globe className="h-6 w-6 text-primary" /> Translator</h1>
        <p className="text-sm text-muted-foreground">South African and international languages for the modern workplace.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass">
          <CardHeader><CardTitle className="text-base">Source</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Textarea rows={9} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type or paste text to translate…" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Target language</Label>
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={run} disabled={loading} className="w-full gradient-primary text-primary-foreground">
              <Sparkles className="mr-2 h-4 w-4" />{loading ? "Translating…" : "Translate"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Translation</CardTitle>
            {out && <Button size="icon" variant="ghost" onClick={() => copyToClipboard(out.translated).then(() => toast.success("Copied"))}><Copy className="h-4 w-4" /></Button>}
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {out ? (
              <>
                <div className="whitespace-pre-wrap rounded-md border bg-background/50 p-3">{out.translated}</div>
                <p className="text-xs italic text-muted-foreground">{out.notes}</p>
              </>
            ) : <p className="text-muted-foreground">Your translation will appear here.</p>}
          </CardContent>
        </Card>
      </div>

      <ResponsibleAINote />
    </div>
  );
}
