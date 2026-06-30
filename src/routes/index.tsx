import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowRight, Brain, Calendar, FileText, Globe, LineChart, Mail, MessageSquare, Sparkles, Heart, ListChecks } from "lucide-react";
import logo from "@/assets/logo.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "SmartDesk AI — The AI Digital Employee for South African workplaces" },
      { name: "description", content: "Your AI co-worker: meetings, emails, planning, research, translation, documents and wellbeing in one beautiful workspace." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Calendar, title: "Meeting Hub", desc: "Prep agendas and capture action items automatically." },
  { icon: Mail, title: "Email Studio", desc: "Generate, rewrite, translate and polish any email in seconds." },
  { icon: ListChecks, title: "Smart Planner", desc: "AI builds your day around priorities and deadlines." },
  { icon: Brain, title: "Research Lab", desc: "Turn any article or report into clear, actionable insight." },
  { icon: Globe, title: "Translator", desc: "English, Zulu, Xhosa, Afrikaans, Chinese, French and more." },
  { icon: FileText, title: "Document Analyzer", desc: "Extract dates, names, deadlines and tasks from any file." },
  { icon: MessageSquare, title: "AI Co-worker Chat", desc: "A junior employee that never sleeps, available 24/7." },
  { icon: LineChart, title: "Productivity Score", desc: "Track your output like a fitness tracker for work." },
  { icon: Heart, title: "Mood Check-in", desc: "Wellbeing-aware suggestions, not just task lists." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background gradient-mesh">
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="SmartDesk AI" width={36} height={36} className="rounded-md" />
          <span className="font-display text-lg font-semibold">SmartDesk AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link to="/auth" className="inline-flex items-center gap-1 rounded-md gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-elegant">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-6 pb-16 pt-12 text-center md:pt-20">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Inspired by Feishu, Tencent Docs & Microsoft Copilot
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-bold leading-tight md:text-6xl">
            Your <span className="text-gradient">AI Digital Employee</span><br />for the modern workplace.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground md:text-lg">
            SmartDesk AI is a complete AI co-worker — not just another chatbot. It prepares meetings, writes emails,
            plans your day, analyses documents and looks after your wellbeing, all in one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" className="inline-flex items-center gap-2 rounded-md gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant">
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="rounded-md border border-input bg-background/60 px-6 py-3 text-sm font-medium backdrop-blur">
              Explore features
            </a>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 pb-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="glass rounded-2xl p-6 shadow-elegant transition hover:-translate-y-0.5">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div className="glass rounded-3xl p-10 text-center shadow-elegant">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">Ready to meet your AI co-worker?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Sign up in seconds and let SmartDesk AI take the busywork off your desk.
            </p>
            <Link to="/auth" className="mt-6 inline-flex items-center gap-2 rounded-md gradient-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} SmartDesk AI · Responsible AI · Built with Lovable Cloud
      </footer>
    </div>
  );
}
