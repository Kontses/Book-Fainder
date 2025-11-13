-- Update RLS policies for list_books to allow viewing books from public lists
DROP POLICY IF EXISTS "Users view own list books" ON public.list_books;

CREATE POLICY "Users view own list books" 
ON public.list_books 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM book_lists
    WHERE book_lists.id = list_books.list_id 
    AND (
      book_lists.user_id = auth.uid() OR 
      (book_lists.is_public = true AND auth.uid() IS NOT NULL)
    )
  )
);