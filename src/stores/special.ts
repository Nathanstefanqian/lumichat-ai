import { create } from 'zustand';

interface SpecialState {
  showApology: boolean;
  showEntry: boolean;
  setShowApology: (show: boolean) => void;
  setShowEntry: (show: boolean) => void;
}

export const useSpecialStore = create<SpecialState>((set) => ({
  showApology: false,
  showEntry: false,
  setShowApology: (show) => set({ showApology: show }),
  setShowEntry: (show) => set({ showEntry: show }),
}));
