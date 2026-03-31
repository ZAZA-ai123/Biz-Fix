import type { Product, QuoteRequest, QuoteItem } from "./types";

/**
 * Calculate the sell price for a product given the target margin.
 * margin = (sellPrice - costPrice) / sellPrice
 * → sellPrice = costPrice / (1 - margin)
 */
function sellPriceForMargin(costPrice: number, marginPercent: number): number {
  if (marginPercent >= 100) throw new Error("Margin cannot be 100% or more");
  return costPrice / (1 - marginPercent / 100);
}

/**
 * Effective margin % from actual prices.
 */
function actualMargin(cost: number, sell: number): number {
  return ((sell - cost) / sell) * 100;
}

type PricingResult = {
  costPrice: number;
  sellPrice: number;
  marginPercent: number;
  assumption?: string;
};

export function applyRules(
  product: Product,
  quantity: number,
  requestedType: string,
  context: Pick<QuoteRequest, "marginPercent" | "positioning">
): PricingResult {
  const assumptions: string[] = [];

  // Determine target margin
  let targetMargin = context.marginPercent ?? product.preferred_margin_percent;

  // Cannot go below floor
  if (targetMargin < product.margin_floor_percent) {
    assumptions.push(
      `Margin for ${product.sku} raised to floor (${product.margin_floor_percent}%)`
    );
    targetMargin = product.margin_floor_percent;
  }

  // Premium positioning bump: add 3% if product is already premium and positioning matches
  if (context.positioning === "premium" && product.tier === "premium") {
    targetMargin = Math.min(targetMargin + 3, 70);
  }

  const sellPrice = sellPriceForMargin(product.cost_price, targetMargin);

  return {
    costPrice: product.cost_price,
    sellPrice: parseFloat(sellPrice.toFixed(2)),
    marginPercent: parseFloat(actualMargin(product.cost_price, sellPrice).toFixed(1)),
    assumption: assumptions[0],
  };
}

/**
 * Build a single QuoteItem from a product, quantity, and pricing result.
 */
export function buildQuoteItem(
  requestedType: string,
  product: Product,
  quantity: number,
  pricing: PricingResult
): QuoteItem {
  const lineTotal = parseFloat((pricing.sellPrice * quantity).toFixed(2));
  return {
    requestedType,
    productId: product.id,
    sku: product.sku,
    name: product.name,
    vendor: product.vendor,
    quantity,
    costPrice: pricing.costPrice,
    sellPrice: pricing.sellPrice,
    lineTotal,
    marginPercent: pricing.marginPercent,
    tier: product.tier,
    stockStatus: product.stock_status,
    leadTimeDays: product.lead_time_days,
  };
}
