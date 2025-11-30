import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Dices } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTypewriter } from "@/hooks/useTypewriter";

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
    }
  };

  const handleRandomPrompt = () => {
    const prompts = t('randomPrompts');
    if (Array.isArray(prompts)) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setQuery(randomPrompt);
    }
  };



  // ... inside component
  const placeholderText = t('searchPlaceholder') as string;
  const animatedPlaceholder = useTypewriter({
    text: placeholderText,
    speed: 30, // Slightly faster typing
    delay: 500 // Start after half a second
  });

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <div className="relative">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={animatedPlaceholder}
            className="min-h-[120px] pr-12 text-base resize-none bg-card/80 backdrop-blur-sm border-border/50 focus:border-primary transition-colors"
            disabled={isLoading}
          />
          <Button
            type="button"
            onClick={handleRandomPrompt}
            disabled={isLoading}
            variant="ghost"
            size="icon"
            className="absolute bottom-2 right-2 text-primary hover:text-primary-glow hover:bg-primary/10"
          >
            <Dices className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex justify-center mt-4">
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full md:w-auto bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity text-primary-foreground shadow-elegant"
            size="lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {isLoading ? t('searching') as string : t('suggestMeBook') as string}
          </Button>
        </div>
      </div>
    </form>
  );
};
