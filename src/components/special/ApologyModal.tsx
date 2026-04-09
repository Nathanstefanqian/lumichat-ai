import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ApologyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApologyModal: React.FC<ApologyModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      // 尝试触发全局 APlayer 播放
      const timer = setTimeout(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const metingElement = document.querySelector('meting-js') as any;
        const ap = metingElement?.aplayer;
        if (ap) {
          ap.play().catch((err: any) => console.log("Autoplay blocked:", err));
        }
      }, 1000); // 给一点延迟确保环境就绪
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white/15 backdrop-blur-2xl border border-white/20 rounded-[2rem] p-8 shadow-2xl text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors text-xl p-2"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
              <div className="text-5xl animate-bounce pt-4">🥺</div>
              
              <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-300 to-purple-300 bg-clip-text text-transparent">
                致最亲爱的欣妍
              </h2>
              
              <div className="space-y-4 text-[1.05rem] leading-relaxed text-white/95 text-left">
                <p>
                  笨猪申请解除冷战模式！😭 其实那天我最想说的是——谢谢你一直以来对我的照顾。
                </p>
                <p>
                  不管是给我发红包点外卖，还是听到我感冒立马买药的种种细节，我都能真切地感受到你对我的关心。
                </p>
                <p>
                  是我在那一刻太任性，语气生硬，没能运营好咱们的关系，真的真心向你道歉。
                </p>
                <p className="border-t border-white/10 pt-4 italic text-white/80">
                  其实我不太敢在大号上和你联系，因为我也不知道你现在的情绪状态如何，这两天的经历，你可能有了许多新的想法。
                </p>
                <p>
                  但我不得不承认，对你的想念已经完全充盈了我目前的生活。
                </p>
                <p>
                  如果你能看到这条信息，无论你做出什么样的选择，我都希望我们能直接，好好聊聊。
                </p>
              </div>

              <div className="w-full pb-4">
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full font-bold shadow-lg shadow-pink-500/30 hover:scale-105 active:scale-95 transition-transform"
                >
                  好，我知道了
                </button>
              </div>
            </div>

            {/* Background glowing orbs */}
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-pink-500/20 blur-3xl rounded-full" />
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-500/30 blur-3xl rounded-full" />
          </motion.div>
        </div>
      )}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </AnimatePresence>
  );
};
