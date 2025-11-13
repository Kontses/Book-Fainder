-- Update default value for newsletter_subscribed to true
ALTER TABLE public.profiles 
ALTER COLUMN newsletter_subscribed SET DEFAULT true;