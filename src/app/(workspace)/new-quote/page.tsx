"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  Percent,
  Sparkles,
  Wand2,
  Zap,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThinkingOrb } from "@/components/ai/thinking-orb";
import { MeshBackground } from "@/components/vibe/mesh-background";
import { cn, formatCurrency } from "@/lib/utils";

type Quote = {
  id: string;
  clientName: string;
  project: string | null;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  total: number;
  margin: number;
  itemsCount: number;
  createdAt: string;
};

type DashboardData = {
  stats: {
    activeQuotes: number;
    acceptedThisMonth: number;
    avgMargin: number;
  };
  recentQuotes: Quote[];
};

const PIPELINE_STEPS = [
  { id: "plan",      label: "Planning your quote",        sublabel: "Understanding the brief" },
  { id: "retrieve",  label: "Searching your catalog",     sublabel: "Matching relevant products" },
  { id: "structure", label: "Structuring the request",    sublabel: "Preparing line items" },
  { id: "build",     label: "Building the quote",         sublabel: "Applying margins and totals" },
  { id: "save",      label: "Saving to workspace",        sublabel: "Almost done" },
] as const;

const EXAMPLE_PROMPTS = [
  {
    label: "Premium classroom",
    text: "Create a quote for GEMS SRI for a premium science lab. Include 18 chairs, 9 tables, 4 storage cabinets, and 2 teacher stations. Apply 30% margin on all products.",
  },
  {
    label: "Budget renovation",
    text: "Budget-friendly kitchen renovation for Thompson Residence — flooring, countertops, cabinets, and paint. Keep margins at 35%.",
  },
  {
    label: "Commercial buildout",
    text: "Quote for Metro Coffee Roasters flagship store — premium flooring, lighting, plumbing fixtures, and tile. Commercial grade. 40% margin.",
  },
  {
    label: "Bathroom remodel",
    text: "Premium master bathroom remodel — porcelain tile, quartz countertops, brushed gold fixtures, and lighting. Apply 45% margin.",
  },
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
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/db/dashboard").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const recentFour = useMemo(() => {
    if (!data) return [];
    return data.recentQuotes.slice(0, 4);
  }, [data]);

  async function handleGenerate() {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    setActiveStepIdx(0);
    setError(null);

    // Advance pipeline steps sequentially while the request runs
    const timers = [
      setTimeout(() => setActiveStepIdx(1), 2500),
      setTimeout(() => setActiveStepIdx(2), 6000),
      setTimeout(() => setActiveStepIdx(3), 10000),
      setTimeout(() => setActiveStepIdx(4), 14000),
    ];
    function clearTimers() { timers.forEach(clearTimeout); }

    try {
      const res = await fetch("/api/quote/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "create", prompt: prompt.trim() }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        quote?: { id: string };
        quoteRequest?: unknown;
        meta?: unknown;
        warnings?: string[];
      };

      if (!res.ok) {
        clearTimers();
        setError(typeof data.error === "string" ? data.error : "Failed to generate quote");
        setGenerating(false);
        return;
      }

      const { quote, quoteRequest, meta, warnings } = data;
      if (!quote?.id) {
        clearTimers();
        setError("Invalid response from quote service.");
        setGenerating(false);
        return;
      }

      clearTimers();
      setActiveStepIdx(PIPELINE_STEPS.length); // mark all done
      sessionStorage.setItem("biz-fix-active-quote", JSON.stringify(quote));
      if (quoteRequest) {
        sessionStorage.setItem("biz-fix-active-quote-request", JSON.stringify(quoteRequest));
      }
      sessionStorage.setItem("biz-fix-active-prompt", prompt.trim());
      sessionStorage.setItem(
        "biz-fix-last-pipeline",
        JSON.stringify({ meta, warnings: warnings ?? [], prompt: prompt.trim() })
      );
      setGenerating(false);
      router.push(`/quote-studio?id=${encodeURIComponent(quote.id)}&fresh=1`);
    } catch {
      clearTimers();
      setError("Something went wrong generating the quote. Please try again.");
      setGenerating(false);
    }
  }

  const statItems = [
    {
      label: "Quotes out for decision",
      value: data ? String(data.stats.activeQuotes) : "--",
      icon: FileText,
      accent: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Accepted wins",
      value: data ? String(data.stats.acceptedThisMonth) : "--",
      icon: CheckCircle2,
      accent: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Avg margin (blend)",
      value: data ? `${data.stats.avgMargin}%` : "--",
      icon: Percent,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Typical generate time",
      value: "~30s",
      icon: Clock,
      accent: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <MeshBackground />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(79,70,229,0.08),transparent_55%)]"
      />

      <div className="page-shell-wide relative">
        <div className="flex flex-col gap-10 lg:gap-12 xl:flex-row xl:items-start xl:gap-14">
          {/* Main column */}
          <div className="mx-auto w-full max-w-2xl flex-1 space-y-8">
            {/* Hero header */}
            <header className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="size-3" aria-hidden />
                AI-native quoting
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-[2.35rem] sm:leading-[1.15]">
                What are you quoting today?
              </h1>
              <p className="mx-auto max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground">
                Describe the job in plain language. Biz-Fix interprets the brief, matches products, applies
                margins, and opens a living quote you can refine with the assistant in Quote Studio.
              </p>
            </header>

            {/* Input area */}
            <div className="space-y-4">
              <div
                className={cn(
                  "relative rounded-2xl transition-shadow duration-300",
                  "border border-border bg-card premium-shadow-lg",
                  "focus-within:border-primary/25 focus-within:shadow-[0_0_0_3px_rgba(79,70,229,0.12)]"
                )}
              >
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`"Create a quote for Riverside Condos — premium hardwood flooring, quartz countertops, and modern lighting for Unit 4B. Apply 42% margin across all products."`}
                  className={cn(
                    "min-h-[160px] resize-y border-0 bg-transparent px-5 py-4 text-[15px] leading-relaxed shadow-none",
                    "placeholder:text-muted-foreground/50 placeholder:italic",
                    "focus-visible:ring-0 focus-visible:ring-offset-0"
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      handleGenerate();
                    }
                  }}
                />
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                  <span className="text-[11px] text-muted-foreground/60">
                    {prompt.length > 0 ? `${prompt.length} characters` : "Cmd+Enter to generate"}
                  </span>
                  <Button
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || generating}
                    size="sm"
                    className="h-9 gap-2 rounded-lg px-5 font-medium shadow-sm"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="size-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="size-3.5" />
                        Generate Quote
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}

              {generating && (
                <div className="rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm backdrop-blur-sm">
                  <ThinkingOrb
                    className="mx-auto max-w-sm"
                    detail="Groq · Catalog · Gemini · Engine"
                  />
                  <ul className="mx-auto mt-5 max-w-md space-y-2">
                    {PIPELINE_STEPS.map((s, i) => {
                      const isDone = i < activeStepIdx;
                      const isActive = i === activeStepIdx;
                      return (
                        <li
                          key={s.id}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-300",
                            isActive && "bg-primary/5 font-medium text-foreground",
                            isDone && "text-muted-foreground/60",
                            !isDone && !isActive && "text-muted-foreground/30"
                          )}
                        >
                          <span className={cn(
                            "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                            isDone ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground/40"
                          )}>
                            {isDone ? <Check className="size-3" /> : isActive ? <Loader2 className="size-3 animate-spin" /> : <span>{i + 1}</span>}
                          </span>
                          <div className="min-w-0">
                            <span>{s.label}</span>
                            {isActive && (
                              <span className="ml-2 text-[11px] text-muted-foreground font-normal">{s.sublabel}</span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Example prompts */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setPrompt(example.text)}
                    className={cn(
                      "group rounded-xl border border-border/60 bg-white p-3.5 text-left text-[13px] leading-snug text-foreground",
                      "transition-all hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-sm",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    )}
                  >
                    <span className="flex items-start gap-2.5">
                      <Wand2 className="mt-0.5 size-3.5 shrink-0 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span>
                        <span className="font-medium text-foreground">{example.label}</span>
                        <span className="text-muted-foreground"> &mdash; </span>
                        <span className="text-muted-foreground line-clamp-2">{example.text.slice(example.text.indexOf("—") + 1).trim() || example.text.slice(0, 80)}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent quotes */}
            {recentFour.length > 0 && (
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[15px] font-semibold tracking-tight">Recent Quotes</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Pick up where you left off</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1" asChild>
                    <Link href="/quotes">
                      View all <ArrowRight className="size-3" />
                    </Link>
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {recentFour.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-border/60 bg-white p-4 transition-all hover:border-border hover:shadow-sm cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-[13px] font-medium text-foreground leading-tight line-clamp-1">{q.clientName}</p>
                        <Badge variant={statusBadgeVariant(q.status)} className="text-[10px] shrink-0">
                          {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mb-3">{q.project}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold tabular-nums tracking-tight">{formatCurrency(q.total)}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{q.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Side stats */}
          <aside className="mx-auto w-full max-w-xs shrink-0 space-y-3 xl:sticky xl:top-20">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60 px-1">
              Your Workspace
            </p>
            {statItems.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3.5 rounded-xl border border-border/60 bg-white p-4 transition-shadow hover:shadow-sm"
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", s.bg)}>
                  <s.icon className={cn("size-4", s.accent)} aria-hidden />
                </div>
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground leading-tight">{s.label}</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight leading-tight">{s.value}</p>
                </div>
              </div>
            ))}

            {/* How it works */}
            <div className="rounded-xl border border-border/60 bg-white p-4 space-y-3 mt-2">
              <p className="text-xs font-semibold text-foreground">How it works</p>
              <div className="space-y-2.5">
                {[
                  { step: "1", text: "Describe the project in natural language" },
                  { step: "2", text: "AI matches products and applies margins" },
                  { step: "3", text: "Refine in Quote Studio with the AI assistant" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">{s.step}</span>
                    <span className="text-xs text-muted-foreground leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
