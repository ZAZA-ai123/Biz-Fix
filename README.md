# Biz-Fix — AI Quote Operating System

Premium AI-powered quote operating system for vendors. Manage catalogs, generate quotes, and close deals faster.

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **shadcn/ui** component patterns (Radix primitives)
- **lucide-react** icons

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to `/dashboard`.

## Pages

| Route | Description |
|---|---|
| `/dashboard` | Business overview with stats, recent quotes, and insights |
| `/new-quote` | AI prompt-first quote creation with natural language input |
| `/quote-studio` | Full quote editing workspace with AI chat panel |
| `/catalog` | Product catalog with search, filters, add/edit/duplicate |
| `/catalog/import` | Bulk CSV import with field mapping and preview |
| `/catalog/rules` | Margins, premium logic, vendor preferences, quote behavior |
| `/quotes` | All quotes with status tracking and management |
| `/vendors` | Vendor relationship management |
| `/settings` | General, quote defaults, notifications, integrations |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/
│   ├── catalog/
│   │   ├── import/
│   │   └── rules/
│   ├── new-quote/
│   ├── quote-studio/
│   ├── quotes/
│   ├── vendors/
│   └── settings/
├── components/
│   ├── layout/             # AppShell, Sidebar, Header
│   └── ui/                 # Reusable UI primitives
└── lib/
    ├── utils.ts            # cn(), formatCurrency(), formatPercent()
    └── mock-data.ts        # Products, vendors, quotes, stats
```
