"use client";

import * as React from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Download,
  FileSpreadsheet,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const BIZ_FIX_FIELDS = [
  { key: "sku", label: "SKU" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "category", label: "Category" },
  { key: "subcategory", label: "Subcategory" },
  { key: "vendor", label: "Vendor" },
  { key: "cost_price", label: "Cost price" },
  { key: "default_sell_price", label: "Default sell price" },
  { key: "tier", label: "Tier" },
  { key: "suitable_for", label: "Suitable for" },
  { key: "tags", label: "Tags" },
  { key: "margin_floor_percent", label: "Margin floor %" },
  { key: "preferred_margin_percent", label: "Preferred margin %" },
  { key: "stock_status", label: "Stock status" },
  { key: "lead_time_days", label: "Lead time (days)" },
  { key: "alternative_skus", label: "Alternative SKUs" },
  { key: "notes", label: "Notes" },
] as const;

const MOCK_CSV_COLUMNS = [
  "sku",
  "product_name",
  "long_description",
  "category",
  "sub_cat",
  "supplier",
  "unit_cost",
  "list_price",
  "product_tier",
  "use_case",
  "keywords",
  "min_margin_pct",
  "target_margin_pct",
  "availability",
  "ship_days",
  "alt_codes",
  "internal_notes",
  "(ignore)",
] as const;

const DEFAULT_MAPPING: Record<string, string> = {
  sku: "sku",
  name: "product_name",
  description: "long_description",
  category: "category",
  subcategory: "sub_cat",
  vendor: "supplier",
  cost_price: "unit_cost",
  default_sell_price: "list_price",
  tier: "product_tier",
  suitable_for: "use_case",
  tags: "keywords",
  margin_floor_percent: "min_margin_pct",
  preferred_margin_percent: "target_margin_pct",
  stock_status: "availability",
  lead_time_days: "ship_days",
  alternative_skus: "alt_codes",
  notes: "internal_notes",
};

const PREVIEW_ROWS = [
  {
    sku: "FL-OAK-8MM",
    name: "Oak Laminate 8mm",
    category: "Flooring",
    cost_price: "$18.40",
    default_sell_price: "$32.99",
    stock_status: "In stock",
  },
  {
    sku: "TL-POR-12X24",
    name: "Porcelain Tile 12×24",
    category: "Tile",
    cost_price: "$4.25",
    default_sell_price: "$8.50",
    stock_status: "Low stock",
  },
  {
    sku: "CT-QUZ-2CM",
    name: "Quartz Slab 2cm",
    category: "Countertops",
    cost_price: "$42.00",
    default_sell_price: "$79.00",
    stock_status: "Made to order",
  },
];

const TEMPLATE_HEADER =
  "sku,name,description,category,subcategory,vendor,cost_price,default_sell_price,tier,suitable_for,tags,margin_floor_percent,preferred_margin_percent,stock_status,lead_time_days,alternative_skus,notes";

const STEPS = [
  { id: 1, title: "Upload", description: "CSV file" },
  { id: 2, title: "Map fields", description: "Match columns" },
  { id: 3, title: "Preview", description: "Validate rows" },
  { id: 4, title: "Import", description: "Apply settings" },
];

export default function CatalogImportPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [mapping, setMapping] = React.useState<Record<string, string>>(() => ({ ...DEFAULT_MAPPING }));
  const [updateBySku, setUpdateBySku] = React.useState(true);
  const [skipErrors, setSkipErrors] = React.useState(true);
  const [autoMargins, setAutoMargins] = React.useState(false);

  const onFile = (file: File | null) => {
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setFileName(file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    onFile(f ?? null);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_HEADER + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "biz-fix-catalog-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-8 pb-16">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">
          Bulk add or update products. Your file never leaves this session until you import.
        </p>
      </div>

      {/* Step indicator */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STEPS.map((step) => {
          const uploadDone = step.id === 1 && !!fileName;
          const uploadActive = step.id === 1 && !fileName;
          const downstreamActive = step.id > 1 && !!fileName;
          const muted = step.id > 1 && !fileName;
          return (
            <div
              key={step.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                uploadActive && "border-primary/40 bg-accent/40 shadow-sm",
                downstreamActive && "border-primary/25 bg-card shadow-sm",
                uploadDone && "border-emerald-200/80 bg-emerald-50/50",
                muted && "opacity-50 border-dashed"
              )}
            >
              <div className="mt-0.5 shrink-0">
                {uploadDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : uploadActive || downstreamActive ? (
                  <Circle className="w-5 h-5 text-primary fill-primary/15" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Step {step.id}
                </p>
                <p className="font-semibold text-foreground">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="border-border/80 shadow-md overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-br from-card to-accent/20 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Upload CSV</CardTitle>
              <CardDescription className="mt-1.5 max-w-xl">
                Use UTF-8 encoding. First row should be headers. Match columns in the next section.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={downloadTemplate}>
              <Download className="w-4 h-4" />
              Download template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className={cn(
              "w-full min-h-[220px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 px-6 py-10 transition-all cursor-pointer",
              dragActive
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-muted-foreground/25 hover:border-primary/40 hover:bg-accent/30"
            )}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <UploadCloud className="w-7 h-7 text-primary" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-medium text-foreground">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground">Maximum recommended size 25 MB · .csv only</p>
            </div>
            {fileName && (
              <Badge variant="info" className="gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {fileName}
              </Badge>
            )}
          </button>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Field mapping</CardTitle>
          <CardDescription>
            Map each Biz-Fix field to a column from your CSV. Unmapped fields can be filled later in the catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="rounded-lg border bg-muted/30 overflow-hidden">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b bg-muted/50">
              <span>Biz-Fix field</span>
              <span className="text-center w-10" aria-hidden>
                →
              </span>
              <span>CSV column</span>
            </div>
            <ul className="divide-y max-h-[420px] overflow-y-auto">
              {BIZ_FIX_FIELDS.map((field) => (
                <li
                  key={field.key}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-2 items-center px-4 py-3 bg-card hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-xs font-mono text-muted-foreground truncate">{field.key}</code>
                    <span className="text-sm font-medium truncate">{field.label}</span>
                  </div>
                  <div className="hidden sm:flex justify-center text-muted-foreground">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                  <Select
                    value={mapping[field.key] ?? "(ignore)"}
                    onValueChange={(v) => setMapping((m) => ({ ...m, [field.key]: v }))}
                  >
                    <SelectTrigger className="h-9 bg-card">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_CSV_COLUMNS.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Import preview</CardTitle>
          <CardDescription>Sample of how the first rows will appear after import (illustrative).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-3 font-semibold">SKU</th>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Category</th>
                  <th className="p-3 font-semibold">Cost</th>
                  <th className="p-3 font-semibold">Sell</th>
                  <th className="p-3 font-semibold">Stock</th>
                </tr>
              </thead>
              <tbody>
                {PREVIEW_ROWS.map((row) => (
                  <tr key={row.sku} className="border-b last:border-0 hover:bg-accent/20">
                    <td className="p-3 font-mono text-xs">{row.sku}</td>
                    <td className="p-3 font-medium">{row.name}</td>
                    <td className="p-3">{row.category}</td>
                    <td className="p-3 text-muted-foreground">{row.cost_price}</td>
                    <td className="p-3">{row.default_sell_price}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          row.stock_status === "In stock"
                            ? "success"
                            : row.stock_status === "Low stock"
                              ? "warning"
                              : "secondary"
                        }
                      >
                        {row.stock_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Import settings</CardTitle>
          <CardDescription>Fine-tune how Biz-Fix applies this upload to your catalog.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="update-sku" className="text-base font-medium">
                Update existing products by SKU match
              </Label>
              <p className="text-sm text-muted-foreground">
                When a row&apos;s SKU exists, merge fields instead of creating a duplicate.
              </p>
            </div>
            <Switch id="update-sku" checked={updateBySku} onCheckedChange={setUpdateBySku} />
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="skip-errors" className="text-base font-medium">
                Skip rows with errors
              </Label>
              <p className="text-sm text-muted-foreground">
                Continue the import and report problematic rows in a summary log.
              </p>
            </div>
            <Switch id="skip-errors" checked={skipErrors} onCheckedChange={setSkipErrors} />
          </div>
          <Separator />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="auto-margins" className="text-base font-medium">
                Auto-assign default margins
              </Label>
              <p className="text-sm text-muted-foreground">
                Use your Rules &amp; Configuration defaults when margin fields are empty.
              </p>
            </div>
            <Switch id="auto-margins" checked={autoMargins} onCheckedChange={setAutoMargins} />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 border-t bg-muted/20 py-6">
          <Button size="lg" className="w-full sm:w-auto min-w-[200px] gap-2" disabled={!fileName}>
            <UploadCloud className="w-4 h-4" />
            Run import
          </Button>
          <p className="text-xs text-muted-foreground sm:ml-auto sm:self-center text-center sm:text-right">
            {!fileName ? "Upload a CSV to enable import." : "You can review the import log after processing."}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
