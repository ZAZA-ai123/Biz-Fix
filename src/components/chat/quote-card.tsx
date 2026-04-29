"use client";

import { motion } from "framer-motion";
import { ArrowRight, Package, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export type QuoteSummary = {
  id: string;
  clientName: string;
  projectType?: string | null;
  total: number;
  margin: number;
  itemCount: number;
};

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function QuoteCard({ quote }: { quote: QuoteSummary }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="mr-auto w-full max-w-[88%] overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] backdrop-blur-sm sm:max-w-sm"
    >
      {/* Accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF1C6A] to-[#9B04DB]" />

      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Quote generated
          </p>
          <p className="mt-1 truncate text-[15px] font-semibold leading-tight text-white">
            {quote.clientName}
          </p>
          {quote.projectType && (
            <p className="mt-0.5 truncate text-xs capitalize text-white/50">
              {quote.projectType}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mb-3 grid grid-cols-3 gap-1.5">
          <div className="flex flex-col rounded-xl bg-white/[0.06] px-2.5 py-2">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Total</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
              {formatCurrency(quote.total)}
            </p>
          </div>
          <div className="flex flex-col rounded-xl bg-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1">
              <TrendingUp className="size-2.5 text-white/35" aria-hidden />
              <p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Margin</p>
            </div>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-400">
              {quote.margin.toFixed(1)}%
            </p>
          </div>
          <div className="flex flex-col rounded-xl bg-white/[0.06] px-2.5 py-2">
            <div className="flex items-center gap-1">
              <Package className="size-2.5 text-white/35" aria-hidden />
              <p className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Items</p>
            </div>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">
              {quote.itemCount}
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button
          asChild
          size="sm"
          className="w-full rounded-xl gap-1.5 bg-white text-[#9B04DB] hover:bg-white/90 font-semibold text-[13px]"
        >
          <Link href={`/quote-studio?id=${encodeURIComponent(quote.id)}&fresh=1`}>
            Open in Quote Studio
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}
