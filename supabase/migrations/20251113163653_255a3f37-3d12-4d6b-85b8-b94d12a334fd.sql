-- Update the trigger function to set newsletter_subscribed to true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nickname, newsletter_subscribed)
  VALUES (NEW.id, 'user_' || substring(NEW.id::text, 1, 8), true);
  RETURN NEW;
END;
$function$;