-- Create user_books table for storing saved books
CREATE TABLE IF NOT EXISTS public.user_books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  book_title TEXT NOT NULL,
  book_author TEXT NOT NULL,
  book_description TEXT,
  book_year TEXT,
  book_cover_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own saved books" 
ON public.user_books 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can save books" 
ON public.user_books 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved books" 
ON public.user_books 
FOR DELETE 
USING (auth.uid() = user_id);