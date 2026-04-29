import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import {
  DEFAULT_SETTINGS,
  getCompanySettings,
  setCompanySettings,
  type CompanySettings,
} from "@/lib/db/settings-redis";

const generalSchema = z
  .object({
    businessName: z.string().max(200),
    businessEmail: z.union([z.email(), z.literal("")]),
    businessPhone: z.string().max(60),
    businessAddress: z.string().max(500),
  })
  .partial();

const quotesSchema = z
  .object({
    expiryDays: z.number().int().min(1).max(365),
    taxRate: z.number().min(0).max(100),
    paymentTerms: z.enum(["due_on_receipt", "net15", "net30", "net45", "net60"]),
    quotePrefix: z.string().max(20),
    autoNumbering: z.boolean(),
  })
  .partial();

const notificationsSchema = z
  .object({
    accepted: z.boolean(),
    expired: z.boolean(),
    lowStock: z.boolean(),
    vendor: z.boolean(),
    weekly: z.boolean(),
  })
  .partial();

const patchSchema = z
  .object({
    general: generalSchema,
    quotes: quotesSchema,
    notifications: notificationsSchema,
  })
  .partial();

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getCompanySettings(userId);
    return Response.json(settings);
  } catch {
    return Response.json(DEFAULT_SETTINGS);
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid settings payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const partial = parsed.data as Partial<CompanySettings>;
  if (!partial.general && !partial.quotes && !partial.notifications) {
    return Response.json({ error: "Empty payload" }, { status: 400 });
  }

  const updated = await setCompanySettings(userId, partial);
  return Response.json(updated);
}
