import { auth } from "@clerk/nextjs/server";
import {
  selectProductsWithVendor,
  selectSales,
  selectVendors,
} from "@/lib/db/company-redis";
import { listQuotesForCompany } from "@/lib/db/quote-redis";
import {
  quotes as demoQuotes,
  dashboardStats as demoStats,
  vendors as demoVendors,
} from "@/lib/mock-data";

function mapDemoQuote(q: (typeof demoQuotes)[0]) {
  return {
    id: q.id,
    clientName: q.client,
    project: q.project,
    status: q.status,
    total: q.total,
    margin: q.margin,
    itemsCount: q.items,
    createdAt: q.created,
  };
}

function demoResponse() {
  const recentQuotes = [...demoQuotes]
    .sort((a, b) => b.created.localeCompare(a.created))
    .slice(0, 6)
    .map(mapDemoQuote);

  return {
    stats: {
      totalRevenue: demoStats.totalRevenue,
      avgMargin: demoStats.avgMargin,
      activeQuotes: demoStats.activeQuotes,
      acceptedThisMonth: demoStats.acceptedThisMonth,
      catalogProducts: demoStats.catalogProducts,
      activeVendors: demoVendors.filter((v) => v.status === "active").length,
    },
    recentQuotes,
    revenueByMonth: { "2026-03": 84200, "2026-02": 61250 },
    revenueByCategory: {
      Flooring: 52000,
      Cabinetry: 38000,
      Lighting: 22000,
      Tile: 18500,
      Other: 12000,
    },
  };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const [allProducts, allVendors, allQuotes, allSales] = await Promise.all([
      selectProductsWithVendor(userId),
      selectVendors(userId),
      listQuotesForCompany(userId),
      selectSales(userId),
    ]);

    const dbEmpty =
      allProducts.length === 0 && allQuotes.length === 0 && allSales.length === 0;
    if (dbEmpty) {
      return Response.json(demoResponse());
    }

    const totalRevenue = allSales.reduce((sum, s) => sum + s.total, 0);
    const avgMargin = allSales.length
      ? allSales.reduce((sum, s) => sum + s.margin, 0) / allSales.length
      : 0;

    const acceptedQuotes = allQuotes.filter((q) => q.status === "accepted");
    const sentQuotes = allQuotes.filter((q) => q.status === "sent");
    const activeVendors = allVendors.filter((v) => v.status === "active");

    const recentQuotes = [...allQuotes]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    const revenueByMonth: Record<string, number> = {};
    for (const s of allSales) {
      const month = s.saleDate.slice(0, 7);
      revenueByMonth[month] = (revenueByMonth[month] ?? 0) + s.total;
    }

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
  } catch {
    return Response.json(demoResponse());
  }
}
