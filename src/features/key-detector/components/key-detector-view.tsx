import { useState, useEffect, useCallback } from 'react';
import { Keyboard, MousePointer2, Zap, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KeyInfo {
  key: string;
  code: string;
  keyCode: number;
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
  timestamp: number;
}

export const KeyDetectorView = () => {
  const [lastEvent, setLastEvent] = useState<KeyInfo | null>(null);
  const [history, setHistory] = useState<KeyInfo[]>([]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent default browser behavior for common shortcuts to ensure we capture them
    if (e.ctrlKey || e.metaKey || e.altKey) {
      // Keep some essential ones
      if (e.key !== 'r' && e.key !== 'F5' && e.key !== 'F12') {
        e.preventDefault();
      }
    }

    const info: KeyInfo = {
      key: e.key === ' ' ? 'Space' : e.key,
      code: e.code,
      keyCode: e.keyCode,
      shiftKey: e.shiftKey,
      ctrlKey: e.ctrlKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      timestamp: Date.now(),
    };

    setLastEvent(info);
    setHistory((prev) => [info, ...prev].slice(0, 20));
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const clearHistory = () => {
    setHistory([]);
    setLastEvent(null);
  };

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto scrollbar-hidden theme-page">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 theme-accent rounded-2xl shadow-sm">
              <Keyboard className="w-8 h-8 text-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold theme-text">按键检测器</h2>
              <p className="theme-subtle text-sm">实时监测键盘按键触发状态</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={clearHistory}
            className="rounded-xl flex items-center gap-2 border-border/50 hover:bg-muted"
          >
            <RotateCcw className="w-4 h-4" />
            重置检测
          </Button>
        </div>

        {/* Main Display Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Current Key Card */}
          <Card className="md:col-span-2 p-8 theme-surface rounded-3xl shadow-lg border-2 border-primary/10 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
            <div className="absolute top-4 left-4 flex gap-2">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Live Status</span>
            </div>
            
            {!lastEvent ? (
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center animate-pulse">
                  <Keyboard className="w-10 h-10 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-sm font-medium">请按下键盘上的任意按键...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-200">
                <div className="relative">
                  <div className="text-8xl md:text-9xl font-black theme-text tracking-tighter drop-shadow-xl">
                    {lastEvent.key}
                  </div>
                  {/* Modifier Indicators */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
                    {lastEvent.ctrlKey && <Badge label="CTRL" />}
                    {lastEvent.shiftKey && <Badge label="SHIFT" />}
                    {lastEvent.altKey && <Badge label="ALT" />}
                    {lastEvent.metaKey && <Badge label="META" />}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-2 pt-12">
                  <InfoRow label="Code" value={lastEvent.code} />
                  <InfoRow label="Key ID" value={lastEvent.keyCode.toString()} />
                </div>
              </div>
            )}
          </Card>

          {/* History Panel */}
          <Card className="p-6 theme-surface rounded-3xl shadow-md border flex flex-col h-full max-h-[400px] md:max-h-none">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">最近记录</h3>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hidden">
              {history.length === 0 ? (
                <div className="h-full flex flex-center items-center justify-center text-xs text-muted-foreground/50 italic py-10">
                  暂无历史数据
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={item.timestamp}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl transition-all duration-200 border border-transparent",
                      idx === 0 ? "bg-primary/10 border-primary/20" : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black theme-text">{item.key}</span>
                      <div className="flex gap-1">
                        {item.ctrlKey && <span className="text-[8px] px-1 bg-zinc-200 dark:bg-zinc-800 rounded">C</span>}
                        {item.shiftKey && <span className="text-[8px] px-1 bg-zinc-200 dark:bg-zinc-800 rounded">S</span>}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {item.keyCode}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Documentation / Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-muted/20 border-dashed rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <MousePointer2 className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold theme-text">使用说明</h4>
            </div>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li>• 该工具可帮助你调试键盘映射或检测按键响应情况。</li>
              <li>• 我们已尝试拦截大部分系统快捷键以确保检测准确。</li>
              <li>• 支持组合键识别（Ctrl, Shift, Alt, Command/Win）。</li>
              <li>• 特殊按键如空格键将显示为 "Space"。</li>
            </ul>
          </Card>
          <div className="flex items-center justify-center p-8 text-center opacity-30 grayscale pointer-events-none">
            <Keyboard className="w-20 h-20 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};

const Badge = ({ label }: { label: string }) => (
  <span className="px-2 py-1 rounded-md bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
    {label}
  </span>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">{label}</span>
    <span className="text-sm font-mono font-bold theme-text">{value}</span>
  </div>
);
