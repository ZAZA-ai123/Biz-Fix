import { groqPlanQuote } from "@/lib/ai/groq-planner";
import { retrieveContext } from "@/lib/rag/retrieve-context";
import { geminiQuoteRequest } from "@/lib/ai/gemini-quote";
import { buildQuote } from "@/lib/engine/build-quote";
import type { EngineQuote, QuoteRequest } from "@/lib/engine/types";
import { persistEngineQuote } from "@/lib/db/persist-engine-quote-redis";
import { getQuoteById, updateQuotePayloads } from "@/lib/db/quote-redis";
import {
  applyOverridesToEngineQuote,
  mergeLockedLineItems,
  type QuoteOverrides,
} from "@/lib/engine/apply-overrides";
import { quoteRequestFromEngine } from "@/lib/engine/quote-request-from-engine";
import { products as mockProducts } from "@/lib/mock-data";
import { attachQuoteDocument } from "@/lib/engine/quote-document";
import type { GroqQuotePlan } from "@/lib/ai/groq-planner";

function applyEditOps(base: QuoteRequest, ops: Array<Record<string, unknown>>): QuoteRequest {
  const next: QuoteRequest = JSON.parse(JSON.stringify(base)) as QuoteRequest;

  for (const op of ops) {
    const kind = String(op.op ?? "");
    if (kind === "set_margin_percent" && typeof op.marginPercent === "number") {
      next.marginPercent = op.marginPercent;
      continue;
    }
    if (kind === "set_positioning" && typeof op.positioning === "string") {
      if (op.positioning === "budget" || op.positioning === "standard" || op.positioning === "premium") {
        next.positioning = op.positioning;
      }
      continue;
    }
    if (kind === "set_customer_name" && typeof op.customerName === "string") {
      next.customerName = op.customerName;
      continue;
    }
    if (kind === "set_project_type" && typeof op.projectType === "string") {
      next.projectType = op.projectType;
      continue;
    }
    if (kind === "add_requested_item" && typeof op.type === "string" && typeof op.quantity === "number") {
      next.requestedItems = next.requestedItems ?? [];
      if (!next.requestedItems.some((i) => i.type === op.type)) {
        next.requestedItems.push({ type: op.type, quantity: Math.max(1, Math.floor(op.quantity)) });
      }
      continue;
    }
    if (kind === "remove_requested_item" && typeof op.type === "string") {
      next.requestedItems = (next.requestedItems ?? []).filter((i) => i.type !== op.type);
      continue;
    }
    if (
      kind === "set_requested_item_quantity" &&
      typeof op.type === "string" &&
      typeof op.quantity === "number"
    ) {
      const q = Math.max(0, Math.floor(op.quantity));
      next.requestedItems = next.requestedItems ?? [];
      const existing = next.requestedItems.find((i) => i.type === op.type);
      if (existing) existing.quantity = q;
      if (q === 0) next.requestedItems = next.requestedItems.filter((i) => i.type !== op.type);
      continue;
    }
  }

  next.requestedItems = (next.requestedItems ?? []).filter((i) => i.quantity > 0);
  return next;
}

export type RunQuoteAgentInput = {
  mode: "create" | "iterate";
  prompt: string;
  companyId: string;
  quoteId?: string;
  existingRequest?: QuoteRequest | null;
  overrides?: QuoteOverrides | null;
  /** When false, existing overrides_payload in SQLite is left unchanged. */
  overridesProvided?: boolean;
  /** When the snapshot is not in the DB yet (e.g. legacy /api/engine/quote callers). */
  clientPreviousQuote?: EngineQuote | null;
};

export type RunQuoteAgentOutput = {
  quote: EngineQuote;
  quoteRequest: QuoteRequest;
  citations: Array<{ id: string; score: number }>;
  meta: {
    plan: GroqQuotePlan & { intent: "quote_create" | "quote_iterate" };
    ragChunks: number;
    catalogLines: number;
    usedDemoCatalog: boolean;
  };
  warnings: string[];
};

export async function runQuoteAgent(input: RunQuoteAgentInput): Promise<RunQuoteAgentOutput> {
  const warnings: string[] = [];
  if (!process.env.GEMINI_API_KEY?.trim()) {
    warnings.push("GEMINI_API_KEY is not set — the structuring step may fail.");
  }
  if (!process.env.GROQ_API_KEY?.trim()) {
    warnings.push("GROQ_API_KEY is not set — planning may fall back to a generic plan.");
  }

  let dbRequest: QuoteRequest | null = null;
  let previousEngineQuote: EngineQuote | null = null;

  if (input.quoteId) {
    const row = await getQuoteById(input.quoteId, input.companyId);
    if (row?.requestPayload) {
      try {
        dbRequest = JSON.parse(row.requestPayload) as QuoteRequest;
      } catch {
        dbRequest = null;
      }
    }
    if (input.mode === "iterate" && row?.enginePayload) {
      try {
        previousEngineQuote = attachQuoteDocument(JSON.parse(row.enginePayload) as EngineQuote);
      } catch {
        previousEngineQuote = null;
      }
    }
  }

  if (input.mode === "iterate" && !previousEngineQuote && input.clientPreviousQuote) {
    previousEngineQuote = attachQuoteDocument(input.clientPreviousQuote);
  }

  const baseRequest = input.existingRequest ?? dbRequest;

  const plan = await groqPlanQuote(input.prompt);
  const forcedCorpora = new Set(plan.retrievalPlan.corpora);
  forcedCorpora.add("catalog_products");
  forcedCorpora.add("catalog_vendors");
  if (input.mode === "iterate") forcedCorpora.add("past_quotes");

  const effectivePlan = {
    ...plan,
    intent: input.mode === "iterate" ? ("quote_iterate" as const) : ("quote_create" as const),
    retrievalPlan: { ...plan.retrievalPlan, corpora: Array.from(forcedCorpora) },
  };

  const context = await retrieveContext({
    companyId: input.companyId,
    prompt: input.prompt,
    plan: effectivePlan,
  });

  let usedDemoCatalog = false;
  let catalog = context.catalog;
  if (catalog.length === 0) {
    catalog = mockProducts;
    usedDemoCatalog = true;
    warnings.push("Catalog is empty for the active company — demo products were used for matching.");
  }

  const contextForGemini = { ...context, catalog };

  let requestSeed: QuoteRequest | null | undefined =
    input.mode === "iterate" && baseRequest
      ? applyEditOps(baseRequest, effectivePlan.editPlan.ops)
      : baseRequest;

  if (input.mode === "iterate" && !requestSeed && previousEngineQuote) {
    const seed = quoteRequestFromEngine(previousEngineQuote);
    requestSeed =
      effectivePlan.editPlan.ops.length > 0
        ? applyEditOps(seed, effectivePlan.editPlan.ops)
        : seed;
  }

  const quoteRequest = await geminiQuoteRequest({
    userPrompt: input.prompt,
    context: contextForGemini,
    mode: input.mode,
    existingRequest: requestSeed ?? null,
    overrides: input.overrides ?? null,
  });

  const built = buildQuote(quoteRequest, catalog, {
    quoteId: input.quoteId,
  });
  let engineQuote = applyOverridesToEngineQuote(built, input.overrides ?? null);
  engineQuote = mergeLockedLineItems(engineQuote, previousEngineQuote, input.overrides ?? null);

  await persistEngineQuote(engineQuote, input.companyId);

  const payloadUpdate: Parameters<typeof updateQuotePayloads>[0] = {
    companyId: input.companyId,
    quoteId: engineQuote.id,
    requestPayload: JSON.stringify(quoteRequest),
  };
  if (input.overridesProvided === true) {
    payloadUpdate.overridesPayload = input.overrides ? JSON.stringify(input.overrides) : null;
  }
  await updateQuotePayloads(payloadUpdate);

  return {
    quote: engineQuote,
    quoteRequest,
    citations: context.ragChunks.map((c) => ({ id: c.id, score: c.score })),
    meta: {
      plan: effectivePlan,
      ragChunks: context.ragChunks.length,
      catalogLines: catalog.length,
      usedDemoCatalog,
    },
    warnings,
  };
}
