import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { groqChat } from "@/lib/ai/groq";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { prompt?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return Response.json({ error: "prompt required" }, { status: 400 });

  try {
    const reply = await groqChat(
      [
        {
          role: "system",
          content: `You are Biz-Fix, an AI assistant for a quote-building platform used by businesses.
Answer questions about margins, product fit, pricing strategy, scope writing, and how to structure quotes — concisely in 2-4 sentences.
Be direct and practical. If a user seems ready to generate actual numbers, suggest switching to Quote mode (∞).`,
        },
        { role: "user", content: prompt },
      ],
      "llama-3.3-70b-versatile"
    );
    return Response.json({ reply });
  } catch (e) {
    console.error("[api/chat/ask]", e);
    return Response.json(
      { error: "Failed to generate response", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
