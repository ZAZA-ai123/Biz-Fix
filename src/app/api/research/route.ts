import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products, researchReports, competitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { groqRoute } from "@/lib/ai/groq";
import { geminiStructuredReport } from "@/lib/ai/gemini";
import { tavilySearch, formatTavilyForLLM } from "@/lib/ai/tavily";
import { fetchEdTechNews, formatNewsForLLM } from "@/lib/ai/newsapi";

const COMPANY_ID = "pedtech-global";

/**
 * POST /api/research
 * Body: { query: string }
 *
 * Orchestration:
 * 1. Groq routes + classifies the query
 * 2. Tavily does deep web research
 * 3. NewsAPI fetches recent signals
 * 4. Gemini synthesizes everything into a structured report
 * 5. Report saved to DB + returned
 */
export async function POST(request: NextRequest) {
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query } = body;
  if (!query?.trim()) {
    return Response.json({ error: '"query" is required' }, { status: 400 });
  }

  // Step 1: Route with Groq
  const routed = await groqRoute(query);

  // Step 2: Parallel research — Tavily + NewsAPI
  const tavilyQuery = routed.company
    ? `${routed.company} EdTech ${routed.intent.replace("_", " ")}`
    : `${routed.query} EdTech`;

  const newsQuery = routed.company
    ? `${routed.company} education technology`
    : `EdTech ${routed.query}`;

  const [tavilyData, newsData] = await Promise.all([
    tavilySearch(tavilyQuery, 6).catch(() => ({ results: [], answer: undefined })),
    fetchEdTechNews(newsQuery, 5).catch(() => ({ articles: [], totalResults: 0 })),
  ]);

  // Step 3: Build catalog context for Gemini
  const catalogProducts = await db
    .select({ name: products.name, category: products.category, sellPrice: products.sellPrice, tier: products.tier })
    .from(products)
    .where(eq(products.companyId, COMPANY_ID));

  const catalogContext = catalogProducts
    .map((p) => `${p.name} (${p.category}, ${p.tier}, $${p.sellPrice})`)
    .join("\n");

  const researchData = [
    "=== WEB RESEARCH (Tavily) ===",
    formatTavilyForLLM(tavilyData),
    "\n=== RECENT NEWS (NewsAPI) ===",
    formatNewsForLLM(newsData.articles),
  ].join("\n");

  // Step 4: Gemini synthesizes
  const report = await geminiStructuredReport({
    type: routed.intent,
    query: routed.query,
    researchData,
    catalogContext,
  });

  // Step 5: Collect sources
  const sources = [
    ...tavilyData.results.map((r) => ({ title: r.title, url: r.url })),
    ...newsData.articles.map((a) => ({ title: a.title, url: a.url })),
  ];

  // Step 6: Save to DB
  const reportId = `rpt-${Date.now()}`;
  await db.insert(researchReports).values({
    id: reportId,
    companyId: COMPANY_ID,
    type: routed.intent,
    query: routed.query,
    title: report.title,
    summary: report.summary,
    content: report.content,
    sources: JSON.stringify(sources),
    createdAt: new Date().toISOString(),
  });

  return Response.json({
    id: reportId,
    intent: routed.intent,
    title: report.title,
    summary: report.summary,
    content: report.content,
    sources,
  });
}

/**
 * GET /api/research
 * Returns saved research reports
 */
export async function GET() {
  const reports = await db
    .select()
    .from(researchReports)
    .where(eq(researchReports.companyId, COMPANY_ID))
    .orderBy(researchReports.createdAt);

  return Response.json(
    reports.map((r) => ({
      ...r,
      sources: JSON.parse(r.sources),
    }))
  );
}
