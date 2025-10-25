import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe the book you're looking for... e.g. I want a mystery novel from the 1930s"
          className="min-h-[120px] pr-4 text-base resize-none bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
          disabled={isLoading}
        />
        <Button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="mt-4 w-full md:w-auto bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity text-primary-foreground shadow-elegant"
          size="lg"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          {isLoading ? "Searching..." : "Suggest me a book"}
        </Button>
      </div>
    </form>
  );
};
