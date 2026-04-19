import React, { useState, useEffect, useContext } from "react";
import ArticlesList from "./ArticlesList";
import SearchPanel from "./SearchPanel";
import { Article, Category } from "./types";
import { LoginContext } from "./App";

const MainContent: React.FC = () => {
  const { isLoggedIn, selectedFullTextMode } = useContext(LoginContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [groups, setGroups] = useState<Array<{ id: number; name: string }>>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [useFullTextSearch, setUseFullTextSearch] = useState(false);
  

  // CATEGORIES – načítaj raz
  useEffect(() => {
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

    fetchCategories();
  }, []);

  // GROUPS – pri zmene loginu
  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (!isLoggedIn || !token) {
      setGroups([]);
      return;
    }

    const fetchUserGroups = async () => {
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

    fetchUserGroups();
  }, [isLoggedIn]);

  const handleSearch = async (
    query: string,
    useFullText: boolean = useFullTextSearch
  ) => {
    setSearchQuery(query);
    setUseFullTextSearch(useFullText);

    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const params = new URLSearchParams({
        q: query,
      });

      if (useFullText) {
        params.append("fulltext", "true");
        params.append("fulltext_mode", selectedFullTextMode);
      }

      const res = await fetch(
        `http://localhost:8000/main/search_articles/?${params.toString()}`,
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

  const handleSelectCategory = async (category: Category | null) => {
      if (!category) {
        if (searchQuery) {
          handleSearch(searchQuery, useFullTextSearch);
        } else {
          setArticles([]);
        }
        return;
      }

    try {
      const res = await fetch(
        `http://localhost:8000/api/articles/by_category/${category.id}/`
      );
      if (!res.ok) {
        console.error("Category filter failed:", res.status);
        return;
      }
      const data = await res.json();
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
          onCategorySelect={handleSelectCategory}
          categories={categories}
          fullTextEnabled={useFullTextSearch}
          onFullTextChange={setUseFullTextSearch}
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
