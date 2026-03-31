"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Upload,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Package,
  Layers,
  Store,
  Percent,
} from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";
type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  vendor: string;
  vendorId: string | null;
  cost_price: number;
  default_sell_price: number;
  tier: "budget" | "standard" | "premium";
  tags: string[];
  suitable_for: string[];
  margin_floor_percent: number;
  preferred_margin_percent: number;
  stock_status: "in_stock" | "low_stock" | "out_of_stock" | "made_to_order";
  lead_time_days: number;
  notes: string;
  alternative_skus: string[];
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const ALL = "__all__";

function marginFromPrices(cost: number, sell: number): number {
  if (sell <= 0) return 0;
  return ((sell - cost) / sell) * 100;
}

function tierBadgeVariant(tier: Product["tier"]) {
  switch (tier) {
    case "budget":
      return "secondary" as const;
    case "standard":
      return "info" as const;
    case "premium":
      return "premium" as const;
  }
}

function stockBadgeVariant(status: Product["stock_status"]) {
  switch (status) {
    case "in_stock":
      return "success" as const;
    case "low_stock":
      return "warning" as const;
    case "out_of_stock":
      return "destructive" as const;
    case "made_to_order":
      return "info" as const;
  }
}

function stockLabel(status: Product["stock_status"]) {
  switch (status) {
    case "in_stock":
      return "In stock";
    case "low_stock":
      return "Low stock";
    case "out_of_stock":
      return "Out of stock";
    case "made_to_order":
      return "Made to order";
  }
}

function tierLabel(tier: Product["tier"]) {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

const EDTECH_CATEGORIES = ["LMS", "Interactive Display", "Student Device", "VR/AR", "Analytics", "Assessment", "STEM Kit", "Security", "Other"];

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  category: EDTECH_CATEGORIES[0] ?? "",
  subcategory: "",
  vendor: "",
  cost_price: "",
  default_sell_price: "",
  tier: "standard" as Product["tier"],
  tags: "",
  stock_status: "in_stock" as Product["stock_status"],
  lead_time_days: "",
  margin_floor_percent: "",
  preferred_margin_percent: "",
  notes: "",
};

export default function CatalogPage() {
  const [items, setItems] = React.useState<Product[]>([]);

  React.useEffect(() => {
    fetch("/api/db/products").then((r) => r.json()).then(setItems).catch(() => {});
  }, []);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState<string>(ALL);
  const [tierFilter, setTierFilter] = React.useState<string>(ALL);
  const [stockFilter, setStockFilter] = React.useState<string>(ALL);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState(emptyForm);
  const selectAllRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (categoryFilter !== ALL && p.category !== categoryFilter) return false;
      if (tierFilter !== ALL && p.tier !== tierFilter) return false;
      if (stockFilter !== ALL && p.stock_status !== stockFilter) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.sku,
        p.vendor,
        p.description,
        ...p.tags,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search, categoryFilter, tierFilter, stockFilter]);

  const stats = React.useMemo(() => {
    const n = filtered.length;
    const catSet = new Set(filtered.map((p) => p.category));
    const vendorSet = new Set(filtered.map((p) => p.vendor));
    const avgMargin =
      n === 0
        ? 0
        : filtered.reduce((acc, p) => acc + marginFromPrices(p.cost_price, p.default_sell_price), 0) /
          n;
    return {
      productCount: n,
      categoryCount: catSet.size,
      vendorCount: vendorSet.size,
      avgMargin,
    };
  }, [filtered]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someFilteredSelected = filtered.some((p) => selected.has(p.id));

  React.useEffect(() => {
    const el = selectAllRef.current;
    if (el) {
      el.indeterminate = someFilteredSelected && !allFilteredSelected;
    }
  }, [someFilteredSelected, allFilteredSelected]);

  function toggleAllFiltered(checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) {
        filtered.forEach((p) => next.add(p.id));
      } else {
        filtered.forEach((p) => next.delete(p.id));
      }
      return next;
    });
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description,
      category: p.category,
      subcategory: p.subcategory,
      vendor: p.vendor,
      cost_price: String(p.cost_price),
      default_sell_price: String(p.default_sell_price),
      tier: p.tier,
      tags: p.tags.join(", "),
      stock_status: p.stock_status,
      lead_time_days: String(p.lead_time_days),
      margin_floor_percent: String(p.margin_floor_percent),
      preferred_margin_percent: String(p.preferred_margin_percent),
      notes: p.notes,
    });
    setDialogOpen(true);
  }

  function parseTags(s: string): string[] {
    return s
      .split(/[,]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function submitProduct() {
    const cost = parseFloat(form.cost_price);
    const sell = parseFloat(form.default_sell_price);
    const lead = parseInt(form.lead_time_days, 10);
    const floor = parseFloat(form.margin_floor_percent);
    const pref = parseFloat(form.preferred_margin_percent);
    if (!form.sku.trim() || !form.name.trim() || Number.isNaN(cost) || Number.isNaN(sell)) return;

    const body = {
      id: editingId,
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      subcategory: form.subcategory.trim(),
      costPrice: cost,
      sellPrice: sell,
      tier: form.tier,
      tags: parseTags(form.tags),
      suitableFor: [],
      marginFloorPercent: Number.isNaN(floor) ? 0 : floor,
      preferredMarginPercent: Number.isNaN(pref) ? 0 : pref,
      stockStatus: form.stock_status,
      leadTimeDays: Number.isNaN(lead) ? 0 : lead,
      qualityNotes: form.notes.trim(),
    };

    if (editingId) {
      await fetch("/api/db/products", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } else {
      await fetch("/api/db/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }

    const fresh = await fetch("/api/db/products").then((r) => r.json());
    setItems(fresh);
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function duplicateProduct(p: Product) {
    await fetch("/api/db/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sku: `${p.sku}-COPY`,
        name: `${p.name} (copy)`,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        costPrice: p.cost_price,
        sellPrice: p.default_sell_price,
        tier: p.tier,
        tags: p.tags,
        suitableFor: p.suitable_for,
        marginFloorPercent: p.margin_floor_percent,
        preferredMarginPercent: p.preferred_margin_percent,
        stockStatus: p.stock_status,
        leadTimeDays: p.lead_time_days,
      }),
    });
    const fresh = await fetch("/api/db/products").then((r) => r.json());
    setItems(fresh);
  }

  async function deleteProduct(id: string) {
    await fetch(`/api/db/products?id=${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Product catalog
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-[15px] leading-relaxed">
              Search, filter, and curate every line item your quotes pull from — built for clarity at a glance.
            </p>
          </div>
        </div>

        <Card className="mb-6 border-border/80 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="relative flex-1 min-w-0 max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU, vendor, or tags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-9 bg-background/80"
                  aria-label="Search products"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[160px] bg-background/80">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[140px] bg-background/80">
                    <SelectValue placeholder="Tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All tiers</SelectItem>
                    <SelectItem value="budget">Budget</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[168px] bg-background/80">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All stock</SelectItem>
                    <SelectItem value="in_stock">In stock</SelectItem>
                    <SelectItem value="low_stock">Low stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of stock</SelectItem>
                    <SelectItem value="made_to_order">Made to order</SelectItem>
                  </SelectContent>
                </Select>

                <Separator orientation="vertical" className="hidden h-8 lg:block" />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Dialog
                    open={dialogOpen}
                    onOpenChange={(o) => {
                      setDialogOpen(o);
                      if (!o) {
                        setEditingId(null);
                        setForm(emptyForm);
                      }
                    }}
                  >
                    <Button className="h-10 gap-2 shadow-sm" type="button" onClick={openAdd}>
                      <Plus className="h-4 w-4" />
                      Add product
                    </Button>
                    <DialogContent className="max-h-[min(90vh,720px)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingId ? "Edit product" : "Add product"}</DialogTitle>
                        <DialogDescription>
                          {editingId
                            ? "Update catalog fields. Changes apply immediately to this workspace."
                            : "Create a new catalog item with pricing and availability your quotes can trust."}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-2 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-1">
                          <Label htmlFor="cat-sku">SKU</Label>
                          <Input
                            id="cat-sku"
                            value={form.sku}
                            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                            placeholder="e.g. FLR-HW-001"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-1">
                          <Label htmlFor="cat-name">Name</Label>
                          <Input
                            id="cat-name"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            placeholder="Product name"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="cat-desc">Description</Label>
                          <Textarea
                            id="cat-desc"
                            rows={3}
                            value={form.description}
                            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            placeholder="Short description for quotes and internal reference"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={form.category}
                            onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-sub">Subcategory</Label>
                          <Input
                            id="cat-sub"
                            value={form.subcategory}
                            onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                            placeholder="e.g. Hardwood"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="cat-vendor">Vendor</Label>
                          <Input
                            id="cat-vendor"
                            value={form.vendor}
                            onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                            placeholder="Supplier name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-cost">Cost price</Label>
                          <Input
                            id="cat-cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.cost_price}
                            onChange={(e) => setForm((f) => ({ ...f, cost_price: e.target.value }))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-sell">Default sell price</Label>
                          <Input
                            id="cat-sell"
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.default_sell_price}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, default_sell_price: e.target.value }))
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tier</Label>
                          <Select
                            value={form.tier}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, tier: v as Product["tier"] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="budget">Budget</SelectItem>
                              <SelectItem value="standard">Standard</SelectItem>
                              <SelectItem value="premium">Premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-tags">Tags</Label>
                          <Input
                            id="cat-tags"
                            value={form.tags}
                            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                            placeholder="comma separated"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock status</Label>
                          <Select
                            value={form.stock_status}
                            onValueChange={(v) =>
                              setForm((f) => ({ ...f, stock_status: v as Product["stock_status"] }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_stock">In stock</SelectItem>
                              <SelectItem value="low_stock">Low stock</SelectItem>
                              <SelectItem value="out_of_stock">Out of stock</SelectItem>
                              <SelectItem value="made_to_order">Made to order</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-lead">Lead time (days)</Label>
                          <Input
                            id="cat-lead"
                            type="number"
                            min="0"
                            value={form.lead_time_days}
                            onChange={(e) => setForm((f) => ({ ...f, lead_time_days: e.target.value }))}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-floor">Margin floor %</Label>
                          <Input
                            id="cat-floor"
                            type="number"
                            step="0.1"
                            value={form.margin_floor_percent}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, margin_floor_percent: e.target.value }))
                            }
                            placeholder="35"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cat-pref">Preferred margin %</Label>
                          <Input
                            id="cat-pref"
                            type="number"
                            step="0.1"
                            value={form.preferred_margin_percent}
                            onChange={(e) =>
                              setForm((f) => ({ ...f, preferred_margin_percent: e.target.value }))
                            }
                            placeholder="44"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor="cat-notes">Notes</Label>
                          <Textarea
                            id="cat-notes"
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                            placeholder="Internal notes, restock alerts, pairing suggestions…"
                          />
                        </div>
                      </div>

                      <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setDialogOpen(false);
                            setEditingId(null);
                            setForm(emptyForm);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="button" onClick={submitProduct}>
                          {editingId ? "Save changes" : "Add product"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" className="h-10 gap-2 bg-background/80" asChild>
                    <Link href="/catalog/import">
                      <Upload className="h-4 w-4" />
                      Import CSV
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Products
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground/80" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:px-5 sm:pb-5">
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {stats.productCount}
              </p>
              <CardDescription className="text-xs mt-1">Matching filters</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Categories
              </CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground/80" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:px-5 sm:pb-5">
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {stats.categoryCount}
              </p>
              <CardDescription className="text-xs mt-1">In current view</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Vendors
              </CardTitle>
              <Store className="h-4 w-4 text-muted-foreground/80" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:px-5 sm:pb-5">
              <p className="text-2xl font-semibold tabular-nums tracking-tight">
                {stats.vendorCount}
              </p>
              <CardDescription className="text-xs mt-1">Unique suppliers</CardDescription>
            </CardContent>
          </Card>
          <Card className="border-border/80 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-5 sm:pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
                Avg margin
              </CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground/80" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:px-5 sm:pb-5">
              <p className="text-2xl font-semibold tabular-nums tracking-tight text-primary">
                {formatPercent(stats.avgMargin)}
              </p>
              <CardDescription className="text-xs mt-1">From sell vs. cost</CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/80 shadow-sm overflow-hidden">
          <CardHeader className="border-b border-border/60 bg-muted/20 px-4 py-4 sm:px-6">
            <CardTitle className="text-base sm:text-lg">All products</CardTitle>
            <CardDescription>
              {filtered.length} {filtered.length === 1 ? "row" : "rows"}
              {selected.size > 0 ? ` · ${selected.size} selected` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="w-10 px-4 py-3.5">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                        checked={allFilteredSelected}
                        onChange={(e) => toggleAllFiltered(e.target.checked)}
                        aria-label="Select all visible"
                      />
                    </th>
                    <th className="min-w-[220px] px-4 py-3.5">Product</th>
                    <th className="hidden md:table-cell min-w-[140px] px-4 py-3.5">Vendor</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Cost</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Sell</th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">Margin</th>
                    <th className="hidden sm:table-cell px-4 py-3.5">Tier</th>
                    <th className="hidden lg:table-cell px-4 py-3.5">Stock</th>
                    <th className="hidden xl:table-cell px-4 py-3.5 text-right whitespace-nowrap">
                      Lead
                    </th>
                    <th className="w-12 px-4 py-3.5 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, index) => {
                    const m = marginFromPrices(p.cost_price, p.default_sell_price);
                    const stripe = index % 2 === 1;
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          "group border-b border-border/60 transition-colors",
                          stripe ? "bg-muted/15" : "bg-card",
                          "hover:bg-accent/40"
                        )}
                      >
                        <td className="px-4 py-3.5 align-middle">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                            checked={selected.has(p.id)}
                            onChange={(e) => toggleOne(p.id, e.target.checked)}
                            aria-label={`Select ${p.name}`}
                          />
                        </td>
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <span className="font-medium text-foreground leading-snug line-clamp-2">
                              {p.name}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs text-muted-foreground">{p.sku}</span>
                              <Badge variant="outline" className="text-[10px] font-normal shrink-0">
                                {p.category}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1.5 md:hidden mt-0.5">
                              <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {p.vendor}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 lg:hidden">
                              <Badge variant={tierBadgeVariant(p.tier)} className="text-[10px]">
                                {tierLabel(p.tier)}
                              </Badge>
                              <Badge variant={stockBadgeVariant(p.stock_status)} className="text-[10px]">
                                {stockLabel(p.stock_status)}
                              </Badge>
                              <span className="text-xs text-muted-foreground self-center">
                                {p.lead_time_days}d lead
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3.5 align-middle text-muted-foreground">
                          <span className="line-clamp-2">{p.vendor}</span>
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right tabular-nums text-muted-foreground">
                          {formatCurrency(p.cost_price)}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right tabular-nums font-medium">
                          {formatCurrency(p.default_sell_price)}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right tabular-nums">
                          <span
                            className={cn(
                              m < p.margin_floor_percent && "text-amber-700 font-medium",
                              m >= p.preferred_margin_percent && "text-emerald-700 font-medium"
                            )}
                          >
                            {formatPercent(m)}
                          </span>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3.5 align-middle">
                          <Badge variant={tierBadgeVariant(p.tier)}>{tierLabel(p.tier)}</Badge>
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3.5 align-middle">
                          <Badge variant={stockBadgeVariant(p.stock_status)}>
                            {stockLabel(p.stock_status)}
                          </Badge>
                        </td>
                        <td className="hidden xl:table-cell px-4 py-3.5 align-middle text-right tabular-nums text-muted-foreground">
                          {p.lead_time_days === 1 ? "1 day" : `${p.lead_time_days} days`}
                        </td>
                        <td className="px-4 py-3.5 align-middle text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-70 group-hover:opacity-100"
                                aria-label={`Actions for ${p.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                className="gap-2"
                                onSelect={() => openEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2"
                                onSelect={() => duplicateProduct(p)}
                              >
                                <Copy className="h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-destructive focus:text-destructive"
                                onSelect={() => deleteProduct(p.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">No products match</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Try clearing filters or adjusting your search. You can also add a product manually.
                </p>
                <Button className="mt-6" onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add product
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
