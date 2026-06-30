# Mzansi-Digital AI- Hub

A complete AI-powered productivity platform inspired by Feishu/Lark and Tencent Docs, brought to the South African workplace context. Every signed-in user gets their own AI co-worker that manages meetings, emails, tasks, research, translation, documents, and wellbeing.

## Tech stack

- Frontend: TanStack Start + React 19 + Tailwind v4 (already scaffolded)
- Backend: Lovable Cloud (Supabase) — auth, Postgres, RLS, storage
- AI: Lovable AI Gateway via `@ai-sdk/openai-compatible` — default model `google/gemini-3-flash-preview` (free tier-friendly), with `Output.object` for structured features
- UI: shadcn components + custom semantic tokens (purple/blue gradient, glassmorphism, dark mode default + light mode toggle), AI Elements for the chatbot

## Design direction

- Identity: "SmartDesk AI". Custom generated logo (geometric mark, not Sparkles).
- Palette (oklch tokens in `src/styles.css`):
  - Background: deep indigo-black `oklch(0.14 0.04 270)` dark / soft cream `oklch(0.99 0.005 270)` light
  - Primary: violet `oklch(0.62 0.22 285)`
  - Accent / glow: electric blue `oklch(0.7 0.18 250)`
  - Gradient: `linear-gradient(135deg, var(--primary), var(--accent))`
  - Glass card: `backdrop-blur` + `bg-card/60` + subtle border + `--shadow-elegant`
- Type: Outfit (headings) + Inter (body) via `@fontsource`.
- Motion: subtle fade/slide on mount, gradient hover on primary cards, animated sidebar collapse, floating chatbot bubble bottom-right of every authenticated page.
- Layout: collapsible sidebar (shadcn sidebar, `collapsible="icon"`) + topbar with theme toggle, user menu, and global "Daily Brief" button.

## Routing (TanStack Start)

```
src/routes/
  __root.tsx                                 (providers, theme, auth listener)
  index.tsx                                  (public marketing landing → CTA to /auth)
  auth.tsx                                   (sign-in / sign-up, email+password + Google)
  _authenticated/
    route.tsx                                (managed gate, ssr:false)
    dashboard.tsx                            (greeting, productivity score, today's tasks, meetings, quick tools)
    assistant.tsx                            (AI Workplace Chatbot — streaming, AI Elements)
    email.tsx                                (AI Email Studio)
    planner.tsx                              (Smart Task Planner)
    meetings.tsx                             (Meeting Hub — prep + post-meeting summary, list of saved meetings)
    research.tsx                             (Research Lab — paste text/URL → structured analysis)
    translator.tsx                           (Translator — EN / Zulu / Xhosa / Afrikaans / Chinese / French / Portuguese / Sesotho)
    documents.tsx                            (Document Analyzer — upload PDF/DOCX/TXT)
    insights.tsx                             (Productivity Insights — score, charts, streak)
    prompts.tsx                              (Prompt Library)
    settings.tsx                             (profile, theme, language defaults)
  api/
    chat.ts                                  (streaming chat server route for useChat)
```

Notes:

- Floating chatbot launcher lives in the `_authenticated` layout, opens a Sheet with the AI Elements chat, calling `/api/chat`.
- Mood Detector and Daily Brief are widgets on the dashboard, not separate routes.
- Prompt Library doubles as a launchpad: clicking a prompt opens the relevant tool prefilled.

## Database schema (Lovable Cloud)

All tables in `public`, with explicit `GRANT`s, RLS enabled, and policies scoped to `auth.uid()`.

- `profiles` (id uuid PK = auth.users.id, full_name, avatar_url, default_language, created_at) — auto-created via trigger on `auth.users` insert.
- `app_role` enum (`admin`, `user`) + `user_roles` table + `has_role(_user_id, _role)` security-definer function (per knowledge — roles never on profiles).
- `tasks` (id, user_id, title, description, priority enum low/med/high, due_at, estimated_minutes, status enum todo/doing/done, completed_at, created_at).
- `meetings` (id, user_id, title, attendees text[], goal, scheduled_at, duration_min, agenda_json, prep_json, notes_text, summary_json, created_at).
- `emails` (id, user_id, kind, tone, recipient, subject, body, source_prompt, created_at).
- `research_items` (id, user_id, title, source_kind enum text/url/pdf, source_ref, analysis_json, created_at).
- `documents` (id, user_id, filename, storage_path, mime, analysis_json, created_at) + Supabase Storage bucket `user-documents` (private, owner-scoped).
- `chat_threads` (id, user_id, title, created_at) and `chat_messages` (id, thread_id, role, content, parts_json, created_at).
- `prompt_library` (id, user_id nullable, category, title, prompt_text, tool_target, is_system) — system rows seeded via migration; user rows owned by `user_id`.
- `productivity_events` (id, user_id, kind enum task_done/meeting_attended/email_written/mood_log, value_json, occurred_at) — fuels Insights + score.

Insights score is computed on the server from `productivity_events` + tasks; no need for a separate score table.

## AI features (all through Lovable AI Gateway)

Server functions live in `src/lib/*.functions.ts`; the chat stream lives in `src/routes/api/chat.ts`. A shared `src/lib/ai-gateway.server.ts` exports `createLovableAiGatewayProvider` exactly as documented.

1. **Meeting Prep** (`generateText` + `Output.object`) — input: topic, attendees, goal, duration → output: `{ agenda[], discussionPoints[], questions[], expectedOutcomes[], risks[] }`.
2. **Meeting Summary** — paste notes → `{ summary, decisions[], actionItems[{owner, task, dueAt}], deadlines[] }`.
3. **Email Studio** — generate / improve / rewrite / translate / shorten / expand / grammar — single server fn with `mode` param, structured `{ subject, body }`.
4. **Smart Planner** — tasks + working hours → `{ morning[], afternoon[], breaks[], priorityMatrix, motivationalTip }`.
5. **Research Lab** — text or URL (server fetches URL with `fetch`) → `{ summary, keyFindings[], pros[], cons[], recommendations[], questions[], actionItems[] }`.
6. **Document Analyzer** — upload to Storage, parse via Gateway multimodal `file` content block (PDF base64) → `{ summary, dates[], deadlines[], names[], tasks[] }`. DOCX/TXT decoded server-side to text first.
7. **Translator** — text + target language → `{ translated, notes }`.
8. **Mood Detector** — short text → `{ stressLevel 1-5, advice[], breakSuggestion, timeTips[] }`.
9. **Daily Brief** — pulls today's tasks + meetings, calls model → `{ greeting, focusOfTheDay, quote, reminders[] }`.
10. **Chatbot** — `streamText` via `/api/chat` with `useChat`, AI Elements rendering, persisted to `chat_threads` / `chat_messages`.

System prompts position the AI as a junior co-worker, professional South African workplace tone, and include the Responsible-AI guardrails.

## Auth flow

- `supabase--enable` first.
- Email/password + Google sign-in (`configure_social_auth`).
- `/auth` page with tabs Sign in / Sign up + Google button.
- Profile auto-created via `handle_new_user` trigger.
- `_authenticated/route.tsx` from integration scaffold (don't author).
- Bearer attacher in `src/start.ts` appended to `functionMiddleware`.
- Sign-out hygiene per knowledge (cancelQueries → clear → signOut → navigate replace).

## UI structure

- **Dashboard**: greeting ("Good morning, {firstName}"), productivity score ring (Recharts), 4 KPI cards (Tasks, Meetings, Emails, Deadlines), "Quick AI Tools" grid (6 large gradient cards), "Today's Tasks" list with quick-complete, "Upcoming Meetings" list, "Daily Brief" panel, Mood check-in widget.
- **Each tool page**: left form, right output card with copy / download-as-PDF / save-to-history buttons (jsPDF for PDF).
- **History panel** on each tool reads from its table, filterable.
- **Responsible AI** banner shown in Settings + as small footnote under outputs.
- **Light/Dark toggle** persisted to `localStorage` + `prefers-color-scheme` default.

## Build order (one continuous build)

1. `supabase--enable`, then migrations: enum, profiles + trigger, user_roles + `has_role`, all feature tables with grants + RLS, storage bucket, seed `prompt_library`.
2. Auth: `configure_social_auth google`, replace `index.tsx` landing, build `/auth`.
3. Design tokens in `src/styles.css`, fonts via `@fontsource/outfit` + `@fontsource/inter`, generate brand logo (`imagegen` premium).
4. AI Elements install (`conversation message prompt-input shimmer tool`), shared `ai-gateway.server.ts`, bearer middleware wiring.
5. Authenticated shell: sidebar + topbar + theme toggle + floating chatbot Sheet.
6. Build each route + its server fn(s) in this order: dashboard → assistant (chat) → email → planner → meetings → research → translator → documents → insights → prompts → settings.
7. PDF export util, history lists, Responsible AI copy.
8. Verify: typecheck, run a representative server fn via invoke-server-function, sign-in flow check with Playwright.

## Out of scope for v1 (callable from chat to extend later)

- Real calendar/email provider integrations (we save locally; export to .ics / mailto link only).
- Team/shared workspaces (single-user per account).
- Mobile-native experience (responsive web only).
- Voice input / TTS.