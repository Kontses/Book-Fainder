import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Globe, Lock } from "lucide-react";
import { BookCard } from "@/components/BookCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface Book {
  id: string;
  book_title: string;
  book_author: string;
  book_description: string;
  book_year: string;
  book_cover_url: string;
}

interface ListDetailProps {
  listId: string;
  listName: string;
  onBack: () => void;
}

export const ListDetail = ({ listId, listName, onBack }: ListDetailProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublic, setIsPublic] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    fetchListBooks();
    fetchListVisibility();
  }, [listId]);

  const fetchListVisibility = async () => {
    try {
      const { data, error } = await supabase
        .from('book_lists')
        .select('is_public')
        .eq('id', listId)
        .single();

      if (error) throw error;
      setIsPublic((data as any)?.is_public ?? true);
    } catch (error: any) {
      console.error('Error fetching list visibility:', error);
    }
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    try {
      const { error } = await supabase
        .from('book_lists')
        .update({ is_public: checked })
        .eq('id', listId);

      if (error) throw error;
      
      setIsPublic(checked);
      toast.success(checked ? t('listNowPublic') : t('listNowPrivate'));
    } catch (error: any) {
      console.error('Error updating list visibility:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  const fetchListBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('list_books')
        .select(`
          book_id,
          user_books (
            id,
            book_title,
            book_author,
            book_description,
            book_year,
            book_cover_url
          )
        `)
        .eq('list_id', listId);

      if (error) throw error;

      // Extract books from the nested structure
      const booksList = data
        ?.map(item => item.user_books)
        .filter(Boolean)
        .flat() as Book[];

      setBooks(booksList || []);
    } catch (error: any) {
      console.error('Error fetching list books:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('list_books')
        .delete()
        .eq('list_id', listId)
        .eq('book_id', bookId);

      if (error) throw error;
      
      toast.success('Removed from list');
      fetchListBooks();
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('loading')}</div>;
  }

  return (
    <div>
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('back') || 'Back'}
      </Button>
      
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-serif font-bold">{listName}</h2>
        
        <div className="flex items-center gap-3">
          {isPublic ? (
            <Globe className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
          <Label htmlFor="list-visibility" className="text-sm font-normal cursor-pointer">
            {t('publicList')}
          </Label>
          <Switch
            id="list-visibility"
            checked={isPublic}
            onCheckedChange={handleVisibilityToggle}
            className="scale-75"
          />
        </div>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t('noSavedBooks')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {books.map((book) => (
            <BookCard
              key={book.id}
              title={book.book_title}
              author={book.book_author || "Unknown Author"}
              description={book.book_description || "No description available."}
              year={book.book_year || "Unknown Year"}
              coverUrl={book.book_cover_url || "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"}
              onSave={() => handleRemoveFromList(book.id)}
              isSaved={true}
              variant="compact"
            />
          ))}
        </div>
      )}
    </div>
  );
};