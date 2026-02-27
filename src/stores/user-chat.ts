import { create } from 'zustand';

interface UserItem {
  id: number;
  username: string;
  email: string;
}

interface UserChatState {
  activeConversationId: string | null;
  users: UserItem[];
  unreadTotal: number;
  setActiveConversationId: (id: string | null) => void;
  setUsers: (users: UserItem[]) => void;
  setUnreadTotal: (total: number) => void;
  getUser: (id: number) => UserItem | undefined;
}

export const useUserChatStore = create<UserChatState>((set, get) => ({
  activeConversationId: null,
  users: [],
  unreadTotal: 0,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setUsers: (users) => set({ users }),
  setUnreadTotal: (total) => set({ unreadTotal: total }),
  getUser: (id) => get().users.find((u) => u.id === id),
}));
