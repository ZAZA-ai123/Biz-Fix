"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRightLeft,
  FileText,
  Package,
  Send,
  Sparkles,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { CursorTrailGoo } from "./CursorTrailGoo";
import { GlassCard } from "./GlassCard";
import { MeshBackground } from "./MeshBackground";
import { PaintSplotTransition } from "./PaintSplotTransition";

type LineItem = {
  id: string;
  product: string;
  qty: number;
  bucket: "quote" | "order";
};

const springPop = {
  type: "spring" as const,
  stiffness: 520,
  damping: 22,
  mass: 0.85,
};

function parseAddLine(text: string): { qty: number; product: string } | null {
  const m = text.match(
    /^\s*add\s+(\d+)\s+units?\s+of\s+(.+?)\s*\.?\s*$/i,
  );
  if (!m) return null;
  const qty = Number(m[1]);
  const product = m[2].trim().replace(/\.$/, "");
  if (!Number.isFinite(qty) || qty <= 0 || !product) return null;
  return { qty, product };
}

export function QuotesOrdersDashboard() {
  const [items, setItems] = useState<LineItem[]>([
    {
      id: "1",
      product: "Premium Widget",
      qty: 120,
      bucket: "quote",
    },
    {
      id: "2",
      product: "Service Retainer",
      qty: 1,
      bucket: "quote",
    },
    {
      id: "3",
      product: "Starter Kit",
      qty: 48,
      bucket: "order",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [view, setView] = useState<"quotes" | "orders">("quotes");
  const [splot, setSplot] = useState(false);

  const quoteItems = useMemo(
    () => items.filter((i) => i.bucket === "quote"),
    [items],
  );
  const orderItems = useMemo(
    () => items.filter((i) => i.bucket === "order"),
    [items],
  );

  const startConvert = useCallback(() => {
    if (quoteItems.length === 0) return;
    setSplot(true);
  }, [quoteItems.length]);

  const onCoverComplete = useCallback(() => {
    setItems((prev) =>
      prev.map((i) =>
        i.bucket === "quote" ? { ...i, bucket: "order" as const } : i,
      ),
    );
    setView("orders");
  }, []);

  const onRevealComplete = useCallback(() => {
    setSplot(false);
  }, []);

  const submitPrompt = useCallback(() => {
    const parsed = parseAddLine(prompt);
    if (!parsed) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
    const bucket = view === "orders" ? "order" : "quote";
    setItems((prev) => [
      {
        id,
        product: parsed.product,
        qty: parsed.qty,
        bucket,
      },
      ...prev,
    ]);
    setPrompt("");
  }, [prompt, view]);

  return (
    <div className="relative min-h-screen">
      <MeshBackground />
      <CursorTrailGoo />
      <PaintSplotTransition
        active={splot}
        onCoverComplete={onCoverComplete}
        onRevealComplete={onRevealComplete}
      />

      <main className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-36 pt-10 md:px-8 md:pt-14">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springPop}
              className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-brand-glow backdrop-blur-xl"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Biz-Fix workspace
            </motion.div>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Quotes &amp; Orders
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/65">
              Frosted panels, magnetic glow, and a paint splot handoff when a
              quote becomes an order.
            </p>
          </div>
          <div className="flex gap-2">
            {(["quotes", "orders"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => !splot && setView(tab)}
                disabled={splot}
                className={`rounded-xl border px-4 py-2 text-sm font-medium backdrop-blur-md transition ${
                  view === tab
                    ? "border-white/35 bg-white/20 text-white"
                    : "border-white/15 bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                {tab === "quotes" ? "Quotes" : "Orders"}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                  <FileText className="h-5 w-5 text-brand-glow" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    Active quote
                  </h2>
                  <p className="text-xs text-white/55">
                    {quoteItems.length} line
                    {quoteItems.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                disabled={quoteItems.length === 0 || splot}
                onClick={startConvert}
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-gradient-to-r from-brand-iris/40 to-brand-fuchsia/35 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-violet/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Convert to order
              </motion.button>
            </div>
            <ul className="mt-6 space-y-2">
              <AnimatePresence initial={false}>
                {quoteItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, filter: "blur(6px)" }}
                    transition={springPop}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-white/90">
                      {item.product}
                    </span>
                    <span className="tabular-nums text-white/60">
                      {item.qty} units
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {quoteItems.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-8 text-center text-sm text-white/45">
                  No quote lines — try the prompt bar below.
                </li>
              )}
            </ul>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Package className="h-5 w-5 text-brand-cyan" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Orders</h2>
                <p className="text-xs text-white/55">
                  Fulfilment queue · {orderItems.length} line
                  {orderItems.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-2">
              <AnimatePresence initial={false}>
                {orderItems.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.92, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={springPop}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-white/90">
                      {item.product}
                    </span>
                    <span className="tabular-nums text-white/60">
                      {item.qty} units
                    </span>
                  </motion.li>
                ))}
              </AnimatePresence>
              {orderItems.length === 0 && (
                <li className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-8 text-center text-sm text-white/45">
                  No orders yet.
                </li>
              )}
            </ul>
          </GlassCard>
        </div>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springPop, delay: 0.08 }}
          className="pointer-events-auto flex w-full max-w-2xl items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-2 pl-4 shadow-2xl shadow-brand-iris/10 backdrop-blur-xl"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPrompt();
            }}
            placeholder='Try: Add 500 units of Product X'
            className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white placeholder:text-white/35 focus:outline-none"
            aria-label="Natural language line item"
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={submitPrompt}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-iris to-brand-fuchsia text-white shadow-lg"
            aria-label="Add line item"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
