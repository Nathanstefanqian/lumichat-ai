import api from '@/lib/axios';
import type { ChatMessage, ChatRole } from '@/stores/chat';

interface ApiMessage {
  _id: string;
  role: ChatRole;
  content: string;
  reasoning_content?: string;
  createdAt: string;
}

export const getAiMessages = async (conversationId: string): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/conversations/${conversationId}/messages`);
  const data = (response as unknown as ApiMessage[]) || [];

  return data.map((item) => ({
    id: item._id, // Use server ID as ID
    role: item.role,
    content: item.content,
    reasoning_content: item.reasoning_content,
    status: 'synced',
    createdAt: item.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
  }));
};
