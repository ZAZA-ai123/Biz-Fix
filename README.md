# Biz-Fix — AI Quote Operating System

Premium AI-powered quote builder for vendors. Describe a project in plain English; Biz-Fix plans, retrieves, structures, prices, and persists a quote — then lets you refine it in Quote Studio and export a branded PDF.

## Tech Stack

- **Next.js 16** (App Router, TypeScript) — note: dynamic route `params` are async
- **Tailwind CSS 4** + **shadcn/ui** patterns (Radix primitives)
- **Clerk** auth (Google OAuth + email)
- **Upstash Redis** (KV store for quotes, settings, RAG metadata)
- **Upstash Vector** (RAG retrieval)
- **Groq** (planner / ask-mode chat) + **Google Gemini** (structure + embeddings)
- **Framer Motion**, **lucide-react**

## Getting Started

```bash
cp .env.example .env.local      # fill in real values
npm install
npm run dev                     # http://127.0.0.1:3000
```

See [`.env.example`](./.env.example) for every variable the app reads.

## Pages

| Route | Description |
|---|---|
| `/` | Public landing page (auto-redirects authenticated users to `/chat`) |
| `/sign-in` | Clerk sign-in / sign-up |
| `/onboarding` | First-run: company name + logo |
| `/chat` | Prompt-first quote creation with inline `<QuoteCard>` and pipeline progress |
| `/dashboard` | Stats, recent quotes, revenue snapshot |
| `/new-quote` | Alternate quote-creation entry with example prompts |
| `/quote-studio` | Full quote editor with AI refinement chat |
| `/quotes` | List, filter, duplicate, delete quotes |
| `/quote/[id]/print` | Branded printable / PDF-ready quote (open in new tab → browser **Save as PDF**) |
| `/settings` | Business profile, quote defaults, notification preferences |

## Architecture (high level)

```
src/
├── app/                          Next.js App Router
│   ├── (workspace)/              Authed shell (sidebar + header)
│   ├── api/
│   │   ├── company/              Settings + onboarding endpoints
│   │   ├── chat/ask              Groq Q&A
│   │   ├── quote/agent           Quote engine entry (create / iterate)
│   │   ├── engine/quote          Lower-level engine call
│   │   ├── db/                   Quote + dashboard CRUD
│   │   └── rag/ingest            Embed + upsert documents
│   ├── quote/[id]/print/         Printable quote (branded HTML + @media print)
│   ├── sign-in/   onboarding/    Public + first-run
│   └── page.tsx                  Public landing page
├── components/
│   ├── chat/                     QuoteCard, PipelineProgress
│   ├── layout/                   AppShell, Sidebar, Header
│   └── ui/                       shadcn primitives
└── lib/
    ├── ai/                       Groq + Gemini SDK wrappers
    ├── db/                       Upstash Redis modules (quotes, settings, company, rag)
    ├── engine/                   Plan → Retrieve → Structure → Build → Save pipeline
    └── rag/                      Vector store wrapper
```

## Deploy to Vercel

1. **Push** the repo to GitHub / GitLab.
2. **Import** the project at [vercel.com/new](https://vercel.com/new).
3. **Set environment variables** — copy every key from [`.env.example`](./.env.example) into the Vercel project's Environment Variables. All `NEXT_PUBLIC_*` keys must also be set.
4. **Configure Clerk** for the deployed domain:
   - Add the Vercel URL to Clerk's *Authorized Redirect URLs* and the OAuth provider settings.
5. **Deploy.** First request will warm the Upstash Redis + Vector connections.

> **Note**: this app does not bundle any serverless-incompatible deps (no SQLite, no headless Chrome). PDF export uses the browser's native **Save as PDF** dialog from the `/quote/[id]/print` page.

## Scripts

```bash
npm run dev      # local dev (binds to 127.0.0.1)
npm run build    # production build
npm run start    # start the production build
npm run lint     # eslint
```
