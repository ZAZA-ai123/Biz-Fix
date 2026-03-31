import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vendors } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const COMPANY_ID = "pedtech-global";

export async function GET() {
  const data = await db.select().from(vendors).where(eq(vendors.companyId, COMPANY_ID));
  return Response.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const id = `v-${Date.now()}`;

  await db.insert(vendors).values({
    id,
    companyId: COMPANY_ID,
    ...body,
    createdAt: new Date().toISOString(),
  });

  return Response.json({ id }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body;

  await db
    .update(vendors)
    .set(rest)
    .where(and(eq(vendors.id, id), eq(vendors.companyId, COMPANY_ID)));

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await db.delete(vendors).where(and(eq(vendors.id, id), eq(vendors.companyId, COMPANY_ID)));
  return Response.json({ success: true });
}
