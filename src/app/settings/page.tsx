"use client";

import { useState, type ComponentType } from "react";
import {
  Building2,
  CreditCard,
  FileSpreadsheet,
  Link2,
  PlugZap,
  Save,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type IntegrationKey = "quickbooks" | "stripe" | "sheets" | "zapier";

const integrationMeta: Record<
  IntegrationKey,
  { name: string; description: string; icon: ComponentType<{ className?: string }> }
> = {
  quickbooks: {
    name: "QuickBooks",
    description: "Sync invoices, expenses, and customers.",
    icon: Building2,
  },
  stripe: {
    name: "Stripe",
    description: "Collect deposits and milestone payments.",
    icon: CreditCard,
  },
  sheets: {
    name: "Google Sheets",
    description: "Export quote line items and price books.",
    icon: FileSpreadsheet,
  },
  zapier: {
    name: "Zapier",
    description: "Automate handoffs to CRM and email.",
    icon: PlugZap,
  },
};

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState("Biz-Fix Supply Co.");
  const [businessEmail, setBusinessEmail] = useState("hello@bizfix.example");
  const [businessPhone, setBusinessPhone] = useState("(555) 123-4567");
  const [businessAddress, setBusinessAddress] = useState(
    "1200 Commerce Ave, Suite 400, Austin, TX 78701"
  );

  const [expiryDays, setExpiryDays] = useState("30");
  const [taxRate, setTaxRate] = useState("8.25");
  const [paymentTerms, setPaymentTerms] = useState("net30");
  const [quotePrefix, setQuotePrefix] = useState("QT-2026-");
  const [autoNumbering, setAutoNumbering] = useState(true);

  const [notifAccepted, setNotifAccepted] = useState(true);
  const [notifExpired, setNotifExpired] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifVendor, setNotifVendor] = useState(false);
  const [notifWeekly, setNotifWeekly] = useState(true);

  const [connected, setConnected] = useState<Record<IntegrationKey, boolean>>({
    quickbooks: true,
    stripe: false,
    sheets: true,
    zapier: false,
  });

  function toggleIntegration(key: IntegrationKey) {
    setConnected((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="relative min-h-full">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.1),transparent)]"
      />
      <div className="relative mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Configure your business profile, quoting defaults, notifications, and connected tools.
          </p>
        </section>

        <Tabs defaultValue="general" className="w-full space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-muted/80 p-1.5 sm:grid-cols-4">
            <TabsTrigger value="general" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              General
            </TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              Quote Defaults
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="rounded-lg px-3 py-2 text-xs sm:text-sm">
              Integrations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-0 focus-visible:ring-0">
            <Card className="border-border/80 shadow-sm ring-1 ring-black/[0.02]">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-lg">Business profile</CardTitle>
                <CardDescription>
                  These details appear on quotes, emails, and customer-facing documents.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="biz-name">Business name</Label>
                    <Input
                      id="biz-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-email">Email</Label>
                    <Input
                      id="biz-email"
                      type="email"
                      value={businessEmail}
                      onChange={(e) => setBusinessEmail(e.target.value)}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Phone</Label>
                    <Input
                      id="biz-phone"
                      value={businessPhone}
                      onChange={(e) => setBusinessPhone(e.target.value)}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="biz-address">Address</Label>
                    <Input
                      id="biz-address"
                      value={businessAddress}
                      onChange={(e) => setBusinessAddress(e.target.value)}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-end">
                  <Button size="lg" className="shadow-md shadow-blue-600/15">
                    <Save className="size-4" aria-hidden />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quotes" className="mt-0 focus-visible:ring-0">
            <Card className="border-border/80 shadow-sm ring-1 ring-black/[0.02]">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-lg">Quote defaults</CardTitle>
                <CardDescription>
                  Pre-fill new quotes with your standard terms and numbering.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="expiry-days">Default expiry (days)</Label>
                    <Input
                      id="expiry-days"
                      type="number"
                      min={1}
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Default tax rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment terms</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger className="h-10 rounded-xl border-border/80">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due_on_receipt">Due on receipt</SelectItem>
                        <SelectItem value="net15">Net 15</SelectItem>
                        <SelectItem value="net30">Net 30</SelectItem>
                        <SelectItem value="net45">Net 45</SelectItem>
                        <SelectItem value="net60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quote-prefix">Quote prefix</Label>
                    <Input
                      id="quote-prefix"
                      value={quotePrefix}
                      onChange={(e) => setQuotePrefix(e.target.value)}
                      placeholder="QT-2026-"
                      className="h-10 rounded-xl border-border/80 font-mono text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-4">
                  <div className="space-y-1">
                    <Label htmlFor="auto-num" className="text-base">
                      Auto-numbering
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Assign the next sequential ID when creating a quote.
                    </p>
                  </div>
                  <Switch
                    id="auto-num"
                    checked={autoNumbering}
                    onCheckedChange={setAutoNumbering}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-0 focus-visible:ring-0">
            <Card className="border-border/80 shadow-sm ring-1 ring-black/[0.02]">
              <CardHeader className="border-b border-border/60 pb-4">
                <CardTitle className="text-lg">Email notifications</CardTitle>
                <CardDescription>
                  Choose which events trigger an email to your team inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border/60 pt-2">
                {[
                  {
                    id: "n-accepted",
                    label: "Quote accepted",
                    desc: "When a client accepts a sent proposal.",
                    checked: notifAccepted,
                    onChange: setNotifAccepted,
                  },
                  {
                    id: "n-expired",
                    label: "Quote expired",
                    desc: "When a quote passes its expiry without action.",
                    checked: notifExpired,
                    onChange: setNotifExpired,
                  },
                  {
                    id: "n-stock",
                    label: "Low stock alert",
                    desc: "When catalog SKUs fall below your thresholds.",
                    checked: notifLowStock,
                    onChange: setNotifLowStock,
                  },
                  {
                    id: "n-vendor",
                    label: "New vendor added",
                    desc: "When a teammate onboards a new supplier.",
                    checked: notifVendor,
                    onChange: setNotifVendor,
                  },
                  {
                    id: "n-weekly",
                    label: "Weekly summary",
                    desc: "Pipeline snapshot every Monday morning.",
                    checked: notifWeekly,
                    onChange: setNotifWeekly,
                  },
                ].map((row) => (
                  <div
                    key={row.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <Label htmlFor={row.id} className="text-base font-medium">
                        {row.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">{row.desc}</p>
                    </div>
                    <Switch
                      id={row.id}
                      checked={row.checked}
                      onCheckedChange={row.onChange}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 focus-visible:ring-0">
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(integrationMeta) as IntegrationKey[]).map((key) => {
                const meta = integrationMeta[key];
                const Icon = meta.icon;
                const isOn = connected[key];
                return (
                  <Card
                    key={key}
                    className={cn(
                      "border-border/80 shadow-sm transition-shadow hover:shadow-md",
                      "ring-1 ring-black/[0.02]"
                    )}
                  >
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{meta.name}</CardTitle>
                          <Badge variant={isOn ? "success" : "secondary"}>
                            {isOn ? "Connected" : "Not connected"}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {meta.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={isOn ? "outline" : "default"}
                          size="sm"
                          className={cn(!isOn && "shadow-sm")}
                          onClick={() => toggleIntegration(key)}
                        >
                          <Link2 className="size-3.5" aria-hidden />
                          {isOn ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
