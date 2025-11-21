import React, { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";

const SearchComponent: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

return (
  <Card
    className="
      w-full 
      max-w-2xl 
      mx-auto 
      mt-6 
      backdrop-blur-xl 
      bg-[hsl(var(--card))/0.85] 
      shadow-[0_4px_20px_rgba(0,0,0,0.05)]
      border border-[hsl(var(--border))]
      rounded-2xl
      transition
      hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)]
    "
  >
    <CardContent className="p-6">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-4 w-full"
      >

        {/* ICON */}
        <div
          className="
            w-11 
            h-11 
            flex 
            items-center 
            justify-center 
            rounded-xl
            bg-[hsl(var(--muted))]
            text-[hsl(var(--foreground))]
            border border-[hsl(var(--border))]
          "
        >
          <MagnifyingGlassIcon className="w-5 h-5" />
        </div>

        {/* INPUT */}
        <Input
          placeholder="Search scientific articles, authors, keywords..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="
            flex-1 
            h-12 
            text-base
            rounded-xl
            bg-[hsl(var(--input))]
            border border-[hsl(var(--border))]
            text-[hsl(var(--foreground))]
            focus-visible:ring-2 
            focus-visible:ring-[hsl(var(--primary))]
            transition
          "
        />

        {/* BUTTON */}
        <Button
          type="submit"
          className="
            h-12 
            px-8 
            rounded-xl 
            font-semibold
            bg-[hsl(var(--primary))]
            text-[hsl(var(--primary-foreground))]
            shadow-md
            hover:scale-[1.02]
            transition-all
          "
        >
          Search
        </Button>

      </form>
    </CardContent>
  </Card>
);

};

export default SearchComponent;
