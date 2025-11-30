import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { BookOpen, LogOut, Library, ListChecks, Users, Settings, Search, ArrowUpDown, MessageSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { BookLists } from "@/components/profile/BookLists";
import { Friends } from "@/components/profile/Friends";
import { Feedback } from "@/components/profile/Feedback";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserBook {
  id: string;
  book_title: string;
  book_author: string;
  book_description: string;
  book_year: string;
  book_cover_url: string;
  created_at: string;
}

const Profile = () => {
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [bookLists, setBookLists] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  // Search and Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { nickname } = useParams();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("books");

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['books', 'lists', 'friends', 'feedback', 'settings'].includes(hash)) {
      setActiveTab(hash);
    } else {
      setActiveTab('books');
    }
  }, [location.hash]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

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

    setIsOwnProfile(false);

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
        .select('id, nickname, avatar_url')
        .eq('nickname', nickname)
        .single();

      if (profileError || !profileData) {
        toast.error(t('profileNotFound'));
        navigate("/");
        return;
      }
      setProfileUser(profileData);
      setIsOwnProfile(currentUserId === profileData.id);

      const { data, error } = await supabase
        .from('user_books')
        .select('*')
        .eq('user_id', profileData.id);

      if (error) {
        throw error;
      }

      // Remove duplicate books (same title + author)
      const uniqueBooks = data?.reduce((acc: UserBook[], book) => {
        const isDuplicate = acc.some(
          b => b.book_title === book.book_title && b.book_author === book.book_author
        );
        if (!isDuplicate) {
          acc.push(book);
        }
        return acc;
      }, []) || [];

      setUserBooks(uniqueBooks);

      // Fetch book lists count
      const { data: listsData } = await supabase
        .from('book_lists')
        .select('*')
        .eq('user_id', profileData.id);

      setBookLists(listsData || []);
    } catch (error: any) {
      console.error('Error fetching user profile or books:', error.message);
      toast.error(`${t('failedSearch')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequestsCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('friendships')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;
      setPendingRequestsCount(count || 0);
    } catch (error) {
      console.error('Error fetching pending requests count:', error);
    }
  };

  useEffect(() => {
    if (isOwnProfile && profileUser?.id) {
      fetchPendingRequestsCount(profileUser.id);
    }
  }, [isOwnProfile, profileUser]);

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

  // Filter and Sort Logic
  const filteredAndSortedBooks = userBooks
    .filter((book) => {
      const query = searchQuery.toLowerCase();
      return (
        book.book_title?.toLowerCase().includes(query) ||
        book.book_author?.toLowerCase().includes(query) ||
        book.book_description?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "a-z":
          return a.book_title.localeCompare(b.book_title, language === 'el' ? 'el' : 'en');
        case "z-a":
          return b.book_title.localeCompare(a.book_title, language === 'el' ? 'el' : 'en');
        default:
          return 0;
      }
    });

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

      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-border shadow-lg">
              {profileUser?.avatar_url ? (
                <AvatarImage src={profileUser.avatar_url} alt={profileUser.nickname} />
              ) : (
                <AvatarFallback className="text-4xl">
                  {profileUser?.nickname?.charAt(0).toUpperCase() || '?'}
                </AvatarFallback>
              )}
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                {profileUser?.nickname || t('profile')}
              </h1>

              {/* Stats */}
              <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{userBooks.length}</span>
                  <span className="text-muted-foreground">{t('myBooks')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{bookLists.length}</span>
                  <span className="text-muted-foreground">{t('myLists')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex w-full justify-start overflow-x-auto whitespace-nowrap mb-8 bg-transparent gap-2">
            <TabsTrigger
              value="books"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 hover:bg-[hsl(var(--hover-subtle))] transition-colors"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              {t('myBooks')}
            </TabsTrigger>
            <TabsTrigger
              value="lists"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 hover:bg-[hsl(var(--hover-subtle))] transition-colors"
            >
              <ListChecks className="h-4 w-4 mr-2" />
              {t('myLists')}
            </TabsTrigger>
            <TabsTrigger
              value="friends"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 hover:bg-[hsl(var(--hover-subtle))] transition-colors relative"
            >
              <Users className="h-4 w-4 mr-2" />
              {t('friends')}
              {isOwnProfile && pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingRequestsCount}
                </span>
              )}
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger
                value="feedback"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 hover:bg-[hsl(var(--hover-subtle))] transition-colors"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('feedback') || "Feedback"}
              </TabsTrigger>
            )}
            {isOwnProfile && (
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-full px-6 hover:bg-[hsl(var(--hover-subtle))] transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                {t('profileSettings')}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="books">
            {/* Search and Sort Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'el' ? "Αναζήτηση στα βιβλία σας..." : "Search your books..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{language === 'el' ? "Πιο πρόσφατα" : "Most Recent"}</SelectItem>
                  <SelectItem value="oldest">{language === 'el' ? "Πιο παλιά" : "Oldest"}</SelectItem>
                  <SelectItem value="a-z">{language === 'el' ? "Α-Ω" : "A-Z"}</SelectItem>
                  <SelectItem value="z-a">{language === 'el' ? "Ω-Α" : "Z-A"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {userBooks.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <BookOpen className="h-20 w-20 mx-auto mb-4 opacity-40" />
                <p className="text-lg">{t('noSavedBooks')}</p>
                <p className="text-sm mt-2">{t('startSaving')}</p>
                <Button className="mt-6" onClick={() => navigate("/")}>
                  {t('startSearch')}
                </Button>
              </div>
            ) : filteredAndSortedBooks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">{language === 'el' ? "Δεν βρέθηκαν βιβλία με αυτή την αναζήτηση." : "No books found matching your search."}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredAndSortedBooks.map((book) => (
                  <BookCard
                    key={book.id}
                    title={book.book_title}
                    author={book.book_author || "Άγνωστος Συγγραφέας"}
                    description={book.book_description || "Δεν υπάρχει περιγραφή."}
                    year={book.book_year || "Άγνωστο Έτος"}
                    coverUrl={book.book_cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"}
                    onSave={() => handleDeleteBook(book.id)}
                    isSaved={true}
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="settings">
              <ProfileSettings profileUser={profileUser} onProfileUpdate={fetchUserProfileAndBooks} />
            </TabsContent>
          )}

          <TabsContent value="lists">
            <BookLists />
          </TabsContent>

          <TabsContent value="friends">
            <Friends
              userId={profileUser.id}
              isOwnProfile={isOwnProfile}
              onRequestsUpdated={() => fetchPendingRequestsCount(profileUser.id)}
            />
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="feedback">
              <Feedback nickname={profileUser?.nickname} />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Profile;
