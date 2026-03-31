"use client";

import { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  FileDown,
  MessageSquare,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { products } from "@/lib/mock-data";
import { cn, formatCurrency } from "@/lib/utils";

type LineRow = {
  id: string;
  item: string;
  productName: string;
  sku: string;
  qty: number;
  unitLabel: string;
  unitPrice: number;
  costPerUnit: number;
};

function lineTotal(row: LineRow) {
  return row.qty * row.unitPrice;
}

function lineMarginPercent(row: LineRow) {
  const sell = lineTotal(row);
  const cost = row.qty * row.costPerUnit;
  if (sell <= 0) return 0;
  return ((sell - cost) / sell) * 100;
}

const INITIAL_LINES: LineRow[] = [
  {
    id: "1",
    item: "1",
    productName: 'Engineered Hardwood — European Oak 7"',
    sku: "FLR-HW-001",
    qty: 450,
    unitLabel: "sqft",
    unitPrice: 14.99,
    costPerUnit: 8.45,
  },
  {
    id: "2",
    item: "2",
    productName: "Luxury Vinyl Plank — Aged Walnut",
    sku: "FLR-LVP-010",
    qty: 200,
    unitLabel: "sqft",
    unitPrice: 6.49,
    costPerUnit: 3.2,
  },
  {
    id: "3",
    item: "3",
    productName: "Quartz Countertop — Calacatta Gold",
    sku: "CNTR-QTZ-030",
    qty: 35,
    unitLabel: "sqft",
    unitPrice: 105,
    costPerUnit: 62,
  },
  {
    id: "4",
    item: "4",
    productName: "Shaker Cabinet Set — Dove White",
    sku: "CABT-KIT-040",
    qty: 1,
    unitLabel: "set",
    unitPrice: 5499,
    costPerUnit: 3200,
  },
  {
    id: "5",
    item: "5",
    productName: 'Modern Linear Pendant — 48" Matte Black',
    sku: "LIGHT-PND-070",
    qty: 3,
    unitLabel: "unit",
    unitPrice: 379,
    costPerUnit: 195,
  },
  {
    id: "6",
    item: "6",
    productName: "Brushed Gold Rainfall Showerhead System",
    sku: "PLMB-FXT-060",
    qty: 2,
    unitLabel: "unit",
    unitPrice: 549,
    costPerUnit: 285,
  },
  {
    id: "7",
    item: "7",
    productName: "Italian Porcelain Tile — Carrara Look 24x24",
    sku: "TILE-PRC-020",
    qty: 120,
    unitLabel: "sqft",
    unitPrice: 9.99,
    costPerUnit: 4.8,
  },
  {
    id: "8",
    item: "8",
    productName: "Interior Premium Paint — Eggshell",
    sku: "PAINT-INT-050",
    qty: 8,
    unitLabel: "gal",
    unitPrice: 64.99,
    costPerUnit: 38,
  },
];

const CHAT_MESSAGES: { role: "ai" | "user"; text: string }[] = [
  {
    role: "ai",
    text: "I've prepared your quote for Unit 4B. The premium tier products give a 42% average margin.",
  },
  {
    role: "user",
    text: "Can you swap the countertop for a more budget-friendly option?",
  },
  {
    role: "ai",
    text: "Absolutely! I've found Granite — Absolute Black at $79.99/sqft which would save $875 while maintaining a 38% margin on that line item.",
  },
  {
    role: "user",
    text: "Perfect — apply that swap and flag anything else that could trim cost without hurting finish quality.",
  },
];

function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function QuoteStudioPage() {
  const [lines, setLines] = useState<LineRow[]>(INITIAL_LINES);
  const [chatDraft, setChatDraft] = useState("");

  const totals = useMemo(() => {
    let subtotal = 0;
    let costTotal = 0;
    for (const row of lines) {
      subtotal += lineTotal(row);
      costTotal += row.qty * row.costPerUnit;
    }
    const taxRate = 0.085;
    const tax = subtotal * taxRate;
    const grand = subtotal + tax;
    const profit = subtotal - costTotal;
    const marginPct = subtotal > 0 ? (profit / subtotal) * 100 : 0;
    return { subtotal, tax, grand, profit, marginPct };
  }, [lines]);

  const graniteRef = useMemo(
    () => products.find((p) => p.sku === "CNTR-GRNT-110"),
    []
  );

  function updateLine(id: string, patch: Partial<LineRow>) {
    setLines((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );
  }

  return (
    <div className="relative min-h-full bg-gradient-to-b from-background via-background to-slate-50/40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_10%_-10%,rgba(15,23,42,0.04),transparent)]"
      />
      <div className="relative mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-6">
          <main className="min-w-0 flex-1 space-y-6 lg:basis-[70%]">
            <Card className="border-border/80 shadow-sm ring-1 ring-black/[0.02]">
              <CardHeader className="border-b border-border/60 pb-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl font-semibold tracking-tight">
                        Project summary
                      </CardTitle>
                      <Badge variant="success">Accepted</Badge>
                    </div>
                    <CardDescription className="text-sm">
                      Riverside Condos LLC · Unit 4B Full Renovation
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:items-end">
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <Calendar className="size-4 shrink-0" aria-hidden />
                      Created {formatShortDate("2026-03-15")}
                    </span>
                    <span className="inline-flex items-center gap-2 tabular-nums">
                      <Calendar className="size-4 shrink-0" aria-hidden />
                      Expires {formatShortDate("2026-04-15")}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="inline-flex items-center gap-2 font-medium text-foreground">
                    <User className="size-4 text-blue-600" aria-hidden />
                    Client: Riverside Condos LLC
                  </span>
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <FileDown className="size-4" aria-hidden />
                    Project: Unit 4B Full Renovation
                  </span>
                </div>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="border-b border-border/60 bg-muted/20 py-4">
                <CardTitle className="text-base font-semibold">
                  Line items
                </CardTitle>
                <CardDescription>
                  Edit quantities and pricing—margins update live.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Unit price</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {lines.map((row) => (
                        <tr
                          key={row.id}
                          className="bg-card transition-colors hover:bg-muted/15"
                        >
                          <td className="px-4 py-2 align-middle font-mono text-xs text-muted-foreground">
                            {row.item}
                          </td>
                          <td className="max-w-[220px] px-4 py-2 align-middle">
                            <span className="line-clamp-2 text-foreground">
                              {row.productName}
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle font-mono text-xs">
                            {row.sku}
                          </td>
                          <td className="px-4 py-2 align-middle text-right">
                            <div className="ml-auto flex w-24 flex-col items-end gap-1">
                              <Input
                                type="number"
                                min={0}
                                value={row.qty}
                                onChange={(e) =>
                                  updateLine(row.id, {
                                    qty: Number(e.target.value) || 0,
                                  })
                                }
                                className="h-8 w-full text-right tabular-nums"
                              />
                              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                                {row.unitLabel}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 align-middle text-right">
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={row.unitPrice}
                              onChange={(e) =>
                                updateLine(row.id, {
                                  unitPrice: Number(e.target.value) || 0,
                                })
                              }
                              className="ml-auto h-8 w-28 text-right tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-2 align-middle text-right font-medium tabular-nums">
                            {formatCurrency(lineTotal(row))}
                          </td>
                          <td className="px-4 py-2 align-middle text-right tabular-nums text-emerald-700">
                            {lineMarginPercent(row).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              {graniteRef && (
                <CardFooter className="border-t border-border/60 bg-blue-50/40 py-3 text-xs text-blue-900">
                  <span className="font-medium">Tip:</span>{" "}
                  <span className="text-blue-900/90">
                    Alternative in catalog: {graniteRef.name} (
                    {formatCurrency(graniteRef.default_sell_price)}/sqft)
                  </span>
                </CardFooter>
              )}
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Subtotal",
                  value: formatCurrency(totals.subtotal),
                  muted: false,
                },
                {
                  label: "Tax (8.5%)",
                  value: formatCurrency(totals.tax),
                  muted: true,
                },
                {
                  label: "Total",
                  value: formatCurrency(totals.grand),
                  muted: false,
                  emphasis: true,
                },
                {
                  label: "Total margin",
                  value: `${totals.marginPct.toFixed(1)}%`,
                  muted: false,
                  accent: "text-emerald-700",
                },
                {
                  label: "Total profit",
                  value: formatCurrency(totals.profit),
                  muted: false,
                  accent: "text-emerald-700",
                },
              ].map((cell) => (
                <Card
                  key={cell.label}
                  className={cn(
                    "border-border/80 shadow-sm",
                    cell.emphasis &&
                      "border-blue-200/80 bg-gradient-to-br from-blue-50/80 to-white ring-1 ring-blue-500/10"
                  )}
                >
                  <CardContent className="p-4">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {cell.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-lg font-semibold tabular-nums tracking-tight",
                        cell.emphasis && "text-blue-950",
                        cell.accent
                      )}
                    >
                      {cell.value}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="bg-white">
                Save Draft
              </Button>
              <Button>Send to Client</Button>
              <Button variant="secondary">
                <Download className="size-4" aria-hidden />
                Export PDF
              </Button>
            </div>
          </main>

          <aside className="flex min-w-0 flex-col lg:basis-[30%] lg:max-w-md lg:shrink-0">
            <Card className="flex h-full min-h-[520px] flex-col border-border/80 shadow-md ring-1 ring-black/[0.03]">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-md shadow-violet-600/25">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Ask for swaps, margin checks, or client-ready copy.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-0 p-0">
                <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {CHAT_MESSAGES.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        m.role === "ai"
                          ? "self-start border border-border/60 bg-muted/40 text-foreground"
                          : "self-end bg-primary text-primary-foreground"
                      )}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder="Message the assistant..."
                      className="h-10 flex-1"
                    />
                    <Button type="button" size="icon" className="shrink-0">
                      <Send className="size-4" aria-hidden />
                    </Button>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <MessageSquare className="size-3.5" aria-hidden />
                    Context: Unit 4B · {lines.length} line items
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
