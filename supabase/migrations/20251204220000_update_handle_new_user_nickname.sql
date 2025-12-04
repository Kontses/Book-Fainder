-- Update handle_new_user to generate nickname from email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  base_nickname text;
  new_nickname text;
  counter integer := 0;
BEGIN
  -- Get the part before @ from the email
  base_nickname := split_part(NEW.email, '@', 1);
  
  -- Fallback if email is missing or empty (e.g. anonymous users)
  IF base_nickname IS NULL OR base_nickname = '' THEN
    base_nickname := 'user_' || substring(NEW.id::text, 1, 8);
  END IF;

  new_nickname := base_nickname;
  
  -- Check if nickname exists and append number if needed to ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE nickname = new_nickname) LOOP
    counter := counter + 1;
    new_nickname := base_nickname || counter::text;
  END LOOP;

  INSERT INTO public.profiles (id, nickname, newsletter_subscribed)
  VALUES (NEW.id, new_nickname, true);
  
  RETURN NEW;
END;
$function$;
