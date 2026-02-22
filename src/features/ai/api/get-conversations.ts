import api from '@/lib/axios';
import type { Conversation } from '@/stores/chat';

interface ApiConversation {
  _id: string;
  title: string;
  createdAt: string;
}

export const getAiConversations = async (): Promise<Conversation[]> => {
  const response = await api.get('/chat/conversations', {
    params: { type: 'ai' },
  });
  const data = (response as unknown as ApiConversation[]) || [];

  return data.map((item) => ({
    id: item._id,
    title: item.title || 'AI 对话',
    createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
    messages: [], // Initially empty, will be fetched on demand
  }));
};
