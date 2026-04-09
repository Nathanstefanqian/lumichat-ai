import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  X, 
  Sparkles, 
  PenTool, 
  CheckCircle2,
  Minimize2,
  Maximize2 as FullscreenIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EssayDetailDialogProps {
  result: {
    score15: number;
    score710: number;
    grade: string;
    comments: string;
    grammarFixes: Array<{
      original: string;
      corrected: string;
      explanation: string;
    }>;
    polishedEssay: string;
    promptImageUrls?: string[];
    resultImageUrls?: string[];
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EssayDetailDialog: React.FC<EssayDetailDialogProps> = ({ result, open, onOpenChange }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!result) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "p-0 overflow-hidden theme-card transition-all duration-300 flex flex-col border-border shadow-2xl [&>button]:hidden",
          isFullscreen 
            ? "w-screen h-screen max-w-none rounded-none" 
            : "w-[95vw] max-w-[650px] rounded-[24px] max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <PenTool className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-none">查看批改详情</h3>
              <p className="text-[11px] text-muted-foreground mt-1">欣妍老师的珍贵记录 ✨</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-background">
          <div className="space-y-6">
            {/* 图片展示区 (双图展示) */}
            {(result.promptImageUrls?.length || result.resultImageUrls?.length) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.promptImageUrls && result.promptImageUrls.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">题目/原文照片</span>
                    </div>
                    <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                      <img 
                        src={result.promptImageUrls[0]} 
                        alt="Prompt" 
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                        onClick={() => window.open(result.promptImageUrls![0], '_blank')}
                      />
                    </div>
                  </div>
                )}
                {result.resultImageUrls && result.resultImageUrls.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">你的作品照片</span>
                    </div>
                    <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                      <img 
                        src={result.resultImageUrls[0]} 
                        alt="Result" 
                        className="w-full h-full object-cover cursor-zoom-in hover:scale-105 transition-transform duration-500"
                        onClick={() => window.open(result.resultImageUrls![0], '_blank')}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* 评分板块 */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-primary/5 border-primary/20 shadow-none rounded-2xl">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">15分制评分</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-primary">{result.score15}</span>
                    <span className="text-xs font-bold text-primary/40">/ 15</span>
                  </div>
                  <div className="mt-2 px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold text-primary">
                    {result.grade}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-indigo-500/5 border-indigo-500/20 shadow-none rounded-2xl">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">710分制换算</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-indigo-500">{result.score710}</span>
                    <span className="text-xs font-bold text-indigo-500/40">/ 710</span>
                  </div>
                  <div className="mt-2 px-2 py-0.5 bg-indigo-500/10 rounded-full text-[10px] font-bold text-indigo-500">
                    作文权重分
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 老师点评 */}
            <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-none rounded-2xl overflow-hidden">
              <CardHeader className="py-2 px-4 bg-emerald-500/10 border-b border-emerald-500/10">
                <CardTitle className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  欣妍老师的建议
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm leading-relaxed text-muted-foreground italic">
                  "{result.comments}"
                </p>
              </CardContent>
            </Card>

            {/* 病句诊断 */}
            {result.grammarFixes?.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2 ml-1">
                  <X className="w-4 h-4 text-destructive" />
                  病句诊断与优化
                </h4>
                <div className="space-y-3">
                  {result.grammarFixes.map((fix, idx) => (
                    <div key={idx} className="p-4 rounded-xl border bg-muted/10 space-y-3">
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-destructive/10 text-destructive rounded-md h-fit mt-0.5 min-w-[36px] text-center">ERR</span>
                            <p className="text-sm text-muted-foreground line-through decoration-destructive/60 decoration-2">{fix.original}</p>
                          </div>
                          <div className="flex gap-3">
                            <span className="flex-shrink-0 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-md h-fit mt-0.5 min-w-[36px] text-center">FIX</span>
                            <p className="text-sm font-bold text-foreground">{fix.corrected}</p>
                          </div>
                          <div className="pl-12 text-xs text-muted-foreground flex items-start gap-2 italic leading-relaxed">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                            <span>{fix.explanation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
              </div>
            )}

            {/* 润色版 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 ml-1">
                <Sparkles className="w-4 h-4 text-primary" />
                欣妍为你润色版
              </h4>
              <div className="p-5 rounded-2xl border-2 border-primary/10 bg-primary/5 text-sm leading-relaxed text-foreground text-justify font-medium">
                {result.polishedEssay}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t bg-muted/20">
          <Button 
            className="w-full h-11 rounded-xl font-bold"
            onClick={() => onOpenChange(false)}
          >
            我知道了，继续加油！
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
