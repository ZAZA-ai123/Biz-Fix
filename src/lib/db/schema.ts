import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─── Companies ───────────────────────────────────────────────────────────────
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default("EdTech"),
  description: text("description"),
  website: text("website"),
  createdAt: text("created_at").notNull(),
});

// ─── Vendors ─────────────────────────────────────────────────────────────────
export const vendors = sqliteTable("vendors", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  category: text("category").notNull(),
  rating: real("rating").notNull().default(0),
  status: text("status").notNull().default("active"), // active | inactive | pending
  paymentTerms: text("payment_terms"),
  deliveryPerformance: real("delivery_performance"), // 0–100
  totalOrders: integer("total_orders").notNull().default(0),
  activeProducts: integer("active_products").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  vendorId: text("vendor_id"),
  sku: text("sku").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  costPrice: real("cost_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  tier: text("tier").notNull().default("standard"), // budget | standard | premium
  suitableFor: text("suitable_for").notNull().default("[]"), // JSON array
  tags: text("tags").notNull().default("[]"),           // JSON array
  marginFloorPercent: real("margin_floor_percent").notNull().default(15),
  preferredMarginPercent: real("preferred_margin_percent").notNull().default(30),
  stockStatus: text("stock_status").notNull().default("in_stock"),
  leadTimeDays: integer("lead_time_days").notNull().default(7),
  qualityScore: real("quality_score"),       // 1–5
  qualityNotes: text("quality_notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// ─── Quotes ───────────────────────────────────────────────────────────────────
export const quotes = sqliteTable("quotes", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  clientName: text("client_name").notNull(),
  project: text("project"),
  status: text("status").notNull().default("draft"), // draft | sent | accepted | declined | expired
  total: real("total").notNull().default(0),
  margin: real("margin").notNull().default(0),
  itemsCount: integer("items_count").notNull().default(0),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  expiresAt: text("expires_at"),
});

// ─── Quote Items ──────────────────────────────────────────────────────────────
export const quoteItems = sqliteTable("quote_items", {
  id: text("id").primaryKey(),
  quoteId: text("quote_id").notNull(),
  productId: text("product_id"),
  productName: text("product_name").notNull(),
  sku: text("sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  costPrice: real("cost_price").notNull(),
  lineTotal: real("line_total").notNull(),
  marginPercent: real("margin_percent").notNull().default(0),
});

// ─── Sales ────────────────────────────────────────────────────────────────────
export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  quoteId: text("quote_id"),
  clientName: text("client_name").notNull(),
  productId: text("product_id"),
  productName: text("product_name").notNull(),
  category: text("category"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  total: real("total").notNull(),
  costTotal: real("cost_total").notNull(),
  margin: real("margin").notNull().default(0),
  status: text("status").notNull().default("completed"), // completed | refunded | pending
  saleDate: text("sale_date").notNull(),
  createdAt: text("created_at").notNull(),
});

// ─── Research Reports ─────────────────────────────────────────────────────────
export const researchReports = sqliteTable("research_reports", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  type: text("type").notNull(), // competitor | opportunity | market | client
  query: text("query").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),   // full markdown report
  sources: text("sources").notNull().default("[]"), // JSON array of {title, url}
  createdAt: text("created_at").notNull(),
});

// ─── Competitors ──────────────────────────────────────────────────────────────
export const competitors = sqliteTable("competitors", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  website: text("website"),
  category: text("category"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  estimatedRevenue: text("estimated_revenue"),
  notes: text("notes"),
  lastUpdated: text("last_updated").notNull(),
});

// ─── News Cache ───────────────────────────────────────────────────────────────
export const newsCache = sqliteTable("news_cache", {
  id: text("id").primaryKey(),
  companyId: text("company_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  source: text("source"),
  description: text("description"),
  publishedAt: text("published_at"),
  cachedAt: text("cached_at").notNull(),
  relevanceTags: text("relevance_tags").notNull().default("[]"), // JSON array
});
