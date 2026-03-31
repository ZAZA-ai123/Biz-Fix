import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { products, vendors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const COMPANY_ID = "pedtech-global";

export async function GET() {
  const rows = await db
    .select({
      id: products.id,
      sku: products.sku,
      name: products.name,
      description: products.description,
      category: products.category,
      subcategory: products.subcategory,
      vendorId: products.vendorId,
      vendorName: vendors.name,
      costPrice: products.costPrice,
      sellPrice: products.sellPrice,
      tier: products.tier,
      tags: products.tags,
      suitableFor: products.suitableFor,
      marginFloorPercent: products.marginFloorPercent,
      preferredMarginPercent: products.preferredMarginPercent,
      stockStatus: products.stockStatus,
      leadTimeDays: products.leadTimeDays,
      qualityScore: products.qualityScore,
      qualityNotes: products.qualityNotes,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .leftJoin(vendors, eq(products.vendorId, vendors.id))
    .where(eq(products.companyId, COMPANY_ID));

  // Return a shape compatible with the existing catalog UI (snake_case + vendorName)
  return Response.json(
    rows.map((p) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      description: p.description ?? "",
      category: p.category,
      subcategory: p.subcategory ?? "",
      vendor: p.vendorName ?? "",
      vendorId: p.vendorId,
      cost_price: p.costPrice,
      default_sell_price: p.sellPrice,
      tier: p.tier as "budget" | "standard" | "premium",
      tags: JSON.parse(p.tags) as string[],
      suitable_for: JSON.parse(p.suitableFor) as string[],
      margin_floor_percent: p.marginFloorPercent,
      preferred_margin_percent: p.preferredMarginPercent,
      stock_status: p.stockStatus as "in_stock" | "low_stock" | "out_of_stock" | "made_to_order",
      lead_time_days: p.leadTimeDays,
      quality_score: p.qualityScore,
      quality_notes: p.qualityNotes ?? "",
      notes: p.qualityNotes ?? "",
      alternative_skus: [] as string[],
      createdAt: p.createdAt,
    }))
  );
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const now = new Date().toISOString();
  const id = `p-${Date.now()}`;

  await db.insert(products).values({
    id,
    companyId: COMPANY_ID,
    ...body,
    suitableFor: JSON.stringify(body.suitableFor ?? []),
    tags: JSON.stringify(body.tags ?? []),
    createdAt: now,
    updatedAt: now,
  });

  return Response.json({ id }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body;

  await db
    .update(products)
    .set({
      ...rest,
      suitableFor: JSON.stringify(rest.suitableFor ?? []),
      tags: JSON.stringify(rest.tags ?? []),
      updatedAt: new Date().toISOString(),
    })
    .where(and(eq(products.id, id), eq(products.companyId, COMPANY_ID)));

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await db.delete(products).where(and(eq(products.id, id), eq(products.companyId, COMPANY_ID)));
  return Response.json({ success: true });
}
