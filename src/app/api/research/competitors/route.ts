import { db } from "@/lib/db";
import { competitors } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const COMPANY_ID = "pedtech-global";

export async function GET() {
  const data = await db.select().from(competitors).where(eq(competitors.companyId, COMPANY_ID));
  return Response.json(data);
}
