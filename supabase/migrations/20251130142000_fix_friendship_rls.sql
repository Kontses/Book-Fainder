-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users manage own friendships" ON public.friendships;

-- Create granular policies

-- Allow users to insert friend requests where they are the sender
CREATE POLICY "Users can insert own friend requests" ON public.friendships
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update friend requests where they are the sender OR the recipient (to accept)
CREATE POLICY "Users can update own friendships" ON public.friendships
FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to delete friend requests where they are the sender OR the recipient (to reject/cancel)
CREATE POLICY "Users can delete own friendships" ON public.friendships
FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
