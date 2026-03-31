import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function geminiSynthesize(prompt: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function geminiStructuredReport(params: {
  type: string;
  query: string;
  researchData: string;
  catalogContext: string;
}): Promise<{ title: string; summary: string; content: string }> {
  const prompt = `You are a business intelligence analyst for PedTECH Global, an EdTech solutions company.

Research Type: ${params.type}
Query: ${params.query}

Research Data gathered:
${params.researchData}

PedTECH Global's current catalog context:
${params.catalogContext}

Generate a structured business intelligence report in this exact JSON format:
{
  "title": "Brief descriptive title (max 10 words)",
  "summary": "2-3 sentence executive summary with key actionable insight",
  "content": "Full markdown report with sections: ## Overview, ## Key Findings, ## Competitive Implications, ## Recommended Actions"
}

Be specific, data-driven, and actionable for an EdTech sales team. Reference PedTECH Global's products where relevant.`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    // Extract JSON from markdown code block if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) ?? [null, text];
    return JSON.parse(jsonMatch[1]!.trim());
  } catch {
    return {
      title: `Research: ${params.query.slice(0, 50)}`,
      summary: text.slice(0, 200),
      content: text,
    };
  }
}
