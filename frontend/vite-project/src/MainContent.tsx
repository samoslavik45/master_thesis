import React, { useState, useEffect, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

import { ChevronsUpDown, Check, Info } from "lucide-react";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

import Swal from "sweetalert2";

import ArticlesList from "./ArticlesList";
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

  // 🔧 OPRAVENÝ SEARCH HANDLER – berie data.articles
  const handleSearchSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("accessToken");
      const headers: HeadersInit = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res = await fetch(
        `http://localhost:8000/main/search_articles/?q=${encodeURIComponent(
          searchQuery
        )}`,
        { headers }
      );

      if (!res.ok) {
        console.error("Search failed:", res.status);
        return;
      }

      const data = await res.json();

      // backend vracia { articles: [...] }
      const list = Array.isArray(data) ? data : data.articles;

      setArticles(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Search error:", err);
    }
  };

  // CATEGORY SELECT HANDLER
  const handleSelectCategory = async (category: Category) => {
    setSelectedCategory(category);
    setCategoryOpen(false);

    try {
      const res = await fetch(
        `http://localhost:8000/api/articles/category/${category.id}/`
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

  const handleShowCategoryInfo = (category: Category) => {
    Swal.fire({
      title: category.name,
      text: category.description,
      icon: "info",
      confirmButtonText: "OK",
    });
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
    <div
      className="
        w-full max-w-3xl
        bg-[hsl(var(--card))]
        backdrop-blur-xl
        border border-[hsl(var(--border))]
        shadow-[0_4px_40px_rgba(0,0,0,0.05)]
        rounded-2xl
        p-6
        space-y-5
        mx-auto
      "
    >
      {/* SEARCH BAR */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
        
        {/* icon */}
        <div
          className="
            w-12 h-12 rounded-xl
            bg-[hsl(var(--muted))]
            border border-[hsl(var(--border))]
            flex items-center justify-center
            text-[hsl(var(--muted-foreground))]
          "
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </div>

        <Input
          placeholder="Search scientific articles, authors, keywords..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            flex-1 h-12 text-base rounded-xl
            bg-[hsl(var(--input))]
            border border-[hsl(var(--border))]
            text-[hsl(var(--foreground))]
            focus-visible:ring-[hsl(var(--ring))]
            focus-visible:ring-2
            transition
          "
        />

        <Button
          type="submit"
          className="
            h-12 px-8 rounded-xl font-semibold
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            shadow-md
            hover:scale-[1.02]
            transition
          "
        >
          Search
        </Button>
      </form>

      {/* CATEGORY FILTER */}
      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="
              w-full h-12 justify-between rounded-xl
              bg-[hsl(var(--accent))]
              text-[hsl(var(--foreground))]
              border border-[hsl(var(--border))]
              hover:bg-[hsl(var(--muted))]
            "
          >
            {selectedCategory ? selectedCategory.name : "Filter by category"}
            <ChevronsUpDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="
            w-full p-0 
            rounded-xl 
            bg-[hsl(var(--card))]
            border border-[hsl(var(--border))]
            shadow-xl
          "
        >
          <Command>
            <CommandInput
              placeholder="Search categories..."
              className="
                bg-[hsl(var(--input))]
                border-b border-[hsl(var(--border))]
                text-[hsl(var(--foreground))]
              "
            />

            <CommandList>
              <CommandEmpty className="py-3 text-[hsl(var(--muted-foreground))]">
                No categories found.
              </CommandEmpty>

              <CommandGroup heading="Categories">
                {categories.map((cat) => (
                  <CommandItem
                    key={cat.id}
                    value={cat.name}
                    onSelect={() => handleSelectCategory(cat)}
                    className="
                      flex items-center justify-between
                      text-[hsl(var(--foreground))]
                      hover:bg-[hsl(var(--muted))]
                      rounded-lg
                      cursor-pointer
                    "
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={`h-4 w-4 ${
                          selectedCategory?.id === cat.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {cat.name}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShowCategoryInfo(cat);
                      }}
                      className="
                        rounded-full p-1 
                        hover:bg-[hsl(var(--accent))]
                      "
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>

          </Command>
        </PopoverContent>
      </Popover>
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
