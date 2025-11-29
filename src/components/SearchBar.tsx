import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sparkles, Dices, Zap, Target } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface SearchBarProps {
  onSearch: (query: string, mode: 'fast' | 'precise') => void;
  isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<'fast' | 'precise'>('precise');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, searchMode);
    }
  };

  const handleRandomPrompt = () => {
    const prompts = t('randomPrompts');
    if (Array.isArray(prompts)) {
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
      setQuery(randomPrompt);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
      <div className="relative">
        <div className="relative">
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder') as string}
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

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <div className="flex items-center space-x-2 bg-card/50 p-2 rounded-lg border border-border/50 backdrop-blur-sm">
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Switch
                  id="search-mode"
                  checked={searchMode === 'precise'}
                  onCheckedChange={(checked) => setSearchMode(checked ? 'precise' : 'fast')}
                />
                <Label htmlFor="search-mode" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                  {searchMode === 'precise' ? (
                    <>
                      <Target className="h-4 w-4 text-primary" />
                      Deep Search
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Fast Search
                    </>
                  )}
                </Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="cursor-help ml-1 text-muted-foreground hover:text-foreground transition-colors">
                      <span className="sr-only">Info</span>
                      <span className="text-xs border border-muted-foreground/30 rounded-full w-4 h-4 inline-flex items-center justify-center">?</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {searchMode === 'precise' ? (
                      <p className="max-w-xs">
                        <strong>Deep Search:</strong> Uses advanced AI to analyze all results and pick the absolute best match for your query. Slower but more accurate.
                      </p>
                    ) : (
                      <p className="max-w-xs">
                        <strong>Fast Search:</strong> Quickly finds matching books and selects one at random. Skips deep AI analysis for speed.
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>

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
