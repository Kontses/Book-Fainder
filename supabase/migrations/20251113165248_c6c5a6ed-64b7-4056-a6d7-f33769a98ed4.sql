-- Update default value for is_public to true
ALTER TABLE public.book_lists 
ALTER COLUMN is_public SET DEFAULT true;

-- Update existing lists to be public
UPDATE public.book_lists 
SET is_public = true 
WHERE is_public = false;