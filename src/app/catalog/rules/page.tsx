"use client";

import * as React from "react";
import { Building2, Percent, Quote, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MARGIN_CATEGORIES = [
  "Flooring",
  "Tile",
  "Countertops",
  "Cabinetry",
  "Paint & Finishes",
  "Plumbing",
  "Lighting",
  "Doors & Hardware",
] as const;

const DEFAULT_MARGINS: Record<string, { floor: string; preferred: string }> = {
  Flooring: { floor: "18", preferred: "28" },
  Tile: { floor: "20", preferred: "32" },
  Countertops: { floor: "22", preferred: "35" },
  Cabinetry: { floor: "18", preferred: "30" },
  "Paint & Finishes": { floor: "25", preferred: "40" },
  Plumbing: { floor: "20", preferred: "33" },
  Lighting: { floor: "22", preferred: "36" },
  "Doors & Hardware": { floor: "19", preferred: "31" },
};

const VENDOR_ROWS = [
  { id: "msi", name: "MSI Surfaces", preferred: true, priority: 1 },
  { id: "armstrong", name: "Armstrong Flooring", preferred: true, priority: 2 },
  { id: "sherwin", name: "Sherwin-Williams", preferred: false, priority: 3 },
  { id: "kohler", name: "Kohler Co.", preferred: true, priority: 4 },
  { id: "feiss", name: "Feiss Lighting", preferred: false, priority: 5 },
  { id: "cambria", name: "Cambria Quartz", preferred: true, priority: 6 },
] as const;

export default function CatalogRulesPage() {
  const [margins, setMargins] = React.useState(DEFAULT_MARGINS);
  const [premiumProject, setPremiumProject] = React.useState(true);
  const [premiumCommercial, setPremiumCommercial] = React.useState(true);
  const [premiumAlternatives, setPremiumAlternatives] = React.useState(false);
  const [premiumThreshold, setPremiumThreshold] = React.useState("25000");
  const [vendors, setVendors] = React.useState<
    { id: string; name: string; preferred: boolean; priority: number }[]
  >(() => VENDOR_ROWS.map((v) => ({ ...v })));
  const [quoteExpiryDays, setQuoteExpiryDays] = React.useState("30");
  const [autoInstall, setAutoInstall] = React.useState(false);
  const [showAlternatives, setShowAlternatives] = React.useState(true);
  const [taxRate, setTaxRate] = React.useState("8.25");
  const [approvalAbove, setApprovalAbove] = React.useState("50000");
  const [leadTimeFlagDays, setLeadTimeFlagDays] = React.useState("14");
  const [excludeOos, setExcludeOos] = React.useState(false);
  const [leadTimeWarnings, setLeadTimeWarnings] = React.useState(true);
  const [lowStockThreshold, setLowStockThreshold] = React.useState("10");

  const updateMargin = (cat: string, key: "floor" | "preferred", value: string) => {
    setMargins((m) => ({
      ...m,
      [cat]: { ...m[cat], [key]: value },
    }));
  };

  const setVendorPreferred = (id: string, preferred: boolean) => {
    setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, preferred } : v)));
  };

  const setVendorPriority = (id: string, priority: number) => {
    setVendors((vs) => vs.map((v) => (v.id === id ? { ...v, priority } : v)));
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-16">
      <p className="text-sm text-muted-foreground max-w-2xl">
        Tune how Biz-Fix prices, prioritizes vendors, and behaves on quotes. Changes apply to new quotes
        unless noted.
      </p>

      <Tabs defaultValue="margins" className="space-y-6">
        <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/80 p-1 rounded-xl">
          <TabsTrigger value="margins" className="gap-2 data-[state=active]:shadow-sm">
            <Percent className="w-3.5 h-3.5" />
            Margins
          </TabsTrigger>
          <TabsTrigger value="premium" className="gap-2 data-[state=active]:shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            Premium Logic
          </TabsTrigger>
          <TabsTrigger value="vendors" className="gap-2 data-[state=active]:shadow-sm">
            <Building2 className="w-3.5 h-3.5" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="quotes" className="gap-2 data-[state=active]:shadow-sm">
            <Quote className="w-3.5 h-3.5" />
            Quote Behavior
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2 data-[state=active]:shadow-sm">
            <Truck className="w-3.5 h-3.5" />
            Stock &amp; Lead Time
          </TabsTrigger>
        </TabsList>

        <TabsContent value="margins" className="mt-0 focus-visible:outline-none">
          <Card className="border-border/80 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-card to-accent/15">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-xl">Default margin rules</CardTitle>
                <Badge variant="secondary">By category</Badge>
              </div>
              <CardDescription>
                Floor and target margins guide quoting when product-level margins are not set. Values are
                percentages.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="hidden sm:grid sm:grid-cols-[1fr_120px_120px] gap-4 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>Category</span>
                <span className="text-right sm:text-center">Floor %</span>
                <span className="text-right sm:text-center">Preferred %</span>
              </div>
              <div className="space-y-3">
                {MARGIN_CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className={cn(
                      "grid grid-cols-1 sm:grid-cols-[1fr_120px_120px] gap-4 items-center rounded-xl border bg-card p-4 shadow-sm",
                      "hover:border-primary/20 transition-colors"
                    )}
                  >
                    <div className="font-medium text-foreground">{cat}</div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground sm:hidden">Margin floor %</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-9 text-center sm:text-right font-mono text-sm"
                        value={margins[cat]?.floor ?? ""}
                        onChange={(e) => updateMargin(cat, "floor", e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground sm:hidden">Preferred margin %</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        className="h-9 text-center sm:text-right font-mono text-sm"
                        value={margins[cat]?.preferred ?? ""}
                        onChange={(e) => updateMargin(cat, "preferred", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="premium" className="mt-0 focus-visible:outline-none">
          <Card className="border-border/80 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-card to-violet-50/50">
              <CardTitle className="text-xl">Premium selection rules</CardTitle>
              <CardDescription>
                Control when Biz-Fix surfaces premium tiers and alternatives for higher-value work.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="prem-project" className="text-base font-medium">
                    Auto-suggest premium tier for projects over $25,000
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Prompt reps to review premium lines when quote totals exceed the threshold.
                  </p>
                </div>
                <Switch id="prem-project" checked={premiumProject} onCheckedChange={setPremiumProject} />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="prem-commercial" className="text-base font-medium">
                    Prioritize premium products for commercial clients
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Rank premium SKUs higher in suggestions for commercial account types.
                  </p>
                </div>
                <Switch id="prem-commercial" checked={premiumCommercial} onCheckedChange={setPremiumCommercial} />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="prem-alt" className="text-base font-medium">
                    Include premium alternatives in all quotes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add optional premium upsell lines alongside standard selections.
                  </p>
                </div>
                <Switch id="prem-alt" checked={premiumAlternatives} onCheckedChange={setPremiumAlternatives} />
              </div>
              <Separator />
              <div className="rounded-xl border bg-muted/20 p-4 space-y-3 max-w-md">
                <Label htmlFor="prem-threshold" className="text-base font-medium">
                  Premium threshold
                </Label>
                <p className="text-sm text-muted-foreground">
                  Project total (USD) at which premium logic intensifies. Works with the auto-suggest rule
                  above.
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="prem-threshold"
                    className="pl-7 font-mono"
                    inputMode="numeric"
                    value={premiumThreshold}
                    onChange={(e) => setPremiumThreshold(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="mt-0 focus-visible:outline-none">
          <Card className="border-border/80 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-card to-accent/15">
              <CardTitle className="text-xl">Preferred vendor settings</CardTitle>
              <CardDescription>
                Preferred vendors appear first in sourcing and quote line suggestions. Lower priority numbers
                rank higher.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="hidden md:grid md:grid-cols-[1fr_auto_100px] gap-4 px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground items-center">
                <span>Vendor</span>
                <span className="text-center">Preferred</span>
                <span className="text-center">Priority</span>
              </div>
              <ul className="space-y-2">
                {vendors
                  .slice()
                  .sort((a, b) => a.priority - b.priority)
                  .map((v) => (
                    <li
                      key={v.id}
                      className="flex flex-col md:grid md:grid-cols-[1fr_auto_100px] gap-4 md:items-center rounded-xl border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium truncate">{v.name}</span>
                      </div>
                      <div className="flex items-center justify-between md:justify-center gap-3">
                        <Label htmlFor={`pref-${v.id}`} className="md:sr-only text-sm text-muted-foreground">
                          Preferred
                        </Label>
                        <Switch
                          id={`pref-${v.id}`}
                          checked={v.preferred}
                          onCheckedChange={(c) => setVendorPreferred(v.id, c)}
                        />
                      </div>
                      <div className="flex items-center gap-2 md:justify-center">
                        <Label htmlFor={`pri-${v.id}`} className="md:sr-only text-sm text-muted-foreground">
                          Priority
                        </Label>
                        <Input
                          id={`pri-${v.id}`}
                          type="number"
                          min={1}
                          className="h-9 w-20 text-center font-mono text-sm"
                          value={v.priority}
                          onChange={(e) => setVendorPriority(v.id, Number(e.target.value) || 1)}
                        />
                      </div>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes" className="mt-0 focus-visible:outline-none">
          <Card className="border-border/80 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-card to-accent/15">
              <CardTitle className="text-xl">Quote behavior</CardTitle>
              <CardDescription>Defaults for new quotes and customer-facing documents.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Default quote expiry (days)</Label>
                  <Input
                    id="expiry"
                    type="number"
                    min={1}
                    className="font-mono"
                    value={quoteExpiryDays}
                    onChange={(e) => setQuoteExpiryDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax">Default tax rate %</Label>
                  <Input
                    id="tax"
                    type="text"
                    inputMode="decimal"
                    className="font-mono"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="approval">Require approval above ($)</Label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      id="approval"
                      className="pl-7 font-mono"
                      inputMode="numeric"
                      value={approvalAbove}
                      onChange={(e) => setApprovalAbove(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="auto-install" className="text-base font-medium">
                    Auto-include installation
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Pre-check installation line items when the catalog item supports labor add-ons.
                  </p>
                </div>
                <Switch id="auto-install" checked={autoInstall} onCheckedChange={setAutoInstall} />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="show-alt" className="text-base font-medium">
                    Show alternative products
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display comparable SKUs on quotes for customer choice.
                  </p>
                </div>
                <Switch id="show-alt" checked={showAlternatives} onCheckedChange={setShowAlternatives} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="mt-0 focus-visible:outline-none">
          <Card className="border-border/80 shadow-md overflow-hidden">
            <CardHeader className="border-b bg-gradient-to-br from-card to-accent/15">
              <CardTitle className="text-xl">Stock &amp; lead time</CardTitle>
              <CardDescription>
                Visibility rules for availability and fulfillment timing across catalog and quotes.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lead-flag">Flag products with lead time greater than (days)</Label>
                  <Input
                    id="lead-flag"
                    type="number"
                    min={0}
                    className="font-mono"
                    value={leadTimeFlagDays}
                    onChange={(e) => setLeadTimeFlagDays(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="low-stock">Low stock threshold (units)</Label>
                  <Input
                    id="low-stock"
                    type="number"
                    min={0}
                    className="font-mono"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="exclude-oos" className="text-base font-medium">
                    Auto-exclude out of stock
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Hide unavailable SKUs from quote suggestions until restocked.
                  </p>
                </div>
                <Switch id="exclude-oos" checked={excludeOos} onCheckedChange={setExcludeOos} />
              </div>
              <Separator />
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border p-4">
                <div className="space-y-1">
                  <Label htmlFor="lead-warn" className="text-base font-medium">
                    Show lead time warnings in quotes
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Surface estimated ship or install windows on PDF and portal quotes.
                  </p>
                </div>
                <Switch id="lead-warn" checked={leadTimeWarnings} onCheckedChange={setLeadTimeWarnings} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
