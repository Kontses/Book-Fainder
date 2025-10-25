import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { BookOpen, User } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [currentBook, setCurrentBook] = useState<any>(null);

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query }),
      });

      if (!response.ok) {
        throw new Error('Failed to search for books');
      }

      const data = await response.json();
      
      if (data.book) {
        setCurrentBook({
          title: data.book.title,
          author: data.book.authors?.[0] || "Unknown Author",
          description: data.book.synopsis || "No description available.",
          year: data.book.date_published || "Unknown",
          coverUrl: data.book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
        });
        toast.success("Found the perfect book for you!");
      } else {
        toast.error("No books found matching your criteria. Try a different search!");
      }
    } catch (error) {
      console.error('Error searching for books:', error);
      toast.error("Failed to search for books. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveBook = () => {
    toast.success("Book added to your favorites!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-primary">Book Fainder</h1>
          </div>
          <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors">
            <User className="mr-2 h-5 w-5" />
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4">
            Discover your next book
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Describe the book you're looking for and AI will find the perfect recommendation for you.
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {/* Results Section */}
        {currentBook && (
          <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-2xl font-serif font-semibold text-foreground mb-6 text-center">
              Our recommendation for you
            </h3>
            <BookCard
              title={currentBook.title}
              author={currentBook.author}
              description={currentBook.description}
              year={currentBook.year}
              coverUrl={currentBook.coverUrl}
              onSave={handleSaveBook}
            />
          </div>
        )}

        {/* Empty State */}
        {!currentBook && !isSearching && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-20 w-20 mx-auto mb-4 opacity-40" />
            <p className="text-lg">Start your search above</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
