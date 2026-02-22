import api from '@/lib/axios';

export const deleteConversation = async (id: string): Promise<void> => {
  await api.post(`/chat/conversations/${id}/delete`);
};
