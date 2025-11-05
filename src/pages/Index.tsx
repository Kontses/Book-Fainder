import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { BookOpen, User, LogOut } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [currentBook, setCurrentBook] = useState<any>(null);
  const [previousBookIds, setPreviousBookIds] = useState<string[]>([]);
  const [session, setSession] = useState<any>(null);
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    })

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthClick = () => {
    navigate("/auth");
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success(t('signedOut'));
      navigate("/");
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast.error(`${t('failedSignOut')}: ${error.message}`);
    }
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: query, previousBookIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to search for books');
      }

      const data = await response.json();
      
      if (data.book) {
        const bookId = data.book.isbn13 || data.book.isbn;
        if (bookId) {
          setPreviousBookIds(prev => [...prev, bookId]);
        }
        
        const originalDescription = data.book.synopsis || "No description available.";
        let translatedDescription = originalDescription;

        // Translate description if language is not English
        if (language !== 'en') {
          try {
            const translateResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate-description`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                description: originalDescription, 
                targetLanguage: language 
              }),
            });

            if (translateResponse.ok) {
              const translateData = await translateResponse.json();
              translatedDescription = translateData.translatedDescription || originalDescription;
            } else {
              console.error('Translation failed, using original description');
            }
          } catch (translateError) {
            console.error('Error translating description:', translateError);
          }
        }
        
        // Trigger exit animation if there's a current book, right before showing new one
        if (currentBook) {
          setIsExiting(true);
          // Wait for exit animation to complete
          await new Promise(resolve => setTimeout(resolve, 400));
        }
        
        setCurrentBook({
          title: data.book.title,
          author: data.book.authors?.[0] || "Unknown Author",
          description: translatedDescription,
          year: data.book.date_published || "Unknown",
          coverUrl: data.book.image || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
          isbn: data.book.isbn13 || data.book.isbn
        });
        setIsExiting(false);
        toast.success(t('foundBook') as string);
      } else {
        toast.error(t('noBooks') as string);
      }
    } catch (error) {
      console.error('Error searching for books:', error);
      toast.error(t('failedSearch') as string);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveBook = async (book: Omit<any, 'onSave'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error(t('mustSignIn'));
      return;
    }

    try {
      const { error } = await supabase
        .from('user_books')
        .insert({
          user_id: user.id,
          book_title: book.title,
          book_author: book.author,
          book_description: book.description,
          book_year: book.year,
          book_cover_url: book.coverUrl,
        });

      if (error) {
        throw error;
      }
      toast.success(t('bookSaved'));
    } catch (error: any) {
      console.error('Error saving book:', error.message);
      toast.error(`${t('failedSave')}: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-primary">Book Fainder</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {session ? (
              <>
                <Button variant="ghost" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-5 w-5" />
                  {t('profile')}
                </Button>
                <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-5 w-5" />
                  {t('signOut')}
                </Button>
              </>
            ) : (
              <Button variant="outline" className="hover:bg-primary/10 hover:text-primary transition-colors" onClick={handleAuthClick}>
                <User className="mr-2 h-5 w-5" />
                {t('loginRegister')}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4">
            {t('discoverYourNextBook')}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('describeBookAI')}
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>

        {/* Results Section */}
        {currentBook && (
          <div 
            className={`max-w-4xl mx-auto transition-all duration-500 ${
              isExiting 
                ? 'opacity-0 scale-95 -translate-y-8' 
                : 'opacity-100 scale-100 translate-y-0 animate-in fade-in slide-in-from-bottom-8'
            }`}
            style={{
              animation: isExiting ? 'none' : undefined
            }}
          >
            <h3 className="text-2xl font-serif font-semibold text-foreground mb-6 text-center">
              {t('ourRecommendation')}
            </h3>
            <BookCard
              title={currentBook.title}
              author={currentBook.author}
              description={currentBook.description}
              year={currentBook.year}
              coverUrl={currentBook.coverUrl}
              isbn={currentBook.isbn}
              onSave={handleSaveBook}
            />
          </div>
        )}

        {/* Empty State */}
        {!currentBook && !isSearching && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="h-20 w-20 mx-auto mb-4 opacity-40" />
            <p className="text-lg">{t('startSearch')}</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
