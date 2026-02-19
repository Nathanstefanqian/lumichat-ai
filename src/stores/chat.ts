import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
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
  setMessageContent: (conversationId: string, messageId: string, content: string) => void;
  setConversationTitle: (conversationId: string, title: string) => void;
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
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.id === messageId
                      ? { ...msg, content: msg.content + chunk }
                      : msg,
                  ),
                }
              : conv,
          ),
        }));
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
      setConversationTitle: (conversationId, title) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, title } : conv,
          ),
        }));
      },
    }),
    {
      name: 'chat-storage',
    },
  ),
);
