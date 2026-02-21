import type { ChatMessage } from '@/stores/chat';

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
  const token = localStorage.getItem('auth-storage');
  const parsed = token ? JSON.parse(token) : null;
  const authToken = parsed?.state?.token;

  const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
    headers: {
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  const data = await response.json();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    id: item._id,
    role: item.role,
    content: item.content,
    status: 'synced',
    createdAt: new Date(item.createdAt).getTime(),
    serverId: item._id,
  }));
}
