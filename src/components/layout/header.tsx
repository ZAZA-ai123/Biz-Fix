"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const pageTitles: Record<string, { title: string; description: string }> = {
  "/dashboard": { title: "Dashboard", description: "Quote pipeline and recent activity" },
  "/chat": { title: "Chat", description: "Prompt, PO, and ask-mode assistant" },
  "/new-quote": { title: "New Quote", description: "Create a new quote with AI assistance" },
  "/quote-studio": { title: "Quote Studio", description: "Fine-tune and finalize your quote" },
  "/quotes": { title: "Quotes", description: "View and manage all quotes" },
  "/settings": { title: "Settings", description: "Configure your workspace preferences" },
};

export function Header({ onOpenMobileNav }: { onOpenMobileNav?: () => void }) {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || { title: "Biz-Fix", description: "" };

  return (
    <header className="sticky top-0 z-30 flex h-14 min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/90 sm:px-5 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {onOpenMobileNav ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10 shrink-0 rounded-xl border-border bg-background shadow-sm md:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5 text-foreground" aria-hidden />
          </Button>
        ) : null}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight tracking-tight text-foreground sm:text-[15px]">
            {pageInfo.title}
          </h1>
          {pageInfo.description ? (
            <p className="mt-0.5 hidden truncate text-xs leading-snug text-muted-foreground sm:block">
              {pageInfo.description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="relative hidden md:block lg:max-w-none">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            placeholder="Search workspace…"
            className="h-9 w-[min(220px,28vw)] rounded-lg border-border bg-muted/60 pl-9 text-sm placeholder:text-muted-foreground focus-visible:bg-card lg:w-60"
            aria-label="Search workspace"
          />
          <div className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 text-[10px] text-muted-foreground/70 xl:flex">
            <Command className="size-3" aria-hidden />
            K
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-10 shrink-0 rounded-xl text-foreground hover:bg-muted/80"
          aria-label="Notifications"
        >
          <Bell className="size-4 text-muted-foreground" aria-hidden />
        </Button>
      </div>
    </header>
  );
}
