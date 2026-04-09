import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { CET4CheckIn } from '../components/cet4-check-in';
import { CheckInCalendar } from '../components/check-in-calendar';
import { RewardBoard } from '../components/reward-board';
import { CheckInHistory } from '../components/check-in-history';
import { getCheckInHistory, getWeeklyRewards } from '../api';
import type { CheckInRecord, CheckInReward } from '../types';
import type { CheckInHistoryResponse } from '../api';
import api from '@/lib/axios';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Flame,
  Calendar as CalendarIcon,
  BarChart3,
  History,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getProfile } from '@/features/auth/api/get-profile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScoreChart } from '../components/score-chart';
import { EssayDetailDialog } from '../components/essay-detail-dialog';

export const CheckInPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [history, setHistory] = useState<{
    items: CheckInRecord[];
    total: number;
    page: number;
    totalPages: number;
  }>({ items: [], total: 0, page: 1, totalPages: 1 });
  const [rewards, setRewards] = useState<CheckInReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTypeTab] = useState('check-in');
  const [activeEssayResult, setActiveEssayResult] = useState<any | null>(null);

  // 注册全局查看作文批改详情的方法，确保在任何 Tab 下都能调用
  useEffect(() => {
    (window as any).showEssayDetail = (result: any) => {
      setActiveEssayResult(result);
    };
    return () => {
      delete (window as any).showEssayDetail;
    };
  }, []);

  const fetchData = useCallback(async (page = 1, date?: string) => {
    try {
      const [historyRes, rewardsRes] = await Promise.all([
        getCheckInHistory(page, 10, date),
        getWeeklyRewards()
      ]);
      setHistory(historyRes);
      setRewards(rewardsRes);
    } catch (error) {
      console.error('Failed to fetch check-in data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = async () => {
    try {
      const profile = await getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  useEffect(() => {
    fetchData(currentPage, selectedDate);
  }, [fetchData, currentPage, selectedDate]);

  const handleCheckInSuccess = () => {
    setSelectedDate(undefined);
    setCurrentPage(1);
    fetchData(1);
    refreshProfile();
  };

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setCurrentPage(1);
    setActiveTypeTab('history');
  };

  const handleRedeemSuccess = (remainingPoints: number) => {
    if (user) {
      setUser({ ...user, points: remainingPoints });
    }
  };

  // 计算打卡统计
  const totalDays = history.total;

  const getAllHistory = useCallback(async () => {
    try {
      const res = await api.get('/check-in/history?page=1&limit=1000');
      return res as unknown as CheckInHistoryResponse;
    } catch {
      return { items: [], total: 0, page: 1, totalPages: 1 };
    }
  }, []);

  const [fullHistory, setFullHistory] = useState<CheckInRecord[]>([]);
  useEffect(() => {
    getAllHistory().then(res => setFullHistory(res.items));
  }, [history.total, getAllHistory]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="text-slate-400 font-bold tracking-widest">正在开启打卡之旅...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <EssayDetailDialog 
          open={!!activeEssayResult} 
          onOpenChange={(open) => !open && setActiveEssayResult(null)} 
          result={activeEssayResult} 
        />
        {/* 1. 顶部统计与状态汇总 - 移动端堆叠，PC 端四列 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="theme-card border-none shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden">
            <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full relative min-h-[100px] md:min-h-[120px]">
              <Trophy className="absolute -bottom-2 -right-2 w-16 md:w-20 h-16 md:h-20 opacity-10" />
              <div className="flex items-center gap-2 opacity-80 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <Target className="w-3 h-3" />
                累计打卡
              </div>
              <div className="mt-2 md:mt-4">
                <span className="text-2xl md:text-4xl font-black">{totalDays}</span>
                <span className="text-xs ml-2 font-bold opacity-80">天</span>
              </div>
            </CardContent>
          </Card>

          <Card className="theme-card border-none shadow-sm bg-gradient-to-br from-orange-400 to-pink-500 text-white overflow-hidden">
            <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full relative min-h-[100px] md:min-h-[120px]">
              <Flame className="absolute -bottom-2 -right-2 w-16 md:w-20 h-16 md:h-20 opacity-10" />
              <div className="flex items-center gap-2 opacity-80 text-[10px] md:text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                当前积分
              </div>
              <div className="mt-2 md:mt-4">
                <span className="text-2xl md:text-4xl font-black">{user?.points || 0}</span>
                <span className="text-xs ml-2 font-bold opacity-80">PTS</span>
              </div>
            </CardContent>
          </Card>

          {/* PC端显示的辅助信息卡片，消除留白 */}
          <div className="hidden md:flex md:col-span-2 gap-4">
             <div className="flex-1 p-6 bg-muted/30 rounded-3xl border border-dashed flex flex-col justify-center">
                <p className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  今日进度
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min((history.total / 60) * 100, 100)}%` }} />
                </div>
                <p className="mt-2 text-[10px] font-bold text-primary">已完成 {Math.min(Math.round((history.total / 60) * 100), 100)}%</p>
             </div>
             <div className="flex-1 p-6 bg-primary/5 rounded-3xl border border-primary/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">距离考试</p>
                  <p className="text-sm font-black text-primary">稳步冲刺中</p>
                </div>
             </div>
          </div>
        </div>

        {/* 2. 核心交互区域 - 左右布局，右侧常驻日历 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 左侧主要区域：Tabs 切换核心功能 */}
          <div className="lg:col-span-8 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTypeTab} className="w-full">
              <TabsList className="bg-muted/50 p-1 rounded-xl mb-6 w-full md:w-auto grid grid-cols-3 md:inline-flex border border-border/50 h-auto md:h-12">
                <TabsTrigger value="check-in" className="w-full rounded-lg px-1 md:px-8 py-2 md:py-2.5 flex items-center justify-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <Target className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                  <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">今日任务</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="w-full rounded-lg px-1 md:px-8 py-2 md:py-2.5 flex items-center justify-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <History className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                  <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">打卡记录</span>
                </TabsTrigger>
                <TabsTrigger value="analysis" className="w-full rounded-lg px-1 md:px-8 py-2 md:py-2.5 flex items-center justify-center gap-1 md:gap-2 data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                  <BarChart3 className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
                  <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">得分分析</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="check-in" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CET4CheckIn onSuccess={handleCheckInSuccess} history={history} />
              </TabsContent>
              
              <TabsContent value="history" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-4">
                  {selectedDate && (
                    <div className="flex items-center justify-between bg-primary/10 p-3 rounded-xl border border-primary/20">
                      <span className="text-sm font-bold text-primary flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        正在查看: {selectedDate}
                      </span>
                      <button 
                        onClick={() => handleCheckInSuccess()}
                        className="text-xs font-black text-primary hover:underline"
                      >
                        显示全部记录
                      </button>
                    </div>
                  )}
                  <CheckInHistory 
                    history={history} 
                    onPageChange={handlePageChange}
                    onDeleted={handleCheckInSuccess} 
                  />
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="m-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                <ScoreChart history={fullHistory} />
              </TabsContent>
            </Tabs>
          </div>

          {/* 右侧辅助区域：日历与奖励常驻，消除 PC 端留白 */}
          <div className="lg:col-span-4 space-y-8 sticky top-8">
            <CheckInCalendar 
              history={{ items: fullHistory, total: history.total }} 
              onDateClick={handleDateClick}
            />
            <RewardBoard 
              rewards={rewards} 
              userPoints={user?.points || 0} 
              onRedeemSuccess={handleRedeemSuccess} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};
