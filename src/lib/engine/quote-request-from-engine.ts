import type { EngineQuote, QuoteRequest } from "@/lib/engine/types";

/** Reconstruct a QuoteRequest from a saved engine snapshot when request_payload is missing. */
export function quoteRequestFromEngine(q: EngineQuote): QuoteRequest {
  const pos = q.positioning;
  const positioning =
    pos === "budget" || pos === "standard" || pos === "premium" ? pos : undefined;

  return {
    customerName: q.customerName,
    projectType: q.projectType,
    positioning,
    requestedItems: q.items.map((i) => ({
      type: i.requestedType,
      quantity: Math.max(1, Math.floor(i.quantity)),
    })),
    marginPercent: q.items[0]?.marginPercent,
  };
}
