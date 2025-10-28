import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface BookList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export const BookLists = () => {
  const [lists, setLists] = useState<BookList[]>([]);
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('book_lists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setLists(data);
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
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold">{list.name}</h3>
                  {list.description && (
                    <p className="text-sm text-muted-foreground">{list.description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteList(list.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
