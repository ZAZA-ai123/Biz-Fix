import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiEmbedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  const values = result.embedding?.values;
  if (!values || !Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini embedding returned empty vector");
  }
  return values;
}

