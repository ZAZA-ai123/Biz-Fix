import { createHash } from "crypto";

export type RagChunk = {
  chunkIndex: number;
  content: string;
  contentHash: string;
};

export function chunkText(input: string, opts?: { maxChars?: number }): RagChunk[] {
  const maxChars = opts?.maxChars ?? 900;
  const normalized = input.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized
    .split(/\n\s*\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let buf = "";
  for (const p of paragraphs.length > 0 ? paragraphs : [normalized]) {
    if (!buf) {
      buf = p;
      continue;
    }
    if ((buf + "\n\n" + p).length <= maxChars) {
      buf += "\n\n" + p;
    } else {
      chunks.push(buf);
      buf = p;
    }
  }
  if (buf) chunks.push(buf);

  return chunks.map((content, idx) => ({
    chunkIndex: idx,
    content,
    contentHash: createHash("sha256").update(content).digest("hex"),
  }));
}

