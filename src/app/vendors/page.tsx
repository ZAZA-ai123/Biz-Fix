"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Mail,
  Package,
  Phone,
  Search,
  ShoppingCart,
  Star,
  Store,
  User,
  Users,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { vendors, type Vendor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

function vendorStatusVariant(
  status: Vendor["status"]
): "success" | "secondary" | "warning" {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "secondary";
    case "pending":
      return "warning";
    default:
      return "secondary";
  }
}

function StarRating({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const partial = rating - full;
  return (
    <div className="flex items-center gap-1" aria-label={`${rating} out of 5 stars`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < full || (i === full && partial >= 0.25);
          const half = i === full && partial >= 0.25 && partial < 0.75;
          return (
            <Star
              key={i}
              className={cn(
                "size-3.5 shrink-0",
                filled || half
                  ? "fill-amber-400 text-amber-500"
                  : "fill-transparent text-muted-foreground/30"
              )}
              aria-hidden
            />
          );
        })}
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

export default function VendorsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const set = new Set(vendors.map((v) => v.category));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vendors.filter((v) => {
      const matchCat = category === "all" || v.category === category;
      if (!q) return matchCat;
      const hay = `${v.name} ${v.contact} ${v.email} ${v.phone} ${v.category}`.toLowerCase();
      return matchCat && hay.includes(q);
    });
  }, [search, category]);

  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.status === "active").length;
    const inactive = vendors.filter((v) => v.status === "inactive").length;
    const orders = vendors.reduce((acc, v) => acc + v.totalOrders, 0);
    return { total, active, inactive, orders };
  }, []);

  const statCards = [
    {
      label: "Total Vendors",
      value: String(stats.total),
      hint: "In directory",
      icon: Store,
      className:
        "border-slate-200/80 bg-gradient-to-br from-slate-50/90 to-white text-slate-950 shadow-slate-100/50",
      iconClass: "bg-slate-700 text-white shadow-slate-700/25",
    },
    {
      label: "Active",
      value: String(stats.active),
      hint: "Receiving orders",
      icon: Users,
      className:
        "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white text-emerald-950 shadow-emerald-100/50",
      iconClass: "bg-emerald-600 text-white shadow-emerald-600/25",
    },
    {
      label: "Inactive",
      value: String(stats.inactive),
      hint: "Paused relationships",
      icon: Building2,
      className:
        "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white text-amber-950 shadow-amber-100/50",
      iconClass: "bg-amber-500 text-white shadow-amber-500/25",
    },
    {
      label: "Total Orders",
      value: String(stats.orders),
      hint: "All-time volume",
      icon: ShoppingCart,
      className:
        "border-blue-200/80 bg-gradient-to-br from-blue-50/90 to-white text-blue-950 shadow-blue-100/50",
      iconClass: "bg-blue-600 text-white shadow-blue-600/25",
    },
  ];

  return (
    <div className="relative min-h-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.1),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section
          className={cn(
            "overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-white via-white to-slate-50/50 p-6 shadow-sm sm:p-8",
            "ring-1 ring-black/[0.03]"
          )}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Manage
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Vendors
              </h1>
              <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                Search, filter, and maintain your supply partners and contact roster.
              </p>
            </div>
            <Button size="lg" className="shadow-md shadow-blue-600/15">
              <Store className="size-4" aria-hidden />
              Add Vendor
            </Button>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search vendors, contacts, email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl border-border/80 bg-white/90 pl-9 shadow-sm"
              />
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10 w-full rounded-xl border-border/80 bg-white/90 shadow-sm sm:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Directory</h2>
              <p className="text-sm text-muted-foreground">
                {filtered.length} vendor{filtered.length === 1 ? "" : "s"} shown
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((v) => (
              <Card
                key={v.id}
                className="group border-border/80 bg-card/80 shadow-sm ring-1 ring-black/[0.02] transition-all hover:border-border hover:shadow-md"
              >
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base font-semibold leading-tight">
                        {v.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <User className="size-3.5 shrink-0" aria-hidden />
                        {v.contact}
                      </CardDescription>
                    </div>
                    <Badge variant={vendorStatusVariant(v.status)} className="shrink-0 capitalize">
                      {v.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="font-normal">
                      {v.category}
                    </Badge>
                    <StarRating rating={v.rating} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                  <div className="space-y-2 rounded-xl border border-border/60 bg-muted/20 px-3 py-3 text-sm">
                    <a
                      href={`mailto:${v.email}`}
                      className="flex items-center gap-2 truncate text-foreground hover:text-primary"
                    >
                      <Mail className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="truncate">{v.email}</span>
                    </a>
                    <a
                      href={`tel:${v.phone.replace(/\D/g, "")}`}
                      className="flex items-center gap-2 text-foreground hover:text-primary"
                    >
                      <Phone className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                      {v.phone}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border/50 bg-white/60 px-3 py-2.5 shadow-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Active products
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 font-semibold tabular-nums">
                        <Package className="size-3.5 text-blue-600" aria-hidden />
                        {v.activeProducts}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border/50 bg-white/60 px-3 py-2.5 shadow-sm">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Total orders
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 font-semibold tabular-nums">
                        <ShoppingCart className="size-3.5 text-emerald-600" aria-hidden />
                        {v.totalOrders}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="default" size="sm" className="flex-1 shadow-sm">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-white/80">
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
