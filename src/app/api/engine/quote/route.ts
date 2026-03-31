import type { NextRequest } from "next/server";
import { products } from "@/lib/mock-data";
import { parseRequest } from "@/lib/engine/parse-request";
import { buildQuote } from "@/lib/engine/build-quote";
import { refineQuote } from "@/lib/engine/refine-quote";
import type { EngineQuote } from "@/lib/engine/types";

/**
 * POST /api/engine/quote
 *
 * Body (build mode):
 *   { "prompt": "Create a quote for GEMS SRI for a premium science lab..." }
 *
 * Body (refine mode):
 *   { "prompt": "reduce total by 10%", "quote": <EngineQuote> }
 */
export async function POST(request: NextRequest) {
  let body: { prompt?: string; quote?: EngineQuote };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { prompt, quote } = body;

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: '"prompt" is required' }, { status: 400 });
  }

  if (quote) {
    // Refinement mode
    const refined = refineQuote(quote, prompt, products);
    return Response.json({ quote: refined });
  }

  // Build mode
  const parsed = parseRequest(prompt);
  const built = buildQuote(parsed, products);

  return Response.json({ parsed, quote: built });
}
