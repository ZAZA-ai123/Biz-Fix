"use client";

import React from "react";
import { TrendingUp, DollarSign, ShoppingCart, Percent, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

type Sale = {
  id: string;
  clientName: string;
  productName: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  costTotal: number;
  margin: number;
  status: string;
  saleDate: string;
};

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  refunded: "bg-red-100 text-red-700",
};

export default function SalesPage() {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");

  React.useEffect(() => {
    fetch("/api/db/sales")
      .then((r) => r.json())
      .then((data) => { setSales(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(sales.map((s) => s.category).filter(Boolean))) as string[];

  const filtered = sales.filter((s) => {
    const matchSearch =
      !search ||
      s.clientName.toLowerCase().includes(search.toLowerCase()) ||
      s.productName.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "all" || s.category === categoryFilter;
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const totalCost = filtered.reduce((sum, s) => sum + s.costTotal, 0);
  const totalProfit = totalRevenue - totalCost;
  const avgMargin = filtered.length ? filtered.reduce((sum, s) => sum + s.margin, 0) / filtered.length : 0;

  // Revenue by category
  const byCategory: Record<string, number> = {};
  for (const s of filtered) {
    const cat = s.category ?? "Other";
    byCategory[cat] = (byCategory[cat] ?? 0) + s.total;
  }
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCatRevenue = sortedCategories[0]?.[1] ?? 1;

  // Revenue by month
  const byMonth: Record<string, number> = {};
  for (const s of filtered) {
    const month = s.saleDate.slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + s.total;
  }
  const sortedMonths = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthRevenue = Math.max(...sortedMonths.map(([, v]) => v), 1);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-bold text-foreground">Sales</h1>
        <p className="text-sm text-muted-foreground">Full sales history, revenue breakdown, and performance by category</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gross Profit</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(totalProfit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="text-lg font-bold text-foreground">{filtered.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Percent className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Margin</p>
                  <p className="text-lg font-bold text-foreground">{avgMargin.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue by month */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revenue by Month</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedMonths.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-2">
                  {sortedMonths.map(([month, rev]) => (
                    <div key={month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-16 shrink-0">{month}</span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${(rev / maxMonthRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-20 text-right">{formatCurrency(rev)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue by category */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {sortedCategories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No data</p>
              ) : (
                <div className="space-y-2">
                  {sortedCategories.map(([cat, rev]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{cat}</span>
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(rev / maxCatRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground w-20 text-right">{formatCurrency(rev)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Filters + Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input className="pl-8 h-8 text-xs" placeholder="Search client or product…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-8 w-36 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 w-32 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Product</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Category</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Unit Price</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total</th>
                    <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Margin</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-muted-foreground">Loading…</td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-muted-foreground">No sales found</td>
                    </tr>
                  )}
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground max-w-[140px] truncate">{s.clientName}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">{s.productName}</td>
                      <td className="px-4 py-3">
                        {s.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.category}</Badge>}
                      </td>
                      <td className="px-4 py-3 text-right text-foreground">{s.quantity}</td>
                      <td className="px-4 py-3 text-right text-foreground">{formatCurrency(s.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatCurrency(s.total)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={s.margin >= 40 ? "text-green-600 font-medium" : s.margin >= 25 ? "text-foreground" : "text-yellow-600"}>
                          {s.margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusColors[s.status] ?? "bg-gray-100 text-gray-600"}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.saleDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
