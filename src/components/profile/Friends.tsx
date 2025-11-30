import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, UserCheck, UserX, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

interface FriendsProps {
  userId: string;
  isOwnProfile: boolean;
  onRequestsUpdated?: () => void;
}

interface Friend {
  id: string;
  nickname: string;
  avatar_url: string | null;
}

interface FriendRequest {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
  sender: Friend;
}

export const Friends = ({ userId, isOwnProfile, onRequestsUpdated }: FriendsProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    fetchFriends();
    if (isOwnProfile) {
      fetchPendingRequests();
    } else {
      checkFriendshipStatus();
    }
  }, [userId, isOwnProfile]);

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('user_id, friend_id, profiles!friendships_friend_id_fkey(id, nickname, avatar_url)')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendsList = data?.map((friendship: any) => {
        // Get the other person in the friendship
        if (friendship.user_id === userId) {
          return friendship.profiles;
        } else {
          // Need to fetch the user who sent the request
          return null;
        }
      }).filter(Boolean) || [];

      // Also get friends where current user is the friend_id
      const { data: data2, error: error2 } = await supabase
        .from('friendships')
        .select('user_id, friend_id, profiles!friendships_user_id_fkey(id, nickname, avatar_url)')
        .eq('friend_id', userId)
        .eq('status', 'accepted');

      if (error2) throw error2;

      const friendsList2 = data2?.map((friendship: any) => friendship.profiles).filter(Boolean) || [];

      setFriends([...friendsList, ...friendsList2]);
    } catch (error: any) {
      console.error('Error fetching friends:', error);
      toast.error(t('failedSearch'));
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('id, user_id, friend_id, status, profiles!friendships_user_id_fkey(id, nickname, avatar_url)')
        .eq('friend_id', userId)
        .eq('status', 'pending');

      if (error) throw error;

      setPendingRequests(data?.map((req: any) => ({
        id: req.id,
        user_id: req.user_id,
        friend_id: req.friend_id,
        status: req.status,
        sender: req.profiles
      })) || []);
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('friendships')
        .select('status')
        .or(`and(user_id.eq.${currentUser.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${currentUser.id})`)
        .maybeSingle();

      if (error) throw error;

      setFriendshipStatus(data?.status || null);
    } catch (error: any) {
      console.error('Error checking friendship status:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nickname, avatar_url')
        .ilike('nickname', `%${searchQuery}%`)
        .neq('id', userId)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      console.error('Error searching users:', error);
      toast.error(t('failedSearch'));
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: userId,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Friend request sent!');
      setSearchResults([]);
      setSearchQuery("");
      if (!isOwnProfile) {
        setFriendshipStatus('pending');
      }
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast.error(t('failedSave'));
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Friend request accepted!');
      fetchFriends();
      fetchPendingRequests();
      if (onRequestsUpdated) onRequestsUpdated();
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error(t('failedSave'));
    }
  };

  const rejectFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Friend request rejected');
      fetchPendingRequests();
      if (onRequestsUpdated) onRequestsUpdated();
    } catch (error: any) {
      console.error('Error rejecting friend request:', error);
      toast.error(t('failedSave'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Friend Button for non-own profiles */}
      {!isOwnProfile && friendshipStatus === null && (
        <Card className="p-6">
          <Button
            onClick={() => sendFriendRequest(userId)}
            className="w-full"
          >
            <UserPlus className="mr-2 h-5 w-5" />
            {t('addFriend')}
          </Button>
        </Card>
      )}

      {!isOwnProfile && friendshipStatus === 'pending' && (
        <Card className="p-6 text-center">
          <UserCheck className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">{t('friendRequestPending')}</p>
        </Card>
      )}

      {/* Search Users (only for own profile) */}
      {isOwnProfile && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="h-5 w-5" />
            {t('findFriends')}
          </h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t('searchByNickname') as string}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {user.avatar_url ? (
                        <AvatarImage src={user.avatar_url} alt={user.nickname} />
                      ) : (
                        <AvatarFallback>
                          {user.nickname.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="font-medium">{user.nickname}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(user.id)}
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Pending Requests (only for own profile) */}
      {isOwnProfile && pendingRequests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('friendRequests')}
          </h3>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    {request.sender.avatar_url ? (
                      <AvatarImage src={request.sender.avatar_url} alt={request.sender.nickname} />
                    ) : (
                      <AvatarFallback>
                        {request.sender.nickname.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="font-medium">{request.sender.nickname}</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => acceptFriendRequest(request.id)}
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rejectFriendRequest(request.id)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Friends List */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-16 w-16 mx-auto mb-3 opacity-40" />
            <p>{t('noFriends')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {friends.map((friend) => (
              <div
                key={friend.id}
                onClick={() => navigate(`/profile/${friend.nickname}`)}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <Avatar className="h-12 w-12">
                  {friend.avatar_url ? (
                    <AvatarImage src={friend.avatar_url} alt={friend.nickname} />
                  ) : (
                    <AvatarFallback className="text-lg">
                      {friend.nickname.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="font-medium">{friend.nickname}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
