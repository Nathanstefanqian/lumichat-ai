import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Coins, CheckCircle2, Lock } from 'lucide-react';
import type { CheckInReward } from '../types';
import { toast } from 'sonner';
import { redeemReward } from '../api';

interface RewardBoardProps {
  rewards: CheckInReward[];
  userPoints: number;
  onRedeemSuccess: (remainingPoints: number) => void;
}

export const RewardBoard: React.FC<RewardBoardProps> = ({ rewards, userPoints, onRedeemSuccess }) => {
  const handleRedeem = async (reward: CheckInReward) => {
    if (userPoints < reward.pointsCost) {
      toast.error('积分还不够哦，继续加油打卡吧！💪');
      return;
    }

    try {
      const res = await redeemReward(reward.id);
      toast.success(res.message);
      onRedeemSuccess(res.remainingPoints);
    } catch (error) {
      const message = error instanceof Error ? error.message : '兑换失败';
      toast.error(message);
    }
  };

  return (
    <Card className="theme-card border-2 border-yellow-500/20">
      <CardHeader className="p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-yellow-600" />
              本周奖励榜单
            </CardTitle>
            <CardDescription className="text-[10px]">打卡积分可兑换以下惊喜奖励哦</CardDescription>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400 font-bold uppercase">我的积分</span>
            <div className="flex items-center gap-1 text-yellow-600 font-black">
              <Coins className="w-4 h-4" />
              <span>{userPoints}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {rewards.length === 0 ? (
          <div className="py-8 text-center text-xs theme-subtle italic">
            本周还没有设置奖励呢，敬请期待吧！🎁
          </div>
        ) : (
          rewards.map((reward) => {
            const canAfford = userPoints >= reward.pointsCost;
            return (
              <div 
                key={reward.id} 
                className={`
                  group p-3 rounded-xl border transition-all
                  ${canAfford ? 'border-yellow-200 bg-yellow-50/30 dark:border-yellow-900/30 dark:bg-yellow-900/10 hover:shadow-sm' : 'border-border bg-muted/30 opacity-80'}
                `}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm theme-text truncate">{reward.title}</h4>
                    {reward.description && (
                      <p className="text-[10px] theme-subtle truncate mt-0.5">{reward.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs font-mono text-yellow-700 dark:text-yellow-500">
                      <Coins className="w-3 h-3" />
                      <span>{reward.pointsCost}</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant={canAfford ? "default" : "secondary"}
                      disabled={!canAfford}
                      onClick={() => handleRedeem(reward)}
                      className={`h-7 px-3 text-[10px] font-bold rounded-full ${canAfford ? 'bg-yellow-500 hover:bg-yellow-600 text-black shadow-sm' : ''}`}
                    >
                      {canAfford ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          兑换
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          锁定
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <p className="text-[9px] theme-subtle text-center pt-2">
          💡 奖励每周一更新，记得及时兑换哦！
        </p>
      </CardContent>
    </Card>
  );
};
