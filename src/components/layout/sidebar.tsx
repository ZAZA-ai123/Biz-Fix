"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { workspaceMainNav, workspaceSecondaryNav, type WorkspaceNavItem } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const { user } = useUser();

  const displayName =
    user?.fullName ??
    user?.primaryEmailAddress?.emailAddress ??
    "User";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
  const companyName = (user?.publicMetadata?.companyName as string | undefined) ?? "Biz-Fix";

  return (
    <aside
      className={cn(
        "relative hidden h-full min-h-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out md:flex",
        collapsed ? "md:w-[60px]" : "md:w-60 lg:w-[248px]"
      )}
    >
      {/* Logo / company */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-3 md:px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
          B
        </div>
        {!collapsed && (
          <span className="block min-w-0 truncate text-sm font-semibold tracking-tight text-foreground">
            {companyName}
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-2 py-3">
        <NavSection label="Menu" collapsed={collapsed}>
          {workspaceMainNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </NavSection>

        <NavSection label="Account" collapsed={collapsed}>
          {workspaceSecondaryNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </NavSection>
      </nav>

      {/* User identity */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        {!collapsed ? (
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-muted/60 transition-colors">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-[13px] font-medium leading-tight text-foreground">
                {displayName}
              </span>
              <span className="block text-[11px] text-muted-foreground">Admin</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground" title={displayName}>
              {initials}
            </div>
          </div>
        )}
      </div>

      {/* Collapse toggle — always visible, not hover-only */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[4.5rem] z-10 flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronRight className="size-3" /> : <ChevronLeft className="size-3" />}
      </button>
    </aside>
  );
}

function NavSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-0.5">
      {!collapsed && (
        <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

function NavItem({
  item,
  pathname,
  collapsed,
}: {
  item: WorkspaceNavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-accent text-accent-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          isActive ? "text-primary" : "text-muted-foreground"
        )}
      />
      {!collapsed && (
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
      )}
    </Link>
  );
}
