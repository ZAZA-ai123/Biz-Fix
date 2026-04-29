import type { EngineQuote } from "@/lib/engine/types";
import { attachQuoteDocument } from "@/lib/engine/quote-document";

export type QuoteOverrides = {
  lineOverrides?: Record<
    string,
    Partial<{
      quantity: number;
      sellPrice: number;
      /** When true, iteration keeps this SKU’s product line from the prior snapshot when possible. */
      locked: boolean;
    }>
  >;
};

export function applyOverridesToEngineQuote(quote: EngineQuote, overrides: QuoteOverrides | null): EngineQuote {
  if (!overrides?.lineOverrides || Object.keys(overrides.lineOverrides).length === 0) return quote;

  const nextItems = quote.items.map((item) => {
    const o = overrides.lineOverrides?.[item.sku];
    if (!o) return item;

    const quantity = typeof o.quantity === "number" ? Math.max(0, Math.floor(o.quantity)) : item.quantity;
    const sellPrice = typeof o.sellPrice === "number" ? Math.max(0, o.sellPrice) : item.sellPrice;
    const lineTotal = parseFloat((quantity * sellPrice).toFixed(2));
    const costTotal = item.costPrice * quantity;
    const marginPercent = lineTotal > 0 ? ((lineTotal - costTotal) / lineTotal) * 100 : 0;

    return {
      ...item,
      quantity,
      sellPrice,
      lineTotal,
      marginPercent: parseFloat(marginPercent.toFixed(2)),
    };
  });

  const subtotal = parseFloat(nextItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
  const total = subtotal;

  const assumptions = quote.assumptions.includes("Manual overrides applied.")
    ? quote.assumptions
    : [...quote.assumptions, "Manual overrides applied."];

  return {
    ...quote,
    items: nextItems.filter((i) => i.quantity > 0),
    subtotal,
    total,
    assumptions,
  };
}

function lineFromPrevWithOverrides(
  prev: EngineQuote["items"][number],
  o: NonNullable<QuoteOverrides["lineOverrides"]>[string] | undefined
) {
  const quantity =
    typeof o?.quantity === "number" ? Math.max(0, Math.floor(o.quantity)) : prev.quantity;
  const sellPrice =
    typeof o?.sellPrice === "number" ? Math.max(0, o.sellPrice) : prev.sellPrice;
  const lineTotal = parseFloat((quantity * sellPrice).toFixed(2));
  const costTotal = prev.costPrice * quantity;
  const marginPercent = lineTotal > 0 ? ((lineTotal - costTotal) / lineTotal) * 100 : 0;
  return {
    ...prev,
    quantity,
    sellPrice,
    lineTotal,
    marginPercent: parseFloat(marginPercent.toFixed(2)),
  };
}

/**
 * After a rebuild, restore pinned SKUs from the previous snapshot (replace in place or append if missing).
 */
export function mergeLockedLineItems(
  quote: EngineQuote,
  previous: EngineQuote | null,
  overrides: QuoteOverrides | null
): EngineQuote {
  if (!previous?.items.length || !overrides?.lineOverrides) {
    return quote;
  }

  const lockedSkus = new Set(
    Object.entries(overrides.lineOverrides)
      .filter(([, v]) => v?.locked === true)
      .map(([sku]) => sku)
  );
  if (lockedSkus.size === 0) return quote;

  const prevBySku = new Map(previous.items.map((i) => [i.sku, i]));
  const used = new Set<string>();
  const merged = quote.items.map((item) => {
    if (!lockedSkus.has(item.sku)) return item;
    const prev = prevBySku.get(item.sku);
    if (!prev) return item;
    used.add(item.sku);
    return lineFromPrevWithOverrides(prev, overrides.lineOverrides?.[item.sku]);
  });

  const additions: EngineQuote["items"] = [];
  for (const sku of lockedSkus) {
    if (used.has(sku) || merged.some((i) => i.sku === sku)) continue;
    const prev = prevBySku.get(sku);
    if (!prev) continue;
    additions.push(lineFromPrevWithOverrides(prev, overrides.lineOverrides?.[sku]));
  }

  const items = [...merged, ...additions].filter((i) => i.quantity > 0);
  const subtotal = parseFloat(items.reduce((s, i) => s + i.lineTotal, 0).toFixed(2));
  const total = subtotal;
  const note = "Pinned line items preserved from your last version.";
  const assumptions = quote.assumptions.includes(note)
    ? quote.assumptions
    : [...quote.assumptions, note];

  return attachQuoteDocument({
    ...quote,
    items,
    subtotal,
    total,
    assumptions,
  });
}

