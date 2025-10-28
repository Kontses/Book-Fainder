-- Drop the existing public policy for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy to allow only authenticated users to view profiles
CREATE POLICY "Profiles are viewable by authenticated users only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);