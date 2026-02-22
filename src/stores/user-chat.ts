import { create } from 'zustand';

interface UserItem {
  id: number;
  username: string;
  email: string;
}

interface UserChatState {
  activeConversationId: string | null;
  users: UserItem[];
  setActiveConversationId: (id: string | null) => void;
  setUsers: (users: UserItem[]) => void;
  getUser: (id: number) => UserItem | undefined;
}

export const useUserChatStore = create<UserChatState>((set, get) => ({
  activeConversationId: null,
  users: [],
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  setUsers: (users) => set({ users }),
  getUser: (id) => get().users.find((u) => u.id === id),
}));
