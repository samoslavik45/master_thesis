import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown, Info, Check } from "lucide-react";
import Swal from "sweetalert2";

interface Category {
  id: number;
  name: string;
  description: string;
}

interface CategorySearchProps {
  onCategorySelect: (categoryId: number) => void;
}

const CategorySearch: React.FC<CategorySearchProps> = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/categories/");
        if (!response.ok) {
          throw new Error(
            "Failed to fetch categories. Status: " + response.status
          );
        }
        const data = (await response.json()) as Category[];
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      }
    };

    fetchCategories();
  }, []);

  const handleShowInfo = (category: Category) => {
    Swal.fire({
      title: category.name,
      text: category.description,
      icon: "info",
      confirmButtonText: "OK",
    });
  };

  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    onCategorySelect(category.id);
    setOpen(false);
  };

return (
  <div className="w-full max-w-2xl mx-auto mt-4">
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="
            w-full justify-between rounded-xl 
            bg-[hsl(var(--accent))]
            border border-[hsl(var(--border))]
            text-[hsl(var(--foreground))]
            hover:bg-[hsl(var(--muted))]
            transition
          "
        >
          {selectedCategory ? selectedCategory.name : "Filter by category"}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="
          w-full p-0 
          rounded-xl
          bg-[hsl(var(--card))]
          border border-[hsl(var(--border))]
          shadow-lg
        "
      >
        <Command>
          <CommandInput
            placeholder="Search categories..."
            className="
              text-[hsl(var(--foreground))]
              bg-[hsl(var(--input))]
              border-b border-[hsl(var(--border))]
            "
          />

          <CommandList>
            <CommandEmpty
              className="py-3 text-center text-[hsl(var(--muted-foreground))]"
            >
              No categories found.
            </CommandEmpty>

            <CommandGroup heading="Categories">
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  onSelect={() => handleSelectCategory(category)}
                  className="
                    flex items-center justify-between gap-3
                    text-[hsl(var(--foreground))]
                    hover:bg-[hsl(var(--muted))]
                    rounded-lg
                    cursor-pointer
                  "
                >
                  <div className="flex items-center gap-2">
                    <Check
                      className={`h-4 w-4 ${
                        selectedCategory?.id === category.id
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                    <span>{category.name}</span>
                  </div>

                  {/* INFO BUTTON */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShowInfo(category);
                    }}
                    className="
                      inline-flex items-center justify-center
                      rounded-full p-1
                      hover:bg-[hsl(var(--accent))]
                      transition
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
);

};

export default CategorySearch;
