import api from '@/lib/axios';
import type { Conversation } from '@/stores/chat';

export const createAiConversation = async (title?: string): Promise<Conversation> => {
  const response = await api.post('/chat/conversations/ai', { title });
  // Ensure we have data
  const data = (response as unknown as { _id: string; title: string; createdAt: string }) || {};
  
  if (!data._id) {
    throw new Error('Failed to create conversation: Invalid response');
  }

  return {
    id: data._id,
    title: data.title || 'AI 对话',
    createdAt: data.createdAt ? new Date(data.createdAt).getTime() : Date.now(),
    messages: [],
  };
};
