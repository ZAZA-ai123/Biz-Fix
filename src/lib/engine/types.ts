import type { Product } from "@/lib/mock-data";

export type { Product };

export type QuoteDocument = {
  title: string;
  summary: string;
  scopeOfWork: string[];
  commercialTerms: string[];
  assumptions: string[];
  exclusions: string[];
  acceptance: string;
};

export type QuoteRequest = {
  customerName?: string;
  projectType?: string;
  positioning?: "budget" | "standard" | "premium";
  requestedItems: Array<{
    type: string;
    quantity: number;
  }>;
  marginPercent?: number;
};

export type QuoteItem = {
  requestedType: string;
  productId: string;
  sku: string;
  name: string;
  vendor: string;
  quantity: number;
  costPrice: number;
  sellPrice: number;
  lineTotal: number;
  marginPercent: number;
  tier: "budget" | "standard" | "premium";
  stockStatus: string;
  leadTimeDays: number;
};

export type EngineQuote = {
  id: string;
  customerName?: string;
  projectType?: string;
  positioning?: string;
  items: QuoteItem[];
  subtotal: number;
  total: number;
  assumptions: string[];
  document: QuoteDocument;
};
