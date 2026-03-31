"use client";

import React from "react";
import { Search, Loader2, TrendingUp, Users, Lightbulb, Newspaper, ChevronRight, ExternalLink, Clock, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, formatCurrency } from "@/lib/utils";

type ResearchReport = {
  id: string;
  type: string;
  query: string;
  title: string;
  summary: string;
  content: string;
  sources: { title: string; url: string }[];
  createdAt: string;
};

type Competitor = {
  id: string;
  name: string;
  website: string | null;
  category: string | null;
  strengths: string | null;
  weaknesses: string | null;
  estimatedRevenue: string | null;
  notes: string | null;
  lastUpdated: string;
};

type NewsArticle = {
  title: string;
  url: string;
  source: { name: string };
  description: string | null;
  publishedAt: string;
};

const SUGGESTED_QUERIES = [
  { label: "Competitor Analysis", query: "Analyze Instructure Canvas as a competitor in K-12 LMS market", icon: Users },
  { label: "Product Opportunity", query: "What EdTech products are trending in 2026 that we should add to our catalog?", icon: Lightbulb },
  { label: "Market Research", query: "EdTech funding rounds and market growth trends 2026", icon: TrendingUp },
  { label: "Client Research", query: "Research Dubai Knowledge Foundation EdTech procurement strategy", icon: Search },
];

const intentColors: Record<string, string> = {
  competitor_analysis: "bg-red-100 text-red-700",
  product_opportunity: "bg-green-100 text-green-700",
  market_research: "bg-blue-100 text-blue-700",
  client_research: "bg-purple-100 text-purple-700",
  news: "bg-yellow-100 text-yellow-700",
  general: "bg-gray-100 text-gray-700",
};

const intentLabels: Record<string, string> = {
  competitor_analysis: "Competitor",
  product_opportunity: "Opportunity",
  market_research: "Market",
  client_research: "Client",
  news: "News",
  general: "General",
};

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-2 text-sm text-foreground leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## ")) return <h3 key={i} className="font-semibold text-base mt-4 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith("# ")) return <h2 key={i} className="font-bold text-lg mt-4 mb-1">{line.slice(2)}</h2>;
        if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 list-disc">{line.slice(2)}</li>;
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

export default function ResearchPage() {
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [reports, setReports] = React.useState<ResearchReport[]>([]);
  const [competitors, setCompetitors] = React.useState<Competitor[]>([]);
  const [news, setNews] = React.useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = React.useState(false);
  const [activeReport, setActiveReport] = React.useState<ResearchReport | null>(null);
  const [tab, setTab] = React.useState("research");

  React.useEffect(() => {
    fetchReports();
    fetchCompetitors();
  }, []);

  async function fetchReports() {
    const res = await fetch("/api/research");
    if (res.ok) setReports(await res.json());
  }

  async function fetchCompetitors() {
    const res = await fetch("/api/research/competitors");
    if (res.ok) setCompetitors(await res.json());
  }

  async function fetchNews() {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/research/news?q=EdTech+education+technology+2026");
      if (res.ok) {
        const data = await res.json();
        setNews(data.articles ?? []);
      }
    } finally {
      setNewsLoading(false);
    }
  }

  async function runResearch(q?: string) {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setLoading(true);
    setActiveReport(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      if (res.ok) {
        const report = await res.json();
        setActiveReport(report);
        setReports((prev) => [report, ...prev]);
        setTab("research");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Research Agent</h1>
            <p className="text-sm text-muted-foreground">AI-powered competitor analysis, market research, and product intelligence</p>
          </div>
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Sparkles className="w-3 h-3 text-primary" />
            Groq · Gemini · Tavily · NewsAPI
          </Badge>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Ask anything — 'Analyze Promethean as a competitor', 'What VR products are trending?'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runResearch()}
            />
          </div>
          <Button onClick={() => runResearch()} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Research"}
          </Button>
        </div>

        {/* Suggested queries */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {SUGGESTED_QUERIES.map((s) => (
            <button
              key={s.label}
              onClick={() => { setQuery(s.query); runResearch(s.query); }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <s.icon className="w-3 h-3" />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — report history */}
        <div className="w-72 border-r border-border flex flex-col overflow-hidden shrink-0">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="mx-3 mt-3 shrink-0">
              <TabsTrigger value="research" className="flex-1 text-xs">Reports</TabsTrigger>
              <TabsTrigger value="competitors" className="flex-1 text-xs">Competitors</TabsTrigger>
              <TabsTrigger value="news" className="flex-1 text-xs" onClick={fetchNews}>News</TabsTrigger>
            </TabsList>

            <TabsContent value="research" className="flex-1 overflow-y-auto px-3 pb-3 mt-2 space-y-2">
              {reports.length === 0 && (
                <p className="text-xs text-muted-foreground text-center pt-8">No reports yet. Run your first research query above.</p>
              )}
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setActiveReport(r); setTab("research"); }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    activeReport?.id === r.id
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:border-border/80 hover:bg-accent/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", intentColors[r.type] ?? intentColors.general)}>
                      {intentLabels[r.type] ?? r.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-foreground line-clamp-2">{r.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{r.summary}</p>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="competitors" className="flex-1 overflow-y-auto px-3 pb-3 mt-2 space-y-2">
              {competitors.map((c) => (
                <div key={c.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-foreground">{c.name}</span>
                    {c.category && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{c.category}</Badge>
                    )}
                  </div>
                  {c.estimatedRevenue && (
                    <p className="text-[11px] text-muted-foreground">Revenue: {c.estimatedRevenue}</p>
                  )}
                  {c.strengths && (
                    <p className="text-[11px] text-green-700 mt-1">+ {c.strengths.slice(0, 80)}{c.strengths.length > 80 ? "…" : ""}</p>
                  )}
                  {c.weaknesses && (
                    <p className="text-[11px] text-red-600">− {c.weaknesses.slice(0, 80)}{c.weaknesses.length > 80 ? "…" : ""}</p>
                  )}
                  {c.website && (
                    <a href={c.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-primary mt-1.5 hover:underline">
                      <ExternalLink className="w-2.5 h-2.5" /> {c.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="news" className="flex-1 overflow-y-auto px-3 pb-3 mt-2 space-y-2">
              {newsLoading && (
                <div className="flex items-center justify-center pt-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
              {!newsLoading && news.length === 0 && (
                <p className="text-xs text-muted-foreground text-center pt-8">Click News tab to load latest EdTech news.</p>
              )}
              {news.map((a, i) => (
                <a
                  key={i}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
                >
                  <p className="text-xs font-medium text-foreground line-clamp-2">{a.title}</p>
                  {a.description && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{a.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-muted-foreground">{a.source.name}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{a.publishedAt.slice(0, 10)}</span>
                    <ExternalLink className="w-2.5 h-2.5 text-muted-foreground ml-auto" />
                  </div>
                </a>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">Researching…</p>
                <p className="text-xs text-muted-foreground mt-1">Groq routing · Tavily searching · NewsAPI scanning · Gemini synthesizing</p>
              </div>
            </div>
          )}

          {!loading && !activeReport && (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Start a research query</p>
                <p className="text-xs text-muted-foreground mt-1">Use the search bar above or click a suggested query</p>
              </div>
            </div>
          )}

          {!loading && activeReport && (
            <div className="max-w-3xl space-y-5">
              {/* Report header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn("text-xs font-medium px-2 py-1 rounded-full", intentColors[activeReport.type] ?? intentColors.general)}>
                    {intentLabels[activeReport.type] ?? activeReport.type}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(activeReport.createdAt).toLocaleString()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-foreground">{activeReport.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{activeReport.summary}</p>
              </div>

              {/* Full report */}
              <Card>
                <CardContent className="pt-5">
                  <MarkdownContent content={activeReport.content} />
                </CardContent>
              </Card>

              {/* Sources */}
              {activeReport.sources.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sources</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {activeReport.sources.slice(0, 8).map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-xs text-muted-foreground hover:text-foreground group"
                      >
                        <ExternalLink className="w-3 h-3 mt-0.5 shrink-0 text-primary group-hover:text-primary" />
                        <span className="line-clamp-1 group-hover:underline">{s.title}</span>
                      </a>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
