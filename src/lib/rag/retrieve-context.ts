import { geminiEmbedText } from "@/lib/ai/gemini-embed";
import { getVectorStore } from "@/lib/rag";
import type { GroqQuotePlan, RetrievalCorpus } from "@/lib/ai/groq-planner";
import {
  selectProductsWithVendor,
  selectResearchReports,
  selectSales,
} from "@/lib/db/company-redis";
import { listQuotesForCompany } from "@/lib/db/quote-redis";
import { selectRagChunksByIds } from "@/lib/db/rag-redis";
import type { Product } from "@/lib/engine/types";
import type { QuoteRowFull } from "@/lib/db/quote-redis";

export type RetrievedRagChunk = {
  id: string;
  score: number;
  content: string;
  metadata?: Record<string, unknown>;
};

export type RetrievedContext = {
  ragChunks: RetrievedRagChunk[];
  catalog: Product[];
  catalogSource: "database" | "empty";
  recentQuotes: QuoteRowFull[];
  salesRows: Awaited<ReturnType<typeof selectSales>>;
  researchReports: Array<Record<string, unknown>>;
};

function hasCorpus(plan: GroqQuotePlan, corpus: RetrievalCorpus): boolean {
  return plan.retrievalPlan.corpora.includes(corpus);
}

export async function retrieveContext(params: {
  companyId: string;
  prompt: string;
  plan: GroqQuotePlan;
}): Promise<RetrievedContext> {
  const { companyId, prompt, plan } = params;

  const [ragChunks, catalogRaw, recentQuotes, salesRows, researchReports] =
    await Promise.all([
      (async () => {
        if (!hasCorpus(plan, "uploaded_docs")) return [] as RetrievedRagChunk[];
        const embedding = await geminiEmbedText(prompt);
        const store = getVectorStore();
        const results = await store.query({
          namespace: companyId,
          embedding,
          topK: plan.retrievalPlan.topK,
          filter: { companyId },
        });
        const ids = results.map((r) => r.id);
        const rows = await selectRagChunksByIds(companyId, ids);
        const contentById = new Map<string, string>();
        for (const row of rows) {
          const id = String(row.id);
          contentById.set(id, String(row.content ?? ""));
        }
        return results
          .map((r) => ({
            id: r.id,
            score: r.score,
            content: contentById.get(r.id) ?? "",
            metadata: r.metadata as Record<string, unknown> | undefined,
          }))
          .filter((c) => c.content.trim().length > 0);
      })(),
      (async () => {
        if (!hasCorpus(plan, "catalog_products") && !hasCorpus(plan, "catalog_vendors"))
          return [];
        return await selectProductsWithVendor(companyId);
      })(),
      (async () => {
        if (!hasCorpus(plan, "past_quotes")) return [];
        const quotes = await listQuotesForCompany(companyId);
        return quotes.slice(0, 25);
      })(),
      (async () => {
        if (!hasCorpus(plan, "sales_history")) return [];
        const sales = await selectSales(companyId);
        return sales.slice(-200);
      })(),
      (async () => {
        if (!hasCorpus(plan, "research_reports")) return [];
        const reports = await selectResearchReports(companyId);
        return reports.slice(0, 20);
      })(),
    ]);

  const catalog: Product[] = (catalogRaw ?? []).map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    description: p.description ?? "",
    category: p.category,
    subcategory: p.subcategory ?? "",
    vendor: p.vendorName ?? "",
    cost_price: p.costPrice,
    default_sell_price: p.sellPrice,
    tier: p.tier as Product["tier"],
    suitable_for: (() => {
      try {
        return JSON.parse(p.suitableFor) as string[];
      } catch {
        return [];
      }
    })(),
    tags: (() => {
      try {
        return JSON.parse(p.tags) as string[];
      } catch {
        return [];
      }
    })(),
    margin_floor_percent: p.marginFloorPercent,
    preferred_margin_percent: p.preferredMarginPercent,
    stock_status: p.stockStatus as Product["stock_status"],
    lead_time_days: p.leadTimeDays,
    alternative_skus: [],
    notes: p.qualityNotes ?? "",
  }));

  return {
    ragChunks,
    catalog,
    catalogSource: catalog.length > 0 ? "database" : "empty",
    recentQuotes,
    salesRows,
    researchReports,
  };
}
