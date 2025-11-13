import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { Upload, User, X } from "lucide-react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";

const nicknameSchema = z.string().min(1, "Nickname cannot be empty").max(50, "Nickname too long").regex(/^[a-zA-Z0-9_\s]+$/, "Nickname can only contain letters, numbers, spaces and underscores");

interface ProfileSettingsProps {
  profileUser?: any;
  onProfileUpdate?: () => void;
}

export const ProfileSettings = ({ profileUser, onProfileUpdate }: ProfileSettingsProps) => {
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('nickname, avatar_url, newsletter_subscribed')
      .eq('id', user.id)
      .maybeSingle();

    if (data) {
      setNickname(data.nickname);
      setAvatarUrl(data.avatar_url);
      setNewsletterSubscribed(data.newsletter_subscribed ?? true);
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
        toast.error(t('fileTooLarge') as string);
        return;
      }

      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
        toast.error(t('invalidFileType') as string);
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
      toast.success(t('photoUpdatedSuccess') as string);
      onProfileUpdate?.();
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
      toast.success(t('photoDeletedSuccess') as string);
      onProfileUpdate?.();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    const validation = nicknameSchema.safeParse(nickname.trim());
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
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
          nickname: validation.data,
          avatar_url: avatarUrl
        }, { onConflict: 'id' });

      if (error) {
        // Check for unique constraint violation
        if (error.code === '23505') {
          toast.error(t('nicknameInUse') as string);
        } else {
          throw error;
        }
      } else {
        toast.success(t('savedSuccessfully') as string);
        onProfileUpdate?.();
        // Navigate to the new profile URL with the updated nickname
        navigate(`/profile/${validation.data}`);
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
          <Label>{t('profilePhoto')}</Label>
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
                {uploading ? t('uploading') : t('uploadPhoto')}
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
                  {t('deletePhoto')}
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('imageRequirements')}
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
            className="max-w-sm"
          />
          <p className="text-sm text-muted-foreground">
            {t('nicknameUnique')}
          </p>
        </div>

        {/* Email Preferences Section */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-lg font-semibold">{t('emailPreferences')}</h3>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="newsletter" className="flex-1 text-sm font-normal">
              {t('receiveNewsletter')}
            </Label>
            <Switch
              id="newsletter"
              checked={newsletterSubscribed}
              onCheckedChange={setNewsletterSubscribed}
              className="scale-75"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading}>
          {t('saveChanges')}
        </Button>
      </CardContent>
    </Card>
  );
};
