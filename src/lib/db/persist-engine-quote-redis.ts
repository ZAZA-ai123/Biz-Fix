import type { EngineQuote } from "@/lib/engine/types";
import { attachQuoteDocument } from "@/lib/engine/quote-document";
import { getRedis } from "./redis";
import { keys } from "./redis-keys";

export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "declined"
  | "expired";

type PersistQuoteOptions = {
  status?: QuoteStatus;
  notes?: string | null;
  expiresAt?: string | null;
  createdAt?: string;
};

function aggregateMargin(q: EngineQuote): number {
  const costTotal = q.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
  const subtotal = q.subtotal;
  return subtotal > 0
    ? parseFloat((((subtotal - costTotal) / subtotal) * 100).toFixed(2))
    : 0;
}

/** Exported for use in API routes that need to map enginePayload items to a list shape. */
export function quoteItemRowsFromEngine(engineQuote: EngineQuote) {
  return engineQuote.items.map((item, index) => ({
    id: `${engineQuote.id}-line-${String(index + 1).padStart(2, "0")}`,
    quoteId: engineQuote.id,
    productId: item.productId,
    productName: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.sellPrice,
    costPrice: item.costPrice,
    lineTotal: item.lineTotal,
    marginPercent: item.marginPercent,
  }));
}

/**
 * Upsert an EngineQuote snapshot to Redis.
 * Uses HSET + ZADD (score = current timestamp so newest-first ZRANGE works).
 * Preserves status / notes / expiresAt from any existing record.
 */
export async function persistEngineQuote(
  engineQuote: EngineQuote,
  companyId: string,
  options: PersistQuoteOptions = {}
): Promise<void> {
  const redis = getRedis();
  const hydratedQuote = attachQuoteDocument(engineQuote);
  const quoteKey = keys.quote(hydratedQuote.id);

  // Read existing hash to preserve status/notes/expiresAt
  const existing = await redis.hgetall<Record<string, string>>(quoteKey);

  const status = options.status ?? (existing?.status as QuoteStatus | undefined) ?? "draft";
  const notes =
    options.notes !== undefined
      ? (options.notes ?? "")
      : (existing?.notes ?? "");
  const expiresAt =
    options.expiresAt !== undefined
      ? (options.expiresAt ?? "")
      : (existing?.expiresAt ?? "");
  const createdAt =
    options.createdAt ?? existing?.createdAt ?? new Date().toISOString();

  const quoteHash: Record<string, string | number> = {
    id: hydratedQuote.id,
    companyId,
    clientName: hydratedQuote.customerName?.trim() || "Unknown client",
    project: hydratedQuote.projectType ?? "",
    status,
    total: hydratedQuote.total,
    margin: aggregateMargin(hydratedQuote),
    itemsCount: hydratedQuote.items.length,
    notes,
    createdAt,
    expiresAt,
    enginePayload: JSON.stringify(hydratedQuote),
  };

  const pipeline = redis.pipeline();
  pipeline.hset(quoteKey, quoteHash);
  // ZADD with current timestamp as score so newest-first listing works
  pipeline.zadd(keys.companyQuotes(companyId), {
    score: Date.now(),
    member: hydratedQuote.id,
  });
  await pipeline.exec();
}
