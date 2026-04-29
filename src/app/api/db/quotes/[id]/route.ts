import { auth } from "@clerk/nextjs/server";
import type { EngineQuote } from "@/lib/engine/types";
import { attachQuoteDocument } from "@/lib/engine/quote-document";
import { persistEngineQuote, type QuoteStatus, quoteItemRowsFromEngine } from "@/lib/db/persist-engine-quote-redis";
import { getQuoteById, updateQuotePartial, type QuotePatch } from "@/lib/db/quote-redis";

type RouteContext = { params: Promise<{ id: string }> };

const QUOTE_STATUSES = new Set<QuoteStatus>([
  "draft",
  "sent",
  "accepted",
  "declined",
  "expired",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isEngineQuote(value: unknown): value is EngineQuote {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.items) &&
    typeof value.subtotal === "number" &&
    typeof value.total === "number" &&
    Array.isArray(value.assumptions)
  );
}

function parseStatus(value: unknown): QuoteStatus | undefined {
  return typeof value === "string" && QUOTE_STATUSES.has(value as QuoteStatus)
    ? (value as QuoteStatus)
    : undefined;
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const row = await getQuoteById(id, userId);
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });

  let engineQuote: EngineQuote | null = null;
  let quoteItems: ReturnType<typeof quoteItemRowsFromEngine> = [];
  if (row.enginePayload) {
    try {
      const parsed = JSON.parse(row.enginePayload) as EngineQuote;
      engineQuote = attachQuoteDocument(parsed);
      quoteItems = quoteItemRowsFromEngine(engineQuote);
    } catch {
      engineQuote = null;
    }
  }

  let quoteRequest: unknown = null;
  if (row.requestPayload) {
    try {
      quoteRequest = JSON.parse(row.requestPayload);
    } catch {
      quoteRequest = null;
    }
  }

  let overrides: unknown = null;
  if (row.overridesPayload) {
    try {
      overrides = JSON.parse(row.overridesPayload);
    } catch {
      overrides = null;
    }
  }

  return Response.json({
    ...row,
    engineQuote,
    quoteRequest,
    overrides,
    quoteItems,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  let body: Record<string, unknown> | null = null;
  try {
    const json = await request.json();
    body = isObject(json) ? json : null;
  } catch {
    body = null;
  }
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  const quoteCandidate = body.quote ?? body.engineQuote;
  if (isEngineQuote(quoteCandidate)) {
    if (quoteCandidate.id !== id) {
      return Response.json({ error: "Quote id does not match route id" }, { status: 400 });
    }
    await persistEngineQuote(quoteCandidate, userId, {
      status: parseStatus(body.status),
      notes: typeof body.notes === "string" || body.notes === null ? body.notes : undefined,
      expiresAt:
        typeof body.expiresAt === "string" || body.expiresAt === null
          ? body.expiresAt
          : undefined,
    });
    return Response.json({ success: true, id });
  }

  const patch: QuotePatch = {};
  if (typeof body.status === "string" && QUOTE_STATUSES.has(body.status as QuoteStatus)) {
    patch.status = body.status as QuoteStatus;
  }
  if (typeof body.notes === "string" || body.notes === null) patch.notes = body.notes;
  if (typeof body.expiresAt === "string" || body.expiresAt === null)
    patch.expiresAt = body.expiresAt;

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No supported quote fields provided" }, { status: 400 });
  }

  const updated = await updateQuotePartial(id, userId, patch);
  if (!updated) {
    return Response.json({ error: "No supported quote fields provided" }, { status: 400 });
  }

  return Response.json({ success: true, id });
}
