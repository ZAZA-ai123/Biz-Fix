import { getRedis } from "./redis";
import { keys } from "./redis-keys";

export type ProductWithVendorRow = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  vendorId: string | null;
  vendorName: string | null;
  costPrice: number;
  sellPrice: number;
  tier: string;
  tags: string;
  suitableFor: string;
  marginFloorPercent: number;
  preferredMarginPercent: number;
  stockStatus: string;
  leadTimeDays: number;
  qualityScore: number | null;
  qualityNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VendorRow = {
  id: string;
  companyId: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  category: string;
  rating: number;
  status: string;
  paymentTerms: string | null;
  deliveryPerformance: number | null;
  totalOrders: number;
  activeProducts: number;
  notes: string | null;
  createdAt: string;
};

export type SaleRow = {
  id: string;
  companyId: string;
  quoteId: string | null;
  clientName: string;
  productId: string | null;
  productName: string;
  category: string | null;
  quantity: number;
  unitPrice: number;
  total: number;
  costTotal: number;
  margin: number;
  status: string;
  saleDate: string;
  createdAt: string;
};

function rawToVendorRow(raw: Record<string, string>, vendorId: string): VendorRow {
  return {
    id: raw.id ?? vendorId,
    companyId: raw.companyId ?? "",
    name: raw.name ?? "",
    contactName: raw.contactName || null,
    email: raw.email || null,
    phone: raw.phone || null,
    category: raw.category ?? "Other",
    rating: parseFloat(raw.rating ?? "0"),
    status: raw.status ?? "active",
    paymentTerms: raw.paymentTerms || null,
    deliveryPerformance: raw.deliveryPerformance ? parseFloat(raw.deliveryPerformance) : null,
    totalOrders: parseInt(raw.totalOrders ?? "0", 10),
    activeProducts: parseInt(raw.activeProducts ?? "0", 10),
    notes: raw.notes || null,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

/** Products list with vendor name joined from vendor hash. */
export async function selectProductsWithVendor(companyId: string): Promise<ProductWithVendorRow[]> {
  const redis = getRedis();
  const productIds = await redis.zrange<string[]>(keys.companyProducts(companyId), 0, -1);
  if (!productIds.length) return [];

  const prodPipeline = redis.pipeline();
  for (const id of productIds) prodPipeline.hgetall(keys.product(id));
  const productRaws = await prodPipeline.exec<(Record<string, string> | null)[]>();

  const validProducts = productRaws
    .map((raw, i) => ({ raw, id: productIds[i] }))
    .filter((p): p is { raw: Record<string, string>; id: string } => !!p.raw);

  // Deduplicate vendor IDs for batch fetch
  const vendorIds = [...new Set(validProducts.map((p) => p.raw.vendorId).filter(Boolean) as string[])];
  const vendorMap = new Map<string, string>();

  if (vendorIds.length > 0) {
    const vendorPipeline = redis.pipeline();
    for (const vid of vendorIds) vendorPipeline.hget(keys.vendor(vid), "name");
    const vendorNames = await vendorPipeline.exec<(string | null)[]>();
    vendorIds.forEach((vid, i) => {
      if (vendorNames[i]) vendorMap.set(vid, vendorNames[i]!);
    });
  }

  return validProducts.map(({ raw, id }) => ({
    id: raw.id ?? id,
    sku: raw.sku ?? "",
    name: raw.name ?? "",
    description: raw.description || null,
    category: raw.category ?? "",
    subcategory: raw.subcategory || null,
    vendorId: raw.vendorId || null,
    vendorName: raw.vendorId ? (vendorMap.get(raw.vendorId) ?? null) : null,
    costPrice: parseFloat(raw.costPrice ?? "0"),
    sellPrice: parseFloat(raw.sellPrice ?? "0"),
    tier: raw.tier ?? "standard",
    tags: raw.tags ?? "[]",
    suitableFor: raw.suitableFor ?? "[]",
    marginFloorPercent: parseFloat(raw.marginFloorPercent ?? "15"),
    preferredMarginPercent: parseFloat(raw.preferredMarginPercent ?? "30"),
    stockStatus: raw.stockStatus ?? "in_stock",
    leadTimeDays: parseInt(raw.leadTimeDays ?? "7", 10),
    qualityScore: raw.qualityScore != null ? parseFloat(raw.qualityScore) : null,
    qualityNotes: raw.qualityNotes || null,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  }));
}

/** All vendors for a company. */
export async function selectVendors(companyId: string): Promise<VendorRow[]> {
  const redis = getRedis();
  const vendorIds = await redis.zrange<string[]>(keys.companyVendors(companyId), 0, -1);
  if (!vendorIds.length) return [];

  const pipeline = redis.pipeline();
  for (const id of vendorIds) pipeline.hgetall(keys.vendor(id));
  const raws = await pipeline.exec<(Record<string, string> | null)[]>();

  return raws
    .map((raw, i) => ({ raw, id: vendorIds[i] }))
    .filter((v): v is { raw: Record<string, string>; id: string } => !!v.raw)
    .map(({ raw, id }) => rawToVendorRow(raw, id));
}

/** Insert a product. */
export async function insertProductRow(
  companyId: string,
  id: string,
  body: Record<string, unknown>
): Promise<void> {
  const redis = getRedis();
  const now = new Date().toISOString();
  const hash: Record<string, string | number> = {
    id,
    companyId,
    vendorId: String(body.vendorId ?? ""),
    sku: String(body.sku ?? ""),
    name: String(body.name ?? ""),
    description: String(body.description ?? ""),
    category: String(body.category ?? ""),
    subcategory: String(body.subcategory ?? ""),
    costPrice: Number(body.costPrice ?? 0),
    sellPrice: Number(body.sellPrice ?? 0),
    tier: String(body.tier ?? "standard"),
    suitableFor: JSON.stringify(body.suitableFor ?? []),
    tags: JSON.stringify(body.tags ?? []),
    marginFloorPercent: Number(body.marginFloorPercent ?? 15),
    preferredMarginPercent: Number(body.preferredMarginPercent ?? 30),
    stockStatus: String(body.stockStatus ?? "in_stock"),
    leadTimeDays: Number(body.leadTimeDays ?? 7),
    qualityScore: body.qualityScore != null ? Number(body.qualityScore) : 0,
    qualityNotes: String(body.qualityNotes ?? ""),
    createdAt: now,
    updatedAt: now,
  };
  const pipeline = redis.pipeline();
  pipeline.hset(keys.product(id), hash);
  pipeline.zadd(keys.companyProducts(companyId), { score: Date.now(), member: id });
  await pipeline.exec();
}

/** Update selected product fields. */
export async function updateProductRow(
  companyId: string,
  productId: string,
  rest: Record<string, unknown>
): Promise<void> {
  const redis = getRedis();
  const updatedAt = new Date().toISOString();
  const update: Record<string, string | number> = { updatedAt };

  const scalarFields: Record<string, string> = {
    sku: "sku",
    name: "name",
    description: "description",
    category: "category",
    subcategory: "subcategory",
    vendorId: "vendorId",
    costPrice: "costPrice",
    sellPrice: "sellPrice",
    tier: "tier",
    marginFloorPercent: "marginFloorPercent",
    preferredMarginPercent: "preferredMarginPercent",
    stockStatus: "stockStatus",
    leadTimeDays: "leadTimeDays",
    qualityScore: "qualityScore",
    qualityNotes: "qualityNotes",
  };

  for (const [jsKey, redisKey] of Object.entries(scalarFields)) {
    if (Object.prototype.hasOwnProperty.call(rest, jsKey) && rest[jsKey] !== undefined) {
      update[redisKey] = rest[jsKey] as string | number;
    }
  }

  if (rest.tags !== undefined) {
    update.tags = JSON.stringify(Array.isArray(rest.tags) ? rest.tags : []);
  }
  if (rest.suitableFor !== undefined) {
    update.suitableFor = JSON.stringify(Array.isArray(rest.suitableFor) ? rest.suitableFor : []);
  }

  // Verify ownership before updating
  const existing = await redis.hget<string>(keys.product(productId), "companyId");
  if (existing !== companyId) return;
  await redis.hset(keys.product(productId), update);
}

/** Insert a vendor. */
export async function insertVendorRow(
  companyId: string,
  id: string,
  body: Record<string, unknown>
): Promise<void> {
  const redis = getRedis();
  const now = new Date().toISOString();
  const hash: Record<string, string | number> = {
    id,
    companyId,
    name: String(body.name ?? ""),
    contactName: String(body.contactName ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    category: String(body.category ?? "Other"),
    rating: Number(body.rating ?? 0),
    status: String(body.status ?? "active"),
    paymentTerms: String(body.paymentTerms ?? ""),
    deliveryPerformance:
      body.deliveryPerformance != null ? Number(body.deliveryPerformance) : 0,
    totalOrders: Number(body.totalOrders ?? 0),
    activeProducts: Number(body.activeProducts ?? 0),
    notes: String(body.notes ?? ""),
    createdAt: now,
  };
  const pipeline = redis.pipeline();
  pipeline.hset(keys.vendor(id), hash);
  pipeline.zadd(keys.companyVendors(companyId), { score: Date.now(), member: id });
  await pipeline.exec();
}

/** Update selected vendor fields. */
export async function updateVendorRow(
  companyId: string,
  vendorId: string,
  rest: Record<string, unknown>
): Promise<void> {
  const redis = getRedis();
  const existing = await redis.hget<string>(keys.vendor(vendorId), "companyId");
  if (existing !== companyId) return;

  const fields = [
    "name","contactName","email","phone","category","rating","status",
    "paymentTerms","deliveryPerformance","totalOrders","activeProducts","notes",
  ];
  const update: Record<string, unknown> = {};
  for (const f of fields) {
    if (Object.prototype.hasOwnProperty.call(rest, f) && rest[f] !== undefined) {
      update[f] = rest[f];
    }
  }
  if (Object.keys(update).length > 0) await redis.hset(keys.vendor(vendorId), update);
}

// Sales, research, and competitor data are not yet migrated.
// Dashboard falls back to demo data when these return empty arrays.
export async function selectSales(_companyId: string): Promise<SaleRow[]> {
  return [];
}
export async function selectResearchReports(_companyId: string): Promise<Record<string, unknown>[]> {
  return [];
}
export async function selectResearchCatalogLines(
  _companyId: string
): Promise<Array<{ name: string; category: string; sellPrice: number; tier: string }>> {
  return [];
}
export async function selectCompetitors(_companyId: string): Promise<Record<string, unknown>[]> {
  return [];
}
