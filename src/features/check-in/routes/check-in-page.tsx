import React, { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { CheckInForm } from '../components/check-in-form';
import { CheckInCalendar } from '../components/check-in-calendar';
import { RewardBoard } from '../components/reward-board';
import { CheckInHistory } from '../components/check-in-history';
import { getCheckInHistory, getWeeklyRewards } from '../api';
import type { CheckInRecord, CheckInReward } from '../types';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Gift, 
  ChevronRight,
  Flame
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getProfile } from '@/features/auth/api/get-profile';

export const CheckInPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [history, setHistory] = useState<CheckInRecord[]>([]);
  const [rewards, setRewards] = useState<CheckInReward[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [historyRes, rewardsRes] = await Promise.all([
        getCheckInHistory(),
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
    fetchData();
  }, [fetchData]);

  const handleCheckInSuccess = () => {
    fetchData();
    refreshProfile();
  };

  const handleRedeemSuccess = (remainingPoints: number) => {
    if (user) {
      setUser({ ...user, points: remainingPoints });
    }
  };

  // 计算打卡统计
  const totalDays = history.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-slate-400">正在开启打卡之旅...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* 头部统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="theme-card border-none shadow-sm bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden">
          <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full relative">
            <Trophy className="absolute -bottom-2 -right-2 w-20 h-20 opacity-10" />
            <div className="flex items-center gap-2 opacity-80 text-xs font-bold uppercase tracking-wider">
              <Target className="w-3 h-3" />
              累计打卡
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-black">{totalDays}</span>
              <span className="text-sm ml-2 font-bold opacity-80">天</span>
            </div>
          </CardContent>
        </Card>

        <Card className="theme-card border-none shadow-sm bg-gradient-to-br from-orange-400 to-pink-500 text-white overflow-hidden">
          <CardContent className="p-4 md:p-6 flex flex-col justify-between h-full relative">
            <Flame className="absolute -bottom-2 -right-2 w-20 h-20 opacity-10" />
            <div className="flex items-center gap-2 opacity-80 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              当前积分
            </div>
            <div className="mt-4">
              <span className="text-3xl md:text-4xl font-black">{user?.points || 0}</span>
              <span className="text-sm ml-2 font-bold opacity-80">PTS</span>
            </div>
          </CardContent>
        </Card>

        {/* 移动端快速跳转入口 (隐藏，仅做参考) */}
        <div className="md:hidden col-span-2 grid grid-cols-2 gap-2">
            <div className="p-3 bg-muted rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold">查看日历</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
            <div className="p-3 bg-muted rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-bold">兑换奖励</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 左侧：打卡表单和历史记录 */}
        <div className="lg:col-span-8 space-y-8">
          <CheckInForm onSuccess={handleCheckInSuccess} />
          <CheckInHistory history={history} />
        </div>

        {/* 右侧：日历和奖励榜单 */}
        <div className="lg:col-span-4 space-y-8">
          <CheckInCalendar history={history} />
          <RewardBoard 
            rewards={rewards} 
            userPoints={user?.points || 0} 
            onRedeemSuccess={handleRedeemSuccess} 
          />
        </div>
      </div>
    </div>
  );
};
