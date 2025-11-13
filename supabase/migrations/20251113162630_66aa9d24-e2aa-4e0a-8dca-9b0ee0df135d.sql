-- Add newsletter_subscribed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN NOT NULL DEFAULT false;