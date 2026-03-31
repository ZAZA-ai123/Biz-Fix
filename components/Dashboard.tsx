"use client";

import { useState, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ShoppingCart,
  ArrowRight,
  Truck,
  CheckCircle2,
  Clock,
  Plus,
  TrendingUp,
  DollarSign,
  Layers,
  Zap,
  X,
} from "lucide-react";

import MeshBackground from "./MeshBackground";
import GlassCard from "./GlassCard";
import CursorTrail from "./CursorTrail";
import PaintSplot from "./PaintSplot";
import NLInputBar from "./NLInputBar";
import type { Quote, Order, LineItem, Point } from "@/types";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_QUOTES: Quote[] = [
  {
    id: "q1",
    title: "Website Redesign",
    client: "Acme Corp",
    items: [
      { id: "i1", product: "Discovery & Strategy", qty: 1, price: 3500 },
      { id: "i2", product: "UI/UX Design", qty: 1, price: 5000 },
      { id: "i3", product: "Frontend Dev", qty: 1, price: 8000 },
    ],
    total: 16500,
    status: "pending",
    createdAt: "Mar 15, 2026",
  },
  {
    id: "q2",
    title: "Brand Identity Package",
    client: "TechStart Inc",
    items: [
      { id: "i4", product: "Logo Design", qty: 1, price: 2500 },
      { id: "i5", product: "Brand Guidelines", qty: 1, price: 1500 },
    ],
    total: 4000,
    status: "draft",
    createdAt: "Mar 18, 2026",
  },
  {
    id: "q3",
    title: "SEO Campaign Q2",
    client: "Green Energy Co",
    items: [
      { id: "i6", product: "Keyword Research", qty: 1, price: 800 },
      { id: "i7", product: "Content Creation", qty: 12, price: 150 },
    ],
    total: 2600,
    status: "approved",
    createdAt: "Mar 22, 2026",
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "o1",
    quoteId: "q0",
    title: "Mobile App MVP",
    client: "StartupXYZ",
    items: [
      { id: "oi1", product: "iOS Development", qty: 1, price: 15000 },
      { id: "oi2", product: "Android Development", qty: 1, price: 15000 },
      { id: "oi3", product: "QA Testing", qty: 1, price: 3500 },
    ],
    total: 33500,
    status: "processing",
    createdAt: "Mar 10, 2026",
  },
  {
    id: "o2",
    quoteId: "q00",
    title: "E-commerce Platform",
    client: "RetailMax",
    items: [
      { id: "oi4", product: "Platform Setup", qty: 1, price: 12000 },
      { id: "oi5", product: "Payment Integration", qty: 1, price: 4000 },
    ],
    total: 16000,
    status: "shipped",
    createdAt: "Mar 5, 2026",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2);
}

function calcTotal(items: LineItem[]) {
  return items.reduce((s, i) => s + i.qty * i.price, 0);
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

// ─── Status Badges ────────────────────────────────────────────────────────────

const QUOTE_STATUS = {
  draft: { label: "Draft", cls: "bg-white/10 text-white/60", icon: FileText },
  pending: { label: "Pending", cls: "bg-amber-400/20 text-amber-300", icon: Clock },
  approved: { label: "Approved", cls: "bg-emerald-400/20 text-emerald-300", icon: CheckCircle2 },
};

const ORDER_STATUS = {
  processing: { label: "Processing", cls: "bg-indigo-400/20 text-indigo-300", icon: Zap },
  shipped: { label: "Shipped", cls: "bg-cyan-400/20 text-cyan-300", icon: Truck },
  delivered: { label: "Delivered", cls: "bg-emerald-400/20 text-emerald-300", icon: CheckCircle2 },
};

// ─── Quote Card ───────────────────────────────────────────────────────────────

function QuoteCard({
  quote,
  isSelected,
  onSelect,
  onConvert,
  newItemIds,
}: {
  quote: Quote;
  isSelected: boolean;
  onSelect: () => void;
  onConvert: (e: React.MouseEvent) => void;
  newItemIds: Set<string>;
}) {
  const st = QUOTE_STATUS[quote.status];
  const Icon = st.icon;

  return (
    <GlassCard
      isSelected={isSelected}
      onClick={onSelect}
      glowColor="rgba(129,140,248,0.2)"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{quote.title}</h3>
            <p className="text-sm text-white/50 mt-0.5">{quote.client}</p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${st.cls}`}
          >
            <Icon size={11} strokeWidth={2.5} />
            {st.label}
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-1 mb-4">
          <AnimatePresence initial={false}>
            {quote.items.map((item) => (
              <motion.div
                key={item.id}
                initial={
                  newItemIds.has(item.id)
                    ? { scale: 0, opacity: 0, y: -12 }
                    : false
                }
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={
                  newItemIds.has(item.id)
                    ? { type: "spring", stiffness: 500, damping: 28 }
                    : {}
                }
                className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                style={{
                  background: newItemIds.has(item.id)
                    ? "rgba(129,140,248,0.15)"
                    : "rgba(255,255,255,0.04)",
                  border: newItemIds.has(item.id)
                    ? "1px solid rgba(129,140,248,0.3)"
                    : "1px solid transparent",
                  transition: "background 0.6s, border-color 0.6s",
                }}
              >
                <span className="text-xs text-white/70 flex-1 min-w-0 truncate">
                  {item.product}
                </span>
                <span className="text-xs text-white/40 mx-3 shrink-0">
                  ×{item.qty}
                </span>
                <span className="text-xs font-medium text-white/70 shrink-0">
                  {fmt(item.qty * item.price)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-xs text-white/40">Total</p>
            <p className="text-lg font-bold text-white">{fmt(quote.total)}</p>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-white/30">{quote.createdAt}</p>
            {quote.status !== "draft" && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onConvert(e);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                  boxShadow: "0 4px 14px rgba(79,70,229,0.5)",
                }}
              >
                Convert
                <ArrowRight size={12} strokeWidth={2.5} />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const st = ORDER_STATUS[order.status];
  const Icon = st.icon;

  return (
    <GlassCard glowColor="rgba(6,182,212,0.15)">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{order.title}</h3>
            <p className="text-sm text-white/50 mt-0.5">{order.client}</p>
          </div>
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${st.cls}`}
          >
            <Icon size={11} strokeWidth={2.5} />
            {st.label}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-white/40 mb-1.5">
            <span>Progress</span>
            <span>
              {order.status === "processing"
                ? "30%"
                : order.status === "shipped"
                ? "70%"
                : "100%"}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #4f46e5, #06b6d4)",
              }}
              initial={{ width: 0 }}
              animate={{
                width:
                  order.status === "processing"
                    ? "30%"
                    : order.status === "shipped"
                    ? "70%"
                    : "100%",
              }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-1 mb-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-1.5 px-3 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-xs text-white/70 flex-1 min-w-0 truncate">
                {item.product}
              </span>
              <span className="text-xs text-white/40 mx-3 shrink-0">
                ×{item.qty}
              </span>
              <span className="text-xs font-medium text-white/70 shrink-0">
                {fmt(item.qty * item.price)}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div>
            <p className="text-xs text-white/40">Order Total</p>
            <p className="text-lg font-bold text-white">{fmt(order.total)}</p>
          </div>
          <p className="text-xs text-white/30">{order.createdAt}</p>
        </div>
      </div>
    </GlassCard>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: color }}
      >
        <Icon size={14} className="text-white" strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-xs text-white/40 leading-none mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-white leading-none">{value}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 280, damping: 30 } },
};

export default function Dashboard() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>("q1");
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());

  // Paint splot state
  const [splotVisible, setSplotVisible] = useState(false);
  const [splotOrigin, setSplotOrigin] = useState<Point>({ x: 0, y: 0 });
  const [pendingConvertId, setPendingConvertId] = useState<string | null>(null);

  // ── Convert quote → order ──────────────────────────────────────────────────
  const handleConvert = useCallback(
    (e: React.MouseEvent, quoteId: string) => {
      if (splotVisible) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setSplotOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setPendingConvertId(quoteId);
      setSplotVisible(true);
    },
    [splotVisible]
  );

  const handleSplotMidpoint = useCallback(() => {
    if (!pendingConvertId) return;
    const quote = quotes.find((q) => q.id === pendingConvertId);
    if (!quote) return;

    const newOrder: Order = {
      id: `o${uid()}`,
      quoteId: quote.id,
      title: quote.title,
      client: quote.client,
      items: quote.items.map((item) => ({ ...item, id: uid() })),
      total: quote.total,
      status: "processing",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setQuotes((prev) => prev.filter((q) => q.id !== pendingConvertId));
    if (selectedQuoteId === pendingConvertId) setSelectedQuoteId("");
  }, [pendingConvertId, quotes, selectedQuoteId]);

  const handleSplotComplete = useCallback(() => {
    setSplotVisible(false);
    setPendingConvertId(null);
  }, []);

  // ── NL: Add item ───────────────────────────────────────────────────────────
  const handleAddItem = useCallback(
    (product: string, qty: number) => {
      const targetId = selectedQuoteId || quotes[0]?.id;
      if (!targetId) return;

      const newItem: LineItem = {
        id: uid(),
        product,
        qty,
        price: Math.ceil(Math.random() * 40 + 10) * 10, // stub price
      };

      setNewItemIds((prev) => {
        const next = new Set(prev);
        next.add(newItem.id);
        return next;
      });
      setTimeout(() => {
        setNewItemIds((prev) => {
          const next = new Set(prev);
          next.delete(newItem.id);
          return next;
        });
      }, 1800);

      setQuotes((prev) =>
        prev.map((q) => {
          if (q.id !== targetId) return q;
          const items = [...q.items, newItem];
          return { ...q, items, total: calcTotal(items) };
        })
      );
    },
    [selectedQuoteId, quotes]
  );

  // ── NL: New quote ──────────────────────────────────────────────────────────
  const handleNewQuote = useCallback((client: string) => {
    const newQuote: Quote = {
      id: `q${uid()}`,
      title: `New Project`,
      client,
      items: [],
      total: 0,
      status: "draft",
      createdAt: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setQuotes((prev) => [newQuote, ...prev]);
    setSelectedQuoteId(newQuote.id);
  }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalQuoteValue = quotes.reduce((s, q) => s + q.total, 0);
  const totalOrderValue = orders.reduce((s, o) => s + o.total, 0);
  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId);

  return (
    <div className="min-h-screen text-white">
      <MeshBackground />
      <CursorTrail />
      <PaintSplot
        isVisible={splotVisible}
        origin={splotOrigin}
        onMidpoint={handleSplotMidpoint}
        onComplete={handleSplotComplete}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-36">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="pt-8 pb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Logo / Title */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #ec4899 100%)",
                  boxShadow: "0 4px 20px rgba(79,70,229,0.5)",
                }}
              >
                <Layers size={20} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-glow">
                  Quotes & Orders
                </h1>
                <p className="text-xs text-white/40">Biz-Fix · Automation</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              <StatChip
                icon={FileText}
                label="Open Quotes"
                value={String(quotes.length)}
                color="rgba(79,70,229,0.6)"
              />
              <StatChip
                icon={DollarSign}
                label="Quote Pipeline"
                value={fmt(totalQuoteValue)}
                color="rgba(124,58,237,0.6)"
              />
              <StatChip
                icon={ShoppingCart}
                label="Active Orders"
                value={String(orders.length)}
                color="rgba(6,182,212,0.5)"
              />
              <StatChip
                icon={TrendingUp}
                label="Order Revenue"
                value={fmt(totalOrderValue)}
                color="rgba(16,185,129,0.5)"
              />
            </div>
          </div>
        </motion.header>

        {/* ── Two-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Quotes column ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={16} className="text-indigo-400" strokeWidth={2} />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                Quotes
              </h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300 font-medium">
                {quotes.length}
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <AnimatePresence>
                {quotes.map((quote) => (
                  <motion.div
                    key={quote.id}
                    variants={cardVariants}
                    layout
                    exit={{
                      opacity: 0,
                      scale: 0.9,
                      y: -20,
                      transition: { duration: 0.35 },
                    }}
                  >
                    <QuoteCard
                      quote={quote}
                      isSelected={selectedQuoteId === quote.id}
                      onSelect={() => setSelectedQuoteId(quote.id)}
                      onConvert={(e) => handleConvert(e, quote.id)}
                      newItemIds={newItemIds}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Empty state */}
              {quotes.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px dashed rgba(255,255,255,0.12)",
                  }}
                >
                  <FileText
                    size={36}
                    className="text-white/20 mb-3"
                    strokeWidth={1}
                  />
                  <p className="text-white/40 text-sm">No open quotes</p>
                  <p className="text-white/25 text-xs mt-1">
                    Type &quot;New quote for Client&quot; below
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* ── Orders column ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart
                size={16}
                className="text-cyan-400"
                strokeWidth={2}
              />
              <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                Orders
              </h2>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-cyan-500/20 text-cyan-300 font-medium">
                {orders.length}
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              <AnimatePresence>
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    variants={cardVariants}
                    layout
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 28,
                    }}
                  >
                    <OrderCard order={order} />
                  </motion.div>
                ))}
              </AnimatePresence>

              {orders.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px dashed rgba(255,255,255,0.12)",
                  }}
                >
                  <ShoppingCart
                    size={36}
                    className="text-white/20 mb-3"
                    strokeWidth={1}
                  />
                  <p className="text-white/40 text-sm">No orders yet</p>
                  <p className="text-white/25 text-xs mt-1">
                    Convert a quote to create one
                  </p>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── NL Input Bar ── */}
      <NLInputBar
        onAddItem={handleAddItem}
        onNewQuote={handleNewQuote}
        selectedQuoteClient={selectedQuote?.client}
      />
    </div>
  );
}
