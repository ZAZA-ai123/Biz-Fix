import { z } from "zod";
import { groqChat } from "@/lib/ai/groq";

export const QuoteIntentSchema = z.enum([
  "quote_create",
  "quote_iterate",
  "quote_export",
  "research",
  "general",
]);

export type QuoteIntent = z.infer<typeof QuoteIntentSchema>;

export const RetrievalCorpusSchema = z.enum([
  "catalog_products",
  "catalog_vendors",
  "past_quotes",
  "sales_history",
  "research_reports",
  "uploaded_docs",
]);

export type RetrievalCorpus = z.infer<typeof RetrievalCorpusSchema>;

export const QuoteEditOpSchema = z.union([
  z.object({
    op: z.literal("set_margin_percent"),
    marginPercent: z.number().min(0).max(95),
  }),
  z.object({
    op: z.literal("set_positioning"),
    positioning: z.enum(["budget", "standard", "premium"]),
  }),
  z.object({
    op: z.literal("set_customer_name"),
    customerName: z.string().min(1).max(120),
  }),
  z.object({
    op: z.literal("set_project_type"),
    projectType: z.string().min(1).max(120),
  }),
  z.object({
    op: z.literal("add_requested_item"),
    type: z.string().min(1).max(80),
    quantity: z.number().int().min(1).max(10000),
  }),
  z.object({
    op: z.literal("remove_requested_item"),
    type: z.string().min(1).max(80),
  }),
  z.object({
    op: z.literal("set_requested_item_quantity"),
    type: z.string().min(1).max(80),
    quantity: z.number().int().min(0).max(10000),
  }),
]);

export type QuoteEditOp = z.infer<typeof QuoteEditOpSchema>;

export const GroqQuotePlanSchema = z.object({
  intent: QuoteIntentSchema,
  query: z.string().min(1),
  retrievalPlan: z.object({
    corpora: z.array(RetrievalCorpusSchema).default([]),
    topK: z.number().int().min(1).max(50).default(8),
  }),
  editPlan: z
    .object({
      ops: z.array(QuoteEditOpSchema).default([]),
    })
    .default({ ops: [] }),
});

export type GroqQuotePlan = z.infer<typeof GroqQuotePlanSchema>;

function extractLikelyJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) return text.slice(first, last + 1).trim();
  return text.trim();
}

async function groqPlanOnce(prompt: string): Promise<string> {
  return groqChat([
    {
      role: "system",
      content: [
        "You are a routing + planning agent for an AI-native quoting system.",
        "Return ONLY valid JSON (no prose) matching this shape:",
        "{",
        '  "intent": "quote_create"|"quote_iterate"|"quote_export"|"research"|"general",',
        '  "query": "refined instruction",',
        '  "retrievalPlan": { "corpora": string[], "topK": number },',
        '  "editPlan": { "ops": Array<...> }',
        "}",
        "",
        "Rules:",
        "- If the user is creating a new quote, intent=quote_create.",
        "- If the user is modifying an existing quote, intent=quote_iterate.",
        "- Include only relevant corpora in retrievalPlan.corpora.",
        "- For quote_iterate, convert the request into concrete editPlan.ops when possible.",
        "- Use these corpora labels ONLY:",
        '  ["catalog_products","catalog_vendors","past_quotes","sales_history","research_reports","uploaded_docs"].',
        "- Use these edit ops ONLY:",
        '  set_margin_percent(marginPercent), set_positioning(positioning), set_customer_name(customerName),',
        '  set_project_type(projectType), add_requested_item(type,quantity), remove_requested_item(type),',
        "  set_requested_item_quantity(type,quantity).",
      ].join("\n"),
    },
    { role: "user", content: prompt },
  ]);
}

export async function groqPlanQuote(prompt: string): Promise<GroqQuotePlan> {
  const first = await groqPlanOnce(prompt);
  const firstJson = extractLikelyJson(first);
  const parsed1 = GroqQuotePlanSchema.safeParse(
    (() => {
      try {
        return JSON.parse(firstJson);
      } catch {
        return null;
      }
    })()
  );
  if (parsed1.success) return parsed1.data;

  const second = await groqChat([
    {
      role: "system",
      content:
        "Fix the user's previous output into valid JSON ONLY. Do not add keys. Do not add prose.",
    },
    { role: "user", content: first },
  ]);
  const secondJson = extractLikelyJson(second);
  const parsed2 = GroqQuotePlanSchema.safeParse(
    (() => {
      try {
        return JSON.parse(secondJson);
      } catch {
        return null;
      }
    })()
  );

  if (parsed2.success) return parsed2.data;
  return {
    intent: "general",
    query: prompt,
    retrievalPlan: { corpora: [], topK: 8 },
    editPlan: { ops: [] },
  };
}

