import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';

interface ApologyEntryProps {
  isVisible: boolean;
  onClick: () => void;
}

export const ApologyEntry: React.FC<ApologyEntryProps> = ({ isVisible, onClick }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 100 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[10000] cursor-pointer"
          onClick={onClick}
        >
          <div className="relative group">
            {/* Pulsing Glow Background */}
            <div className="absolute inset-0 bg-pink-500/40 rounded-full blur-xl animate-pulse group-hover:bg-pink-500/60 transition-colors" />
            
            {/* The Entry Bubble */}
            <div className="relative flex items-center gap-3 bg-white/20 backdrop-blur-xl border border-white/40 px-6 py-4 rounded-full shadow-2xl text-white">
              <div className="relative">
                <Mail className="w-6 h-6 animate-bounce" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                </span>
              </div>
              <span className="font-bold whitespace-nowrap tracking-wide">
                有一封来自笨猪的未读消息 🥺
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
