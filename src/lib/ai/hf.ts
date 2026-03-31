const HF_API = "https://router.huggingface.co/hf-inference/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2";

async function embed(text: string): Promise<number[]> {
  const res = await fetch(HF_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HF_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) throw new Error(`HF embed error: ${res.status}`);
  const data = await res.json();
  // API returns [[...values]] for single input
  return Array.isArray(data[0]) ? data[0] : data;
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

export async function semanticSearch<T extends { name: string; description?: string | null }>(
  query: string,
  items: T[],
  topK = 10
): Promise<Array<T & { score: number }>> {
  const queryEmbed = await embed(query);

  const scored = await Promise.all(
    items.map(async (item) => {
      const text = `${item.name} ${item.description ?? ""}`.trim();
      const itemEmbed = await embed(text);
      return { ...item, score: cosineSimilarity(queryEmbed, itemEmbed) };
    })
  );

  return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
