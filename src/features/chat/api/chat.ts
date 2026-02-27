import api from '@/lib/axios';

export interface ChatConversation {
  _id: string;
  type: 'ai' | 'user';
  participants: number[];
  title: string;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  participantInfo?: {
    id: number;
    username: string;
    avatar?: string;
  };
  unreadCount?: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  senderId: number | null;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  type?: 'text' | 'image' | 'audio';
  fileUrl?: string;
  isRead?: boolean;
  readAt?: string;
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

export const sendMessage = (
  conversationId: string, 
  content: string, 
  type: 'text' | 'image' | 'audio' = 'text',
  fileUrl?: string
) => {
  return api
    .post(`/chat/conversations/${conversationId}/messages`, {
      content,
      type,
      fileUrl,
    })
    .then((res) => res as unknown as ChatMessage);
};

export const deleteMessage = (messageId: string) => {
  return api.post(`/chat/messages/${messageId}/delete`).then((res) => res as unknown as { success: boolean });
};

export const deleteConversation = (conversationId: string) => {
  return api.post(`/chat/conversations/${conversationId}/delete`).then((res) => res as unknown as { success: boolean });
};

export const markAsRead = (conversationId: string) => {
  return api.post(`/chat/conversations/${conversationId}/read`).then((res) => res as unknown as { success: boolean });
};

export const uploadFile = (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  return api
    .post('/common/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((res) => res as unknown as { url: string });
};

export const fetchUsers = (username?: string) => {
  return api
    .get('/users', {
      params: username ? { username } : undefined,
    })
    .then(
      (res) =>
        res as unknown as { id: number; username: string; email: string; lastSeen?: string }[],
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
