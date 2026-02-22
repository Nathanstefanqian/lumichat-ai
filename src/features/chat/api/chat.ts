import api from '@/lib/axios';

export interface ChatConversation {
  _id: string;
  type: 'ai' | 'user';
  participants: number[];
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: number | null;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface FriendRequest {
  _id: string;
  requesterId: number;
  addresseeId: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const fetchConversations = (type?: 'ai' | 'user') => {
  return api
    .get('/chat/conversations', {
      params: type ? { type } : undefined,
    })
    .then((res) => res as unknown as ChatConversation[]);
};

export const createAiConversation = (title?: string) => {
  return api
    .post('/chat/conversations/ai', { title })
    .then((res) => res as unknown as ChatConversation);
};

export const createUserConversation = (participantId: number) => {
  return api
    .post('/chat/conversations', { participantId })
    .then((res) => res as unknown as ChatConversation);
};

export const fetchMessages = (conversationId: string) => {
  return api
    .get(`/chat/conversations/${conversationId}/messages`)
    .then((res) => res as unknown as ChatMessage[]);
};

export const sendMessage = (conversationId: string, content: string) => {
  return api
    .post(`/chat/conversations/${conversationId}/messages`, {
      content,
    })
    .then((res) => res as unknown as ChatMessage);
};

export const fetchUsers = () => {
  return api
    .get('/users')
    .then(
      (res) =>
        res as unknown as { id: number; username: string; email: string }[],
    );
};

export const fetchFriends = () => {
  return api
    .get('/friends')
    .then(
      (res) =>
        res as unknown as { id: number; username: string; email: string }[],
    );
};

export const fetchFriendRequests = () => {
  return api
    .get('/friends/requests')
    .then(
      (res) =>
        res as unknown as {
          incoming: FriendRequest[];
          outgoing: FriendRequest[];
        },
    );
};

export const sendFriendRequest = (targetUserId: number) => {
  return api
    .post('/friends/requests', { targetUserId })
    .then((res) => res as unknown as FriendRequest);
};

export const acceptFriendRequest = (requestId: string) => {
  return api
    .post(`/friends/requests/${requestId}/accept`)
    .then((res) => res as unknown as FriendRequest);
};

export const rejectFriendRequest = (requestId: string) => {
  return api
    .post(`/friends/requests/${requestId}/reject`)
    .then((res) => res as unknown as FriendRequest);
};

export const deleteFriend = (targetUserId: number) => {
  return api
    .delete(`/friends/${targetUserId}`)
    .then((res) => res as unknown as { success: boolean });
};
