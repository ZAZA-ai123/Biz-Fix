"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThinkingOrb } from "@/components/ai/thinking-orb";
import { MeshBackground } from "@/components/vibe/mesh-background";
import { cn, formatCurrency } from "@/lib/utils";
import type { EngineQuote, QuoteRequest } from "@/lib/engine/types";
import { applyOverridesToEngineQuote, type QuoteOverrides } from "@/lib/engine/apply-overrides";

type ChatMessage = { role: "ai" | "user"; text: string };

type AgentMeta = {
  plan?: {
    intent?: string;
    query?: string;
    retrievalPlan?: { corpora?: string[]; topK?: number };
    editPlan?: { ops?: unknown[] };
  };
  ragChunks?: number;
  catalogLines?: number;
  usedDemoCatalog?: boolean;
};

type PipelineSnapshot = {
  meta?: AgentMeta;
  warnings?: string[];
  prompt?: string;
};

function buildWelcomeMessage(parsed: EngineQuote): ChatMessage {
  return {
    role: "ai",
    text: `I've prepared the quote${parsed.customerName ? ` for ${parsed.customerName}` : ""}${parsed.projectType ? ` (${parsed.projectType} project)` : ""}. ${parsed.items.length} line items totaling ${formatCurrency(parsed.total)} with ${parsed.assumptions.length > 0 ? parsed.assumptions.length + " assumptions" : "no special assumptions"}.\n\nYou can ask me to adjust margins, swap products, upgrade tiers, or reduce costs.`,
  };
}

function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const today = new Date().toISOString().slice(0, 10);
const expiryDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

export function QuoteStudioClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const freshRun = searchParams.get("fresh") === "1";
  const [quote, setQuote] = useState<EngineQuote | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<QuoteRequest | null>(null);
  const [overrides, setOverrides] = useState<QuoteOverrides | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [refining, setRefining] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [inboundPipeline, setInboundPipeline] = useState<PipelineSnapshot | null>(null);
  const [lastCopilotPipeline, setLastCopilotPipeline] = useState<PipelineSnapshot | null>(null);
  const [pipelinePanelOpen, setPipelinePanelOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!freshRun || !idFromUrl) return;
    try {
      const raw = sessionStorage.getItem("biz-fix-last-pipeline");
      if (raw) setInboundPipeline(JSON.parse(raw) as PipelineSnapshot);
    } catch {
      setInboundPipeline(null);
    }
    setPipelinePanelOpen(true);
    router.replace(`/quote-studio?id=${encodeURIComponent(idFromUrl)}`);
  }, [freshRun, idFromUrl, router]);

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);

    if (idFromUrl) {
      setLoadingRemote(true);
      (async () => {
        try {
          const res = await fetch(`/api/db/quotes/${encodeURIComponent(idFromUrl)}`);
          const data = await res.json();
          if (cancelled) return;
          if (!res.ok) {
            setQuote(null);
            setLoadError(data.error ?? "Could not load quote.");
            setChatMessages([]);
            return;
          }
          if (!data.engineQuote) {
            setQuote(null);
            setLoadError(
              "This quote has no saved line snapshot. Legacy rows only store summary totals — create a new quote from New Quote to open it here."
            );
            setChatMessages([]);
            setQuoteRequest(null);
            setOverrides(null);
            return;
          }
          const parsed = data.engineQuote as EngineQuote;
          setQuote(parsed);
          sessionStorage.setItem("biz-fix-active-quote", JSON.stringify(parsed));
          setChatMessages([buildWelcomeMessage(parsed)]);
          if (data.quoteRequest) {
            setQuoteRequest(data.quoteRequest as QuoteRequest);
            sessionStorage.setItem("biz-fix-active-quote-request", JSON.stringify(data.quoteRequest));
          } else {
            setQuoteRequest(null);
          }
          if (data.overrides) {
            setOverrides(data.overrides as QuoteOverrides);
          } else {
            setOverrides(null);
          }
        } finally {
          if (!cancelled) {
            setLoadingRemote(false);
            setHasLoaded(true);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    const stored = sessionStorage.getItem("biz-fix-active-quote");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as EngineQuote;
        setQuote(parsed);
        setChatMessages([buildWelcomeMessage(parsed)]);
      } catch {
        // ignore parse errors
      }
    }
    const storedRequest = sessionStorage.getItem("biz-fix-active-quote-request");
    if (storedRequest) {
      try {
        setQuoteRequest(JSON.parse(storedRequest) as QuoteRequest);
      } catch {
        setQuoteRequest(null);
      }
    }
    const storedOverrides = sessionStorage.getItem("biz-fix-active-quote-overrides");
    if (storedOverrides) {
      try {
        setOverrides(JSON.parse(storedOverrides) as QuoteOverrides);
      } catch {
        setOverrides(null);
      }
    }
    setHasLoaded(true);
    return () => {
      cancelled = true;
    };
  }, [idFromUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (overrides) {
      sessionStorage.setItem("biz-fix-active-quote-overrides", JSON.stringify(overrides));
    }
  }, [overrides]);

  const totals = useMemo(() => {
    if (!quote) return { subtotal: 0, tax: 0, grand: 0, profit: 0, marginPct: 0 };
    const subtotal = quote.subtotal;
    const costTotal = quote.items.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
    const taxRate = 0.085;
    const tax = subtotal * taxRate;
    const grand = subtotal + tax;
    const profit = subtotal - costTotal;
    const marginPct = subtotal > 0 ? (profit / subtotal) * 100 : 0;
    return { subtotal, tax, grand, profit, marginPct };
  }, [quote]);

  function upsertLineOverride(
    sku: string,
    patch: { quantity?: number; sellPrice?: number; locked?: boolean }
  ) {
    const nextOverrides: QuoteOverrides = {
      lineOverrides: {
        ...(overrides?.lineOverrides ?? {}),
        [sku]: { ...(overrides?.lineOverrides?.[sku] ?? {}), ...patch },
      },
    };
    setOverrides(nextOverrides);
    setQuote((prev) => (prev ? applyOverridesToEngineQuote(prev, nextOverrides) : prev));
  }

  async function handleRefine() {
    if (!chatDraft.trim() || !quote || refining) return;
    const userMessage = chatDraft.trim();
    setChatDraft("");
    setChatMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setRefining(true);

    try {
      const body: Record<string, unknown> = {
        mode: "iterate",
        prompt: userMessage,
        quoteId: quote.id,
        existingRequest: quoteRequest,
      };
      if (overrides != null) body.overrides = overrides;

      const res = await fetch("/api/quote/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Refinement failed");
      const data = (await res.json()) as {
        quote: EngineQuote;
        quoteRequest?: QuoteRequest;
        meta?: AgentMeta;
        warnings?: string[];
        citations?: Array<{ id: string; score: number }>;
      };
      const { quote: refined, quoteRequest: nextRequest, meta, warnings, citations } = data;
      setQuote(refined);
      sessionStorage.setItem("biz-fix-active-quote", JSON.stringify(refined));
      if (nextRequest) {
        setQuoteRequest(nextRequest as QuoteRequest);
        sessionStorage.setItem("biz-fix-active-quote-request", JSON.stringify(nextRequest));
      }

      const newAssumptions = refined.assumptions.filter(
        (a: string) => !quote.assumptions.includes(a)
      );
      const opCount = meta?.plan?.editPlan?.ops?.length ?? 0;
      const citeCount = citations?.length ?? meta?.ragChunks ?? 0;
      const summaryBits = [
        meta?.plan?.intent ? `Intent: ${meta.plan.intent}` : null,
        typeof meta?.ragChunks === "number" ? `RAG chunks: ${meta.ragChunks}` : null,
        typeof meta?.catalogLines === "number" ? `Catalog lines: ${meta.catalogLines}` : null,
        meta?.usedDemoCatalog ? "Demo catalog fallback was used." : null,
        opCount > 0 ? `Planned edits: ${opCount} op(s)` : null,
        citeCount > 0 ? `Retrieval signals: ${citeCount}` : null,
      ].filter(Boolean);
      const diffText =
        newAssumptions.length > 0
          ? [summaryBits.length > 0 ? summaryBits.join(" · ") : null, "", ...newAssumptions]
              .filter(Boolean)
              .join("\n")
          : [summaryBits.join(" · "), "", `Updated total: ${formatCurrency(refined.total)} · ${refined.items.length} line(s).`]
              .filter(Boolean)
              .join("\n");

      setLastCopilotPipeline({ meta, warnings: warnings ?? [], prompt: userMessage });
      setPipelinePanelOpen(true);
      setChatMessages((prev) => [...prev, { role: "ai", text: diffText }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, I couldn't process that refinement. Please try again." },
      ]);
    } finally {
      setRefining(false);
    }
  }

  async function handleSaveDraft() {
    if (!quote || savingDraft) return;
    setSaveMessage(null);
    setSavingDraft(true);
    try {
      // Use collection PUT — matches deployed API (dynamic [id] route may not expose PATCH on older builds).
      const res = await fetch("/api/db/quotes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quote, quoteRequest, overrides }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setSaveMessage(typeof data.error === "string" ? data.error : "Save failed");
        return;
      }
      setSaveMessage("Saved");
      sessionStorage.setItem("biz-fix-active-quote", JSON.stringify(quote));
    } catch {
      setSaveMessage("Network error");
    } finally {
      setSavingDraft(false);
    }
  }

  if (!hasLoaded || loadingRemote) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden />
        <p className="text-sm text-muted-foreground">Loading quote…</p>
      </div>
    );
  }

  if (!quote) {
    if (loadError) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="size-6 text-primary" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Couldn&apos;t open this quote</h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">{loadError}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="outline" onClick={() => router.push("/quotes")}>
              Back to quotes
            </Button>
            <Button onClick={() => router.push("/new-quote")} className="gap-2">
              New Quote <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="size-6 text-primary" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground">No active quote</h2>
        <p className="mb-6 max-w-md text-sm text-muted-foreground">
          Start from New Quote — we&apos;ll drop the generated lines here so you can refine pricing, swap
          SKUs, and tighten assumptions with the assistant.
        </p>
        <Button onClick={() => router.push("/new-quote")} className="gap-2">
          Create a quote <ArrowRight className="size-4" />
        </Button>
      </div>
    );
  }

  function renderPipelineDetails(snapshot: PipelineSnapshot | null) {
    if (!snapshot?.meta && !(snapshot?.warnings && snapshot.warnings.length)) return null;
    const m = snapshot.meta;
    return (
      <div className="mt-2 space-y-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {snapshot.prompt && (
          <p>
            <span className="font-semibold text-foreground/80">Prompt: </span>
            {snapshot.prompt}
          </p>
        )}
        {m?.plan?.query && (
          <p>
            <span className="font-semibold text-foreground/80">Search query: </span>
            {m.plan.query}
          </p>
        )}
        {m?.plan?.retrievalPlan?.corpora && m.plan.retrievalPlan.corpora.length > 0 && (
          <p>
            <span className="font-semibold text-foreground/80">Sources searched: </span>
            {m.plan.retrievalPlan.corpora.join(", ")}
          </p>
        )}
        {(m?.ragChunks !== undefined || m?.catalogLines !== undefined) && (
          <p className="tabular-nums">
            Context chunks: {m?.ragChunks ?? "—"} · Catalog products considered: {m?.catalogLines ?? "—"}
            {m?.usedDemoCatalog ? " · (demo catalog used)" : ""}
          </p>
        )}
        {snapshot.warnings && snapshot.warnings.length > 0 && (
          <ul className="list-disc pl-4 text-amber-800">
            {snapshot.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <MeshBackground />
      <div className="page-shell-studio">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8">
          <main className="min-w-0 flex-1 space-y-5 lg:min-w-0">
            <Card className="border-border/80 premium-shadow">
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-lg font-semibold tracking-tight">
                        {quote.customerName || "Untitled Quote"}
                      </CardTitle>
                      <Badge variant="secondary">Draft</Badge>
                      {quote.positioning && (
                        <Badge variant={quote.positioning === "premium" ? "premium" : quote.positioning === "budget" ? "secondary" : "info"} className="capitalize">
                          {quote.positioning}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-[13px]">
                      {quote.projectType ? `${quote.projectType.charAt(0).toUpperCase() + quote.projectType.slice(1)} project` : "Custom project"} &middot; {quote.id}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:items-end">
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Calendar className="size-3.5" aria-hidden />
                      Created {formatShortDate(today)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Calendar className="size-3.5" aria-hidden />
                      Expires {formatShortDate(expiryDate)}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {quote.assumptions.length > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-3">
                <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-800">Assumptions</p>
                  {quote.assumptions.map((a, i) => (
                    <p key={i} className="text-xs text-amber-700 leading-relaxed">{a}</p>
                  ))}
                </div>
              </div>
            )}

            {(inboundPipeline || lastCopilotPipeline) && (
              <Card className="border-border/80 premium-shadow">
                <CardHeader className="py-3 px-4 pb-2">
                  <button
                    type="button"
                    onClick={() => setPipelinePanelOpen((o) => !o)}
                    className="flex w-full items-center gap-2 text-left"
                  >
                    {pipelinePanelOpen ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    )}
                    <CardTitle className="text-[14px] font-semibold">How this quote was built</CardTitle>
                  </button>
                  <CardDescription className="text-xs pl-6">
                    Steps the AI took — planning, catalog search, structuring, and building — based on your workspace data.
                  </CardDescription>
                </CardHeader>
                {pipelinePanelOpen && (
                  <CardContent className="space-y-4 border-t border-border/60 px-4 py-3">
                    {inboundPipeline && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Initial generation
                        </p>
                        {renderPipelineDetails(inboundPipeline)}
                      </div>
                    )}
                    {lastCopilotPipeline && (
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Last copilot turn
                        </p>
                        {renderPipelineDetails(lastCopilotPipeline)}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )}

            <Card className="overflow-hidden border-border/80 premium-shadow">
              <CardHeader className="border-b border-border/60 bg-muted/30 py-3.5 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-[14px] font-semibold">Line Items</CardTitle>
                    <CardDescription className="text-xs">{quote.items.length} products matched</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-[13px]">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-2.5 w-8">#</th>
                        <th className="px-5 py-2.5 w-10 text-center" title="Lock this line — AI won't swap or reprice it during refinement">Lock</th>
                        <th className="px-5 py-2.5">Product</th>
                        <th className="px-5 py-2.5">Vendor</th>
                        <th className="px-5 py-2.5 text-right">Qty</th>
                        <th className="px-5 py-2.5 text-right">Unit Price</th>
                        <th className="px-5 py-2.5 text-right">Line Total</th>
                        <th className="px-5 py-2.5 text-right">Margin</th>
                        <th className="px-5 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {quote.items.map((item, idx) => {
                        const longLead = item.leadTimeDays > 14;
                        const review =
                          item.stockStatus === "low_stock" ||
                          item.stockStatus === "made_to_order" ||
                          longLead;
                        return (
                        <tr key={`${item.sku}-${idx}`} className="bg-card transition-colors hover:bg-muted/20">
                          <td className="px-5 py-3 text-muted-foreground text-xs tabular-nums">{idx + 1}</td>
                          <td className="px-5 py-3 text-center">
                            <Checkbox
                              checked={overrides?.lineOverrides?.[item.sku]?.locked === true}
                              onCheckedChange={(checked) => {
                                upsertLineOverride(item.sku, {
                                  locked: checked === true,
                                });
                              }}
                              aria-label={`Lock line ${item.sku} — AI won't reprice or swap this item`}
                              title="Lock — AI won't reprice or swap this item"
                              className="mx-auto"
                            />
                          </td>
                          <td className="px-5 py-3">
                            <div className="space-y-1">
                              <p className="font-medium text-foreground leading-tight line-clamp-1">{item.name}</p>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] text-muted-foreground">{item.sku}</span>
                                <Badge variant={item.tier === "premium" ? "premium" : item.tier === "budget" ? "secondary" : "info"} className="text-[9px] px-1.5 py-0">
                                  {item.tier}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground text-xs">{item.vendor}</td>
                          <td className="px-5 py-3 text-right tabular-nums font-medium">
                            <Input
                              type="number"
                              inputMode="numeric"
                              className="h-8 w-20 text-right text-[12px]"
                              value={item.quantity}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isFinite(n)) upsertLineOverride(item.sku, { quantity: n });
                              }}
                            />
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums">
                            <Input
                              type="number"
                              inputMode="decimal"
                              step="0.01"
                              className="h-8 w-28 text-right text-[12px]"
                              value={item.sellPrice}
                              onChange={(e) => {
                                const n = Number(e.target.value);
                                if (Number.isFinite(n)) upsertLineOverride(item.sku, { sellPrice: n });
                              }}
                            />
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums font-medium">{formatCurrency(item.lineTotal)}</td>
                          <td className={cn("px-5 py-3 text-right tabular-nums font-medium", item.marginPercent >= 40 ? "text-emerald-700" : item.marginPercent >= 25 ? "text-foreground" : "text-amber-600")}>
                            {item.marginPercent.toFixed(1)}%
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col items-start gap-1.5">
                              {item.stockStatus === "in_stock" ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                                  <Check className="size-3" /> In stock
                                </span>
                              ) : item.stockStatus === "low_stock" ? (
                                <Badge variant="warning" className="text-[9px]">
                                  Low stock
                                </Badge>
                              ) : item.stockStatus === "out_of_stock" ? (
                                <Badge variant="destructive" className="text-[9px]">
                                  Out of stock
                                </Badge>
                              ) : (
                                <Badge variant="info" className="inline-flex items-center gap-1 text-[9px]">
                                  <Clock3 className="size-3" />
                                  {item.leadTimeDays}d lead
                                </Badge>
                              )}
                              {review && (
                                <Badge variant="outline" className="text-[9px] font-normal text-muted-foreground">
                                  Review
                                </Badge>
                              )}
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { label: "Subtotal", value: formatCurrency(totals.subtotal) },
                { label: "Tax (8.5%)", value: formatCurrency(totals.tax), muted: true },
                { label: "Total", value: formatCurrency(totals.grand), emphasis: true },
                { label: "Margin", value: `${totals.marginPct.toFixed(1)}%`, accent: true },
                { label: "Profit", value: formatCurrency(totals.profit), accent: true },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className={cn(
                    "rounded-xl border border-border/60 bg-white p-3.5",
                    cell.emphasis && "border-primary/20 bg-primary/5"
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{cell.label}</p>
                  <p className={cn(
                    "mt-0.5 text-lg font-semibold tabular-nums tracking-tight",
                    cell.emphasis && "text-foreground",
                    cell.accent && "text-emerald-700",
                    cell.muted && "text-muted-foreground"
                  )}>
                    {cell.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-card"
                type="button"
                disabled={savingDraft}
                onClick={() => void handleSaveDraft()}
              >
                {savingDraft ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : (
                  "Save draft"
                )}
              </Button>
              {saveMessage && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium transition-colors",
                    saveMessage === "Saved" ? "text-emerald-600" : "text-destructive"
                  )}
                  role="status"
                >
                  {saveMessage === "Saved" && <Check className="size-3" aria-hidden />}
                  {saveMessage}
                </span>
              )}
              <Button
                size="sm"
                className="h-9 cursor-not-allowed opacity-50"
                disabled
                title="Coming soon — send quote directly to client via email"
                type="button"
              >
                Send to client
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => {
                  if (quote?.id) {
                    window.open(`/quote/${quote.id}/print`, "_blank", "noopener");
                  }
                }}
                disabled={!quote?.id}
                type="button"
              >
                <Download className="size-3.5" /> Export PDF
              </Button>
            </div>
          </main>

          <aside className="flex min-w-0 flex-col lg:w-[400px] lg:shrink-0">
            <Card className="flex min-h-[min(560px,70vh)] flex-1 flex-col border-border/80 premium-shadow-lg lg:sticky lg:top-20">
              <CardHeader className="border-b border-border/60 px-4 pb-3 pt-4">
                <CardTitle className="flex items-center gap-2.5 text-[14px] font-semibold">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Sparkles className="size-3.5" aria-hidden />
                  </span>
                  AI Assistant
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                  Ask to adjust margins, swap products, change tiers, or cut costs — the table updates live.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-0 p-0">
                <div className="flex max-h-[min(420px,45vh)] flex-1 flex-col gap-2.5 overflow-y-auto p-4 lg:max-h-[52vh]">
                  {chatMessages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[92%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed",
                        m.role === "ai"
                          ? "self-start border border-border/60 bg-muted/40 text-foreground"
                          : "self-end bg-primary text-primary-foreground"
                      )}
                    >
                      {m.text.split("\n").map((line, j) => (
                        <p key={j} className={j > 0 ? "mt-1.5" : ""}>{line}</p>
                      ))}
                    </div>
                  ))}
                  {refining && (
                    <div className="self-start rounded-xl border border-border/60 bg-muted/30 px-3 py-3">
                      <ThinkingOrb
                        className="max-w-[280px]"
                        labelClassName="text-[11px]"
                        detail="Groq → RAG → Gemini → engine → DB"
                      />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="flex flex-wrap gap-1.5 border-t border-border/60 px-4 py-2.5">
                  {[
                    "Set 35% margin",
                    "Make it more premium",
                    "Reduce total by 10%",
                    "Swap tables",
                  ].map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setChatDraft(q)}
                      className="rounded-md border border-border/70 bg-card px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-foreground"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <div className="border-t border-border/60 p-3">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRefine();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder="e.g. Apply 32% margin or swap cabinets…"
                      className="h-9 flex-1 rounded-lg text-[13px]"
                      disabled={refining}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="h-9 w-9 shrink-0 rounded-lg"
                      disabled={!chatDraft.trim() || refining}
                    >
                      <Send className="size-3.5" aria-hidden />
                    </Button>
                  </form>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground/60 px-1">
                    <MessageSquare className="size-3" aria-hidden />
                    {quote.items.length} items &middot; {formatCurrency(quote.total)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
