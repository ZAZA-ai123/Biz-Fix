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

const PROJECT_TAG_BONUS: Record<string, string[]> = {
  school: ["school", "education", "classroom", "student"],
  "science lab": ["lab", "laboratory", "science", "school", "education", "stem"],
  commercial: ["commercial", "office", "retail"],
  office: ["office", "commercial", "workspace"],
  kitchen: ["kitchen", "cabinet", "counter"],
  bathroom: ["bathroom", "bath", "plumb"],
};

function projectTypeScore(product: Product, projectType?: string): number {
  if (!projectType) return 0;
  const pt = projectType.toLowerCase();
  let score = 0;
  if (product.suitable_for.some((sf) => sf.toLowerCase().includes(pt))) score += 8;
  if (product.tags.some((tag) => tag.toLowerCase().includes(pt))) score += 5;
  const bonus = PROJECT_TAG_BONUS[pt];
  if (bonus) {
    const hay = [...product.tags, ...product.suitable_for].map((s) => s.toLowerCase());
    if (bonus.some((b) => hay.some((h) => h.includes(b)))) score += 4;
  }
  return score;
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
