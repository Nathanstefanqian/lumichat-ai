import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'streaming' | 'synced' | 'failed';

export interface ChatMessage {
  id: string;
  serverId?: string;  // 服务器返回的真实 ID
  role: ChatRole;
  content: string;
  reasoning_content?: string;
  status: MessageStatus;  // 消息状态
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  setConversations: (conversations: Conversation[]) => void;
  mergeConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  setActiveConversationId: (id: string | null) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  createConversation: () => string;
  switchConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  appendMessage: (conversationId: string, messageId: string, chunk: string) => void;
  appendReasoning: (conversationId: string, messageId: string, chunk: string) => void;
  setMessageContent: (conversationId: string, messageId: string, content: string) => void;
  setMessageStatus: (conversationId: string, messageId: string, status: MessageStatus) => void;
  updateMessageServerId: (conversationId: string, localId: string, serverId: string) => void;
  setConversationTitle: (conversationId: string, title: string) => void;
  clearMessages: (conversationId: string) => void;
  removeConversation: (id: string) => void;
  clearAllConversations: () => void;
}

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversations: [],
      activeConversationId: null,
      setConversations: (conversations) => {
        set({ conversations });
      },
      mergeConversations: (conversations) => {
        set((state) => ({
          conversations: conversations.map((conv) => {
            const existing = state.conversations.find(
              (item) => item.id === conv.id,
            );
            if (!existing) {
              return conv;
            }
            return {
              ...existing,
              ...conv,
              messages:
                existing.messages.length > 0 ? existing.messages : conv.messages,
            };
          }),
        }));
      },
      removeConversation: (id) => {
        set((state) => {
          const newConversations = state.conversations.filter(
            (item) => item.id !== id,
          );
          let nextActiveId = state.activeConversationId;
          if (state.activeConversationId === id) {
            nextActiveId =
              newConversations.length > 0 ? newConversations[0].id : null;
          }
          return {
            conversations: newConversations,
            activeConversationId: nextActiveId,
          };
        });
      },
      upsertConversation: (conversation) => {
        set((state) => {
          const exists = state.conversations.find(
            (item) => item.id === conversation.id,
          );
          if (exists) {
            const mergedMessages =
              conversation.messages.length > 0
                ? conversation.messages
                : exists.messages;
            return {
              conversations: state.conversations.map((item) =>
                item.id === conversation.id
                  ? {
                      ...item,
                      ...conversation,
                      messages: mergedMessages,
                    }
                  : item,
              ),
            };
          }
          return {
            conversations: [conversation, ...state.conversations],
          };
        });
      },
      setActiveConversationId: (id) => {
        set({ activeConversationId: id });
      },
      setMessages: (conversationId, messages) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, messages } : conv,
          ),
        }));
      },
      createConversation: () => {
        const id = createId();
        const conversation: Conversation = {
          id,
          title: '新的对话',
          createdAt: Date.now(),
          messages: [],
        };
        set((state) => ({
          conversations: [conversation, ...state.conversations],
          activeConversationId: id,
        }));
        return id;
      },
      switchConversation: (id) => {
        set({ activeConversationId: id });
      },
      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, messages: [...conv.messages, message] }
              : conv,
          ),
        }));
      },
      appendMessage: (conversationId, messageId, chunk) => {
        set((state) => {
          const conversation = state.conversations.find(
            (c) => c.id === conversationId,
          );
          if (!conversation) return state;

          const messageIndex = conversation.messages.findIndex(
            (m) => m.id === messageId,
          );
          if (messageIndex === -1) return state;

          const newMessages = [...conversation.messages];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            content: newMessages[messageIndex].content + chunk,
          };

          const newConversation = {
            ...conversation,
            messages: newMessages,
          };

          return {
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? newConversation : c,
            ),
          };
        });
      },
      appendReasoning: (conversationId, messageId, chunk) => {
        set((state) => {
          const conversation = state.conversations.find(
            (c) => c.id === conversationId,
          );
          if (!conversation) return state;

          const messageIndex = conversation.messages.findIndex(
            (m) => m.id === messageId,
          );
          if (messageIndex === -1) return state;

          const newMessages = [...conversation.messages];
          newMessages[messageIndex] = {
            ...newMessages[messageIndex],
            reasoning_content: (newMessages[messageIndex].reasoning_content || '') + chunk,
          };

          const newConversation = {
            ...conversation,
            messages: newMessages,
          };

          return {
            conversations: state.conversations.map((c) =>
              c.id === conversationId ? newConversation : c,
            ),
          };
        });
      },
      setMessageContent: (conversationId, messageId, content) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, content } : msg,
                  ),
                }
              : conv,
          ),
        }));
      },
      setMessageStatus: (conversationId, messageId, status) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId ? { ...msg, status } : msg,
                  ),
                }
              : conv,
          ),
        }));
      },
      updateMessageServerId: (conversationId, localId, serverId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === localId 
                      ? { ...msg, serverId, status: 'synced' as MessageStatus } 
                      : msg,
                  ),
                }
              : conv,
          ),
        }));
      },
      setConversationTitle: (conversationId, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, title } : conv,
          ),
        }));
      },
      clearMessages: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, messages: [] } : conv,
          ),
        }));
      },
      clearAllConversations: () => {
        set({
          conversations: [],
          activeConversationId: null,
        });
      },
    }),
    {
      name: 'chat-storage-v2', // Increment version to clear old cache
      version: 1,
    },
  ),
);
