import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { quotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const COMPANY_ID = "pedtech-global";

export async function GET() {
  const data = await db.select().from(quotes).where(eq(quotes.companyId, COMPANY_ID)).orderBy(quotes.createdAt);
  return Response.json(data);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...rest } = body;

  await db
    .update(quotes)
    .set(rest)
    .where(and(eq(quotes.id, id), eq(quotes.companyId, COMPANY_ID)));

  return Response.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  await db.delete(quotes).where(and(eq(quotes.id, id), eq(quotes.companyId, COMPANY_ID)));
  return Response.json({ success: true });
}
