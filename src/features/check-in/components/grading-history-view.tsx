import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getCheckInHistory } from '../api';
import type { CheckInRecord } from '../types';
import dayjs from 'dayjs';
import { 
  BookOpen, 
  Languages, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Maximize2,
  Sparkles,
  FileText,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EssayDetailDialog } from './essay-detail-dialog';

export const GradingHistoryView: React.FC = () => {
  const [history, setHistory] = useState<{
    items: CheckInRecord[];
    total: number;
    page: number;
    totalPages: number;
  }>({ items: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeEssayResult, setActiveEssayResult] = useState<any | null>(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // 只获取专项训练类型的记录，因为只有这些才有批改结果
      const res = await getCheckInHistory(page, 12);
      // 过滤出有 essayResult 的记录
      const gradingItems = res.items.filter(item => item.essayResult);
      setHistory({
        ...res,
        items: gradingItems
      });
    } catch (error) {
      console.error('Failed to fetch grading history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(currentPage);
  }, [fetchHistory, currentPage]);

  const TYPE_CONFIG = {
    training: { label: '专项训练', color: 'bg-indigo-500', icon: BookOpen },
    correction: { label: '订正总结', color: 'bg-emerald-500', icon: Languages },
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-6xl animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <History className="w-8 h-8 text-blue-600" />
            </div>
            批改历史记录
          </h2>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            “笨猪，每一次批改都是你进步的足迹哦 ✨”
          </p>
        </div>
      </div>

      {loading && history.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">正在努力加载批改记录...</p>
        </div>
      ) : history.items.length === 0 ? (
        <Card className="theme-card border-dashed py-20">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <FileText className="w-12 h-12 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold">还没有批改记录呢</p>
              <p className="text-muted-foreground text-sm">快去“欣妍四级500+”里完成一次作文或翻译练习吧！</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.items.map((record) => {
              const config = TYPE_CONFIG[record.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.training;
              const result = record.essayResult;
              const promptImages = record.promptImageUrls || [];
              const resultImages = record.imageUrls || [];
              
              return (
                <div 
                  key={record._id} 
                  className="group relative bg-card border border-border/50 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer"
                  onClick={() => setActiveEssayResult({ ...result, promptImageUrls: promptImages, resultImageUrls: resultImages })}
                >
                  {/* Card Header with Score */}
                  <div className="aspect-[16/9] relative overflow-hidden bg-muted flex">
                    {promptImages.length > 0 ? (
                      <div className="flex w-full h-full">
                        <div className="flex-1 h-full overflow-hidden border-r border-background/20 relative">
                          <img src={promptImages[0]} alt="Prompt" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-600/80 text-white text-[8px] font-bold rounded">题目</div>
                        </div>
                        <div className="flex-1 h-full overflow-hidden relative">
                          <img src={resultImages[0]} alt="Result" className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-rose-600/80 text-white text-[8px] font-bold rounded">成果</div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={resultImages[0]} 
                        alt="Handwritten" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                    
                    {/* Score Tag */}
                    <div className="absolute bottom-4 left-4 flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{result?.score15}</span>
                      <span className="text-sm font-bold text-white/60">/ 15</span>
                    </div>

                    {/* Type Badge */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5", config.color)}>
                        <config.icon className="w-3 h-3" />
                        {record.section === 'translation' ? '翻译批改' : '作文批改'}
                      </div>
                    </div>

                    {/* Date Tag */}
                    <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] text-white font-bold border border-white/10">
                      {dayjs(record.createdAt).format('YYYY-MM-DD')}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider">
                        {record.paperId}
                      </span>
                      <div className="flex items-center gap-1 text-rose-500 font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        {result?.grade}
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3 italic leading-relaxed">
                      "{result?.comments}"
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-border/50">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        710换算: <span className="text-primary">{result?.score710}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold group-hover:text-primary transition-colors">
                        查看详情
                        <Maximize2 className="w-3 h-3 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {history.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="px-4 py-2 bg-muted rounded-xl text-xs font-bold">
                第 {currentPage} 页 / 共 {history.totalPages} 页
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={currentPage === history.totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="rounded-xl"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Detail Dialog */}
      <EssayDetailDialog 
        open={!!activeEssayResult} 
        onOpenChange={(open) => !open && setActiveEssayResult(null)}
        result={activeEssayResult}
      />
    </div>
  );
};
