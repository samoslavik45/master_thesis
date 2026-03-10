import React from "react";
import { RecommendedArticle, Category } from "./types";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface RecommendedListProps {
  articles: RecommendedArticle[];
  categories: Category[];
  keywords: Keyword[];
  isLoggedIn: boolean;
  onOpen: (article: RecommendedArticle) => void;
  onLike: (articleId: number) => void;
  onDismiss: (articleId: number) => void;
}

interface Keyword {
  id: number;
  keyword: string;
}

const RecommendedList: React.FC<RecommendedListProps> = ({
  articles,
  categories,
  keywords,
  isLoggedIn,
  onOpen,
  onLike,
  onDismiss,
}) => {
  if (!isLoggedIn || !articles.length) return null;

  const visibleArticles = articles.slice(0, 5);
  const categoryMap = new Map(categories.map((cat) => [cat.id, cat.name]));

  const keywordMap: { [key: string]: string } = keywords.reduce(
    (map, keyword) => {
      map[keyword.id.toString()] = keyword.keyword;
      return map;
    },
    {} as { [key: string]: string }
  );

  const getRecommendationLabel = (score?: number) => {
    if (typeof score !== "number") return "Recommended";

    if (score >= 0.8) return "Highly recommended";
    if (score >= 0.6) return "Strong match";
    if (score >= 0.4) return "Recommended";
    if (score >= 0.2) return "Worth exploring";
    return "Low relevance";
  };

  return (
    <div className="space-y-4">
      {visibleArticles.map((article) => (
        <Card
          key={article.id}
          className="
            bg-[hsl(var(--muted))]
            border border-[hsl(var(--border))]
            rounded-xl p-4 shadow-sm
            hover:bg-[hsl(var(--card))]
            transition
          "
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-[hsl(var(--foreground))] text-lg">
                  {article.title}
                </h3>

                {typeof article.score === "number" && (
                  <span
                    className="
                      inline-flex items-center rounded-full
                      border border-[hsl(var(--primary))/0.25]
                      bg-[hsl(var(--primary))/0.08]
                      px-2.5 py-1 text-xs font-medium
                      text-[hsl(var(--primary))]
                    "
                  >
                    {getRecommendationLabel(article.score)}
                  </span>
                )}
              </div>

              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                Authors: {article.authors?.length ? article.authors.join(", ") : "Unknown"}
              </p>

              {!!article.categories?.length && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Categories:{" "}
                  {article.categories?.length
                    ? article.categories
                        .map((category: any) => {
                          if (typeof category === "object") return category.name;
                          return categoryMap.get(Number(category)) ?? `Category #${category}`;
                        })
                        .join(", ")
                    : "Unknown"}
                </p>
              )}

              {!!article.keywords?.length && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Keywords:{" "}
                  {article.keywords
                    .map((keyword: any) => {
                      if (typeof keyword === "object") {
                        return keyword.keyword || keyword.name || "Unknown";
                      }

                      return keywordMap[String(keyword)] ?? `Keyword #${keyword}`;
                    })
                    .join(", ")}
                </p>
              )}

              <div
                className="
                  mt-3 rounded-xl
                  border border-[hsl(var(--border))]
                  bg-[hsl(var(--background))/0.65]
                  p-3
                "
              >
                <p className="text-sm text-[hsl(var(--foreground))] leading-relaxed">
                  {article.content?.length > 240
                    ? `${article.content.substring(0, 240)}...`
                    : article.content || "No abstract available."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <Button
                onClick={() => onOpen(article)}
                size="sm"
                className="
                  rounded-xl px-3 py-1.5 text-xs font-medium
                  bg-[hsl(var(--primary))]
                  text-[hsl(var(--primary-foreground))]
                  hover:brightness-110
                  shadow-sm
                  transition-colors
                "
              >
                Open
              </Button>

              <Button
                onClick={() => onLike(article.id)}
                size="sm"
                variant="outline"
                className="
                  rounded-xl px-3 py-1.5 text-xs font-medium
                  border border-[hsl(var(--primary))/60]
                  bg-[hsl(var(--accent))]
                  text-[hsl(var(--primary))]
                  hover:bg-[hsl(var(--primary))/10]
                  shadow-sm
                  transition-colors
                "
              >
                Like
              </Button>

              <Button
                onClick={() => onDismiss(article.id)}
                size="sm"
                variant="outline"
                className="
                  rounded-xl px-3 py-1.5 text-xs font-medium
                  border-[hsl(var(--destructive))]/70
                  bg-[hsl(var(--destructive))]/10
                  text-[hsl(var(--destructive))]
                  hover:bg-[hsl(var(--destructive))]/20
                  transition-colors
                "
              >
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RecommendedList;