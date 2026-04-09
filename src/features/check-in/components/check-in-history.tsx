import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { CheckInRecord } from '../types';
import dayjs from 'dayjs';
import { 
  Quote, 
  BookOpen, 
  Languages, 
  ImageIcon, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Maximize2,
  ChevronLeftCircle,
  ChevronRightCircle,
  X,
  Sparkles
} from 'lucide-react';
import { deleteCheckIn } from '../api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface CheckInHistoryProps {
  history: {
    items: CheckInRecord[];
    total: number;
    page: number;
    totalPages: number;
  };
  onPageChange: (page: number) => void;
  onDeleted: () => void;
}

const TYPE_CONFIG = {
  word: { label: '单词打卡', color: 'bg-blue-500', icon: ImageIcon },
  training: { label: '专项训练', color: 'bg-indigo-500', icon: BookOpen },
  correction: { label: '订正总结', color: 'bg-emerald-500', icon: Languages },
};

export const CheckInHistory: React.FC<CheckInHistoryProps> = ({ history, onPageChange, onDeleted }) => {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{urls: string[], index: number} | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这条打卡记录吗？')) return;
    
    setIsDeleting(id);
    try {
      await deleteCheckIn(id);
      toast.success('记录已删除');
      onDeleted();
    } catch {
      toast.error('删除失败，请稍后再试');
    } finally {
      setIsDeleting(null);
    }
  };

  if (history.items.length === 0) {
    return (
      <div className="text-center py-12 theme-subtle italic">
        还没有打卡记录哦，快去开启第一次打卡吧！✨
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2 ml-1 theme-text">
        <span className="w-1.5 h-6 bg-primary rounded-full" />
        近期记录 ({history.total})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.items.map((record) => {
          const config = TYPE_CONFIG[record.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.word;
          const displayImages = record.imageUrls?.length > 0 ? record.imageUrls : (record.imageUrl ? [record.imageUrl] : []);
          const promptImages = record.promptImageUrls || [];
          
          return (
            <Card key={record._id} className="theme-card overflow-hidden group hover:shadow-md transition-all border-border/50 relative">
              <div className="aspect-video relative overflow-hidden bg-muted flex">
                {/* 如果有题目图片，展示题目图片和打卡图片的组合 */}
                {promptImages.length > 0 ? (
                  <div className="flex w-full h-full">
                    {/* 题目图 */}
                    <div 
                      className="flex-1 h-full overflow-hidden border-r border-background/20 relative cursor-zoom-in"
                      onClick={() => setPreviewData({ urls: [...promptImages, ...displayImages], index: 0 })}
                    >
                      <img src={promptImages[0]} alt="Prompt" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600/80 text-white text-[8px] font-bold rounded">题目</div>
                    </div>
                    {/* 打卡图 */}
                    <div 
                      className="flex-1 h-full overflow-hidden relative cursor-zoom-in"
                      onClick={() => setPreviewData({ urls: [...promptImages, ...displayImages], index: promptImages.length })}
                    >
                      <img src={displayImages[0]} alt="Result" className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-600/80 text-white text-[8px] font-bold rounded">成果</div>
                    </div>
                  </div>
                ) : (
                  displayImages.map((url, idx) => (
                    <div 
                      key={idx} 
                      className="flex-1 h-full overflow-hidden border-r border-background/20 last:border-none relative cursor-zoom-in"
                      onClick={() => setPreviewData({ urls: displayImages, index: idx })}
                    >
                      <img 
                        src={url} 
                        alt="Check in" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))
                )}
                
                <div className="absolute top-2 left-2 flex gap-1 pointer-events-none">
                  <div className="px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white font-bold">
                    {dayjs(record.createdAt).format('MM-DD HH:mm')}
                  </div>
                  <div className={`px-2 py-1 ${config.color} text-white rounded text-[10px] font-bold flex items-center gap-1`}>
                    <config.icon className="w-3 h-3" />
                    {config.label}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(record._id);
                  }}
                  disabled={isDeleting === record._id}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-50 z-10"
                >
                  {isDeleting === record._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
                
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-yellow-500 text-black rounded text-[10px] font-black shadow-lg">
                  +{record.pointsEarned} PTS
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-2">
                    {record.paperId && (
                      <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold text-muted-foreground uppercase border border-border/50">
                        {record.paperId}
                      </span>
                    )}
                    {record.section && (
                      <span className="px-2 py-0.5 bg-primary/10 rounded text-[10px] font-bold text-primary">
                        {record.section}
                      </span>
                    )}
                  </div>
                  {record.score !== undefined && record.score > 0 && (
                    <div className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      SCORE: {Math.round(record.score)}
                    </div>
                  )}
                  {(record as any).essayResult && (
                    <button 
                      onClick={() => (window as any).showEssayDetail?.({ 
                        ...(record as any).essayResult, 
                        promptImageUrls: record.promptImageUrls, 
                        resultImageUrls: record.imageUrls 
                      })}
                      className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span className="text-[10px] font-bold">查看批改</span>
                    </button>
                  )}
                </div>
                
                {record.content && (
                  <p className="text-sm theme-text line-clamp-2 italic font-medium">
                    "{record.content}"
                  </p>
                )}

                {record.type === 'training' && record.totalQuestions && (
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground bg-muted/30 p-2 rounded-lg border border-dashed">
                    <span>总题数: {record.totalQuestions}</span>
                    <span className="w-[1px] h-3 bg-border" />
                    <span className="text-emerald-500">正确: {record.correctQuestions}</span>
                    <span className="w-[1px] h-3 bg-border" />
                    <span className="text-primary">正确率: {Math.round((record.correctQuestions! / record.totalQuestions!) * 100)}%</span>
                  </div>
                )}
                
                <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                  <div className="flex gap-2">
                    <Quote className="w-4 h-4 text-primary/40 shrink-0 mt-0.5" />
                    <p className="text-xs theme-subtle leading-relaxed italic">
                      {record.encouragement}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 图片预览 Dialog */}
      <Dialog open={!!previewData} onOpenChange={(open) => !open && setPreviewData(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-[80vw] max-h-[90vh] p-0 overflow-hidden bg-black/90 border-none">
          {previewData && (
            <div className="relative w-full h-full flex items-center justify-center p-4 min-h-[50vh]">
              <button 
                onClick={() => setPreviewData(null)}
                className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {previewData.urls.length > 1 && (
                <>
                  <button 
                    onClick={() => setPreviewData(prev => prev ? ({ ...prev, index: (prev.index - 1 + prev.urls.length) % prev.urls.length }) : null)}
                    className="absolute left-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <ChevronLeftCircle className="w-8 h-8" />
                  </button>
                  <button 
                    onClick={() => setPreviewData(prev => prev ? ({ ...prev, index: (prev.index + 1) % prev.urls.length }) : null)}
                    className="absolute right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                  >
                    <ChevronRightCircle className="w-8 h-8" />
                  </button>
                </>
              )}

              <img 
                src={previewData.urls[previewData.index]} 
                alt="Preview" 
                className="max-w-full max-h-[85vh] object-contain shadow-2xl animate-in zoom-in-95 duration-300"
              />
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-white text-xs font-bold">
                {previewData.index + 1} / {previewData.urls.length}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 分页控制 */}
      {history.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={history.page === 1}
            onClick={() => onPageChange(history.page - 1)}
            className="rounded-xl font-bold"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一页
          </Button>
          <span className="text-sm font-black theme-text">
            {history.page} / {history.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={history.page === history.totalPages}
            onClick={() => onPageChange(history.page + 1)}
            className="rounded-xl font-bold"
          >
            下一页
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
