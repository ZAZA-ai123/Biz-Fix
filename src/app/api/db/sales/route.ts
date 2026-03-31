import { db } from "@/lib/db";
import { sales } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const COMPANY_ID = "pedtech-global";

export async function GET() {
  const data = await db.select().from(sales).where(eq(sales.companyId, COMPANY_ID)).orderBy(sales.saleDate);
  return Response.json(data);
}
