import type { RetrievedContext } from "@/lib/rag/retrieve-context";
import type { SaleRow } from "@/lib/db/company-redis";

const MAX_SECTION_CHARS = 3800;

function clip(s: string, max = MAX_SECTION_CHARS): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}\n…(truncated)`;
}

/** Recent quotes list rows (from listQuotesForCompany). */
export function formatRecentQuotesForLLM(
  recent: RetrievedContext["recentQuotes"],
  maxRows = 18
): string {
  if (!recent.length) return "";
  const lines = recent.slice(0, maxRows).map(
    (q) =>
      `- id=${q.id} client=${q.clientName} project=${q.project ?? "—"} total=${q.total} margin=${q.margin}% items=${q.itemsCount} status=${q.status}`
  );
  return clip(lines.join("\n"));
}

export function formatSalesHistoryForLLM(sales: SaleRow[], maxRows = 35): string {
  if (!sales.length) return "";
  const tail = sales.slice(-maxRows);
  const lines = tail.map(
    (s) =>
      `- ${s.saleDate} ${s.clientName} | ${s.productName}${s.category ? ` (${s.category})` : ""} qty=${s.quantity} total=${s.total} margin=${s.margin}%`
  );
  return clip(lines.join("\n"));
}

export function formatResearchReportsForLLM(reports: RetrievedContext["researchReports"], maxRows = 10): string {
  if (!reports.length) return "";
  const lines: string[] = [];
  for (const r of reports.slice(0, maxRows)) {
    const title = typeof r.title === "string" ? r.title : "";
    const summary = typeof r.summary === "string" ? r.summary.slice(0, 420) : "";
    const q = typeof r.query === "string" ? r.query.slice(0, 120) : "";
    lines.push(`- title=${title}${q ? ` query=${q}` : ""}\n  summary=${summary}`);
  }
  return clip(lines.join("\n\n"));
}

export function formatBusinessContextSections(ctx: RetrievedContext): string {
  const parts: string[] = [];
  const q = formatRecentQuotesForLLM(ctx.recentQuotes);
  if (q) parts.push("Recent quotes (company):\n" + q);
  const s = formatSalesHistoryForLLM(ctx.salesRows);
  if (s) parts.push("Sales history (recent lines):\n" + s);
  const r = formatResearchReportsForLLM(ctx.researchReports);
  if (r) parts.push("Research reports:\n" + r);
  return parts.join("\n\n");
}
