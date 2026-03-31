"use client";

import { useMemo, useState } from "react";
import {
  Boxes,
  Clock,
  Sparkles,
  Store,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { dashboardStats, quotes, type Quote } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

const EXAMPLE_PROMPTS = [
  "Full kitchen renovation for a 200 sqft space — premium materials, modern style",
  "Commercial office flooring for 3,000 sqft — budget-conscious, durable",
  "Master bathroom remodel — porcelain tile, quartz countertop, gold fixtures",
  "Restaurant buildout — floor, walls, lighting for 1,500 sqft",
  "Retail storefront refresh — durable LVP, accent lighting, fresh paint package",
];

function statusBadgeVariant(
  status: Quote["status"]
): "success" | "info" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "accepted":
      return "success";
    case "sent":
      return "info";
    case "draft":
      return "secondary";
    case "declined":
      return "destructive";
    case "expired":
      return "warning";
    default:
      return "secondary";
  }
}

export default function NewQuotePage() {
  const [prompt, setPrompt] = useState("");

  const recentFour = useMemo(() => {
    return [...quotes]
      .sort((a, b) => b.created.localeCompare(a.created))
      .slice(0, 4);
  }, []);

  const statItems = [
    {
      label: "Products in catalog",
      value: String(dashboardStats.catalogProducts),
      icon: Boxes,
      accent:
        "border-sky-200/90 bg-gradient-to-br from-sky-50/90 to-white text-sky-950",
      iconWrap: "bg-sky-600 text-white shadow-sky-600/25",
    },
    {
      label: "Active vendors",
      value: String(dashboardStats.activeVendors),
      icon: Store,
      accent:
        "border-teal-200/90 bg-gradient-to-br from-teal-50/90 to-white text-teal-950",
      iconWrap: "bg-teal-600 text-white shadow-teal-600/25",
    },
    {
      label: "Average quote time",
      value: "30 seconds",
      icon: Clock,
      accent:
        "border-violet-200/90 bg-gradient-to-br from-violet-50/90 to-white text-violet-950",
      iconWrap: "bg-violet-600 text-white shadow-violet-600/25",
    },
  ];

  return (
    <div className="relative min-h-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-15%,rgba(59,130,246,0.18),transparent_55%),radial-gradient(ellipse_50%_40%_at_80%_40%,rgba(139,92,246,0.08),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col gap-12 xl:flex-row xl:items-start xl:justify-between xl:gap-16">
          <div className="mx-auto w-full max-w-3xl flex-1 space-y-10">
            <header className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/90 px-4 py-1.5 text-xs font-medium text-blue-800 shadow-sm shadow-blue-500/10">
                <Sparkles className="size-3.5" aria-hidden />
                AI quote generation
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                What are you quoting today?
              </h1>
              <p className="mx-auto max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
                Describe the job in plain language. We&apos;ll match materials,
                margins, and vendors—so you ship a polished quote without the
                spreadsheet shuffle.
              </p>
            </header>

            <div className="space-y-4">
              <div
                className={cn(
                  "relative rounded-2xl p-[1px]",
                  "bg-gradient-to-br from-blue-400/50 via-blue-500/30 to-indigo-400/40",
                  "shadow-[0_0_0_1px_rgba(59,130,246,0.12),0_20px_50px_-20px_rgba(37,99,235,0.35)]"
                )}
              >
                <div className="rounded-[15px] bg-card/95 backdrop-blur-sm">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the project and materials needed..."
                    className={cn(
                      "min-h-[180px] resize-y border-0 bg-transparent px-5 py-5 text-base leading-relaxed shadow-none",
                      "placeholder:text-muted-foreground/70",
                      "focus-visible:ring-0 focus-visible:ring-offset-0"
                    )}
                  />
                </div>
              </div>

              <p className="text-center text-xs text-muted-foreground">
                Try an example below—or write your own. You can refine in Quote
                Studio after generation.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className={cn(
                      "group rounded-xl border border-border/80 bg-white/80 p-4 text-left text-sm leading-snug text-foreground shadow-sm",
                      "transition-all hover:border-blue-300/80 hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-500/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <span className="flex items-start gap-2">
                      <Wand2 className="mt-0.5 size-4 shrink-0 text-blue-600 opacity-70 group-hover:opacity-100" />
                      <span>{example}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-center pt-2">
                <Button
                  size="lg"
                  className="h-12 min-w-[200px] rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 text-base font-semibold shadow-lg shadow-blue-600/25 hover:from-blue-600/95 hover:to-indigo-600/95"
                >
                  <Sparkles className="size-5" aria-hidden />
                  Generate Quote
                </Button>
              </div>
            </div>

            <Separator className="opacity-60" />

            <section className="space-y-5">
              <div className="text-center xl:text-left">
                <h2 className="text-lg font-semibold tracking-tight">
                  Recent Quotes
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick up where you left off
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {recentFour.map((q) => (
                  <Card
                    key={q.id}
                    className="border-border/70 bg-card/90 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {q.client}
                        </CardTitle>
                        <Badge variant={statusBadgeVariant(q.status)}>
                          {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                        {q.project}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {q.id}
                      </p>
                      <p className="mt-2 text-lg font-semibold tabular-nums tracking-tight">
                        {formatCurrency(q.total)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          </div>

          <aside className="mx-auto w-full max-w-sm shrink-0 space-y-4 xl:sticky xl:top-24">
            {statItems.map((s) => (
              <Card
                key={s.label}
                className={cn(
                  "border shadow-sm transition-shadow hover:shadow-md",
                  s.accent
                )}
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-md",
                      s.iconWrap
                    )}
                  >
                    <s.icon className="size-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
                      {s.label}
                    </p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight">
                      {s.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </aside>
        </div>
      </div>
    </div>
  );
}
