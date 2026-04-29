import type { VectorStore } from "@/lib/rag/vector-store";
import { createUpstashVectorStore } from "@/lib/rag/providers/upstash";

export function getVectorStore(): VectorStore {
  const provider = process.env.VECTOR_STORE_PROVIDER ?? "upstash";

  if (provider === "upstash") {
    const url = process.env.UPSTASH_VECTOR_REST_URL;
    const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
    if (!url || !token) {
      throw new Error(
        "Missing Upstash Vector config. Set UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN."
      );
    }
    return createUpstashVectorStore({ url, token });
  }

  throw new Error(`Unsupported VECTOR_STORE_PROVIDER: ${provider}`);
}

