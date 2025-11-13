-- Add is_public column to book_lists table
ALTER TABLE public.book_lists 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Update RLS policies to allow viewing public lists
DROP POLICY IF EXISTS "Users view own lists" ON public.book_lists;

CREATE POLICY "Users view own lists" 
ON public.book_lists 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  (is_public = true AND auth.uid() IS NOT NULL)
);