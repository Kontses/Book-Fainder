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
import { useTypewriter } from "@/hooks/useTypewriter";

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

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
          <Button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="w-full md:w-auto bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity text-primary-foreground shadow-elegant"
            size="lg"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            {isLoading ? t('searching') as string : t('suggestMeBook') as string}
          </Button>

          <div className="flex items-center space-x-2 bg-card/50 p-2 rounded-lg border border-border/50 backdrop-blur-sm">
            <TooltipProvider>
              <div className="flex items-center space-x-2">
                <Switch
                  id="search-mode"
                  checked={searchMode === 'precise'}
                  onCheckedChange={(checked) => setSearchMode(checked ? 'precise' : 'fast')}
                />
                <Label htmlFor="search-mode" className="text-sm font-medium cursor-pointer grid grid-cols-1 items-center">
                  {/* Visible content */}
                  <span className="col-start-1 row-start-1 flex items-center gap-2">
                    {searchMode === 'precise' ? (
                      <>
                        <Target className="h-4 w-4 text-primary" />
                        {t('deepSearchTitle')}
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 text-yellow-500" />
                        {t('fastSearchTitle')}
                      </>
                    )}
                  </span>

                  {/* Spacers to reserve width */}
                  <span className="col-start-1 row-start-1 flex items-center gap-2 opacity-0 pointer-events-none invisible" aria-hidden="true">
                    <Target className="h-4 w-4" />
                    {t('deepSearchTitle')}
                  </span>
                  <span className="col-start-1 row-start-1 flex items-center gap-2 opacity-0 pointer-events-none invisible" aria-hidden="true">
                    <Zap className="h-4 w-4" />
                    {t('fastSearchTitle')}
                  </span>
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
                        <strong>{t('deepSearchTitle')}:</strong> {t('deepSearchDesc')}
                      </p>
                    ) : (
                      <p className="max-w-xs">
                        <strong>{t('fastSearchTitle')}:</strong> {t('fastSearchDesc')}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </form>
  );
};
