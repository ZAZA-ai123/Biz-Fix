export type NewsArticle = {
  title: string;
  url: string;
  source: { name: string };
  description: string | null;
  publishedAt: string;
};

export type NewsResponse = {
  articles: NewsArticle[];
  totalResults: number;
};

export async function fetchEdTechNews(query = "EdTech education technology", pageSize = 10): Promise<NewsResponse> {
  const params = new URLSearchParams({
    q: query,
    pageSize: String(pageSize),
    language: "en",
    sortBy: "publishedAt",
    apiKey: process.env.NEWS_API_KEY!,
  });

  const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
    next: { revalidate: 3600 }, // cache 1 hour
  });

  if (!res.ok) {
    throw new Error(`NewsAPI error: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export function formatNewsForLLM(articles: NewsArticle[]): string {
  return articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.title} (${a.source.name}, ${a.publishedAt.slice(0, 10)})\n${a.description ?? ""}\nURL: ${a.url}`
    )
    .join("\n\n");
}
