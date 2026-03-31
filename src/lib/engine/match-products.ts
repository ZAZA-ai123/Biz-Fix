import type { Product, QuoteRequest } from "./types";

// Maps engine item type tokens → catalog categories / tags / subcategories
const ITEM_TO_CATEGORY: Record<string, string[]> = {
  chair: ["furniture", "seating", "chair"],
  table: ["furniture", "table", "desk"],
  flooring: ["Flooring"],
  countertop: ["Countertops"],
  cabinet: ["Cabinetry"],
  paint: ["Paint & Finishes"],
  lighting: ["Lighting"],
  plumbing: ["Plumbing"],
  door: ["Doors & Hardware"],
  tile: ["Tile"],
};

function normalize(s: string) {
  return s.toLowerCase();
}

function productMatchesType(product: Product, itemType: string): boolean {
  const targets = (ITEM_TO_CATEGORY[itemType] ?? [itemType]).map(normalize);
  const searchable = [
    product.category,
    product.subcategory,
    ...product.tags,
    ...product.suitable_for,
    product.name,
    product.description,
  ]
    .filter(Boolean)
    .map(normalize);

  return targets.some((t) => searchable.some((s) => s.includes(t)));
}

function productMatchesProjectType(product: Product, projectType?: string): boolean {
  if (!projectType) return true;
  const pt = normalize(projectType);
  return (
    product.suitable_for.some((sf) => normalize(sf).includes(pt)) ||
    product.tags.some((tag) => normalize(tag).includes(pt)) ||
    normalize(product.description).includes(pt)
  );
}

/**
 * Returns candidate products from the catalog for a given requested item type
 * and quote context. Does NOT rank — that's rank-products.ts.
 */
export function matchProducts(
  itemType: string,
  catalog: Product[],
  context: Pick<QuoteRequest, "projectType" | "positioning">
): Product[] {
  return catalog.filter((product) => {
    if (!productMatchesType(product, itemType)) return false;
    // Filter out definitively wrong tiers only when user is explicit
    if (context.positioning === "budget" && product.tier === "premium") return false;
    if (context.positioning === "premium" && product.tier === "budget") return false;
    return true;
  });
}
