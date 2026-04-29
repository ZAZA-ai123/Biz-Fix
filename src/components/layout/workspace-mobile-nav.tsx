"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { workspaceMainNav, workspaceSecondaryNav, type WorkspaceNavItem } from "./nav-config";

function MobileNavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: WorkspaceNavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive =
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-muted/90 hover:text-foreground"
      )}
    >
      <Icon className={cn("size-[18px] shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {item.highlight && !isActive && (
        <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
          AI
        </span>
      )}
    </Link>
  );
}

export function WorkspaceMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18.5rem)] max-w-[320px] flex-col border-r border-sidebar-border bg-sidebar shadow-xl md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
              B
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Biz-Fix</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Quote OS
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0 rounded-xl"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-3 py-4">
          <div className="space-y-0.5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Main
            </p>
            {workspaceMainNav.map((item) => (
              <MobileNavItem key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
            ))}
          </div>
          <div className="space-y-0.5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </p>
            {workspaceSecondaryNav.map((item) => (
              <MobileNavItem key={item.href} item={item} pathname={pathname} onNavigate={onClose} />
            ))}
          </div>
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
              ZS
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">Zoravar Singh</p>
              <p className="truncate text-xs text-muted-foreground">Admin</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
