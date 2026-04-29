export const keys = {
  company: (uid: string) => `company:${uid}`,
  companySettings: (uid: string) => `company:${uid}:settings`,
  companyQuotes: (uid: string) => `company:${uid}:quotes`,
  quote: (id: string) => `quote:${id}`,
  companyProducts: (uid: string) => `company:${uid}:products`,
  product: (id: string) => `product:${id}`,
  companyVendors: (uid: string) => `company:${uid}:vendors`,
  vendor: (id: string) => `vendor:${id}`,
  ragDoc: (id: string) => `rag:doc:${id}`,
  ragChunk: (id: string) => `rag:chunk:${id}`,
  companyRagChunks: (uid: string) => `company:${uid}:ragChunkIds`,
};
