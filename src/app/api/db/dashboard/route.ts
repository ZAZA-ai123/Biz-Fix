import { db } from "@/lib/db";
import { products, vendors, quotes, sales } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const COMPANY_ID = "pedtech-global";

export async function GET() {
  const [allProducts, allVendors, allQuotes, allSales] = await Promise.all([
    db.select().from(products).where(eq(products.companyId, COMPANY_ID)),
    db.select().from(vendors).where(eq(vendors.companyId, COMPANY_ID)),
    db.select().from(quotes).where(eq(quotes.companyId, COMPANY_ID)),
    db.select().from(sales).where(eq(sales.companyId, COMPANY_ID)),
  ]);

  const totalRevenue = allSales.reduce((sum, s) => sum + s.total, 0);
  const avgMargin = allSales.length
    ? allSales.reduce((sum, s) => sum + s.margin, 0) / allSales.length
    : 0;

  const acceptedQuotes = allQuotes.filter((q) => q.status === "accepted");
  const sentQuotes = allQuotes.filter((q) => q.status === "sent");
  const activeVendors = allVendors.filter((v) => v.status === "active");

  // Recent quotes (last 6)
  const recentQuotes = [...allQuotes]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  // Revenue by month
  const revenueByMonth: Record<string, number> = {};
  for (const s of allSales) {
    const month = s.saleDate.slice(0, 7);
    revenueByMonth[month] = (revenueByMonth[month] ?? 0) + s.total;
  }

  // Revenue by category
  const revenueByCategory: Record<string, number> = {};
  for (const s of allSales) {
    const cat = s.category ?? "Other";
    revenueByCategory[cat] = (revenueByCategory[cat] ?? 0) + s.total;
  }

  return Response.json({
    stats: {
      totalRevenue,
      avgMargin: Math.round(avgMargin * 10) / 10,
      activeQuotes: sentQuotes.length,
      acceptedThisMonth: acceptedQuotes.length,
      catalogProducts: allProducts.length,
      activeVendors: activeVendors.length,
    },
    recentQuotes,
    revenueByMonth,
    revenueByCategory,
  });
}
