"use client";

import { Printer, X } from "lucide-react";

export function PrintToolbar() {
  return (
    <div className="print-hide fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-zinc-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-800"
      >
        <Printer className="size-4" aria-hidden />
        Print / Save as PDF
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-100"
        aria-label="Close"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
