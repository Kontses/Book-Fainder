import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ListDetail } from "./ListDetail";
import { ListThumbnail } from "./ListThumbnail";

interface BookList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  covers?: string[];
}

export const BookLists = () => {
  const [lists, setLists] = useState<BookList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<{ id: string; name: string } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      // Fetch lists
      const { data: listsData, error: listsError } = await supabase
        .from('book_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      if (listsData) {
        // Fetch covers for each list
        const listsWithCovers = await Promise.all(listsData.map(async (list) => {
          const { data: booksData } = await supabase
            .from('list_books')
            .select(`
              user_books (
                book_cover_url
              )
            `)
            .eq('list_id', list.id)
            .limit(3); // Only need top 3

          const covers = booksData
            ?.map((item: any) => item.user_books?.book_cover_url)
            .filter(Boolean) || [];

          return { ...list, covers };
        }));

        setLists(listsWithCovers);
      }
    } catch (error: any) {
      console.error('Error fetching lists:', error);
      toast.error(t('failedSearch'));
    }
  };

  const handleCreateList = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('book_lists')
        .insert({
          user_id: user.id,
          name: newListName,
          description: newListDescription || null,
        });

      if (error) throw error;
      toast.success(t('savedSuccessfully'));
      setNewListName("");
      setNewListDescription("");
      setOpen(false);
      fetchLists();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('book_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;
      toast.success(t('savedSuccessfully'));
      fetchLists();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (selectedList) {
    return (
      <ListDetail
        listId={selectedList.id}
        listName={selectedList.name}
        onBack={() => {
          setSelectedList(null);
          fetchLists(); // Refresh to update thumbnails if changed
        }}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('myLists')}</CardTitle>
            <CardDescription>{t('createList')}</CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createNewList')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('createNewList')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="listName">{t('listName')}</Label>
                  <Input
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder={t('listName') as string}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="listDescription">{t('listDescription')}</Label>
                  <Textarea
                    id="listDescription"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder={t('listDescription') as string}
                  />
                </div>
                <Button onClick={handleCreateList} className="w-full">
                  {t('createNewList')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lists.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('noSavedBooks')}
            </p>
          ) : (
            lists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => setSelectedList({ id: list.id, name: list.name })}
              >
                <div className="flex items-center flex-1">
                  {/* Thumbnail */}
                  <ListThumbnail coverUrls={list.covers || []} />

                  <div className="ml-2">
                    <h3 className="font-semibold">{list.name}</h3>
                    {list.description && (
                      <p className="text-sm text-muted-foreground">{list.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteList(list.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
