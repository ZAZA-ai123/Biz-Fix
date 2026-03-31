export type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export type TavilyResponse = {
  results: TavilyResult[];
  answer?: string;
};

export async function tavilySearch(query: string, maxResults = 5): Promise<TavilyResponse> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: "advanced",
      include_answer: true,
      include_raw_content: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export function formatTavilyForLLM(data: TavilyResponse): string {
  let out = "";
  if (data.answer) out += `Summary: ${data.answer}\n\n`;
  out += data.results
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content}`)
    .join("\n\n");
  return out;
}
