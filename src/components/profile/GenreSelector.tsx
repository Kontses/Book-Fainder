import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Genre {
  id: string;
  name: string;
}

export const GenreSelector = () => {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetchGenres();
    fetchUserGenres();
  }, []);

  const fetchGenres = async () => {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .order('name');

    if (data) setGenres(data);
  };

  const fetchUserGenres = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Ensure profile exists
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, nickname: 'user_' + user.id.substring(0, 8) }, { onConflict: 'id' });

    const { data } = await supabase
      .from('user_genres')
      .select('genre_id')
      .eq('user_id', user.id);

    if (data) {
      setSelectedGenres(data.map(g => g.genre_id));
    }
  };

  const handleToggleGenre = async (genreId: string, checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (checked) {
        const { error } = await supabase
          .from('user_genres')
          .insert({ user_id: user.id, genre_id: genreId });
        if (error) throw error;
        setSelectedGenres([...selectedGenres, genreId]);
      } else {
        const { error } = await supabase
          .from('user_genres')
          .delete()
          .eq('user_id', user.id)
          .eq('genre_id', genreId);
        if (error) throw error;
        setSelectedGenres(selectedGenres.filter(id => id !== genreId));
      }
      toast.success(t('savedSuccessfully'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('genrePreferences')}</CardTitle>
        <CardDescription>{t('selectGenres')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {genres.map((genre) => (
            <div key={genre.id} className="flex items-center space-x-2">
              <Checkbox
                id={genre.id}
                checked={selectedGenres.includes(genre.id)}
                onCheckedChange={(checked) => handleToggleGenre(genre.id, checked as boolean)}
              />
              <label
                htmlFor={genre.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {genre.name}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
