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
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { ChevronsUpDown, Info, Check } from "lucide-react";
import Swal from "sweetalert2";

interface Category {
  id: number;
  name: string;
  description: string;
}

interface SearchPanelProps {
  onSearch: (query: string) => void;
  onCategorySelect: (categoryId: number) => void;
}

const SearchPanel: React.FC<SearchPanelProps> = ({ onSearch, onCategorySelect }) => {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/categories/")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error(err));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

    const onCategoryPick = (cat: Category) => {
    setSelectedCategory(cat);
    onCategorySelect(cat.id);   // pošleš ID hore
    onSearch(cat.name);            // hneď spustíš vyhľadávanie (môže byť aj "" ak chceš len podľa kategórie)
    setOpen(false);
    };


  const showInfo = (cat: Category) => {
    Swal.fire({
      title: cat.name,
      text: cat.description,
      icon: "info",
      confirmButtonText: "OK",
    });
  };

return (
  <div className="w-full max-w-4xl mx-auto">
    <div className="relative overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))/0.9] shadow-[0_22px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl">
      {/* soft glow blobs */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--primary))/0.18,transparent_60%)]" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,hsl(var(--accent))/0.9,transparent_65%)]" />

      {/* HEADER */}
      <div className="relative px-8 pt-4 pb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[hsl(var(--muted-foreground))]">
            Smart literature search
          </p>
          <h2 className="mt-1 text-xl sm:text-2xl font-semibold text-[hsl(var(--foreground))]">
            Find articles in a few keystrokes
          </h2>
        </div>

        {selectedCategory && (
          <div className="mt-3 sm:mt-0 inline-flex items-center gap-2 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--accent))] px-3 py-1.5 text-xs sm:text-[0.8rem] text-[hsl(var(--muted-foreground))] shadow-sm">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[10px] font-semibold text-[hsl(var(--primary-foreground))]">
              {selectedCategory.name.charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-[hsl(var(--foreground))]">
                {selectedCategory.name}
              </span>
              <span className="truncate">Active category</span>
            </div>
          </div>
        )}
      </div>

      {/* BODY */}
      <div className="relative border-t border-[hsl(var(--border))] px-4 sm:px-6 md:px-8 pb-5 pt-4 flex flex-col gap-4">
        {/* SEARCH BAR */}
        <form
          onSubmit={handleSubmit}
          className="group relative flex w-full items-center gap-3 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--accent))] px-4 py-3 shadow-sm transition-all focus-within:border-[hsl(var(--primary))] focus-within:shadow-[0_0_0_1px_hsl(var(--primary))]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] transition-all group-focus-within:bg-[hsl(var(--primary))] group-focus-within:text-[hsl(var(--primary-foreground))]">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </div>

          <div className="flex-1 flex flex-col">
            <Input
              placeholder="Search by title, author, DOI, keyword…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 border-none bg-transparent px-0 text-[0.95rem] text-[hsl(var(--foreground))] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <p className="mt-0.5 text-[0.7rem] text-[hsl(var(--muted-foreground))]">
              Press Enter or click Search to explore relevant articles.
            </p>
          </div>

          <Button
            type="submit"
            className="ml-1 h-10 whitespace-nowrap rounded-xl bg-[hsl(var(--primary))] px-4 text-[0.9rem] font-semibold text-[hsl(var(--primary-foreground))] shadow-md transition-transform hover:translate-y-0.5 hover:shadow-lg active:translate-y-0"
          >
            Search
          </Button>
        </form>

        {/* CATEGORY + HINT ROW */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {/* CATEGORY SELECTOR */}
          <div className="w-full sm:w-72">
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex h-11 w-full items-center justify-between rounded-xl border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-[0.9rem] font-normal text-[hsl(var(--foreground))] shadow-sm hover:bg-[hsl(var(--muted))]"
                >
                  <span className="truncate">
                    {selectedCategory ? selectedCategory.name : "Filter by discipline"}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[320px] overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-0 shadow-2xl">
                <Command>
                  <CommandInput
                    placeholder="Search categories…"
                    className="border-b border-[hsl(var(--border))] bg-transparent text-[0.9rem] placeholder:text-[hsl(var(--muted-foreground))]"
                  />
                  <CommandList className="max-h-64">
                    <CommandEmpty className="py-4 text-center text-[0.85rem] text-[hsl(var(--muted-foreground))]">
                      No categories found.
                    </CommandEmpty>
                    <CommandGroup heading="Categories">
                      {categories.map((cat) => (
                    <CommandItem
                    key={cat.id}
                    value={cat.name}
                    onSelect={() => onCategoryPick(cat)}
                    className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[0.9rem]
                                aria-selected:bg-red-300
                                aria-selected:text-[hsl(var(--foreground))]"
                    >

                          <div className="flex items-center gap-2">
                            <Check
                              className={`h-4 w-4 shrink-0 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--accent))] p-[2px] transition-all ${
                                selectedCategory?.id === cat.id
                                  ? "opacity-100 text-[hsl(var(--primary))]"
                                  : "opacity-0"
                              }`}
                            />
                            <span className="truncate">{cat.name}</span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              showInfo(cat);
                            }}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-transparent text-[hsl(var(--muted-foreground))] transition-colors hover:border-[hsl(var(--border))] hover:bg-[hsl(var(--accent))]"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <p className="text-[0.7rem] text-[hsl(var(--muted-foreground))]">
            Categories help you focus on a specific scientific field. You can change them at any time.
          </p>
        </div>
      </div>
    </div>
  </div>
);




};

export default SearchPanel;
