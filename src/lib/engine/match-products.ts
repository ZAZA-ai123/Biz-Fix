import type { Product, QuoteRequest } from "./types";

/** Maps parse-request item tokens → strings we match in catalog fields */
const ITEM_TO_CATEGORY: Record<string, string[]> = {
  chair: ["chair", "seating", "stool", "task chair", "student chair"],
  table: [
    "table",
    "desk",
    "workstation",
    "lab table",
    "teacher station",
    "instructor",
  ],
  flooring: ["floor", "flooring", "hardwood", "vinyl", "lvp", "carpet", "carpet tile"],
  countertop: ["countertop", "counter", "worktop", "bench", "quartz", "granite"],
  cabinet: ["cabinet", "cabinetry", "cupboard", "storage", "locker", "wardrobe"],
  paint: ["paint", "finishes", "primer", "voc"],
  lighting: ["light", "lighting", "pendant", "lamp", "led", "fixture"],
  plumbing: ["plumbing", "fixture", "shower", "faucet", "valve"],
  door: ["door", "hardware", "pre-hung", "panel"],
  tile: ["tile", "backsplash", "porcelain", "ceramic", "subway"],
  lms: ["LMS", "learning management"],
  display: ["Interactive Display", "display", "smartboard"],
  tablet: ["Student Device", "tablet", "device", "chromebook"],
  device: ["Student Device", "tablet", "device", "laptop"],
  vr: ["VR/AR", "virtual reality", "augmented reality"],
  ar: ["VR/AR", "augmented reality"],
  analytics: ["Analytics", "data", "dashboard"],
  assessment: ["Assessment", "testing", "exam"],
  stem: ["STEM Kit", "stem", "science", "robotics"],
  security: ["Security", "access control", "surveillance"],
};

/** Project labels from parse-request → hints we accept on products */
const PROJECT_HINTS: Record<string, string[]> = {
  kitchen: ["kitchen", "residential", "commercial"],
  bathroom: ["bathroom", "residential", "commercial", "kitchen"],
  office: ["office", "commercial", "workspace", "education"],
  "science lab": [
    "lab",
    "laboratory",
    "science",
    "school",
    "education",
    "classroom",
    "commercial",
    "office",
  ],
  commercial: ["commercial", "retail", "office", "hospitality"],
  residential: ["residential", "home", "kitchen", "bathroom"],
  hospitality: ["hospitality", "hotel", "commercial"],
  school: ["school", "education", "classroom", "commercial", "office"],
  renovation: ["residential", "commercial", "renovation"],
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
  const hints = PROJECT_HINTS[pt] ?? [pt];
  const searchable = [
    ...product.suitable_for,
    ...product.tags,
    product.category,
    product.subcategory,
    product.name,
    product.description,
  ]
    .filter(Boolean)
    .map(normalize);

  return hints.some((h) => searchable.some((s) => s.includes(h)));
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
    if (!productMatchesProjectType(product, context.projectType)) return false;
    // Filter out definitively wrong tiers only when user is explicit
    if (context.positioning === "budget" && product.tier === "premium") return false;
    if (context.positioning === "premium" && product.tier === "budget") return false;
    return true;
  });
}
