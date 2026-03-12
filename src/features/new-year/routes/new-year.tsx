import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Heart, Star, Gift } from 'lucide-react';

interface Firework {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  delay: number;
}

const fireworks: Firework[] = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 60 + 10,
  color: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#9b59b6', '#ff85a2'][Math.floor(Math.random() * 6)],
  size: Math.random() * 4 + 2,
  delay: Math.random() * 3,
}));

const blessings = [
  { icon: '🧧', text: '岁岁平安' },
  { icon: '🎊', text: '万事胜意' },
  { icon: '✨', text: '心想事成' },
  { icon: '💫', text: '财源广进' },
  { icon: '🌟', text: '吉星高照' },
  { icon: '🎉', text: '喜气盈门' },
];

export function NewYearPage() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const particles = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 3 + 4,
  })), []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      setTimeout(() => setShowContent(true), 300);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      {/* Fireworks */}
      <div className="absolute inset-0 pointer-events-none">
        {fireworks.map((fw) => (
          <div
            key={fw.id}
            className="absolute animate-firework"
            style={{
              left: `${fw.x}%`,
              top: `${fw.y}%`,
              animationDelay: `${fw.delay}s`,
            }}
          >
            <div
              className="rounded-full blur-[1px]"
              style={{
                width: fw.size * 4,
                height: fw.size * 4,
                backgroundColor: fw.color,
                boxShadow: `0 0 ${fw.size * 6}px ${fw.color}, 0 0 ${fw.size * 12}px ${fw.color}`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Lanterns */}
      <div className="absolute top-8 left-8 animate-sway opacity-80">
        <div className="text-6xl filter drop-shadow-lg">🏮</div>
      </div>
      <div className="absolute top-12 right-12 animate-sway opacity-80" style={{ animationDelay: '0.5s' }}>
        <div className="text-5xl filter drop-shadow-lg">🧧</div>
      </div>
      <div className="absolute top-32 left-16 animate-sway opacity-60" style={{ animationDelay: '1s' }}>
        <div className="text-4xl filter drop-shadow-lg">🎈</div>
      </div>
      <div className="absolute top-24 right-24 animate-sway opacity-60" style={{ animationDelay: '1.5s' }}>
        <div className="text-4xl filter drop-shadow-lg">✨</div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute animate-float"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          >
            <Star className="w-2 h-2 text-yellow-200 opacity-40" fill="currentColor" />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center px-4 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Back Button */}
        <button
          onClick={handleBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/80 hover:bg-white/20 hover:text-white transition-all duration-300 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">返回</span>
        </button>

        {/* Title */}
        <div className={`text-center mb-12 transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 mb-6">
            <Sparkles className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-200 font-medium">Happy New Year 2026</span>
            <Sparkles className="w-4 h-4 text-red-400" />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-yellow-200 via-red-300 to-pink-300 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            新年快乐
          </h1>
          <p className="text-lg md:text-xl text-white/70 font-light">
            愿新的一年，阳光温暖，岁月静好
          </p>
        </div>

        {/* Blessing Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 max-w-3xl transition-all duration-700 delay-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {blessings.map((blessing, index) => (
            <div
              key={index}
              className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
              style={{ animationDelay: `${index * 100 + 600}ms` }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl mb-1 transform group-hover:scale-110 transition-transform duration-300">
                  {blessing.icon}
                </div>
                <span className="text-white/90 font-medium text-lg">{blessing.text}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Message */}
        <div className={`mt-16 text-center transition-all duration-700 delay-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 via-red-500/20 to-pink-500/20 border border-white/10 backdrop-blur-md">
            <Heart className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-white/80">点击任意祝福卡片，接收专属祝福</span>
            <Gift className="w-5 h-5 text-yellow-400" />
          </div>
        </div>

        {/* Year Display */}
        <div className={`absolute bottom-8 right-8 transition-all duration-700 delay-900 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="text-8xl md:text-9xl font-bold text-white/5 select-none">
            2026
          </div>
        </div>
      </div>

      <style>{`
        @keyframes firework {
          0%, 100% {
            opacity: 0;
            transform: scale(0);
          }
          15% {
            opacity: 1;
            transform: scale(1);
          }
          30% {
            opacity: 1;
            transform: scale(1.2);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.5);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }

        @keyframes sway {
          0%, 100% {
            transform: rotate(-5deg);
          }
          50% {
            transform: rotate(5deg);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.4;
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
            opacity: 0.8;
          }
        }

        .animate-firework {
          animation: firework 3s ease-in-out infinite;
        }

        .animate-sway {
          animation: sway 3s ease-in-out infinite;
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
