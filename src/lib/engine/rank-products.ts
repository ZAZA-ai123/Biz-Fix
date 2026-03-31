import type { Product, QuoteRequest } from "./types";

const STOCK_SCORE: Record<Product["stock_status"], number> = {
  in_stock: 10,
  low_stock: 6,
  made_to_order: 3,
  out_of_stock: 0,
};

const TIER_SCORE: Record<Product["tier"], number> = {
  premium: 3,
  standard: 2,
  budget: 1,
};

function tierMatchScore(product: Product, positioning?: QuoteRequest["positioning"]): number {
  if (!positioning) return 0;
  return product.tier === positioning ? 10 : 0;
}

function projectTypeScore(product: Product, projectType?: string): number {
  if (!projectType) return 0;
  const pt = projectType.toLowerCase();
  return product.suitable_for.some((sf) => sf.toLowerCase().includes(pt)) ? 8 : 0;
}

function leadTimeScore(product: Product): number {
  // Faster delivery → higher score (max 7 days treated as great)
  return Math.max(0, 7 - product.lead_time_days);
}

function scoreProduct(
  product: Product,
  context: Pick<QuoteRequest, "positioning" | "projectType">
): number {
  return (
    STOCK_SCORE[product.stock_status] +
    TIER_SCORE[product.tier] +
    tierMatchScore(product, context.positioning) +
    projectTypeScore(product, context.projectType) +
    leadTimeScore(product)
  );
}

/**
 * Rank candidate products from highest to lowest suitability.
 * Returns the full sorted list; callers pick the first (best) match.
 */
export function rankProducts(
  candidates: Product[],
  context: Pick<QuoteRequest, "positioning" | "projectType">
): Product[] {
  return [...candidates].sort(
    (a, b) => scoreProduct(b, context) - scoreProduct(a, context)
  );
}
