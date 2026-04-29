import type { QuoteRequest } from "./types";

// Keyword maps for extracting item types from natural language
const ITEM_KEYWORDS: Record<string, string[]> = {
  chair: ["chair", "chairs", "seating", "seat", "seats"],
  table: [
    "table",
    "tables",
    "desk",
    "desks",
    "workstation",
    "workstations",
    "teacher station",
    "teacher stations",
  ],
  flooring: ["floor", "floors", "flooring", "hardwood", "vinyl", "lvp", "carpet", "tile"],
  countertop: ["countertop", "countertops", "counter", "counters", "bench", "benches", "worktop"],
  cabinet: ["cabinet", "cabinets", "cabinetry", "cupboard", "storage"],
  paint: ["paint", "paints", "painting", "finish", "finishes"],
  lighting: ["light", "lights", "lighting", "pendant", "pendants", "lamp", "lamps"],
  plumbing: ["plumbing", "fixture", "fixtures", "shower", "tap", "faucet"],
  door: ["door", "doors", "hardware"],
  tile: ["tile", "tiles", "backsplash", "porcelain", "ceramic", "subway"],
};

const POSITIONING_KEYWORDS: Record<"budget" | "standard" | "premium", string[]> = {
  premium: ["premium", "luxury", "high-end", "high end", "top", "best", "designer", "finest"],
  budget: ["budget", "cheap", "affordable", "economy", "low-cost", "cost-effective"],
  standard: ["standard", "mid", "mid-range", "regular", "normal", "typical"],
};

const PROJECT_KEYWORDS: Record<string, string[]> = {
  kitchen: ["kitchen", "kitchens"],
  bathroom: ["bathroom", "bathrooms", "bath", "baths", "toilet", "washroom"],
  office: ["office", "offices", "workplace", "workspace"],
  "science lab": ["science lab", "science labs", "laboratory", "lab"],
  commercial: ["commercial", "store", "retail", "shop", "restaurant", "cafe"],
  residential: ["residential", "home", "house", "apartment", "condo", "flat"],
  hospitality: ["hotel", "hospitality", "motel", "resort", "lodge"],
  school: ["school", "schools", "classroom", "classrooms", "education"],
  renovation: ["renovation", "remodel", "remodeling", "refurb", "refurbishment"],
};

function extractQuantity(text: string, before: string): number {
  // Look for a number immediately before the keyword (e.g. "18 chairs")
  const regex = new RegExp(`(\\d+)\\s+${before}`, "i");
  const match = text.match(regex);
  return match ? parseInt(match[1], 10) : 1;
}

function extractMargin(text: string): number | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%\s*margin/i);
  return match ? parseFloat(match[1]) : undefined;
}

function extractCustomerName(text: string): string | undefined {
  // "quote for Acme Corp for a ..." → stop before second "for a/an/the"
  const bridge = text.match(/(?:quote\s+for|for)\s+(.+?)(?=\s+for\s+(?:a|an|the)\s+)/i);
  if (bridge) {
    const n = bridge[1].trim().replace(/\s+/g, " ");
    if (n.length >= 2) return n;
  }
  const fallback = text.match(/quote\s+for\s+([^,.]+?)(?=,|\.|\s+—|$)/i);
  if (fallback) {
    const n = fallback[1].trim();
    if (n.length >= 2) return n;
  }
  return undefined;
}

function extractProjectType(text: string): string | undefined {
  const lower = text.toLowerCase();
  for (const [type, keywords] of Object.entries(PROJECT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return type;
    }
  }
  return undefined;
}

function extractPositioning(text: string): "budget" | "standard" | "premium" | undefined {
  const lower = text.toLowerCase();
  for (const [tier, keywords] of Object.entries(POSITIONING_KEYWORDS) as Array<["budget" | "standard" | "premium", string[]]>) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return tier;
    }
  }
  return undefined;
}

function extractRequestedItems(text: string): Array<{ type: string; quantity: number }> {
  const lower = text.toLowerCase();
  const found: Array<{ type: string; quantity: number }> = [];

  for (const [itemType, keywords] of Object.entries(ITEM_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        const quantity = extractQuantity(text, kw);
        // Avoid duplicates for the same item type
        if (!found.some((f) => f.type === itemType)) {
          found.push({ type: itemType, quantity });
        }
        break;
      }
    }
  }

  return found;
}

/**
 * Parse a natural language quote request into a structured QuoteRequest.
 * Rule-based for now; can be replaced with an LLM call later.
 */
export function parseRequest(prompt: string): QuoteRequest {
  return {
    customerName: extractCustomerName(prompt),
    projectType: extractProjectType(prompt),
    positioning: extractPositioning(prompt),
    requestedItems: extractRequestedItems(prompt),
    marginPercent: extractMargin(prompt),
  };
}
