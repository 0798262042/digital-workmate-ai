import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  Brain,
  Calendar,
  FileText,
  Globe,
  LineChart,
  Mail,
  MessageSquare,
  Sparkles,
  Heart,
  ListChecks,
  ShieldCheck,
  Zap,
} from "lucide-react";
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
      {
        name: "description",
        content:
          "Your AI co-worker: meetings, emails, planning, research, translation, documents and wellbeing in one beautiful workspace.",
      },
      { property: "og:title", content: "SmartDesk AI — Your AI Digital Employee" },
      {
        property: "og:description",
        content: "An AI Workplace Hub for the modern South African workplace.",
      },
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

// Navy palette scoped to this landing page only.
const NAVY = {
  bg: "#06122b",
  bgSoft: "#0a1d3f",
  surface: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  primary: "#3b82f6", // bright blue accent
  primaryDeep: "#1e3a8a", // navy
  text: "#eaf1ff",
  muted: "rgba(234,241,255,0.7)",
};

function Landing() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: NAVY.bg,
        color: NAVY.text,
        backgroundImage: `radial-gradient(at 0% 0%, rgba(59,130,246,0.25) 0px, transparent 50%),
                          radial-gradient(at 100% 0%, rgba(30,58,138,0.45) 0px, transparent 55%),
                          radial-gradient(at 50% 100%, rgba(14,165,233,0.18) 0px, transparent 55%)`,
      }}
    >
      <header className="container mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="SmartDesk AI" width={36} height={36} className="rounded-md" />
          <span className="font-display text-lg font-semibold">SmartDesk AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm font-medium"
            style={{ color: NAVY.muted }}
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="inline-flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${NAVY.primary}, ${NAVY.primaryDeep})`,
              color: "#fff",
              boxShadow: "0 10px 30px -10px rgba(30,58,138,0.6)",
            }}
          >
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-6 pb-16 pt-12 text-center md:pt-20">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs"
            style={{
              background: NAVY.surface,
              border: `1px solid ${NAVY.border}`,
              color: NAVY.muted,
              backdropFilter: "blur(10px)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: NAVY.primary }} />
            Inspired by Feishu, Tencent Docs & Microsoft Copilot
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-bold leading-tight md:text-6xl">
            Your{" "}
            <span
              style={{
                backgroundImage: `linear-gradient(135deg, #60a5fa, #93c5fd)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AI Digital Employee
            </span>
            <br />
            for the modern workplace.
          </h1>
          <p
            className="mx-auto mt-6 max-w-2xl text-pretty text-base md:text-lg"
            style={{ color: NAVY.muted }}
          >
            SmartDesk AI is a complete AI co-worker — not just another chatbot. It prepares meetings,
            writes emails, plans your day, analyses documents and looks after your wellbeing, all in
            one navy-blue dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium"
              style={{
                background: `linear-gradient(135deg, ${NAVY.primary}, ${NAVY.primaryDeep})`,
                color: "#fff",
                boxShadow: "0 10px 30px -10px rgba(30,58,138,0.6)",
              }}
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="rounded-md px-6 py-3 text-sm font-medium"
              style={{
                background: NAVY.surface,
                border: `1px solid ${NAVY.border}`,
                color: NAVY.text,
                backdropFilter: "blur(10px)",
              }}
            >
              Explore features
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs" style={{ color: NAVY.muted }}>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Responsible AI by default</span>
            <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4" /> Built on Lovable Cloud</span>
            <span className="inline-flex items-center gap-2"><Globe className="h-4 w-4" /> Multilingual workplace ready</span>
          </div>
        </section>

        <section id="features" className="container mx-auto px-6 pb-24">
          <div className="mb-10 text-center">
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Everything your team needs, in one navy hub.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: NAVY.muted }}>
              Nine AI-powered modules designed to replace the busywork — not your people.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 transition hover:-translate-y-0.5"
                style={{
                  background: NAVY.surface,
                  border: `1px solid ${NAVY.border}`,
                  backdropFilter: "blur(10px)",
                  boxShadow: "0 10px 30px -15px rgba(0,0,0,0.5)",
                }}
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{
                    background: `linear-gradient(135deg, ${NAVY.primary}, ${NAVY.primaryDeep})`,
                    color: "#fff",
                  }}
                >
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm" style={{ color: NAVY.muted }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-6 pb-24">
          <div
            className="rounded-3xl p-10 text-center"
            style={{
              background: `linear-gradient(135deg, ${NAVY.primaryDeep}, ${NAVY.bgSoft})`,
              border: `1px solid ${NAVY.border}`,
              boxShadow: "0 20px 60px -20px rgba(30,58,138,0.6)",
            }}
          >
            <h2 className="font-display text-3xl font-semibold md:text-4xl">
              Ready to meet your AI co-worker?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: NAVY.muted }}>
              Sign up in seconds and let SmartDesk AI take the busywork off your desk.
            </p>
            <Link
              to="/auth"
              className="mt-6 inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-medium"
              style={{
                background: "#fff",
                color: NAVY.primaryDeep,
                boxShadow: "0 10px 30px -10px rgba(0,0,0,0.4)",
              }}
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer
        className="border-t py-6 text-center text-xs"
        style={{ borderColor: NAVY.border, color: NAVY.muted }}
      >
        © {new Date().getFullYear()} SmartDesk AI · Responsible AI · Built with Lovable Cloud
      </footer>
    </div>
  );
}
