-- Add foreign keys to friendships table if they don't exist
DO $$ 
BEGIN
  -- Add foreign key for user_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friendships_user_id_fkey'
  ) THEN
    ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;

  -- Add foreign key for friend_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'friendships_friend_id_fkey'
  ) THEN
    ALTER TABLE public.friendships
    ADD CONSTRAINT friendships_friend_id_fkey 
    FOREIGN KEY (friend_id) 
    REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  END IF;
END $$;