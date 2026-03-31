/**
 * Run this once to create all tables: npx tsx src/lib/db/migrate.ts
 */
import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "bizfix.db");
const sqlite = new Database(DB_PATH);

sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'EdTech',
    description TEXT,
    website TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    payment_terms TEXT,
    delivery_performance REAL,
    total_orders INTEGER NOT NULL DEFAULT 0,
    active_products INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    vendor_id TEXT,
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    cost_price REAL NOT NULL,
    sell_price REAL NOT NULL,
    tier TEXT NOT NULL DEFAULT 'standard',
    suitable_for TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]',
    margin_floor_percent REAL NOT NULL DEFAULT 15,
    preferred_margin_percent REAL NOT NULL DEFAULT 30,
    stock_status TEXT NOT NULL DEFAULT 'in_stock',
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    quality_score REAL,
    quality_notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    project TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    total REAL NOT NULL DEFAULT 0,
    margin REAL NOT NULL DEFAULT 0,
    items_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL,
    expires_at TEXT
  );

  CREATE TABLE IF NOT EXISTS quote_items (
    id TEXT PRIMARY KEY,
    quote_id TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    sku TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    cost_price REAL NOT NULL,
    line_total REAL NOT NULL,
    margin_percent REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    quote_id TEXT,
    client_name TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT NOT NULL,
    category TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total REAL NOT NULL,
    cost_total REAL NOT NULL,
    margin REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    sale_date TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS research_reports (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    type TEXT NOT NULL,
    query TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    sources TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS competitors (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    name TEXT NOT NULL,
    website TEXT,
    category TEXT,
    strengths TEXT,
    weaknesses TEXT,
    estimated_revenue TEXT,
    notes TEXT,
    last_updated TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS news_cache (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT,
    description TEXT,
    published_at TEXT,
    cached_at TEXT NOT NULL,
    relevance_tags TEXT NOT NULL DEFAULT '[]'
  );
`);

console.log("✓ Database tables created at", DB_PATH);
sqlite.close();
