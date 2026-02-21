import type { Conversation } from '@/stores/chat';

export async function getConversations(): Promise<Conversation[]> {
  const token = localStorage.getItem('auth-storage');
  const parsed = token ? JSON.parse(token) : null;
  const authToken = parsed?.state?.token;

  const response = await fetch('/api/chat/conversations?type=ai', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }

  const data = await response.json();
  
  // Map backend data to frontend Conversation interface
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((item: any) => ({
    id: item._id,
    title: item.title || '新对话',
    createdAt: new Date(item.createdAt).getTime(),
    messages: [], // Messages are not included in the list, will be fetched separately or merged from local
  }));
}
