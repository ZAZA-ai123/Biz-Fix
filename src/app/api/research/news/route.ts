import { fetchEdTechNews } from "@/lib/ai/newsapi";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "EdTech education technology trends 2026";

  const data = await fetchEdTechNews(query, 12);
  return Response.json(data);
}
