import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import heic2any from 'heic2any';
import { 
  Zap, 
  Cpu, 
  Globe, 
  Activity, 
  Database, 
  Layers,
  Terminal,
  ShieldCheck,
  Search,
  Maximize2,
  ChevronRight,
  Camera,
  Loader2
} from 'lucide-react';

// --- 声明 LivePhotosKit 全局变量 ---
declare global {
  interface Window {
    LivePhotosKit: any;
  }
}

// --- 高级组件: LivePhotoPlayer (方案 A) ---
const LivePhotoPlayer = ({ photoSrc, videoSrc }: { photoSrc: string, videoSrc: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processedPhotoSrc, setProcessedPhotoSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 处理 HEIC 转换
  useEffect(() => {
    const processImage = async () => {
      if (photoSrc.toLowerCase().endsWith('.heic')) {
        setIsProcessing(true);
        try {
          const response = await fetch(photoSrc);
          const blob = await response.blob();
          const convertedBlob = await heic2any({
            blob,
            toType: 'image/jpeg',
            quality: 0.8
          });
          const url = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
          setProcessedPhotoSrc(url);
        } catch (err) {
          console.error('HEIC Conversion failed:', err);
          setProcessedPhotoSrc(photoSrc); // 失败了尝试原链接
        } finally {
          setIsProcessing(false);
        }
      } else {
        setProcessedPhotoSrc(photoSrc);
      }
    };
    processImage();

    return () => {
      if (processedPhotoSrc && processedPhotoSrc.startsWith('blob:')) {
        URL.revokeObjectURL(processedPhotoSrc);
      }
    };
  }, [photoSrc]);

  useEffect(() => {
    if (!processedPhotoSrc || isProcessing) return;

    let script: HTMLScriptElement | null = null;

    const initPlayer = () => {
      if (!containerRef.current || !window.LivePhotosKit) return;
      
      try {
        const player = window.LivePhotosKit.Player(containerRef.current);
        player.photoSrc = processedPhotoSrc;
        player.videoSrc = videoSrc;
        
        // 监听加载完成
        player.addEventListener('canplay', () => setIsLoaded(true));
        player.addEventListener('error', (e: any) => {
          console.error('Live Photo Error:', e);
          setError('Failed to load Live Photo');
        });
      } catch (err) {
        setError('Initialization failed');
      }
    };

    if (window.LivePhotosKit) {
      initPlayer();
    } else {
      script = document.createElement('script');
      script.src = 'https://cdn.apple-livephotoskit.com/lpk/1/livephotoskit.js';
      script.async = true;
      script.onload = initPlayer;
      script.onerror = () => setError('Script load failed');
      document.body.appendChild(script);
    }
  }, [processedPhotoSrc, videoSrc, isProcessing]);

  return (
    <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 border border-white/10 group">
      <div 
        ref={containerRef} 
        className="w-full h-full"
        style={{ '--lpk-background-color': 'transparent' } as React.CSSProperties}
      />
      
      <AnimatePresence>
        {(isProcessing || (!isLoaded && !error)) && (
          <motion.div 
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="animate-spin text-indigo-400" />
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                {isProcessing ? 'Converting HEIC...' : 'Loading Live Photo...'}
              </span>
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div className="absolute inset-0 flex items-center justify-center bg-red-500/10 backdrop-blur-sm z-10">
            <span className="text-xs text-red-400">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="flex items-center gap-2 px-2 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="text-[9px] font-bold text-white uppercase tracking-wider">LIVE</span>
        </div>
      </div>
    </div>
  );
};
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

// --- 高级组件: 磁吸力场容器 ---
const MagneticContainer = ({ children, strength = 0.2 }: { children: React.ReactNode, strength?: number }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * strength);
    y.set((e.clientY - centerY) * strength);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      {children}
    </motion.div>
  );
};

// --- 高级组件: 数据流拓扑图 ---
const DataStreamGraph = () => {
  const [nodes, setNodes] = useState<{ id: number; x: number; y: number; active: boolean }[]>(() => 
    Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      active: false
    }))
  );
  
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => prev.map(node => ({
        ...node,
        active: Math.random() > 0.7
      })));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-48 bg-slate-950/50 rounded-xl overflow-hidden border border-white/5">
      <svg className="absolute inset-0 w-full h-full">
        {nodes.map((node, i) => (
          nodes.slice(i + 1).map((other, j) => (
            <motion.line
              key={`${i}-${j}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${other.x}%`}
              y2={`${other.y}%`}
              stroke="currentColor"
              className="text-indigo-500/20"
              strokeWidth="1"
              animate={{ opacity: node.active && other.active ? 0.6 : 0.1 }}
            />
          ))
        ))}
      </svg>
      {nodes.map(node => (
        <motion.div
          key={node.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={{
            backgroundColor: node.active ? '#6366f1' : '#1e293b',
            boxShadow: node.active ? '0 0 12px #6366f1' : 'none',
            scale: node.active ? 1.5 : 1
          }}
        />
      ))}
    </div>
  );
};

export const TestPage = () => {
  const [systemStatus, setSystemStatus] = useState<'idle' | 'processing' | 'optimizing'>('idle');
  const [load, setLoad] = useState(24);
  const [terminalLines, setTerminalLines] = useState<string[]>(['> System initialized.', '> Ready for instructions...']);

  // 模拟系统逻辑
  useEffect(() => {
    if (systemStatus === 'processing') {
      const timer = setTimeout(() => {
        setLoad(prev => Math.min(prev + 12, 98));
        setTerminalLines(prev => [...prev.slice(-5), `> Analyzing data packet #${Math.floor(Math.random()*1000)}...`]);
        setSystemStatus('optimizing');
      }, 1500);
      return () => clearTimeout(timer);
    } else if (systemStatus === 'optimizing') {
      const timer = setTimeout(() => {
        setLoad(prev => Math.max(prev - 8, 45));
        setTerminalLines(prev => [...prev.slice(-5), `> Resource optimized. Index updated.`]);
        setSystemStatus('idle');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [systemStatus]);

  return (
    <div className="fixed inset-0 bg-[#02040a] text-slate-200 selection:bg-indigo-500/30 font-mono overflow-y-auto overflow-x-hidden">
      {/* 背景流光 - 保持 fixed 且 z-0 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
      </div>

      {/* 内容层 - 确保 z-10 且正常随容器滚动 */}
      <div className="relative z-10 container mx-auto px-6 py-12 max-w-7xl min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/5 pb-8">
          <div>
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2 text-indigo-400 mb-2"
            >
              <Cpu size={16} className="animate-pulse" />
              <span className="text-xs tracking-[0.2em] uppercase font-bold">Neural Engine Core v4.0</span>
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-5xl font-bold tracking-tight text-white"
            >
              LUMI <span className="text-slate-500 font-light">OS</span>
            </motion.h1>
          </div>
          
          <div className="flex items-center gap-8 text-sm text-slate-500">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Uptime</span>
              <span className="text-white tabular-nums">12:44:02:11</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Latency</span>
              <span className="text-emerald-400 tabular-nums">14ms</span>
            </div>
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Stats & Control */}
          <div className="lg:col-span-4 space-y-6">
            <MagneticContainer strength={0.1}>
              <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-6 hover:border-indigo-500/30 transition-colors duration-500 group">
                <div className="flex items-center justify-between mb-8">
                  <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
                    <Activity size={20} />
                  </div>
                  <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5 px-2 py-0">Online</Badge>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs mb-2 text-slate-400 uppercase tracking-tighter">
                      <span>Core Load</span>
                      <span className="text-white">{load}%</span>
                    </div>
                    <Progress value={load} className="h-1 bg-white/5" />
                  </div>

                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <Button 
                      onClick={() => setSystemStatus('processing')}
                      disabled={systemStatus !== 'idle'}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white border-none h-12 rounded-xl group overflow-hidden relative"
                    >
                      <AnimatePresence mode="wait">
                        {systemStatus === 'idle' ? (
                          <motion.span 
                            key="run" 
                            initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }}
                            className="flex items-center gap-2"
                          >
                            <Zap size={16} fill="currentColor" /> Execute
                          </motion.span>
                        ) : (
                          <motion.span 
                            key="loading" 
                            initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }}
                          >
                            <RefreshCw size={16} className="animate-spin" />
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setLoad(24)}
                      className="border-white/10 hover:bg-white/5 text-slate-300 h-12 rounded-xl"
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            </MagneticContainer>

            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-6 overflow-hidden">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <Terminal size={14} /> System Terminal
              </h3>
              <div className="font-mono text-[11px] space-y-1 text-indigo-300/80">
                {terminalLines.map((line, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    key={`${i}-${line}`}
                  >
                    {line}
                  </motion.div>
                ))}
                <motion.span 
                  animate={{ opacity: [1, 0] }} 
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-1.5 h-3 bg-indigo-500 align-middle ml-1"
                />
              </div>
            </Card>
          </div>

          {/* Right Column: Visualizer & Data */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-8 relative overflow-hidden group">
              {/* 背景装饰 SVG */}
              <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none group-hover:text-indigo-500/10 transition-colors">
                <Globe size={180} strokeWidth={1} />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Layers size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Neural Topology Visualizer</h2>
                    <p className="text-sm text-slate-500">Real-time mapping of synapse connections</p>
                  </div>
                </div>

                <DataStreamGraph />

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Security', value: 'Shielded', icon: ShieldCheck, color: 'text-blue-400' },
                    { label: 'Database', value: 'Optimized', icon: Database, color: 'text-purple-400' },
                    { label: 'Sync Status', value: 'Verified', icon: ShieldCheck, color: 'text-emerald-400' }
                  ].map((item) => (
                    <motion.div 
                      whileHover={{ y: -5 }}
                      key={item.label}
                      className="p-4 bg-white/5 rounded-2xl border border-white/5"
                    >
                      <item.icon size={18} className={`${item.color} mb-3`} />
                      <div className="text-[10px] uppercase text-slate-500 mb-1">{item.label}</div>
                      <div className="text-sm font-bold text-white">{item.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-6 hover:bg-slate-900/60 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-bold text-white">Global Nodes</h4>
                    <Search size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <div className="space-y-3">
                    {['Shanghai-A1', 'Tokyo-C2', 'Singapore-B4'].map(node => (
                      <div key={node} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{node}</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      </div>
                    ))}
                  </div>
               </Card>

               <Card className="bg-slate-900/40 backdrop-blur-xl border-white/5 p-6 hover:bg-slate-900/60 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Camera size={14} className="text-indigo-400" /> Live Photo (Scheme A)
                    </h4>
                  </div>
                  <LivePhotoPlayer 
                    photoSrc={`https://nest.hopai.cn/proxy?url=${encodeURIComponent('https://lumi-chat.oss-cn-shanghai.aliyuncs.com/dxy/2026-04-07%20010438.heic')}`}
                    videoSrc={`https://nest.hopai.cn/proxy?url=${encodeURIComponent('https://lumi-chat.oss-cn-shanghai.aliyuncs.com/dxy/2026-04-07%20010438.mov')}`}
                  />
                  <p className="mt-4 text-[10px] text-slate-500 leading-relaxed italic">
                    * Tap and hold or hover to play. Powered by Apple LivePhotosKit JS.
                  </p>
               </Card>

               <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl relative overflow-hidden group cursor-pointer">
                  <motion.div 
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="absolute -right-4 -bottom-4 text-white/10"
                  >
                    <Maximize2 size={120} />
                  </motion.div>
                  <div className="relative z-10">
                    <h4 className="text-white font-bold mb-2">Upgrade Engine</h4>
                    <p className="text-white/70 text-xs mb-6 max-w-[180px]">Enhance processing speed with new model architecture.</p>
                    <Button className="bg-white text-indigo-700 hover:bg-slate-100 rounded-full text-xs font-bold px-6">
                      Get Started <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
               </Card>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <footer className="mt-16 text-center text-[10px] text-slate-600 uppercase tracking-[0.3em]">
          Design & Logic Verified by XinYan AI • 2026 Edition
        </footer>
      </div>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .app-shell {
          cursor: crosshair;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
      `}</style>
    </div>
  );
};

const RefreshCw = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M8 16H3v5" />
  </svg>
);
