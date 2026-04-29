import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runQuoteAgent } from "@/lib/ai/run-quote-agent";
import { quoteRequestFromEngine } from "@/lib/engine/quote-request-from-engine";
import type { EngineQuote } from "@/lib/engine/types";

function isEngineQuote(value: unknown): value is EngineQuote {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as EngineQuote).id === "string" &&
    Array.isArray((value as EngineQuote).items) &&
    typeof (value as EngineQuote).subtotal === "number" &&
    typeof (value as EngineQuote).total === "number" &&
    Array.isArray((value as EngineQuote).assumptions)
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

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

  try {
    if (quote) {
      if (!isEngineQuote(quote)) {
        return Response.json({ error: '"quote" must be a valid quote payload' }, { status: 400 });
      }
      const result = await runQuoteAgent({
        mode: "iterate",
        prompt,
        companyId: userId,
        quoteId: quote.id,
        existingRequest: quoteRequestFromEngine(quote),
        overrides: null,
        clientPreviousQuote: quote,
      });
      return Response.json({
        quote: result.quote,
        quoteRequest: result.quoteRequest,
        parsed: result.quoteRequest,
        citations: result.citations,
        meta: { ...result.meta, warnings: result.warnings, pipeline: "agent" as const, persisted: true },
      });
    }

    const result = await runQuoteAgent({ mode: "create", prompt, companyId: userId });
    return Response.json({
      quote: result.quote,
      quoteRequest: result.quoteRequest,
      parsed: result.quoteRequest,
      citations: result.citations,
      meta: { ...result.meta, warnings: result.warnings, pipeline: "agent" as const, persisted: true },
    });
  } catch (e) {
    console.error("[api/engine/quote]", e);
    return Response.json(
      {
        error: "Quote generation failed",
        detail: e instanceof Error ? e.message : String(e),
        meta: { persisted: false, warnings: ["Request failed before save."] },
      },
      { status: 500 }
    );
  }
}
