import React, { useState, useEffect, FormEvent } from "react";
import ArticlesList from "./ArticlesList";
import SearchPanel from "./SearchPanel";
import { Article, Category } from "./types";

interface MainContentProps {
  setIsLoggedIn: (value: boolean) => void;
}

const MainContent: React.FC<MainContentProps> = ({ setIsLoggedIn }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);

  // CATEGORY STATE
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [categoryOpen, setCategoryOpen] = useState(false);

  // LOGIN STATE
  const [isLoggedIn, setIsLoggedInState] = useState(false);

  // FETCH USER + CATEGORIES + GROUPS
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const loggedIn = !!token;
    setIsLoggedInState(loggedIn);
    setIsLoggedIn(loggedIn);

    if (token) {
      fetchUserGroups(token);
    }

    fetchCategories();
  }, [setIsLoggedIn]);

  const fetchUserGroups = async (token: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/groups/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      setGroups(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/categories/");
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const handleSearch = async (query: string) => {
  setSearchQuery(query);
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      const res = await fetch(
        `http://localhost:8000/main/search_articles/?q=${encodeURIComponent(query)}`,
        { headers }
      );

      if (!res.ok) return;

      const data = await res.json();
      const list = Array.isArray(data) ? data : data.articles;
      setArticles(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    }
  };


  // CATEGORY SELECT HANDLER
  const handleSelectCategory = async (category: Category) => {
    setSelectedCategory(category);
    setCategoryOpen(false);

    try {
      const res = await fetch(
        `http://localhost:8000/api/articles/by_category/${category.id}/`
      );
      if (!res.ok) {
        console.error("Category filter failed:", res.status);
        return;
      }
      const data = await res.json();
      // tu endpoint vracia priamo pole článkov
      setArticles(Array.isArray(data) ? data : data.articles ?? []);
    } catch (err) {
      console.error(err);
    }
  };

return (
  <div className="w-full flex flex-col items-center pt-10 pb-10 text-[hsl(var(--foreground))]">

    {/* TITLE */}
    <div className="text-center mt-8 mb-6">
      <h1 className="text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
        Article searching database
      </h1>
      <p className="text-lg mt-2 text-[hsl(var(--muted-foreground))]">
        Find the best articles on various topics right here.
      </p>
    </div>

    {/* SEARCH + FILTER PANEL */}
    <div>
    <SearchPanel
      onSearch={handleSearch}
      onCategorySelect={(categoryId) => {
        const category = categories.find(c => c.id === categoryId);
        if (category) handleSelectCategory(category);
      }}
    />
    </div>


    {/* ARTICLES LIST */}
    <div className="w-full mt-10">
      <ArticlesList
        isLoggedIn={isLoggedIn}
        articles={articles}
        groups={groups}
        categories={categories}
      />
    </div>
  </div>
);

};

export default MainContent;
