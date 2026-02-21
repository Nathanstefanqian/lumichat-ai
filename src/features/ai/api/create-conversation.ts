import type { Conversation } from '@/stores/chat';

export async function createConversation(): Promise<Conversation> {
  const token = localStorage.getItem('auth-storage');
  const parsed = token ? JSON.parse(token) : null;
  const authToken = parsed?.state?.token;

  const response = await fetch('/api/chat/conversations/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to create conversation');
  }

  const data = await response.json();
  
  return {
    id: data._id,
    title: data.title || '新对话',
    createdAt: new Date(data.createdAt).getTime(),
    messages: [],
  };
}
