import type { VectorQueryResult, VectorStore, VectorUpsertItem } from "@/lib/rag/vector-store";

type UpstashVectorUpsertBody = {
  namespace: string;
  vectors: Array<{
    id: string;
    values: number[];
    metadata?: Record<string, unknown>;
  }>;
};

type UpstashVectorQueryBody = {
  namespace: string;
  vector: number[];
  topK: number;
  includeMetadata: boolean;
  filter?: Record<string, unknown>;
};

export function createUpstashVectorStore(params: {
  url: string;
  token: string;
}): VectorStore {
  const baseUrl = params.url.replace(/\/+$/, "");

  async function request<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Upstash Vector error ${res.status}: ${text.slice(0, 500)}`);
    }
    return (text ? (JSON.parse(text) as T) : ({} as T));
  }

  return {
    async upsert({ namespace, items }: { namespace: string; items: VectorUpsertItem[] }) {
      if (items.length === 0) return;
      const payload: UpstashVectorUpsertBody = {
        namespace,
        vectors: items.map((i) => ({
          id: i.id,
          values: i.embedding,
          metadata: i.metadata as Record<string, unknown> | undefined,
        })),
      };
      await request("/upsert", payload);
    },

    async query({
      namespace,
      embedding,
      topK,
      filter,
    }: {
      namespace: string;
      embedding: number[];
      topK: number;
      filter?: Record<string, unknown>;
    }): Promise<VectorQueryResult[]> {
      const payload: UpstashVectorQueryBody = {
        namespace,
        vector: embedding,
        topK,
        includeMetadata: true,
        filter,
      };

      const data = await request<
        Array<{ id: string; score: number; metadata?: Record<string, unknown> }>
      >("/query", payload);

      return data.map((r) => ({
        id: r.id,
        score: r.score,
        metadata: r.metadata as VectorQueryResult["metadata"],
      }));
    },
  };
}

