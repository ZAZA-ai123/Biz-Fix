"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  PenTool,
  Package,
  Upload,
  Settings2,
  Store,
  ScrollText,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "New Quote", href: "/new-quote", icon: Sparkles },
  { label: "Quote Studio", href: "/quote-studio", icon: PenTool },
  { label: "Quotes", href: "/quotes", icon: ScrollText },
];

const catalogNav = [
  { label: "Products", href: "/catalog", icon: Package },
  { label: "Import", href: "/catalog/import", icon: Upload },
  { label: "Rules & Config", href: "/catalog/rules", icon: Settings2 },
];

const manageNav = [
  { label: "Vendors", href: "/vendors", icon: Store },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative group",
        collapsed ? "w-[68px]" : "w-[260px]"
      )}
    >
      <div className={cn("flex items-center gap-3 px-5 h-16 shrink-0", collapsed && "justify-center px-0")}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-primary-foreground font-bold text-base shrink-0">
          B
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[15px] text-foreground tracking-tight">Biz-Fix</span>
            <span className="text-[11px] text-muted-foreground leading-none">Quote Operating System</span>
          </div>
        )}
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <NavSection label="Main" collapsed={collapsed}>
          {mainNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </NavSection>

        <NavSection label="Catalog" collapsed={collapsed}>
          {catalogNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </NavSection>

        <NavSection label="Manage" collapsed={collapsed}>
          {manageNav.map((item) => (
            <NavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </NavSection>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-accent/50">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              ZS
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-foreground truncate">Zoravar Singh</span>
              <span className="text-[11px] text-muted-foreground truncate">Admin</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              ZS
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100 z-10 cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
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
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
          {label}
        </p>
      )}
      {collapsed && <Separator className="mb-2" />}
      {children}
    </div>
  );
}

function NavItem({
  item,
  pathname,
  collapsed,
}: {
  item: { label: string; href: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-sidebar-accent text-primary shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className={cn("w-[18px] h-[18px] shrink-0", isActive && "text-primary")} />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}
