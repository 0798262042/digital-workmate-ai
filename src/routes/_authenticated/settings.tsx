import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResponsibleAINote } from "@/components/responsible-ai-note";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import { toast } from "sonner";
import { Settings as SettingsIcon, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · SmartDesk AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (p) {
        setName(p.full_name ?? "");
        setLanguage(p.default_language ?? "English");
      }
    });
  }, []);

  async function save() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, default_language: language }).eq("id", user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Saved");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><SettingsIcon className="h-6 w-6 text-primary" /> Settings</h1>
        <p className="text-sm text-muted-foreground">Personalise your SmartDesk AI workspace.</p>
      </div>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={email} disabled /></div>
          <div><Label>Default translation language</Label><Input value={language} onChange={(e) => setLanguage(e.target.value)} /></div>
          <Button onClick={save} disabled={loading} className="gradient-primary text-primary-foreground">{loading ? "Saving…" : "Save changes"}</Button>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs text-muted-foreground">Currently {theme}</div>
          </div>
          <ThemeToggle />
        </CardContent>
      </Card>

      <Card className="glass border-primary/30">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Responsible AI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• AI-generated content should always be reviewed by a human before use.</p>
          <p>• The assistant may occasionally generate inaccurate information.</p>
          <p>• Avoid uploading confidential or personal company information.</p>
          <p>• AI supports decision-making but does not replace professional judgment.</p>
        </CardContent>
      </Card>

      <ResponsibleAINote />
    </div>
  );
}
