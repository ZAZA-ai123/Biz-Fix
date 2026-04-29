import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { runQuoteAgent } from "@/lib/ai/run-quote-agent";
import type { QuoteRequest } from "@/lib/engine/types";
import type { QuoteOverrides } from "@/lib/engine/apply-overrides";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    mode?: "create" | "iterate";
    prompt?: string;
    quoteId?: string;
    overrides?: QuoteOverrides;
    existingRequest?: QuoteRequest | null;
  };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const mode = body.mode === "iterate" ? "iterate" : "create";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return Response.json({ error: '"prompt" is required' }, { status: 400 });

  const quoteId =
    typeof body.quoteId === "string" && body.quoteId.trim() ? body.quoteId.trim() : undefined;
  const overridesProvided = Object.prototype.hasOwnProperty.call(body, "overrides");

  try {
    const result = await runQuoteAgent({
      mode,
      prompt,
      companyId: userId,
      quoteId,
      existingRequest: body.existingRequest ?? null,
      overrides: body.overrides ?? null,
      overridesProvided,
    });

    return Response.json({
      quote: result.quote,
      quoteRequest: result.quoteRequest,
      citations: result.citations,
      meta: result.meta,
      warnings: result.warnings,
    });
  } catch (e) {
    console.error("[api/quote/agent]", e);
    return Response.json(
      { error: "Quote agent failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
