import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, User, X } from "lucide-react";

export const ProfileSettings = () => {
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setNickname(data.nickname);
      setAvatarUrl(data.avatar_url);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size (5MB)
      if (file.size > 5242880) {
        toast.error("Το αρχείο είναι πολύ μεγάλο. Μέγιστο μέγεθος: 5MB");
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error("Μη έγκυρος τύπος αρχείου. Επιτρέπονται μόνο εικόνες.");
        return;
      }

      setUploading(true);

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${user.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          avatar_url: publicUrl,
          nickname: nickname || 'user_' + user.id.substring(0, 8)
        }, { onConflict: 'id' });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Η φωτογραφία ενημερώθηκε επιτυχώς!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !avatarUrl) return;

      setUploading(true);

      // Delete from storage
      const path = avatarUrl.split('/').pop();
      if (path) {
        await supabase.storage.from('avatars').remove([`${user.id}/${path}`]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setAvatarUrl(null);
      toast.success("Η φωτογραφία διαγράφηκε επιτυχώς!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error("Το nickname δεν μπορεί να είναι κενό");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id,
          nickname: nickname.trim(),
          avatar_url: avatarUrl
        }, { onConflict: 'id' });

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          toast.error("Αυτό το nickname χρησιμοποιείται ήδη. Παρακαλώ επιλέξτε άλλο.");
        } else {
          throw error;
        }
      } else {
        toast.success(t('savedSuccessfully'));
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('editProfile')}</CardTitle>
        <CardDescription>{t('profileSettings')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar Upload Section */}
        <div className="space-y-4">
          <Label>Φωτογραφία Προφίλ</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt="Profile" />
              ) : (
                <AvatarFallback>
                  <User className="h-12 w-12" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Ανέβασμα..." : "Ανέβασμα Φωτογραφίας"}
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAvatar}
                  disabled={uploading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Διαγραφή Φωτογραφίας
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Επιτρέπονται μόνο εικόνες (JPEG, PNG, WebP, GIF) μέχρι 5MB
          </p>
        </div>

        {/* Nickname Section */}
        <div className="space-y-2">
          <Label htmlFor="nickname">{t('nickname')}</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('nickname') as string}
          />
          <p className="text-sm text-muted-foreground">
            Το nickname πρέπει να είναι μοναδικό
          </p>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {t('saveChanges')}
        </Button>
      </CardContent>
    </Card>
  );
};
