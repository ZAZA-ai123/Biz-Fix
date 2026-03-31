"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  FileText,
  Layers,
  Package,
  Percent,
  Sparkles,
  Target,
  TrendingUp,
  Upload,
  Users,
  Zap,
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
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
import Link from "next/link";

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
    totalRevenue: number;
    avgMargin: number;
    activeQuotes: number;
    acceptedThisMonth: number;
    catalogProducts: number;
    activeVendors: number;
  };
  recentQuotes: Quote[];
  revenueByMonth: Record<string, number>;
  revenueByCategory: Record<string, number>;
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusBadgeVariant(status: Quote["status"]): "success" | "info" | "secondary" | "destructive" | "warning" {
  switch (status) {
    case "accepted": return "success";
    case "sent": return "info";
    case "draft": return "secondary";
    case "declined": return "destructive";
    case "expired": return "warning";
    default: return "secondary";
  }
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/db/dashboard").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const stats = data
    ? [
        { label: "Total Revenue", value: formatCurrency(data.stats.totalRevenue), hint: "YTD recognized", icon: DollarSign, className: "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white text-blue-950 shadow-blue-100/50", iconClass: "bg-blue-600 text-white shadow-blue-600/25" },
        { label: "Active Quotes", value: String(data.stats.activeQuotes), hint: "In pipeline", icon: FileText, className: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white text-emerald-950 shadow-emerald-100/50", iconClass: "bg-emerald-600 text-white shadow-emerald-600/25" },
        { label: "Accepted This Month", value: String(data.stats.acceptedThisMonth), hint: "Closed wins", icon: CheckCircle2, className: "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white text-violet-950 shadow-violet-100/50", iconClass: "bg-violet-600 text-white shadow-violet-600/25" },
        { label: "Avg Margin", value: `${data.stats.avgMargin}%`, hint: "Blended sales margin", icon: Percent, className: "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white text-amber-950 shadow-amber-100/50", iconClass: "bg-amber-500 text-white shadow-amber-500/25" },
        { label: "Catalog Products", value: String(data.stats.catalogProducts), hint: "SKUs live", icon: Package, className: "border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-white text-sky-950 shadow-sky-100/50", iconClass: "bg-sky-600 text-white shadow-sky-600/25" },
        { label: "Active Vendors", value: String(data.stats.activeVendors), hint: "Supply partners", icon: Users, className: "border-teal-200/80 bg-gradient-to-br from-teal-50/90 to-white text-teal-950 shadow-teal-100/50", iconClass: "bg-teal-600 text-white shadow-teal-600/25" },
      ]
    : [];

  const topCategory = data
    ? Object.entries(data.revenueByCategory).sort((a, b) => b[1] - a[1])[0]
    : null;

  const conversionRate = data
    ? data.stats.acceptedThisMonth / Math.max(data.stats.activeQuotes + data.stats.acceptedThisMonth, 1)
    : 0;

  return (
    <div className="relative min-h-full">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.12),transparent)]" />
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

        {/* Hero */}
        <section className={cn("overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-blue-50/40 p-6 shadow-sm sm:p-8", "ring-1 ring-black/[0.03]")}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-800">
                <Sparkles className="size-3.5" aria-hidden />
                PedTECH Global — Command Center
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {greeting}, Zoravar
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Your EdTech pipeline is live. Spin up a new proposal, run competitor research, or browse your catalog.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="shadow-md shadow-blue-600/15" asChild>
                <Link href="/new-quote"><FileText className="size-4" aria-hidden /> New Quote</Link>
              </Button>
              <Button variant="outline" size="lg" className="bg-white/80" asChild>
                <Link href="/research"><Sparkles className="size-4" aria-hidden /> Research Agent</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {stats.map((s) => (
              <Card key={s.label} className={cn("border shadow-sm transition-shadow hover:shadow-md", s.className)}>
                <CardContent className="flex flex-col gap-4 p-5">
                  <div className={cn("flex size-10 items-center justify-center rounded-xl shadow-md", s.iconClass)}>
                    <s.icon className="size-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">{s.label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Quotes + Insights */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <Card className="border-border/80 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
              <div>
                <CardTitle className="text-lg">Recent Quotes</CardTitle>
                <CardDescription>Latest activity across clients and projects</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary" asChild>
                <Link href="/quotes">View all <ArrowUpRight className="size-4" aria-hidden /></Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-6 py-3">Quote</th>
                      <th className="px-6 py-3">Client</th>
                      <th className="px-6 py-3">Project</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Total</th>
                      <th className="px-6 py-3">Created</th>
                      <th className="px-6 py-3 text-right">Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {!data && (
                      <tr><td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground">Loading…</td></tr>
                    )}
                    {data?.recentQuotes.map((q) => (
                      <tr key={q.id} className="bg-card transition-colors hover:bg-muted/20">
                        <td className="px-6 py-3.5 font-mono text-xs font-medium text-foreground">{q.id}</td>
                        <td className="px-6 py-3.5 font-medium text-foreground">{q.clientName}</td>
                        <td className="max-w-[200px] truncate px-6 py-3.5 text-muted-foreground">{q.project}</td>
                        <td className="px-6 py-3.5">
                          <Badge variant={statusBadgeVariant(q.status)}>
                            {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium tabular-nums">{formatCurrency(q.total)}</td>
                        <td className="px-6 py-3.5 text-muted-foreground tabular-nums">{formatShortDate(q.createdAt)}</td>
                        <td className="px-6 py-3.5 text-right font-medium tabular-nums text-emerald-700">{q.margin.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit border-border/80 bg-gradient-to-b from-white to-slate-50/50 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="size-5 text-blue-600" aria-hidden />
                Quick Insights
              </CardTitle>
              <CardDescription>Operational signals from your workspace</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex gap-4 rounded-xl border border-border/60 bg-white/80 p-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20">
                  <TrendingUp className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top Category</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{topCategory?.[0] ?? "—"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{topCategory ? formatCurrency(topCategory[1]) + " revenue" : "No sales yet"}</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-border/60 bg-white/80 p-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <Target className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Conversion Rate</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{formatPercent(conversionRate)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Sent → accepted quotes</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-border/60 bg-white/80 p-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-md shadow-amber-500/20">
                  <Percent className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Avg Sales Margin</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{data ? `${data.stats.avgMargin}%` : "—"}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Blended across all completed sales</p>
                </div>
              </div>

              <div className="flex gap-4 rounded-xl border border-border/60 bg-white/80 p-4 shadow-sm">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-md shadow-violet-600/20">
                  <Zap className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Catalog Health</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    <span className="font-semibold tabular-nums">{data?.stats.catalogProducts ?? "—"}</span> live SKUs across{" "}
                    <span className="font-semibold tabular-nums">{data?.stats.activeVendors ?? "—"}</span> active vendors
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">EdTech solutions ready to quote</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
