import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Language {
  id: string;
  name: string;
  iso_code: string;
}

export const LanguagePreferences = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    fetchLanguages();
    fetchUserLanguages();
  }, []);

  const fetchLanguages = async () => {
    const { data, error } = await supabase
      .from('languages')
      .select('*')
      .order('name');

    if (data) setLanguages(data);
  };

  const fetchUserLanguages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_languages')
      .select('language_id')
      .eq('user_id', user.id);

    if (data) {
      setSelectedLanguages(data.map(l => l.language_id));
    }
  };

  const handleToggleLanguage = async (languageId: string, checked: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      if (checked) {
        const { error } = await supabase
          .from('user_languages')
          .insert({ user_id: user.id, language_id: languageId });
        if (error) throw error;
        setSelectedLanguages([...selectedLanguages, languageId]);
      } else {
        const { error } = await supabase
          .from('user_languages')
          .delete()
          .eq('user_id', user.id)
          .eq('language_id', languageId);
        if (error) throw error;
        setSelectedLanguages(selectedLanguages.filter(id => id !== languageId));
      }
      toast.success(t('savedSuccessfully'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('languagePreferences')}</CardTitle>
        <CardDescription>{t('selectLanguages')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {languages.map((language) => (
            <div key={language.id} className="flex items-center space-x-2">
              <Checkbox
                id={language.id}
                checked={selectedLanguages.includes(language.id)}
                onCheckedChange={(checked) => handleToggleLanguage(language.id, checked as boolean)}
              />
              <label
                htmlFor={language.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {language.name}
              </label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
