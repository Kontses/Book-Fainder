import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { BookLists } from "@/components/profile/BookLists";

interface UserBook {
  id: string;
  book_title: string;
  book_author: string;
  book_description: string;
  book_year: string;
  book_cover_url: string;
}

const Profile = () => {
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null); // New state for profile user
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { nickname } = useParams();

  useEffect(() => {
    fetchUserProfileAndBooks();
  }, [nickname]); // Re-run effect when nickname changes

  const fetchUserProfileAndBooks = async () => {
    setLoading(true);
    let currentUserId: string | null = null;

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser) {
      currentUserId = currentUser.id;
    }

    if (!nickname) {
      if (currentUserId) {
        // If no nickname in URL, navigate to current user's profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', currentUserId)
          .single();
        if (profileError || !profileData) {
          toast.error(t('profileNotFound'));
          navigate("/");
          setLoading(false);
          return;
        }
        navigate(`/profile/${profileData.nickname}`);
        return;
      } else {
        toast.error(t('mustSignIn'));
        navigate("/");
        setLoading(false);
        return;
      }
    }

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, nickname')
        .eq('nickname', nickname)
        .single();

      if (profileError || !profileData) {
        toast.error(t('profileNotFound'));
        navigate("/");
        return;
      }
      setProfileUser(profileData);

      const { data, error } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', profileData.id);

      if (error) {
        throw error;
      }
      setUserBooks(data || []);
    } catch (error: any) {
      console.error('Error fetching user profile or books:', error.message);
      toast.error(`${t('failedSearch')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
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

  const handleDeleteBook = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('user_books')
        .delete()
        .eq('id', bookId);

      if (error) {
        throw error;
      }
      toast.success(t('bookSaved'));
      fetchUserProfileAndBooks(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting book:', error.message);
      toast.error(`${t('failedSave')}: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/30">
        <p className="text-lg text-foreground">{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-serif font-bold text-primary">Book Fainder</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <Button variant="ghost" onClick={handleSignOut} className="hover:bg-primary/10 hover:text-primary transition-colors">
              <LogOut className="mr-2 h-5 w-5" />
              {t('signOut')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground mb-4">
            {profileUser ? profileUser.nickname : t('profile')}
          </h2>
        </div>

        <Tabs defaultValue="books" className="w-full">
          <TabsList className="flex w-full justify-start overflow-x-auto whitespace-nowrap mb-8">
            <TabsTrigger value="books">{t('myBooks')}</TabsTrigger>
            <TabsTrigger value="settings">{t('profileSettings')}</TabsTrigger>
            <TabsTrigger value="lists">{t('myLists')}</TabsTrigger>
          </TabsList>

          <TabsContent value="books">
            {userBooks.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="h-20 w-20 mx-auto mb-4 opacity-40" />
                <p className="text-lg">{t('noSavedBooks')}</p>
                <p className="text-sm mt-2">{t('startSaving')}</p>
                <Button className="mt-6" onClick={() => navigate("/")}>
                  {t('startSearch')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {userBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    title={book.book_title}
                    author={book.book_author || "Άγνωστος Συγγραφέας"}
                    description={book.book_description || "Δεν υπάρχει περιγραφή."}
                    year={book.book_year || "Άγνωστο Έτος"}
                    coverUrl={book.book_cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"}
                    onSave={() => handleDeleteBook(book.id)}
                    isSaved={true} // Mark as saved
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="lists">
            <BookLists />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
