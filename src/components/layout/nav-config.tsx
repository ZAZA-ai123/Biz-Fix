import type { ComponentType } from "react";
import {
  LayoutDashboard,
  MessageCircle,
  PenTool,
  ScrollText,
  Settings,
  Sparkles,
} from "lucide-react";

export type WorkspaceNavItem = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  highlight?: boolean;
};

export const workspaceMainNav: WorkspaceNavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageCircle },
  { label: "New Quote", href: "/new-quote", icon: Sparkles, highlight: true },
  { label: "Quote Studio", href: "/quote-studio", icon: PenTool },
  { label: "Quotes", href: "/quotes", icon: ScrollText },
];

export const workspaceSecondaryNav: WorkspaceNavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];
