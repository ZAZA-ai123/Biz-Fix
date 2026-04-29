export type VectorMetadata = Record<string, string | number | boolean | null | undefined>;

export type VectorUpsertItem = {
  id: string;
  embedding: number[];
  metadata?: VectorMetadata;
};

export type VectorQueryResult = {
  id: string;
  score: number;
  metadata?: VectorMetadata;
};

export type VectorStore = {
  upsert(params: { namespace: string; items: VectorUpsertItem[] }): Promise<void>;
  query(params: {
    namespace: string;
    embedding: number[];
    topK: number;
    filter?: VectorMetadata;
  }): Promise<VectorQueryResult[]>;
};

