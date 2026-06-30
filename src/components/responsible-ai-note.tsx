import { ShieldCheck } from "lucide-react";

export function ResponsibleAINote({ className = "" }: { className?: string }) {
  return (
    <p className={`flex items-start gap-2 text-xs text-muted-foreground ${className}`}>
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      AI outputs may be inaccurate. Always review before use. Don't paste confidential company data.
    </p>
  );
}
