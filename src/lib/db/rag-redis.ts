import { getRedis } from "./redis";
import { keys } from "./redis-keys";

export type RagDocumentRow = {
  id: string;
  companyId: string;
  type: string;
  title: string | null;
  sourceUri: string | null;
  createdAt: string;
};

export type RagChunkRow = {
  id: string;
  documentId: string;
  companyId: string;
  chunkIndex: number;
  content: string;
  contentHash: string;
  createdAt: string;
};

export async function insertRagDocument(row: RagDocumentRow): Promise<void> {
  const redis = getRedis();
  await redis.hset(keys.ragDoc(row.id), {
    id: row.id,
    companyId: row.companyId,
    type: row.type,
    title: row.title ?? "",
    sourceUri: row.sourceUri ?? "",
    createdAt: row.createdAt,
  });
}

export async function insertRagChunk(row: RagChunkRow): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  pipeline.hset(keys.ragChunk(row.id), {
    id: row.id,
    documentId: row.documentId,
    companyId: row.companyId,
    chunkIndex: row.chunkIndex,
    content: row.content,
    contentHash: row.contentHash,
    createdAt: row.createdAt,
  });
  pipeline.sadd(keys.companyRagChunks(row.companyId), row.id);
  await pipeline.exec();
}

export async function selectRagChunksByIds(
  companyId: string,
  ids: string[]
): Promise<Record<string, unknown>[]> {
  if (!ids.length) return [];
  const redis = getRedis();
  const pipeline = redis.pipeline();
  for (const id of ids) pipeline.hgetall(keys.ragChunk(id));
  const results = await pipeline.exec<(Record<string, string> | null)[]>();
  return results
    .filter((r): r is Record<string, string> => !!r && r.companyId === companyId)
    .map((r) => ({
      id: r.id,
      documentId: r.documentId,
      companyId: r.companyId,
      chunkIndex: parseInt(r.chunkIndex ?? "0", 10),
      content: r.content,
      contentHash: r.contentHash,
      createdAt: r.createdAt,
    }));
}
