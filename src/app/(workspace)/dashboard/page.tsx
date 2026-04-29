"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  FileText,
  Percent,
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
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const { user } = useUser();
  const displayName =
    (user?.publicMetadata?.companyName as string | undefined) ??
    user?.firstName ??
    "there";
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/db/dashboard").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  const stats = data
    ? [
        {
          label: "Total Revenue",
          value: formatCurrency(data.stats.totalRevenue),
          hint: "YTD recognized",
          icon: DollarSign,
          accent: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Active Quotes",
          value: String(data.stats.activeQuotes),
          hint: "Sent, awaiting response",
          icon: FileText,
          accent: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "Accepted",
          value: String(data.stats.acceptedThisMonth),
          hint: "Closed wins",
          icon: CheckCircle2,
          accent: "text-violet-600",
          bg: "bg-violet-50",
        },
        {
          label: "Avg Margin",
          value: `${data.stats.avgMargin}%`,
          hint: "Blended across sales",
          icon: Percent,
          accent: "text-amber-600",
          bg: "bg-amber-50",
        },
      ]
    : [];

  return (
    <div className="relative min-h-full w-full">
      <div className="page-shell space-y-6 md:space-y-8">

        {/* Hero */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-6 md:p-7 premium-shadow">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between lg:gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/70 px-3 py-1 text-[10px] font-semibold text-blue-700 tracking-wide uppercase">
                <Sparkles className="size-3" aria-hidden />
                Command Center
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {greeting}, {displayName}
                </h1>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Your pipeline is live. Start from a prompt and refine every line in Quote Studio.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Button size="default" className="shadow-sm shadow-blue-600/10 gap-1.5" asChild>
                <Link href="/new-quote">
                  <FileText className="size-3.5" aria-hidden /> New Quote
                </Link>
              </Button>
              <Button variant="outline" size="default" className="bg-white gap-1.5" asChild>
                <Link href="/quotes">
                  <FileText className="size-3.5" aria-hidden /> All quotes
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        {stats.length > 0 && (
          <section>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border/50 bg-white p-4 transition-shadow hover:shadow-sm"
                >
                  <div className={cn("flex size-8 items-center justify-center rounded-lg mb-3", s.bg)}>
                    <s.icon className={cn("size-4", s.accent)} aria-hidden />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {s.label}
                  </p>
                  <p className="mt-0.5 text-xl font-bold tracking-tight tabular-nums">{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{s.hint}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recent Quotes — full width */}
        <section>
          <Card className="border-border/50 bg-white premium-shadow">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
              <div>
                <CardTitle className="text-[15px] font-semibold">Recent Quotes</CardTitle>
                <CardDescription className="text-xs">Latest activity across clients and projects</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700 gap-1" asChild>
                <Link href="/quotes">
                  View all <ArrowUpRight className="size-3" aria-hidden />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-2.5">Client</th>
                      <th className="px-5 py-2.5">Project</th>
                      <th className="px-5 py-2.5">Status</th>
                      <th className="px-5 py-2.5 text-right">Total</th>
                      <th className="px-5 py-2.5 text-right">Margin</th>
                      <th className="px-5 py-2.5">Date</th>
                      <th className="px-5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {!data && (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                          Loading…
                        </td>
                      </tr>
                    )}
                    {data?.recentQuotes.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-sm text-muted-foreground">
                          No quotes yet.{" "}
                          <Link href="/new-quote" className="font-medium text-primary hover:underline">
                            Create your first quote →
                          </Link>
                        </td>
                      </tr>
                    )}
                    {data?.recentQuotes.map((q) => (
                      <tr key={q.id} className="bg-white hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3 font-medium text-foreground">{q.clientName}</td>
                        <td className="max-w-[180px] truncate px-5 py-3 text-muted-foreground">
                          {q.project ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={statusBadgeVariant(q.status)} className="text-[10px] capitalize">
                            {q.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-right font-medium tabular-nums">
                          {formatCurrency(q.total)}
                        </td>
                        <td className={cn(
                          "px-5 py-3 text-right font-medium tabular-nums",
                          q.margin >= 35 ? "text-emerald-700" : q.margin >= 20 ? "text-foreground" : "text-amber-600"
                        )}>
                          {formatPercent(q.margin)}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground tabular-nums text-xs">
                          {formatShortDate(q.createdAt)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary" asChild>
                            <Link href={`/quote-studio?id=${encodeURIComponent(q.id)}`}>
                              Open
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
