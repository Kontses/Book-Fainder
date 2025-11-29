import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, ShoppingCart, Plus } from "lucide-react";
import { toast } from "sonner";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface BookList {
  id: string;
  name: string;
}

interface BookCardProps {
  title: string;
  author: string;
  description: string;
  year?: string;
  coverUrl?: string;
  isbn?: string;
  onSave?: (book: Omit<BookCardProps, 'onSave' | 'variant'>) => void;
  isSaved?: boolean;
  variant?: "default" | "compact";
}

export const BookCard = ({ title, author, description, year, coverUrl, isbn, onSave, isSaved = false, variant = "default" }: BookCardProps) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [userLists, setUserLists] = useState<BookList[]>([]);
  const [isHoverOpen, setIsHoverOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const bookDetails = { title, author, description, year, coverUrl };

  // Proper HTML parsing to preserve spaces
  const cleanedDescription = (() => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(description, 'text/html');
      return doc.body.textContent || description;
    } catch {
      return description.replaceAll(/<[^>]*>/g, ' ').replaceAll(/\s+/g, ' ');
    }
  })();

  useEffect(() => {
    fetchUserLists();
  }, []);

  const fetchUserLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('book_lists')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setUserLists(data);
  };

  // Amazon Affiliate configuration
  const AMAZON_AFFILIATE_TAG = import.meta.env.VITE_AMAZON_AFFILIATE_TAG || 'your-tag-20';

  const getAmazonLink = () => {
    // Clean ISBN by removing any non-alphanumeric characters
    const cleanISBN = isbn?.replace(/[^0-9X]/gi, '');

    let searchQuery = '';

    if (cleanISBN && cleanISBN.length >= 10) {
      // Use cleaned ISBN for search
      searchQuery = cleanISBN;
    } else {
      // Fall back to title and author, but clean them up first
      // 1. Title: Take text before first slash or parenthesis to avoid "Title / Translated Title" or "Title (Series)"
      const cleanTitle = title.split(/[\/\(]/)[0].trim();

      // 2. Author: Remove dates (e.g., "1909-2004") and special chars
      const cleanAuthor = author.replace(/\d{4}-\d{4}/g, '').replace(/[^\w\s,.-]/g, '').trim();

      searchQuery = `${cleanTitle} ${cleanAuthor}`;
    }

    return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}&tag=${AMAZON_AFFILIATE_TAG}`;
  };

  // Apple Books Affiliate configuration
  const APPLE_AFFILIATE_TOKEN = import.meta.env.VITE_APPLE_AFFILIATE_TOKEN || '1000l3dlk';

  const getAppleBooksLink = () => {
    // Clean ISBN by removing any non-alphanumeric characters
    const cleanISBN = isbn?.replace(/[^0-9X]/gi, '');

    let searchQuery = '';

    if (cleanISBN && cleanISBN.length >= 10) {
      searchQuery = cleanISBN;
    } else {
      const cleanTitle = title.split(/[\/\(]/)[0].trim();
      const cleanAuthor = author.replace(/\d{4}-\d{4}/g, '').replace(/[^\w\s,.-]/g, '').trim();
      searchQuery = `${cleanTitle} ${cleanAuthor}`;
    }

    return `https://books.apple.com/us/search?term=${encodeURIComponent(searchQuery)}&at=${APPLE_AFFILIATE_TOKEN}`;
  };

  const handleAddToList = async (listId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // First, save the book if not already saved
      if (!isSaved) {
        const { error: saveError } = await supabase
          .from('user_books')
          .insert({
            user_id: user.id,
            book_title: title,
            book_author: author,
            book_description: description,
            book_year: year,
            book_cover_url: coverUrl,
          });

        if (saveError) throw saveError;
      }

      // Get the book_id from user_books
      const { data: bookData } = await supabase
        .from('user_books')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_title', title)
        .single();

      if (!bookData) throw new Error('Book not found');

      // Add to list
      const { error } = await supabase
        .from('list_books')
        .insert({
          list_id: listId,
          book_id: bookData.id,
        });

      if (error) throw error;

      toast.success('Added to list!');
      setIsHoverOpen(false);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 600);

      // Trigger save callback to update UI
      if (onSave) {
        onSave(bookDetails);
      }
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('Book already in this list');
      } else {
        toast.error(`Error: ${error.message}`);
      }
    }
  };



  const isCompact = variant === "compact";

  return (
    <Card className={cn(
      "relative transition-all duration-300 hover:shadow-elegant hover:scale-[1.02] hover:z-50 border-border/50 bg-card/80 backdrop-blur-sm",
      isCompact ? "min-h-0 pb-4" : "pb-6"
    )}>
      <div className={cn(
        "flex",
        isCompact ? "flex-row gap-4 p-4" : "flex-col sm:flex-row"
      )}>
        {coverUrl && (
          <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogTrigger asChild>
              <div className={cn(
                "flex-shrink-0 cursor-pointer hover:opacity-90 transition-all duration-300 overflow-hidden group",
                isCompact ? "w-24 h-36" : "w-48 h-64"
              )}>
                <img
                  src={coverUrl}
                  alt={`Εξώφυλλο: ${title}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <div className="flex items-center justify-center p-4">
                <img
                  src={coverUrl}
                  alt={`Εξώφυλλο: ${title}`}
                  className="max-h-[80vh] w-auto object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
        <div className="flex-1 flex flex-col">
          <CardHeader className={cn("p-0", isCompact ? "pb-2" : "p-4 pb-3")}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className={cn(
                  "font-serif text-primary mb-1",
                  isCompact ? "text-base line-clamp-2" : "text-xl line-clamp-2"
                )}>
                  {title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-1">
                  {author} {year && `• ${year}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">

                {onSave && (
                  <HoverCard open={isHoverOpen} onOpenChange={setIsHoverOpen} openDelay={200} closeDelay={300}>
                    <HoverCardTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "transition-all duration-300",
                          isSaved ? "text-red-500 bg-red-500/20" : "text-red-500 hover:bg-red-500/20"
                        )}
                      >
                        <Heart
                          className={cn(
                            isCompact ? "h-4 w-4" : "h-5 w-5",
                            justSaved && "animate-heart-pop"
                          )}
                          fill={isSaved ? "currentColor" : "none"}
                        />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64 bg-popover/95 backdrop-blur-sm z-50" side="bottom" align="end">
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Save to:</h4>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            onSave(bookDetails);
                            setIsHoverOpen(false);
                            setJustSaved(true);
                            setTimeout(() => setJustSaved(false), 600);
                          }}
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          {isSaved ? 'Remove from' : 'Add to'} My Books
                        </Button>
                        {userLists.length > 0 && (
                          <>
                            <div className="border-t pt-2">
                              <p className="text-xs text-muted-foreground mb-2">Add to list:</p>
                              <div className="space-y-1 max-h-48 overflow-y-auto">
                                {userLists.map((list) => (
                                  <Button
                                    key={list.id}
                                    variant="ghost"
                                    className="w-full justify-start text-sm"
                                    onClick={() => handleAddToList(list.id)}
                                  >
                                    <Plus className="mr-2 h-3 w-3" />
                                    {list.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className={cn("p-0 flex-1 flex flex-col justify-between", !isCompact && "px-4")}>
            {isCompact ? (
              <p className="text-foreground/80 leading-relaxed text-sm line-clamp-3 mb-3">
                {cleanedDescription}
              </p>
            ) : (
              <ScrollArea className="flex-1 pr-2 mb-4">
                <p className="text-foreground/80 leading-relaxed text-sm">
                  {cleanedDescription}
                </p>
              </ScrollArea>
            )}
            <div className="grid grid-cols-2 gap-2 mt-auto">
              <Button
                className={cn(
                  "w-full bg-[#FF9900] hover:bg-[#FF9900]/90 text-black font-semibold transition-all duration-300 hover:shadow-lg",
                  isCompact && "text-sm py-2"
                )}
                onClick={() => window.open(getAmazonLink(), '_blank', 'noopener,noreferrer')}
              >
                <ShoppingCart className={cn("mr-2", isCompact ? "h-4 w-4" : "h-5 w-5")} />
                Amazon
              </Button>
              <Button
                className={cn(
                  "w-full bg-black hover:bg-black/90 text-white font-semibold transition-all duration-300 hover:shadow-lg",
                  isCompact && "text-sm py-2"
                )}
                onClick={() => window.open(getAppleBooksLink(), '_blank', 'noopener,noreferrer')}
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className={cn("mr-2 fill-current", isCompact ? "h-4 w-4" : "h-5 w-5")}
                >
                  <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.127 3.688-.543 9.138 1.519 12.153 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
                </svg>
                Apple Books
              </Button>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};
