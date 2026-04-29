import { randomUUID } from "crypto";
import type { Product, QuoteRequest, EngineQuote } from "./types";
import { matchProducts } from "./match-products";
import { rankProducts } from "./rank-products";
import { applyRules, buildQuoteItem } from "./apply-rules";
import { attachQuoteDocument } from "./quote-document";

export type BuildQuoteOptions = {
  /** Keep the same quote id when rebuilding (e.g. AI refinement). */
  quoteId?: string;
};

/**
 * Assemble a full quote from a structured QuoteRequest and a product catalog.
 */
export function buildQuote(
  request: QuoteRequest,
  catalog: Product[],
  options?: BuildQuoteOptions
): EngineQuote {
  const assumptions: string[] = [];
  const items = [];

  for (const { type, quantity } of request.requestedItems) {
    const candidates = matchProducts(type, catalog, request);

    if (candidates.length === 0) {
      assumptions.push(`No matching products found for "${type}" — skipped.`);
      continue;
    }

    const ranked = rankProducts(candidates, request);
    let chosen = ranked[0];

    // If best match is out of stock, try to use an alternative from ranked list
    if (chosen.stock_status === "out_of_stock") {
      const fallback = ranked.find((p) => p.stock_status !== "out_of_stock");
      if (fallback) {
        assumptions.push(
          `${chosen.sku} is out of stock — substituted with ${fallback.sku}`
        );
        chosen = fallback;
      } else {
        assumptions.push(`${chosen.sku} is out of stock with no available alternative.`);
      }
    }

    const pricing = applyRules(chosen, quantity, type, request);
    if (pricing.assumption) {
      assumptions.push(pricing.assumption);
    }

    items.push(buildQuoteItem(type, chosen, quantity, pricing));
  }

  const subtotal = parseFloat(
    items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );

  if (request.positioning === "premium") {
    assumptions.push("Premium positioning applied — premium-tier products preferred.");
  }

  if (request.marginPercent !== undefined) {
    assumptions.push(`Target margin of ${request.marginPercent}% applied per line.`);
  }

  if (items.length === 0 && request.requestedItems.length > 0) {
    assumptions.push(
      "No catalog lines were added — adjust wording or expand the catalog for the requested categories."
    );
  }

  const id =
    options?.quoteId ??
    `QT-${new Date().getFullYear()}-${randomUUID().slice(0, 6).toUpperCase()}`;

  return attachQuoteDocument({
    id,
    customerName: request.customerName,
    projectType: request.projectType,
    positioning: request.positioning,
    items,
    subtotal,
    total: subtotal, // taxes / install costs can be layered on top later
    assumptions,
  });
}
