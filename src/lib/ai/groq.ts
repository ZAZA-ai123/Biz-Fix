import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export type GroqMessage = { role: "system" | "user" | "assistant"; content: string };

export async function groqChat(messages: GroqMessage[], model = "llama-3.3-70b-versatile"): Promise<string> {
  const completion = await groq.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 4096,
  });
  return completion.choices[0]?.message?.content ?? "";
}

export async function groqRoute(userPrompt: string): Promise<{
  intent: "competitor_analysis" | "product_opportunity" | "market_research" | "client_research" | "news" | "general";
  query: string;
  company?: string;
}> {
  const result = await groqChat([
    {
      role: "system",
      content: `You are a routing agent for an EdTech business intelligence system.
Classify the user's research request and extract the core query.
Respond with ONLY valid JSON in this format:
{"intent": "competitor_analysis"|"product_opportunity"|"market_research"|"client_research"|"news"|"general", "query": "refined search query", "company": "company name if mentioned or null"}`,
    },
    { role: "user", content: userPrompt },
  ]);

  try {
    return JSON.parse(result);
  } catch {
    return { intent: "general", query: userPrompt };
  }
}
