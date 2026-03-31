import type { Product, EngineQuote, QuoteRequest } from "./types";
import { buildQuote } from "./build-quote";
import { matchProducts } from "./match-products";
import { rankProducts } from "./rank-products";
import { applyRules, buildQuoteItem } from "./apply-rules";

type RefinementIntent =
  | { kind: "adjust_margin"; marginPercent: number }
  | { kind: "adjust_positioning"; positioning: "budget" | "standard" | "premium" }
  | { kind: "adjust_total_percent"; delta: number }
  | { kind: "swap_item"; itemType: string }
  | { kind: "unknown" };

function parseRefinement(message: string): RefinementIntent {
  const lower = message.toLowerCase();

  // Margin change: "set margin to 35%" / "30% margin"
  const marginMatch = lower.match(/(\d+(?:\.\d+)?)\s*%\s*margin|margin\s+(?:to|of)\s+(\d+(?:\.\d+)?)/);
  if (marginMatch) {
    const pct = parseFloat(marginMatch[1] ?? marginMatch[2]);
    return { kind: "adjust_margin", marginPercent: pct };
  }

  // Reduce total by X%
  const reduceMatch = lower.match(/reduce\s+(?:total|price|cost)\s+by\s+(\d+(?:\.\d+)?)\s*%/);
  if (reduceMatch) {
    return { kind: "adjust_total_percent", delta: -parseFloat(reduceMatch[1]) };
  }

  // Increase total by X%
  const increaseMatch = lower.match(/increase\s+(?:total|price)\s+by\s+(\d+(?:\.\d+)?)\s*%/);
  if (increaseMatch) {
    return { kind: "adjust_total_percent", delta: parseFloat(increaseMatch[1]) };
  }

  // Tier change
  if (lower.includes("more premium") || lower.includes("upgrade") || lower.includes("higher tier")) {
    return { kind: "adjust_positioning", positioning: "premium" };
  }
  if (lower.includes("budget") || lower.includes("cheaper") || lower.includes("lower cost")) {
    return { kind: "adjust_positioning", positioning: "budget" };
  }

  // Swap: "swap tables" / "replace flooring"
  const swapMatch = lower.match(/(?:swap|replace|change)\s+(\w+)/);
  if (swapMatch) {
    return { kind: "swap_item", itemType: swapMatch[1] };
  }

  return { kind: "unknown" };
}

/**
 * Refine an existing quote given a natural language instruction and the catalog.
 */
export function refineQuote(
  current: EngineQuote,
  message: string,
  catalog: Product[]
): EngineQuote {
  const intent = parseRefinement(message);

  if (intent.kind === "adjust_margin") {
    // Rebuild quote with new margin, preserving item types and quantities
    const request: QuoteRequest = {
      customerName: current.customerName,
      projectType: current.projectType,
      positioning: current.positioning as QuoteRequest["positioning"],
      requestedItems: current.items.map((i) => ({
        type: i.requestedType,
        quantity: i.quantity,
      })),
      marginPercent: intent.marginPercent,
    };
    return buildQuote(request, catalog);
  }

  if (intent.kind === "adjust_positioning") {
    const request: QuoteRequest = {
      customerName: current.customerName,
      projectType: current.projectType,
      positioning: intent.positioning,
      requestedItems: current.items.map((i) => ({
        type: i.requestedType,
        quantity: i.quantity,
      })),
      marginPercent: current.items[0]?.marginPercent,
    };
    return buildQuote(request, catalog);
  }

  if (intent.kind === "adjust_total_percent") {
    // Scale sell prices proportionally — preserves line structure
    const factor = 1 + intent.delta / 100;
    const updatedItems = current.items.map((item) => {
      const newSell = parseFloat((item.sellPrice * factor).toFixed(2));
      const newLineTotal = parseFloat((newSell * item.quantity).toFixed(2));
      const newMargin = parseFloat(
        (((newSell - item.costPrice) / newSell) * 100).toFixed(1)
      );
      return { ...item, sellPrice: newSell, lineTotal: newLineTotal, marginPercent: newMargin };
    });
    const subtotal = parseFloat(
      updatedItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)
    );
    return {
      ...current,
      id: current.id,
      items: updatedItems,
      subtotal,
      total: subtotal,
      assumptions: [
        ...current.assumptions,
        `Total adjusted by ${intent.delta > 0 ? "+" : ""}${intent.delta}%.`,
      ],
    };
  }

  if (intent.kind === "swap_item") {
    const targetType = intent.itemType;
    const itemIndex = current.items.findIndex(
      (i) => i.requestedType.toLowerCase().includes(targetType) ||
              targetType.includes(i.requestedType.toLowerCase())
    );

    if (itemIndex === -1) {
      return {
        ...current,
        assumptions: [
          ...current.assumptions,
          `Could not find item of type "${targetType}" to swap.`,
        ],
      };
    }

    const existing = current.items[itemIndex];
    const request: QuoteRequest = {
      positioning: current.positioning as QuoteRequest["positioning"],
      projectType: current.projectType,
      requestedItems: [],
      marginPercent: existing.marginPercent,
    };
    const candidates = matchProducts(existing.requestedType, catalog, request);
    // Exclude the currently selected product
    const alternatives = candidates.filter((p) => p.id !== existing.productId);
    const ranked = rankProducts(alternatives, request);

    if (ranked.length === 0) {
      return {
        ...current,
        assumptions: [
          ...current.assumptions,
          `No alternative found for "${existing.requestedType}".`,
        ],
      };
    }

    const newProduct = ranked[0];
    const pricing = applyRules(newProduct, existing.quantity, existing.requestedType, request);
    const newItem = buildQuoteItem(existing.requestedType, newProduct, existing.quantity, pricing);
    const updatedItems = [...current.items];
    updatedItems[itemIndex] = newItem;

    const subtotal = parseFloat(
      updatedItems.reduce((s, i) => s + i.lineTotal, 0).toFixed(2)
    );

    return {
      ...current,
      items: updatedItems,
      subtotal,
      total: subtotal,
      assumptions: [
        ...current.assumptions,
        `Swapped ${existing.sku} → ${newProduct.sku} for "${existing.requestedType}".`,
      ],
    };
  }

  // Unknown: return unchanged with a note
  return {
    ...current,
    assumptions: [
      ...current.assumptions,
      `Refinement not understood: "${message}". No changes made.`,
    ],
  };
}
