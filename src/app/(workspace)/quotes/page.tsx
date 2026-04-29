"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Copy,
  FileText,
  Plus,
  ScrollText,
  Search,
  Send,
  Trash2,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  expiresAt: string | null;
};

function quoteStatusVariant(
  status: Quote["status"]
): "secondary" | "info" | "success" | "destructive" | "warning" {
  switch (status) {
    case "draft":
      return "secondary";
    case "sent":
      return "info";
    case "accepted":
      return "success";
    case "declined":
      return "destructive";
    case "expired":
      return "warning";
    default:
      return "secondary";
  }
}

function formatShortDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function inDateRange(created: string, from: string, to: string): boolean {
  if (!from && !to) return true;
  const d = created;
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}

export default function QuotesPage() {
  const [rows, setRows] = useState<Quote[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/db/quotes").then((r) => r.json()).then(setRows).catch(() => {});
  }, []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchDate = inDateRange(r.createdAt, dateFrom, dateTo);
      if (!q) return matchStatus && matchDate;
      const hay = `${r.id} ${r.clientName} ${r.project ?? ""}`.toLowerCase();
      return matchStatus && matchDate && hay.includes(q);
    });
  }, [rows, search, statusFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const sent = filtered.filter((q) => q.status === "sent").length;
    const accepted = filtered.filter((q) => q.status === "accepted").length;
    const value = filtered.reduce((acc, q) => acc + q.total, 0);
    return { total, sent, accepted, value };
  }, [filtered]);

  const statCards = [
    {
      label: "Total Quotes",
      value: String(stats.total),
      hint: "In current view",
      icon: ScrollText,
      className:
        "border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white text-slate-950 shadow-slate-100/50",
      iconClass: "bg-slate-700 text-white shadow-slate-700/25",
    },
    {
      label: "Sent",
      value: String(stats.sent),
      hint: "Awaiting response",
      icon: Send,
      className:
        "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white text-blue-950 shadow-blue-100/50",
      iconClass: "bg-blue-600 text-white shadow-blue-600/25",
    },
    {
      label: "Accepted",
      value: String(stats.accepted),
      hint: "Closed wins",
      icon: CheckCircle2,
      className:
        "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white text-emerald-950 shadow-emerald-100/50",
      iconClass: "bg-emerald-600 text-white shadow-emerald-600/25",
    },
    {
      label: "Total Value",
      value: formatCurrency(stats.value),
      hint: "Sum of totals",
      icon: FileText,
      className:
        "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white text-violet-950 shadow-violet-100/50",
      iconClass: "bg-violet-600 text-white shadow-violet-600/25",
    },
  ];

  function duplicateQuote(q: Quote) {
    setRows((prev) => {
      const duplicateCount = prev.filter((row) => row.id.startsWith(`${q.id}-COPY-`)).length + 1;
      const copy: Quote = {
        ...q,
        id: `${q.id}-COPY-${duplicateCount.toString().padStart(2, "0")}`,
        status: "draft",
        createdAt: new Date().toISOString().slice(0, 10),
      };
      return [copy, ...prev];
    });
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/db/quotes?id=${encodeURIComponent(deleteTarget.id)}`, { method: "DELETE" });
      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    } catch {
      // keep list unchanged on network failure
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.1),transparent)]"
      />
      <div className="page-shell relative space-y-8 md:space-y-10">
        <section
          className={cn(
            "overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-blue-50/30 p-6 shadow-sm sm:p-8",
            "ring-1 ring-black/[0.03]"
          )}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pipeline
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Quotes
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                Track proposals, filter by status and dates, and act on each opportunity.
              </p>
            </div>
            <Button size="lg" className="shadow-sm" asChild>
              <Link href="/new-quote">
                <Plus className="size-4" aria-hidden />
                New Quote
              </Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
            <div className="relative min-w-0 lg:col-span-4">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search ID, client, project…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-white/90 pl-9 shadow-sm"
              />
            </div>
            <div className="lg:col-span-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-10 w-full rounded-xl border-border/80 bg-white/90 shadow-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center lg:col-span-5">
              <div className="flex items-center gap-2 text-muted-foreground sm:shrink-0">
                <CalendarRange className="size-4 hidden sm:block" aria-hidden />
                <span className="text-xs font-medium uppercase tracking-wide sm:hidden">
                  Date range
                </span>
              </div>
              <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 rounded-xl border-border/80 bg-white/90 shadow-sm"
                  aria-label="From date"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 rounded-xl border-border/80 bg-white/90 shadow-sm"
                  aria-label="To date"
                />
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((s) => (
              <Card
                key={s.label}
                className={cn("border shadow-sm transition-shadow hover:shadow-md", s.className)}
              >
                <CardContent className="flex flex-col gap-4 p-5">
                  <div
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl shadow-md",
                      s.iconClass
                    )}
                  >
                    <s.icon className="size-5" aria-hidden />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground/90">
                      {s.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
                      {s.value}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{s.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card className="border-border/80 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
              <div>
                <CardTitle className="text-lg">All quotes</CardTitle>
                <CardDescription>
                  {filtered.length} row{filtered.length === 1 ? "" : "s"} match your filters
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/80 bg-muted/30 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3">Quote ID</th>
                      <th className="px-5 py-3">Client</th>
                      <th className="px-5 py-3">Project</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Items</th>
                      <th className="px-5 py-3 text-right">Total</th>
                      <th className="px-5 py-3 text-right">Margin</th>
                      <th className="px-5 py-3">Created</th>
                      <th className="px-5 py-3">Expires</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.map((q) => (
                      <tr
                        key={q.id}
                        className="bg-card transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-medium text-foreground">
                          {q.id}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-foreground">{q.clientName}</td>
                        <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">
                          {q.project}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant={quoteStatusVariant(q.status)} className="capitalize">
                            {q.status}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                          {q.itemsCount}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium tabular-nums">
                          {formatCurrency(q.total)}
                        </td>
                        <td className="px-5 py-3.5 text-right font-medium tabular-nums text-emerald-700">
                          {formatPercent(q.margin)}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                          {formatShortDate(q.createdAt)}
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground tabular-nums">
                          {q.expiresAt ? formatShortDate(q.expiresAt) : "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex flex-wrap justify-end gap-1">
                            <Button variant="ghost" size="sm" className="h-8 px-2 text-primary" asChild>
                              <Link href={`/quote-studio?id=${encodeURIComponent(q.id)}`}>View</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-muted-foreground hover:text-foreground"
                              onClick={() => duplicateQuote(q)}
                            >
                              <Copy className="size-3.5 sm:mr-1" aria-hidden />
                              <span className="hidden sm:inline">Duplicate</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(q)}
                            >
                              <Trash2 className="size-3.5 sm:mr-1" aria-hidden />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No quotes match your filters. Try clearing search or widening the date range.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete quote?</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{deleteTarget?.clientName}</span>
              {deleteTarget?.project ? ` · ${deleteTarget.project}` : ""} will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
