import { useState } from 'react';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { fetchUsers, type FriendRequest } from '@/features/chat/api/chat';
import { useAuthStore } from '@/stores/auth';

interface UserItem {
  id: number;
  username: string;
  email: string;
}

interface AddFriendDialogProps {
  friends: UserItem[];
  outgoingRequests: FriendRequest[];
  onAddFriend: (userId: number) => Promise<void>;
}

export function AddFriendDialog({ friends, outgoingRequests, onAddFriend }: AddFriendDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((state) => state.user);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const users = await fetchUsers(query);
      // Filter out current user
      const filtered = users.filter((u) => u.id !== currentUser?.userId);
      setResults(filtered);
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: number) => {
    try {
      await onAddFriend(userId);
    } catch (error) {
      console.error('Failed to send friend request:', error);
      const message = error instanceof Error ? error.message : '发送好友请求失败';
      alert(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" title="添加好友">
          <UserPlus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加好友</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="搜索用户昵称..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </form>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {results.length === 0 && query && !loading ? (
              <div className="text-center text-sm text-muted-foreground py-4">
                未找到相关用户
              </div>
            ) : (
              results.map((user) => {
                const isFriend = friends.some((f) => f.id === user.id);
                const isPending = outgoingRequests.some((r) => r.addresseeId === user.id);

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex flex-col overflow-hidden mr-3">
                      <span className="font-medium truncate">{user.username}</span>
                      <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                    </div>
                    
                    {isFriend ? (
                      <span className="text-xs text-green-600 flex items-center gap-1 shrink-0">
                        <Check className="h-3 w-3" /> 已添加
                      </span>
                    ) : isPending ? (
                      <span className="text-xs text-muted-foreground shrink-0">已发送请求</span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSendRequest(user.id)}
                        className="h-7 px-3 shrink-0"
                      >
                        <UserPlus className="h-3 w-3 mr-1" /> 添加
                      </Button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
