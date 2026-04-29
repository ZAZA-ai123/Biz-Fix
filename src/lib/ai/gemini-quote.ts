import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { QuoteRequest } from "@/lib/engine/types";
import type { RetrievedContext } from "@/lib/rag/retrieve-context";
import { formatBusinessContextSections } from "@/lib/ai/context-prompt-formatters";
import type { QuoteOverrides } from "@/lib/engine/apply-overrides";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

export const QuoteRequestSchema = z.object({
  customerName: z.string().min(1).max(120).optional(),
  projectType: z.string().min(1).max(120).optional(),
  positioning: z.enum(["budget", "standard", "premium"]).optional(),
  requestedItems: z
    .array(
      z.object({
        type: z.string().min(1).max(80),
        quantity: z.number().int().min(1).max(10000),
      })
    )
    .min(1),
  marginPercent: z.number().min(0).max(95).optional(),
});

function extractLikelyJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1).trim();
  return text.trim();
}

function formatCatalogForLLM(context: RetrievedContext): string {
  const lines = context.catalog.slice(0, 80).map((p) => {
    const vendor = p.vendor ? ` vendor=${p.vendor}` : "";
    return [
      `sku=${p.sku}`,
      `name=${p.name}`,
      `cat=${p.category}${p.subcategory ? `/${p.subcategory}` : ""}`,
      `tier=${p.tier}`,
      `sell=${p.default_sell_price}`,
      `cost=${p.cost_price}`,
      `stock=${p.stock_status}`,
      `leadDays=${p.lead_time_days}`,
      vendor,
    ]
      .filter(Boolean)
      .join(" | ");
  });
  return lines.join("\n");
}

function formatRagChunksForLLM(context: RetrievedContext): string {
  return context.ragChunks
    .slice(0, 10)
    .map((c) => `- [${c.id}] score=${c.score.toFixed(3)}\n${c.content}`)
    .join("\n\n");
}

function lockedSkuList(overrides: unknown): string[] {
  if (!overrides || typeof overrides !== "object") return [];
  const lo = (overrides as QuoteOverrides).lineOverrides;
  if (!lo) return [];
  return Object.entries(lo)
    .filter(([, v]) => v && typeof v === "object" && (v as { locked?: boolean }).locked === true)
    .map(([sku]) => sku);
}

async function generateQuoteRequestOnce(params: {
  userPrompt: string;
  context: RetrievedContext;
  mode: "create" | "iterate";
  existingRequest?: QuoteRequest | null;
  overrides?: unknown;
}): Promise<string> {
  const businessCtx = formatBusinessContextSections(params.context);
  const locked = lockedSkuList(params.overrides);
  const lockedRules =
    locked.length > 0
      ? [
          "",
          "Locked line items (user pinned these SKUs): " + locked.join(", "),
          "- Preserve the same product categories/quantities intent for these lines unless the user explicitly asks to remove or replace them.",
          "- Do not drop requested item types that correspond to locked SKUs from the prior quote context.",
        ].join("\n")
      : "";

  const prompt = [
    "You are a quoting assistant. Your job is to convert the user's instruction into a strict JSON QuoteRequest.",
    "",
    "Output rules:",
    "- Return ONLY valid JSON (no markdown, no code fences, no prose).",
    "- requestedItems must be non-empty.",
    "- requestedItems.type should be broad product categories the engine can match (e.g. chair, table, cabinet, flooring, lighting).",
    "- If the user asks for a margin, populate marginPercent.",
    "- If not specified, do NOT invent a marginPercent.",
    "",
    "QuoteRequest JSON schema:",
    JSON.stringify(
      {
        customerName: "string?",
        projectType: "string?",
        positioning: "budget|standard|premium?",
        requestedItems: [{ type: "string", quantity: 1 }],
        marginPercent: 30,
      },
      null,
      2
    ),
    "",
    `Mode: ${params.mode}`,
    params.existingRequest
      ? `Existing QuoteRequest (if iterating, preserve intent unless user overrides):\n${JSON.stringify(
          params.existingRequest,
          null,
          2
        )}`
      : "Existing QuoteRequest: null",
    params.overrides
      ? `ManualOverrides (do NOT propose changes that would wipe these unless user explicitly says so):\n${JSON.stringify(
          params.overrides,
          null,
          2
        )}`
      : "ManualOverrides: null",
    lockedRules,
    "",
    "Company context (quotes, sales, research — use for tone, pricing hints, and continuity; still output category-based requestedItems, not raw SKUs):",
    businessCtx || "(none)",
    "",
    "Catalog context (for grounding; you still output categories, not SKUs):",
    formatCatalogForLLM(params.context) || "(none)",
    "",
    "Retrieved docs context (if any):",
    formatRagChunksForLLM(params.context) || "(none)",
    "",
    "User instruction:",
    params.userPrompt,
  ].join("\n");

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function geminiQuoteRequest(params: {
  userPrompt: string;
  context: RetrievedContext;
  mode: "create" | "iterate";
  existingRequest?: QuoteRequest | null;
  overrides?: unknown;
}): Promise<QuoteRequest> {
  const raw1 = await generateQuoteRequestOnce(params);
  const json1 = extractLikelyJson(raw1);
  const parsed1 = QuoteRequestSchema.safeParse(
    (() => {
      try {
        return JSON.parse(json1);
      } catch {
        return null;
      }
    })()
  );
  if (parsed1.success) return parsed1.data;

  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  const repair = await model.generateContent([
    "Fix the following into valid JSON ONLY matching the QuoteRequest schema.",
    "Do not add prose. Do not use markdown.",
    raw1,
  ].join("\n\n"));
  const json2 = extractLikelyJson(repair.response.text());
  const parsed2 = QuoteRequestSchema.safeParse(
    (() => {
      try {
        return JSON.parse(json2);
      } catch {
        return null;
      }
    })()
  );

  if (parsed2.success) return parsed2.data;

  // Last resort: minimal request so the engine can proceed.
  return {
    requestedItems: [{ type: "general", quantity: 1 }],
  };
}

