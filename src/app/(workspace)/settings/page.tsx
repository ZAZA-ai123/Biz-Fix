"use client";

import { useCallback, useEffect, useState, type ComponentType } from "react";
import { useUser } from "@clerk/nextjs";
import {
  Building2,
  Check,
  CreditCard,
  FileSpreadsheet,
  Link2,
  Loader2,
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
import {
  DEFAULT_SETTINGS,
  type CompanySettings,
  type GeneralSettings,
  type NotificationPrefs,
  type QuoteDefaults,
} from "@/lib/db/settings-redis";

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

type SaveState = "idle" | "saving" | "saved" | "error";

type TabKey = "general" | "quotes" | "notifications";

export default function SettingsPage() {
  const { user } = useUser();
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<Record<TabKey, SaveState>>({
    general: "idle",
    quotes: "idle",
    notifications: "idle",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company/settings", { cache: "no-store" });
        if (!res.ok) throw new Error("load failed");
        const data = (await res.json()) as CompanySettings;
        if (cancelled) return;
        const fallbackName =
          (user?.publicMetadata?.companyName as string | undefined) ?? "";
        setSettings({
          ...data,
          general: {
            ...data.general,
            businessName: data.general.businessName || fallbackName,
            businessEmail:
              data.general.businessEmail ||
              user?.primaryEmailAddress?.emailAddress ||
              "",
          },
        });
      } catch {
        if (!cancelled) setSettings(DEFAULT_SETTINGS);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const saveTab = useCallback(
    async (tab: TabKey, payload: Partial<CompanySettings>) => {
      setSaveState((s) => ({ ...s, [tab]: "saving" }));
      try {
        const res = await fetch("/api/company/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("save failed");
        const updated = (await res.json()) as CompanySettings;
        setSettings(updated);
        setSaveState((s) => ({ ...s, [tab]: "saved" }));
        setTimeout(
          () =>
            setSaveState((s) =>
              s[tab] === "saved" ? { ...s, [tab]: "idle" } : s
            ),
          1800
        );
      } catch {
        setSaveState((s) => ({ ...s, [tab]: "error" }));
      }
    },
    []
  );

  const updateGeneral = (patch: Partial<GeneralSettings>) =>
    setSettings((s) => ({ ...s, general: { ...s.general, ...patch } }));
  const updateQuotes = (patch: Partial<QuoteDefaults>) =>
    setSettings((s) => ({ ...s, quotes: { ...s.quotes, ...patch } }));
  const updateNotifications = (patch: Partial<NotificationPrefs>) =>
    setSettings((s) => ({
      ...s,
      notifications: { ...s.notifications, ...patch },
    }));

  return (
    <div className="relative min-h-full w-full overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(37,99,235,0.1),transparent)]"
      />
      <div className="page-shell-narrow relative space-y-8 md:space-y-10">
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

        <Tabs defaultValue="general" className="w-full min-w-0 space-y-6">
          <TabsList className="grid h-auto w-full min-w-0 grid-cols-2 gap-1 rounded-xl bg-muted/80 p-1.5 sm:grid-cols-4">
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
                      value={settings.general.businessName}
                      onChange={(e) => updateGeneral({ businessName: e.target.value })}
                      disabled={!loaded}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-email">Email</Label>
                    <Input
                      id="biz-email"
                      type="email"
                      value={settings.general.businessEmail}
                      onChange={(e) => updateGeneral({ businessEmail: e.target.value })}
                      disabled={!loaded}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="biz-phone">Phone</Label>
                    <Input
                      id="biz-phone"
                      value={settings.general.businessPhone}
                      onChange={(e) => updateGeneral({ businessPhone: e.target.value })}
                      disabled={!loaded}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="biz-address">Address</Label>
                    <Input
                      id="biz-address"
                      value={settings.general.businessAddress}
                      onChange={(e) => updateGeneral({ businessAddress: e.target.value })}
                      disabled={!loaded}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-end gap-3">
                  <SaveStatus state={saveState.general} />
                  <Button
                    size="lg"
                    className="shadow-md shadow-blue-600/15"
                    onClick={() => saveTab("general", { general: settings.general })}
                    disabled={!loaded || saveState.general === "saving"}
                  >
                    {saveState.general === "saving" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="size-4" aria-hidden />
                    )}
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
                      value={settings.quotes.expiryDays}
                      onChange={(e) =>
                        updateQuotes({ expiryDays: Number(e.target.value) || 0 })
                      }
                      disabled={!loaded}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tax-rate">Default tax rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      step="0.01"
                      value={settings.quotes.taxRate}
                      onChange={(e) =>
                        updateQuotes({ taxRate: Number(e.target.value) || 0 })
                      }
                      disabled={!loaded}
                      className="h-10 rounded-xl border-border/80"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Payment terms</Label>
                    <Select
                      value={settings.quotes.paymentTerms}
                      onValueChange={(v) =>
                        updateQuotes({
                          paymentTerms: v as QuoteDefaults["paymentTerms"],
                        })
                      }
                      disabled={!loaded}
                    >
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
                      value={settings.quotes.quotePrefix}
                      onChange={(e) => updateQuotes({ quotePrefix: e.target.value })}
                      placeholder="QT-2026-"
                      disabled={!loaded}
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
                    checked={settings.quotes.autoNumbering}
                    onCheckedChange={(v) => updateQuotes({ autoNumbering: v })}
                    disabled={!loaded}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-end gap-3">
                  <SaveStatus state={saveState.quotes} />
                  <Button
                    size="lg"
                    className="shadow-md shadow-blue-600/15"
                    onClick={() => saveTab("quotes", { quotes: settings.quotes })}
                    disabled={!loaded || saveState.quotes === "saving"}
                  >
                    {saveState.quotes === "saving" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="size-4" aria-hidden />
                    )}
                    Save Changes
                  </Button>
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
                {(
                  [
                    {
                      id: "n-accepted",
                      key: "accepted",
                      label: "Quote accepted",
                      desc: "When a client accepts a sent proposal.",
                    },
                    {
                      id: "n-expired",
                      key: "expired",
                      label: "Quote expired",
                      desc: "When a quote passes its expiry without action.",
                    },
                    {
                      id: "n-stock",
                      key: "lowStock",
                      label: "Low stock alert",
                      desc: "When catalog SKUs fall below your thresholds.",
                    },
                    {
                      id: "n-vendor",
                      key: "vendor",
                      label: "New vendor added",
                      desc: "When a teammate onboards a new supplier.",
                    },
                    {
                      id: "n-weekly",
                      key: "weekly",
                      label: "Weekly summary",
                      desc: "Pipeline snapshot every Monday morning.",
                    },
                  ] as const
                ).map((row) => (
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
                      checked={settings.notifications[row.key]}
                      onCheckedChange={(v) =>
                        updateNotifications({ [row.key]: v } as Partial<NotificationPrefs>)
                      }
                      disabled={!loaded}
                    />
                  </div>
                ))}
                <div className="flex items-center justify-end gap-3 pt-4">
                  <SaveStatus state={saveState.notifications} />
                  <Button
                    size="lg"
                    className="shadow-md shadow-blue-600/15"
                    onClick={() =>
                      saveTab("notifications", {
                        notifications: settings.notifications,
                      })
                    }
                    disabled={!loaded || saveState.notifications === "saving"}
                  >
                    {saveState.notifications === "saving" ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <Save className="size-4" aria-hidden />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="mt-0 focus-visible:ring-0">
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              <Badge variant="secondary" className="shrink-0">Preview</Badge>
              Integration connections are visual previews — full OAuth wiring is on the roadmap.
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {(Object.keys(integrationMeta) as IntegrationKey[]).map((key) => {
                const meta = integrationMeta[key];
                const Icon = meta.icon;
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
                          <Badge variant="secondary">Not connected</Badge>
                        </div>
                        <CardDescription className="text-sm leading-relaxed">
                          {meta.description}
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-2">
                        <Button variant="default" size="sm" disabled className="shadow-sm">
                          <Link2 className="size-3.5" aria-hidden />
                          Connect
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

function SaveStatus({ state }: { state: SaveState }) {
  if (state === "saved") {
    return (
      <span className="flex items-center gap-1.5 text-sm text-emerald-600">
        <Check className="size-4" aria-hidden />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return <span className="text-sm text-rose-600">Couldn&apos;t save — try again</span>;
  }
  return null;
}
