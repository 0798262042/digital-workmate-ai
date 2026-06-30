import { ShieldCheck } from "lucide-react";

export function ResponsibleAINote() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        AI-generated content should be reviewed by a human before use. Avoid sharing confidential company information.
        The assistant may occasionally make mistakes — it supports decisions, it doesn't replace judgement.
      </p>
    </div>
  );
}
