import api from '@/lib/axios';

export const generateAiTitle = (message: string, conversationId?: string) => {
  return api
    .post('/ai/chat/title', { message, conversationId })
    .then((res) => res as unknown as { title: string; conversationId?: string });
};
