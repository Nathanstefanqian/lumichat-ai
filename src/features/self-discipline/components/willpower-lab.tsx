import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getWillpowerStatus, recordBehavior, getBehaviorLogs, deleteBehaviorLog, refreshAiReport, setGuardian, getFriends } from '../api';
import type { WillpowerStatus, BehaviorLog, RecordBehaviorDto } from '../types';
import { RecordModal } from './record-modal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format, subDays, startOfDay, isSameDay, differenceInSeconds } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { 
  ShieldCheck, 
  Zap, 
  History, 
  Timer, 
  AlertCircle,
  BarChart3, 
  PieChart as PieChartIcon, 
  Calendar, 
  Clock, 
  Trash2, 
  BrainCircuit, 
  Lightbulb, 
  FileSearch, 
  CheckCircle2,
  TrendingUp,
  UserCheck,
  Settings2,
  Users
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const PositiveTimer = ({ lastActionTime }: { lastActionTime: string }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = differenceInSeconds(new Date(), new Date(lastActionTime));
      setElapsed(diff);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [lastActionTime]);

  const days = Math.floor(elapsed / (24 * 3600));
  const hours = Math.floor((elapsed % (24 * 3600)) / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-2 items-baseline">
        <span className="text-4xl font-black tabular-nums">{days}</span><span className="text-xs font-bold opacity-50">天</span>
        <span className="text-4xl font-black tabular-nums">{hours.toString().padStart(2, '0')}</span><span className="text-xs font-bold opacity-50">时</span>
        <span className="text-4xl font-black tabular-nums">{minutes.toString().padStart(2, '0')}</span><span className="text-xs font-bold opacity-50">分</span>
        <span className="text-4xl font-black tabular-nums text-primary">{seconds.toString().padStart(2, '0')}</span><span className="text-xs font-bold opacity-50">秒</span>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-2 flex items-center gap-1">
        <Clock className="w-3 h-3" /> 已持续自律时长
      </p>
    </div>
  );
};

export const WillpowerLab = () => {
  const [status, setStatus] = useState<WillpowerStatus | null>(null);
  const [logs, setLogs] = useState<BehaviorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<BehaviorLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRefreshingReport, setIsRefreshingReport] = useState(false);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [isSettingGuardian, setIsSettingGuardian] = useState(false);

  const fetchStatus = async () => {
    try {
      const statusResponse = await getWillpowerStatus();
      const logsResponse = await getBehaviorLogs();
      
      // Axios 拦截器已经处理了 { code, data, message }
      const statusData = (statusResponse as unknown as { data: WillpowerStatus }).data || statusResponse;
      const logsData = (logsResponse as unknown as { data: BehaviorLog[] }).data || logsResponse;
      
      console.log('Processed status:', statusData);
      console.log('Processed logs:', logsData);
      
      setStatus(statusData as WillpowerStatus);
      setLogs(Array.isArray(logsData) ? (logsData as BehaviorLog[]) : []);
    } catch (error: unknown) {
      console.error('Fetch error:', error);
      const message = error instanceof Error ? error.message : '获取数据失败';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  // 数据转换：诱因分析
  const triggerData = useMemo(() => {
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      log.triggers.forEach(t => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  // 数据转换：自律趋势 (两次行为之间的间隔时间)
  const trendData = useMemo(() => {
    if (logs.length < 2) return [];
    const data = [];
    for (let i = logs.length - 1; i > 0; i--) {
      const current = new Date(logs[i-1].timestamp).getTime();
      const prev = new Date(logs[i].timestamp).getTime();
      const intervalHours = (current - prev) / (1000 * 60 * 60);
      data.push({
        date: format(new Date(logs[i-1].timestamp), 'MM-dd'),
        hours: parseFloat(intervalHours.toFixed(1))
      });
    }
    return data;
  }, [logs]);

  // 数据转换：热力图 (最近 28 天)
  const heatmapData = useMemo(() => {
    const days = [];
    for (let i = 27; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const count = logs.filter(log => isSameDay(new Date(log.timestamp), date)).length;
      days.push({ date, count });
    }
    return days;
  }, [logs]);

  const handleOpenModal = () => {
    if (!status) return;
    
    // 如果正在冷却中，依然允许记录（透支模式升级）
    if (status.isCoolingDown) {
      if (!window.confirm('宝宝，当前身体正在修复中（冷却期），确定要强行再次记录“破戒”行为吗？这对身体伤害很大哦...')) {
        return;
      }
    } else if (status.currentTokens < 1) {
      // 如果点数不足，允许强行记录（透支模式）
      if (!window.confirm('宝宝，当前意志力点数不足，确定要强行记录这次“破戒”行为吗？这将导致点数进一步透支哦...')) {
        return;
      }
    }
    
    setIsModalOpen(true);
  };

  const handleConfirmRecord = async (data: RecordBehaviorDto) => {
    setIsRecording(true);
    try {
      await recordBehavior(data);
      toast.success('记录成功，点数已扣除。重新开始戒色守护！');
      setIsModalOpen(false);
      // 立即刷新数据
      await fetchStatus();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '记录失败';
      toast.error(message);
    } finally {
      setIsRecording(false);
    }
  };

  const handleShowDetail = (log: BehaviorLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await deleteBehaviorLog(logId);
      toast.success('记录已成功删除');
      await fetchStatus();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '删除失败';
      toast.error(message);
    }
  };

  const handleRefreshReport = async () => {
    if (!status || isRefreshingReport) return;
    setIsRefreshingReport(true);
    try {
      await refreshAiReport();
      await fetchStatus();
      toast.success('AI 诊断报告已更新');
    } catch (error) {
      console.error('Refresh report error:', error);
      toast.error('AI 报告更新失败，请稍后再试');
    } finally {
      setIsRefreshingReport(false);
    }
  };

  const handleTabChange = (value: string) => {
    if (value === 'ai-report') {
      // 只有当没有报告或者报告是很久以前的时候才自动刷新
      const shouldRefresh = !status?.aiReport || 
        (status.aiReport && new Date().getTime() - new Date(status.aiReport.updatedAt).getTime() > 10 * 60 * 1000); // 10分钟有效期
      
      if (shouldRefresh) {
        handleRefreshReport();
      }
    }
  };

  const handleOpenGuardianModal = async () => {
    try {
      const friendList = await getFriends();
      setFriends(friendList);
      setIsGuardianModalOpen(true);
    } catch (error) {
      toast.error('获取好友列表失败');
    }
  };

  const handleSetGuardian = async (guardianId: string) => {
    setIsSettingGuardian(true);
    try {
      const gid = guardianId === 'none' ? null : Number(guardianId);
      await setGuardian(gid);
      toast.success(gid ? '监护人设置成功' : '已取消监护人');
      setIsGuardianModalOpen(false);
      await fetchStatus();
    } catch (error) {
      toast.error('设置监护人失败');
    } finally {
      setIsSettingGuardian(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center p-12 text-primary font-medium">正在加载守护计划...</div>;
  if (!status) return null;

  const nextTokenProgress = status.currentTokens >= 5 ? 100 : (1 - (status.nextTokenIn / (24 * 60 * 60 * 1000))) * 100;

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 p-4 max-w-6xl mx-auto animate-in fade-in duration-500 pb-24">
        {/* 监护人视角提示 */}
        {status.isGuardianView && (
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-200 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                  <UserCheck className="w-6 h-6" />
                </div>
                {status.wardAvatar && (
                  <img 
                    src={status.wardAvatar} 
                    className="w-10 h-10 rounded-full border-2 border-white absolute -top-1 -left-1 object-cover shadow-sm" 
                    alt="ward avatar" 
                  />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">正在进入监护人视角</p>
                <p className="text-xs opacity-80 flex items-center gap-1.5">
                  你正在查看并监督好友 
                  <span className="font-bold underline decoration-wavy decoration-white/50">
                    {status.wardNickname || `ID: ${status.wardId}`}
                  </span> 
                  的自律数据
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white border-none">监护模式</Badge>
          </div>
        )}

        <RecordModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onConfirm={handleConfirmRecord}
          isSubmitting={isRecording}
        />

        {/* 监护人设置弹窗 */}
        <Dialog open={isGuardianModalOpen} onOpenChange={setIsGuardianModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                监护模式设置
              </DialogTitle>
              <DialogDescription>
                指定一名好友作为你的监护人。设置后，该好友将能实时查看你的戒色数据。
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> 选择监护人
                </Label>
                <Select 
                  defaultValue={status.guardianId?.toString() || 'none'} 
                  onValueChange={handleSetGuardian}
                  disabled={isSettingGuardian}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择一名好友" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不指定监护人</SelectItem>
                    {friends.map(friend => (
                      <SelectItem key={friend.id} value={friend.id.toString()}>
                        <div className="flex items-center gap-3">
                          {friend.avatar ? (
                            <img src={friend.avatar} className="w-6 h-6 rounded-full object-cover" alt="avatar" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-3 h-3 text-primary" />
                            </div>
                          )}
                          <span className="font-medium">{friend.nickname || friend.username}</span>
                          <span className="text-[10px] text-muted-foreground opacity-50">ID: {friend.id}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                * 监护人可以在其意志力实验室界面看到你的所有记录。请务必选择你信任的人哦，宝宝！
              </p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsGuardianModalOpen(false)}>关闭</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 详情弹窗 */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                破戒详情
              </DialogTitle>
              <DialogDescription>
                宝宝，这就是当时的战场记录，我们要吸取教训哦！
              </DialogDescription>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-6 py-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">破戒时间</Label>
                    <div className="text-sm font-bold">{format(new Date(selectedLog.timestamp), 'yyyy-MM-dd HH:mm:ss')}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="h-fit">{selectedLog.location}</Badge>
                    {selectedLog.duration && (
                      <span className="text-[10px] text-muted-foreground font-medium">
                        时长: {selectedLog.duration} 分钟
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">诱因分析</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedLog.triggers.map(t => (
                      <Badge key={t} variant="outline" className="bg-primary/5">{t}</Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">心情与备注</Label>
                  <div className="p-3 bg-muted/50 rounded-xl border border-border/50 text-sm italic">
                    <span className="font-bold text-primary not-italic">心情：</span>{selectedLog.moodPost}
                    {selectedLog.note && (
                      <>
                        <div className="my-2 border-t border-border/50" />
                        <span className="font-bold text-primary not-italic">感言：</span>{selectedLog.note}
                      </>
                    )}
                  </div>
                </div>

                {selectedLog.image && (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">现场罪证</Label>
                    <div className="rounded-xl overflow-hidden border border-border/50">
                      <img src={selectedLog.image} className="w-full h-auto object-cover max-h-[300px]" alt="evidence" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailOpen(false)}>知道了，我会反省的</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 核心控制面板 */}
        <Card className="lg:col-span-2 overflow-hidden border-2 border-primary/10 shadow-xl">
          <CardHeader className="bg-primary/5 pb-4 border-b">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-2xl font-black flex items-center gap-2 tracking-tight">
                    <ShieldCheck className="text-primary w-7 h-7" />
                    意志力实验室
                  </CardTitle>
                  {!status.isGuardianView && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-primary/10 text-muted-foreground"
                      onClick={handleOpenGuardianModal}
                    >
                      <Settings2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription className="text-sm font-medium opacity-70">
                  宝宝的自律守护计划 · 难度: 12h/Token · 目标: 有节律的适度自律
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-primary flex items-center gap-1 justify-end tabular-nums">
                  <Zap className={status.currentTokens < 0 ? "fill-rose-500 text-rose-500 w-6 h-6" : "fill-primary w-6 h-6"} />
                  <span className={status.currentTokens < 0 ? "text-rose-500" : ""}>
                    {status.currentTokens.toFixed(1)}
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Willpower Tokens</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-8">
            <div className="flex justify-center py-4">
              <PositiveTimer lastActionTime={status.lastActionTime} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="w-3.5 h-3.5" />
                  下一意志力点数恢复进度
                </span>
                <span className="text-primary">
                  {status.currentTokens >= 5 ? '已存满' : formatDistanceToNow(new Date(Date.now() + status.nextTokenIn), { locale: zhCN })}
                </span>
              </div>
              <Progress value={nextTokenProgress} className="h-4 rounded-full" />
            </div>

            <div className="flex flex-col items-center justify-center py-6 space-y-6">
              <div className="relative">
                <Button
                  size="lg"
                  disabled={isRecording}
                  onClick={handleOpenModal}
                  className={`
                    w-56 h-52 rounded-full text-2xl font-black transition-all duration-500 shadow-[0_0_40px_rgba(0,0,0,0.1)]
                    ${status.isCoolingDown ? 'bg-orange-500 hover:bg-orange-600 text-white border-4 border-orange-400/50 scale-100 hover:scale-105 active:scale-95 shadow-orange-200' : 
                      status.currentTokens >= 1 ? 'bg-emerald-500 hover:bg-emerald-600 scale-100 hover:scale-105 active:scale-95 shadow-emerald-200 border-4 border-emerald-400/50' : 
                      'bg-rose-500 hover:bg-rose-600 text-white border-4 border-rose-400/50 scale-100 hover:scale-105 active:scale-95 shadow-rose-200'}
                  `}
                >
                  {status.isCoolingDown ? '强行记录' : 
                   status.currentTokens >= 1 ? '戒色结算' : '点数透支'}
                </Button>
                {!status.isCoolingDown && (
                  <span className={`absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-black shadow-lg animate-bounce ${status.currentTokens >= 1 ? 'bg-primary text-primary-foreground' : 'bg-rose-500 text-white'}`}>
                    !
                  </span>
                )}
              </div>
              {status.isCoolingDown && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <p className="text-sm font-bold text-orange-500 flex items-center gap-1.5 bg-orange-500/10 px-4 py-2 rounded-full">
                    <AlertCircle className="w-4 h-4" />
                    身体正在修复中，若强行破戒请如实记录
                  </p>
                  <span className="text-xs text-muted-foreground font-medium italic">自律是一个循序渐进的过程，加油宝宝！</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 侧边统计看板 */}
        <div className="space-y-6">
          <Card className="border-2 border-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                戒色守护状态
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-3xl font-black text-primary">{status.streakDays} 天</div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">连续不打飞机时长</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-rose-500">{status.totalCount || 0} 次</div>
                  <p className="text-xs text-muted-foreground font-bold uppercase">累计破戒次数</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="text-left">
                  <div className="text-xl font-bold text-emerald-500">x{status.recoveryRate.toFixed(1)}</div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">恢复速率倍率</p>
                </div>
              </div>
              <div className="pt-4 border-t border-dashed">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">上次破戒时间</p>
                <div className="text-sm font-bold">
                  {format(new Date(status.lastActionTime), 'yyyy-MM-dd HH:mm:ss')}
                </div>
                <p className="text-xs font-medium text-primary mt-0.5">
                  ({formatDistanceToNow(new Date(status.lastActionTime), { addSuffix: true, locale: zhCN })})
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 简易热力图 */}
          <Card className="border-2 border-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                最近 28 天戒色热力图
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {heatmapData.map((day, i) => (
                  <div 
                    key={i} 
                    className={`
                      aspect-square rounded-sm transition-all duration-300
                      ${day.count === 0 ? 'bg-emerald-500/80' : 
                        day.count === 1 ? 'bg-amber-400' : 
                        'bg-rose-500'}
                    `}
                    title={`${format(day.date, 'MM-dd')}: ${day.count} 次`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-3 text-[10px] font-bold text-muted-foreground uppercase">
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-sm" /> 完美自律</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 bg-rose-500 rounded-sm" /> 破戒记录</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 数据分析与记录区 */}
      <Tabs defaultValue="charts" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl bg-muted/50 p-1 mb-4">
          <TabsTrigger value="charts" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            数据分析
          </TabsTrigger>
          <TabsTrigger value="ai-report" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            AI 诊断报告
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <History className="w-4 h-4" />
            破戒记录
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  戒色间隔趋势 (小时)
                </CardTitle>
                <CardDescription>记录两次破戒之间的坚持时长，曲线越高越棒哦！</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelStyle={{ fontWeight: 'bold' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="hours" 
                        stroke="#10b981" 
                        strokeWidth={4} 
                        dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground font-medium italic">
                    需要至少两次记录才能生成趋势图哦
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/5 shadow-md">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  破戒诱因分析
                </CardTitle>
                <CardDescription>看看是什么在诱导你的打飞机行为</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] pt-4">
                {triggerData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={triggerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {triggerData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground font-medium italic">
                    暂无诱因数据
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-report">
          <Card className="border-2 border-primary/5 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-500" />
                    意志力深度诊断报告
                  </CardTitle>
                  <CardDescription>
                    由 DeepSeek AI 引擎驱动 · 结合最近 5 次行为记录生成
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshReport}
                    disabled={isRefreshingReport}
                    className="h-8 gap-2 bg-white/50 backdrop-blur-sm border-indigo-200 hover:bg-indigo-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isRefreshingReport ? 'animate-pulse' : ''}`} />
                    {isRefreshingReport ? '正在分析...' : '手动刷新'}
                  </Button>
                  {status.aiReport && (
                    <div className="text-right">
                      <div className="text-3xl font-black text-indigo-600 leading-none">
                        {status.aiReport.score}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                        自律评分
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {status.aiReport ? (
                <div className="divide-y divide-border/50">
                  {/* 一句话总结 */}
                  <div className="p-6 bg-indigo-50/30">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-500 text-white p-2 rounded-xl">
                        <FileSearch className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-indigo-900">核心结论</h3>
                        <p className="text-base font-medium text-indigo-700 leading-relaxed">
                          “{status.aiReport.summary}”
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 状态分析 */}
                  <div className="p-6 space-y-4">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      深度状态分析
                    </h3>
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {status.aiReport.analysis}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* 改进建议 */}
                  <div className="p-6 space-y-4 bg-emerald-50/20">
                    <h3 className="text-sm font-bold flex items-center gap-2 text-emerald-700">
                      <Lightbulb className="w-4 h-4" />
                      自律守护建议
                    </h3>
                    <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {status.aiReport.advice}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* 更新时间 */}
                  <div className="p-4 bg-muted/30 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      报告已根据最新动态更新
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      生成于: {format(new Date(status.aiReport.updatedAt), 'yyyy-MM-dd HH:mm')}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 px-10 text-center space-y-4">
                  <div className="bg-muted p-4 rounded-full">
                    <BrainCircuit className="w-12 h-12 text-muted-foreground opacity-20" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-bold">暂无诊断报告</h3>
                    <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                      宝宝，AI 需要至少 1 次破戒记录来分析你的状态。在你下次提交破戒记录后，欣妍会请 DeepSeek 为你生成第一份深度诊断。
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="border-2 border-primary/5 shadow-md">
            <CardHeader>
              <CardTitle className="text-base font-bold">破戒历史清单</CardTitle>
              <CardDescription>记录每一次的教训，为了以后更好地自律。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.length > 0 ? logs.map((log, index) => (
                  <div 
                    key={index} 
                    onClick={() => handleShowDetail(log)}
                    className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10 group relative transition-all hover:bg-primary/10 cursor-pointer"
                  >
                    <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:scale-110 transition-transform">
                      <History className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm">
                          {format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{log.location}</Badge>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('确定要删除这条记录吗？删除后将无法恢复。')) {
                                handleDeleteLog(log._id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {log.triggers.map(t => (
                          <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic line-clamp-1">
                        心情：{log.moodPost} {log.duration && ` | 时长：${log.duration}min`} {log.note && ` | 感言：${log.note}`}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-muted-foreground italic">
                    暂无破戒记录，宝宝继续保持哦！
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  </div>
);
};
