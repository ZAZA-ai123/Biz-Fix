import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { EngineQuote } from "@/lib/engine/types";
import { persistEngineQuote, type QuoteStatus } from "@/lib/db/persist-engine-quote-redis";
import {
  listQuotesForCompany,
  updateQuotePartial,
  updateQuotePayloads,
  deleteQuote,
  type QuotePatch,
} from "@/lib/db/quote-redis";

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

async function readBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return isObject(body) ? body : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const data = await listQuotesForCompany(userId);
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readBody(request);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  const quoteCandidate = body.quote ?? body.engineQuote;
  if (!isEngineQuote(quoteCandidate)) {
    return Response.json({ error: '"quote" must be a valid quote payload' }, { status: 400 });
  }

  try {
    await persistEngineQuote(quoteCandidate, userId, {
      status: parseStatus(body.status),
      notes: typeof body.notes === "string" || body.notes === null ? body.notes : undefined,
      expiresAt:
        typeof body.expiresAt === "string" || body.expiresAt === null
          ? body.expiresAt
          : undefined,
    });
    if (
      Object.prototype.hasOwnProperty.call(body, "quoteRequest") ||
      Object.prototype.hasOwnProperty.call(body, "overrides")
    ) {
      await updateQuotePayloads({
        companyId: userId,
        quoteId: quoteCandidate.id,
        requestPayload: Object.prototype.hasOwnProperty.call(body, "quoteRequest")
          ? JSON.stringify(body.quoteRequest ?? null)
          : undefined,
        overridesPayload: Object.prototype.hasOwnProperty.call(body, "overrides")
          ? JSON.stringify(body.overrides ?? null)
          : undefined,
      });
    }
  } catch (e) {
    console.error("[api/db/quotes] POST persistEngineQuote", e);
    return Response.json({ error: "Failed to save quote", detail: String(e) }, { status: 500 });
  }

  return Response.json({ success: true, id: quoteCandidate.id }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await readBody(request);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  const quoteCandidate = body.quote ?? body.engineQuote;
  if (isEngineQuote(quoteCandidate)) {
    try {
      await persistEngineQuote(quoteCandidate, userId, {
        status: parseStatus(body.status),
        notes: typeof body.notes === "string" || body.notes === null ? body.notes : undefined,
        expiresAt:
          typeof body.expiresAt === "string" || body.expiresAt === null
            ? body.expiresAt
            : undefined,
      });
      if (
        Object.prototype.hasOwnProperty.call(body, "quoteRequest") ||
        Object.prototype.hasOwnProperty.call(body, "overrides")
      ) {
        await updateQuotePayloads({
          companyId: userId,
          quoteId: quoteCandidate.id,
          requestPayload: Object.prototype.hasOwnProperty.call(body, "quoteRequest")
            ? JSON.stringify(body.quoteRequest ?? null)
            : undefined,
          overridesPayload: Object.prototype.hasOwnProperty.call(body, "overrides")
            ? JSON.stringify(body.overrides ?? null)
            : undefined,
        });
      }
    } catch (e) {
      console.error("[api/db/quotes] PUT persistEngineQuote", e);
      return Response.json({ error: "Failed to save quote", detail: String(e) }, { status: 500 });
    }
    return Response.json({ success: true, id: quoteCandidate.id });
  }

  const id = typeof body.id === "string" ? body.id : null;
  if (!id) return Response.json({ error: '"id" is required' }, { status: 400 });

  const patch: QuotePatch = {};
  if (typeof body.clientName === "string") patch.clientName = body.clientName;
  if (typeof body.project === "string" || body.project === null) patch.project = body.project;
  if (typeof body.total === "number") patch.total = body.total;
  if (typeof body.margin === "number") patch.margin = body.margin;
  if (typeof body.itemsCount === "number") patch.itemsCount = body.itemsCount;
  if (typeof body.notes === "string" || body.notes === null) patch.notes = body.notes;
  if (typeof body.expiresAt === "string" || body.expiresAt === null)
    patch.expiresAt = body.expiresAt;
  const status = parseStatus(body.status);
  if (status) patch.status = status;

  if (Object.keys(patch).length === 0) {
    return Response.json({ error: "No supported quote fields provided" }, { status: 400 });
  }

  const updated = await updateQuotePartial(id, userId, patch);
  if (!updated) {
    return Response.json({ error: "No supported quote fields provided" }, { status: 400 });
  }

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await deleteQuote(id, userId);
  return Response.json({ success: true });
}
