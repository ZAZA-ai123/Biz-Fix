import type { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { randomUUID } from "crypto";
import { chunkText } from "@/lib/rag/chunk";
import { geminiEmbedText } from "@/lib/ai/gemini-embed";
import { getVectorStore } from "@/lib/rag";
import { insertRagChunk, insertRagDocument } from "@/lib/db/rag-redis";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    type?: string;
    title?: string | null;
    sourceUri?: string | null;
    content?: string;
  };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return Response.json({ error: '"content" is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const documentId = `doc-${randomUUID()}`;

  await insertRagDocument({
    id: documentId,
    companyId: userId,
    type: typeof body.type === "string" && body.type.trim() ? body.type.trim() : "note",
    title: typeof body.title === "string" ? body.title : null,
    sourceUri: typeof body.sourceUri === "string" ? body.sourceUri : null,
    createdAt: now,
  });

  const chunks = chunkText(content, { maxChars: 900 });
  const store = getVectorStore();
  const namespace = userId;

  const upsertItems = [];
  for (const c of chunks) {
    const id = `chk-${randomUUID()}`;
    await insertRagChunk({
      id,
      documentId,
      companyId: userId,
      chunkIndex: c.chunkIndex,
      content: c.content,
      contentHash: c.contentHash,
      createdAt: now,
    });
    const embedding = await geminiEmbedText(c.content);
    upsertItems.push({
      id,
      embedding,
      metadata: {
        companyId: userId,
        documentId,
        chunkIndex: c.chunkIndex,
        type: typeof body.type === "string" ? body.type : "note",
        contentHash: c.contentHash,
      },
    });
  }

  await store.upsert({ namespace, items: upsertItems });

  return Response.json({
    success: true,
    documentId,
    chunksIngested: chunks.length,
  });
}
