"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Search, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Overview of your business performance" },
  "/new-quote": { title: "New Quote", description: "Create a new quote with AI assistance" },
  "/quote-studio": { title: "Quote Studio", description: "Fine-tune and finalize your quote" },
  "/catalog": { title: "Product Catalog", description: "Manage your products, pricing, and inventory" },
  "/catalog/import": { title: "Import Products", description: "Bulk import products from CSV files" },
  "/catalog/rules": { title: "Rules & Configuration", description: "Set margins, vendor preferences, and quote behavior" },
  "/vendors": { title: "Vendors", description: "Manage your supplier relationships" },
  "/quotes": { title: "Quotes", description: "View and manage all quotes" },
  "/settings": { title: "Settings", description: "Configure your workspace preferences" },
};

export function Header() {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || { title: "Biz-Fix", description: "" };

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-30">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-foreground leading-tight">{pageInfo.title}</h1>
        <p className="text-xs text-muted-foreground">{pageInfo.description}</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products, quotes, vendors..."
            className="w-[280px] pl-9 h-8 bg-secondary/50 border-transparent focus-visible:bg-card focus-visible:border-input"
          />
        </div>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <HelpCircle className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
        </Button>
      </div>
    </header>
  );
}
