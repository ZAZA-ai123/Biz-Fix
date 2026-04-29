import { getRedis } from "./redis";
import { keys } from "./redis-keys";

export type QuotePatch = Partial<{
  clientName: string;
  project: string | null;
  total: number;
  margin: number;
  itemsCount: number;
  notes: string | null;
  expiresAt: string | null;
  status: string;
}>;

export type QuoteRowFull = {
  id: string;
  companyId: string;
  clientName: string;
  project: string | null;
  status: string;
  total: number;
  margin: number;
  itemsCount: number;
  notes: string | null;
  createdAt: string;
  expiresAt: string | null;
  enginePayload: string | null;
  requestPayload: string | null;
  overridesPayload: string | null;
};

function rawToQuoteRow(raw: Record<string, string>): QuoteRowFull {
  return {
    id: raw.id,
    companyId: raw.companyId,
    clientName: raw.clientName ?? "Unknown client",
    project: raw.project || null,
    status: raw.status ?? "draft",
    total: parseFloat(raw.total ?? "0"),
    margin: parseFloat(raw.margin ?? "0"),
    itemsCount: parseInt(raw.itemsCount ?? "0", 10),
    notes: raw.notes || null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    expiresAt: raw.expiresAt || null,
    enginePayload: raw.enginePayload || null,
    requestPayload: raw.requestPayload || null,
    overridesPayload: raw.overridesPayload || null,
  };
}

/** List quotes for a company, newest first (ZRANGE REV by score). */
export async function listQuotesForCompany(companyId: string): Promise<QuoteRowFull[]> {
  const redis = getRedis();
  const quoteIds = await redis.zrange<string[]>(keys.companyQuotes(companyId), 0, -1, {
    rev: true,
  });
  if (!quoteIds.length) return [];

  const pipeline = redis.pipeline();
  for (const id of quoteIds) pipeline.hgetall(keys.quote(id));
  const results = await pipeline.exec<(Record<string, string> | null)[]>();

  return results
    .filter((r): r is Record<string, string> => !!r)
    .map(rawToQuoteRow);
}

/** Get a single quote by id, verifying company ownership. */
export async function getQuoteById(
  quoteId: string,
  companyId: string
): Promise<QuoteRowFull | undefined> {
  const redis = getRedis();
  const raw = await redis.hgetall<Record<string, string>>(keys.quote(quoteId));
  if (!raw || raw.companyId !== companyId) return undefined;
  return rawToQuoteRow(raw);
}

/** Update request/overrides payload blobs on a quote. */
export async function updateQuotePayloads(params: {
  companyId: string;
  quoteId: string;
  requestPayload?: string | null;
  overridesPayload?: string | null;
}): Promise<void> {
  const redis = getRedis();
  const update: Record<string, string> = {};
  if (Object.prototype.hasOwnProperty.call(params, "requestPayload")) {
    update.requestPayload = params.requestPayload ?? "";
  }
  if (Object.prototype.hasOwnProperty.call(params, "overridesPayload")) {
    update.overridesPayload = params.overridesPayload ?? "";
  }
  if (Object.keys(update).length === 0) return;
  await redis.hset(keys.quote(params.quoteId), update);
}

/** Apply a partial field update to a quote. Returns false if ownership fails or nothing to update. */
export async function updateQuotePartial(
  id: string,
  companyId: string,
  patch: QuotePatch
): Promise<boolean> {
  const redis = getRedis();
  const existing = await redis.hget<string>(keys.quote(id), "companyId");
  if (existing !== companyId) return false;

  const update: Record<string, string | number> = {};
  if (patch.clientName !== undefined) update.clientName = patch.clientName;
  if (patch.project !== undefined) update.project = patch.project ?? "";
  if (patch.total !== undefined) update.total = patch.total;
  if (patch.margin !== undefined) update.margin = patch.margin;
  if (patch.itemsCount !== undefined) update.itemsCount = patch.itemsCount;
  if (patch.notes !== undefined) update.notes = patch.notes ?? "";
  if (patch.expiresAt !== undefined) update.expiresAt = patch.expiresAt ?? "";
  if (patch.status !== undefined) update.status = patch.status;

  if (Object.keys(update).length === 0) return false;
  await redis.hset(keys.quote(id), update);
  return true;
}

/** Delete a quote and remove it from the company index. */
export async function deleteQuote(quoteId: string, companyId: string): Promise<void> {
  const redis = getRedis();
  const existing = await redis.hget<string>(keys.quote(quoteId), "companyId");
  if (existing !== companyId) return;
  const pipeline = redis.pipeline();
  pipeline.del(keys.quote(quoteId));
  pipeline.zrem(keys.companyQuotes(companyId), quoteId);
  await pipeline.exec();
}
