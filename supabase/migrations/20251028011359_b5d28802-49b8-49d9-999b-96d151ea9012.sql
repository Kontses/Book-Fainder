-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create genres table (from ISBNdb)
CREATE TABLE IF NOT EXISTS public.genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  isbndb_code TEXT
);

-- Create languages table (from ISBNdb)
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  iso_code TEXT UNIQUE NOT NULL
);

-- User preferred genres (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  genre_id UUID REFERENCES public.genres(id) ON DELETE CASCADE,
  UNIQUE(user_id, genre_id)
);

-- User reading languages (many-to-many)
CREATE TABLE IF NOT EXISTS public.user_languages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  language_id UUID REFERENCES public.languages(id) ON DELETE CASCADE,
  UNIQUE(user_id, language_id)
);

-- Custom book lists
CREATE TABLE IF NOT EXISTS public.book_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Books in custom lists (many-to-many with user_books)
CREATE TABLE IF NOT EXISTS public.list_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.book_lists(id) ON DELETE CASCADE,
  book_id UUID REFERENCES public.user_books(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, book_id)
);

-- Friendships table
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for genres and languages (public read)
CREATE POLICY "Genres viewable by everyone" ON public.genres FOR SELECT USING (true);
CREATE POLICY "Languages viewable by everyone" ON public.languages FOR SELECT USING (true);

-- RLS Policies for user preferences
CREATE POLICY "Users view own genres" ON public.user_genres FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own genres" ON public.user_genres FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own languages" ON public.user_languages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own languages" ON public.user_languages FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for book lists
CREATE POLICY "Users view own lists" ON public.book_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own lists" ON public.book_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own list books" ON public.list_books FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.book_lists WHERE id = list_id AND user_id = auth.uid())
);
CREATE POLICY "Users manage own list books" ON public.list_books FOR ALL USING (
  EXISTS (SELECT 1 FROM public.book_lists WHERE id = list_id AND user_id = auth.uid())
);

-- RLS Policies for friendships
CREATE POLICY "Users view own friendships" ON public.friendships FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);
CREATE POLICY "Users manage own friendships" ON public.friendships FOR ALL USING (auth.uid() = user_id);

-- Trigger for profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, 'user_' || substring(NEW.id::text, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert common genres
INSERT INTO public.genres (name, isbndb_code) VALUES
  ('Fiction', 'fiction'),
  ('Mystery', 'mystery'),
  ('Science Fiction', 'science-fiction'),
  ('Fantasy', 'fantasy'),
  ('Romance', 'romance'),
  ('Thriller', 'thriller'),
  ('Historical Fiction', 'historical-fiction'),
  ('Biography', 'biography'),
  ('Self-Help', 'self-help'),
  ('Business', 'business')
ON CONFLICT (name) DO NOTHING;

-- Insert common languages
INSERT INTO public.languages (name, iso_code) VALUES
  ('English', 'en'),
  ('Greek', 'el'),
  ('Spanish', 'es'),
  ('French', 'fr'),
  ('German', 'de'),
  ('Italian', 'it')
ON CONFLICT (iso_code) DO NOTHING;