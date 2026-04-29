"use client";

import React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MeshBackground } from "@/components/vibe/mesh-background";
import { WorkspaceMobileNav } from "./workspace-mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex h-dvh max-h-dvh w-full min-w-0 flex-row overflow-hidden bg-[var(--canvas)] text-foreground">
      <MeshBackground />
      <WorkspaceMobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-border/80 bg-[var(--canvas)]/85 backdrop-blur-[2px] md:border-l">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">{children}</main>
      </div>
    </div>
  );
}
