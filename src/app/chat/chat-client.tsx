"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PenTool,
  ScrollText,
  Settings,
} from "lucide-react";
import { PromptInputBox, type PromptSendMeta } from "@/components/ui/ai-prompt-box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/nextjs";
import { QuoteCard } from "@/components/chat/quote-card";
import { PipelineProgress } from "@/components/chat/pipeline-progress";

type Role = "user" | "assistant";

type QuoteSummary = {
  id: string;
  clientName: string;
  projectType?: string | null;
  total: number;
  margin: number;
  itemCount: number;
};

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  meta?: string;
  quoteSummary?: QuoteSummary;
};

type PipelineStep = "plan" | "retrieve" | "structure" | "build" | "save" | "done" | null;

export function ChatClient() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const companyName = (user?.publicMetadata?.companyName as string | undefined) ?? user?.firstName ?? "your workspace";

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (!user.publicMetadata?.companyName) {
      router.replace("/onboarding");
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const welcome = useMemo(
    () =>
      `Welcome to ${companyName}. Describe a project and I’ll build a detailed quote — line items, margins, and totals — in about 30 seconds. Switch to Ask mode for quick questions without creating a quote.`,
    [companyName]
  );

  async function handleSend(text: string, files?: File[], meta?: PromptSendMeta) {
    const mode = meta?.mode ?? "quote";
    const fileNote =
      files?.length
        ? `\n\n_Attached: ${files.map((f) => `${f.name} (${(f.size / 1024).toFixed(0)} KB)`).join(", ")}_`
        : "";
    const userContent = text + fileNote;
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: userContent, meta: mode === "quote" ? "Generate quote" : "Ask" },
    ]);

    if (mode === "ask") {
      setSending(true);
      try {
        const res = await fetch("/api/chat/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text.trim() }),
        });
        const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              data.reply ??
              "Ask mode is for quick Q&A—margins, product fit, or how to phrase a scope. Switch to Quote mode (∞) when ready to build numbers.",
          },
        ]);
      } catch {
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: "Network error while responding." },
        ]);
      } finally {
        setSending(false);
      }
      return;
    }

    setSending(true);
    setPipelineStep("plan");

    // Timed pipeline step animation (conservative estimates for the full agent pipeline)
    const t1 = setTimeout(() => setPipelineStep("retrieve"), 1200);
    const t2 = setTimeout(() => setPipelineStep("structure"), 3500);
    const t3 = setTimeout(() => setPipelineStep("build"), 6500);
    const t4 = setTimeout(() => setPipelineStep("save"), 9500);

    function clearTimers() {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    }

    try {
      const promptForAgent =
        text.trim() +
        (files?.length
          ? `\n\n[User attached files for context: ${files.map((f) => f.name).join(", ")}]`
          : "");
      const res = await fetch("/api/quote/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "create", prompt: promptForAgent }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        quote?: { id: string; customerName?: string; projectType?: string; total?: number; margin?: number; items?: unknown[] };
        quoteRequest?: unknown;
        meta?: unknown;
        warnings?: string[];
      };

      clearTimers();

      if (!res.ok) {
        setPipelineStep(null);
        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: typeof data.error === "string" ? data.error : "Quote agent failed. Check API keys and try again.",
          },
        ]);
        return;
      }

      if (data.quote?.id) {
        sessionStorage.setItem("biz-fix-active-quote", JSON.stringify(data.quote));
        if (data.quoteRequest) {
          sessionStorage.setItem("biz-fix-active-quote-request", JSON.stringify(data.quoteRequest));
        }
        sessionStorage.setItem("biz-fix-active-prompt", text.trim());

        setPipelineStep("done");
        setTimeout(() => setPipelineStep(null), 800);

        setMessages((m) => [
          ...m,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            quoteSummary: {
              id: data.quote!.id,
              clientName: data.quote!.customerName ?? "Client",
              projectType: data.quote!.projectType ?? null,
              total: data.quote!.total ?? 0,
              margin: typeof (data.quote as Record<string, unknown>).margin === "number"
                ? (data.quote as Record<string, unknown>).margin as number
                : 0,
              itemCount: data.quote!.items?.length ?? 0,
            },
          },
        ]);
      } else {
        setPipelineStep(null);
        setMessages((m) => [
          ...m,
          { id: crypto.randomUUID(), role: "assistant", content: "Something went wrong: no quote id returned." },
        ]);
      }
    } catch {
      clearTimers();
      setPipelineStep(null);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: "Network error while generating the quote." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSignOut() {
    signOut(() => router.push("/sign-in"));
  }

  if (!isLoaded || !user) {
    return (
      <div className="grainy-radial flex min-h-dvh items-center justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-sm font-medium text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-[#0c0c0f] text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(155,4,219,0.12),transparent)]"
      />

      <header className="relative z-20 flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-white/15 px-4 pt-[max(0px,env(safe-area-inset-top))] sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-xl text-white hover:bg-white/10"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF1C6A] to-[#9B04DB] text-xs font-bold text-white">
              {companyName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{companyName}</p>
              <p className="text-[11px] text-white/55">Biz-Fix · Chat</p>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="hidden rounded-xl text-white/80 hover:bg-white/10 sm:inline-flex"
          asChild
        >
          <Link href="/dashboard">Workspace</Link>
        </Button>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-3 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:px-5 sm:pb-6 sm:pt-4">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-5 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF1C6A]/30 to-[#9B04DB]/30">
                    <MessageCircle className="size-3.5 text-pink-300" aria-hidden />
                  </div>
                  <p className="text-sm font-semibold text-white">Start here</p>
                </div>
                <p className="text-[13px] leading-relaxed text-white/65">{welcome}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Generate quote", desc: "Describe a project and get a full quote" },
                    { label: "Ask a question", desc: "Get pricing or margin advice" },
                  ].map((tip) => (
                    <div key={tip.label} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-white/80">{tip.label}</p>
                      <p className="mt-0.5 text-[11px] text-white/45">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {messages.map((msg) =>
              msg.quoteSummary ? (
                <QuoteCard key={msg.id} quote={msg.quoteSummary} />
              ) : (
                <div
                  key={msg.id}
                  className={cn(
                    "max-w-[92%] rounded-2xl px-4 py-3 text-[14px] leading-relaxed shadow-sm",
                    msg.role === "user"
                      ? "ml-auto bg-gradient-to-br from-[#FF1C6A]/90 to-[#9B04DB]/90 text-white"
                      : "mr-auto border border-white/10 bg-white/[0.06] text-white/90 backdrop-blur-sm"
                  )}
                >
                  {msg.meta && msg.role === "user" && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                      {msg.meta}
                    </p>
                  )}
                  <MessageBody content={msg.content} isUser={msg.role === "user"} />
                </div>
              )
            )}
            <PipelineProgress activeStep={pipelineStep} />
            {sending && !pipelineStep && (
              <div className="mr-auto rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/60">
                Thinking…
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="mt-4 shrink-0 pt-1">
            <PromptInputBox
              toolbarPreset="bizfix"
              isLoading={sending}
              onSend={handleSend}
              className="border-white/10 bg-[#141418]/95 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
            />
          </div>
        </div>
      </main>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
              aria-label="Close menu"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="grainy-radial fixed right-0 top-0 z-50 flex h-full w-[min(100vw,20rem)] flex-col border-l border-white/20 shadow-2xl"
            >
              <div className="relative z-[1] flex items-center justify-between border-b border-white/15 p-4">
                <span className="text-sm font-semibold text-white">Menu</span>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="rounded-full text-white hover:bg-white/15"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close sidebar"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>
              <nav className="relative z-[1] flex flex-1 flex-col gap-1 p-3">
                {[
                  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { href: "/new-quote", label: "New quote (classic)", icon: PenTool },
                  { href: "/quotes", label: "Quotes", icon: ScrollText },
                  { href: "/settings", label: "Settings", icon: Settings },
                ].map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15"
                  >
                    <Icon className="size-4 shrink-0 opacity-90" />
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="relative z-[1] border-t border-white/15 p-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/90 transition-colors hover:bg-white/15"
                >
                  <LogOut className="size-4" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MessageBody({ content, isUser }: { content: string; isUser: boolean }) {
  const linkMatch = content.match(/\[Open in Quote Studio\]\(([^)]+)\)/);
  if (linkMatch) {
    const [full, path] = linkMatch;
    const rest = content.replace(full, "").trim();
    return (
      <div className="space-y-2">
        {rest ? <p className="whitespace-pre-wrap">{rest}</p> : null}
        <Link
          href={path}
          className={cn(
            "inline-flex rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors",
            isUser ? "bg-white/20 text-white hover:bg-white/30" : "bg-white text-[#9B04DB] hover:bg-white/90"
          )}
        >
          Open Quote Studio
        </Link>
      </div>
    );
  }
  return <p className="whitespace-pre-wrap">{content}</p>;
}
