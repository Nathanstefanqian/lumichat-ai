import { useState, useEffect } from 'react';
import { useInterviewPrep } from '../hooks/use-interview-prep';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Calendar, Clock, Plus, Building2, MapPin, 
  Target, BrainCircuit, CheckCircle2, Circle, 
  Loader2, ChevronRight, LayoutGrid
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const CATEGORIES = [
  "AI 基础", "提示词工程", "RAG & Embedding", "Agent Workflow", 
  "MCP & Tools", "流式输出", "HTML5 & CSS3", "Node.js", 
  "浏览器 & 网络", "算法", "Vue", "React", "性能优化", "JS & TS"
];

export const InterviewPrepView = () => {
  const { tasks, companies, loading, toggleTask, addCompany } = useInterviewPrep();
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    position: '前端开发实习生',
    location: '深圳',
    scale: '大厂' as const,
    importance: 5,
    interviewDate: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm'),
    status: 'pending' as const
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedCompanies = [...companies].sort((a, _b) => 
    dayjs(a.interviewDate).diff(currentTime)
  );
  const upcomingCompanies = sortedCompanies.filter(c => dayjs(c.interviewDate).isAfter(currentTime)).slice(0, 3);

  const formatCountdown = (date: string) => {
    const diff = dayjs(date).diff(currentTime);
    if (diff <= 0) return '已开始/已结束';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}天 ${hours}时 ${mins}分 ${secs}秒`;
  };

  const handleAddCompany = async () => {
    if (!newCompany.name) {
      toast.error('请输入公司名称');
      return;
    }
    try {
      await addCompany(newCompany);
      setIsAddDialogOpen(false);
      setNewCompany({
        name: '',
        position: '前端开发实习生',
        location: '深圳',
        scale: '大厂',
        importance: 5,
        interviewDate: dayjs().add(7, 'day').format('YYYY-MM-DDTHH:mm'),
        status: 'pending'
      });
      toast.success('面试日程添加成功！猪宝加油！');
    } catch (err) {
      toast.error('添加失败，请重试');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto md:overflow-hidden custom-scrollbar">
      {/* Header with Top 3 Countdown */}
      <div className="p-4 md:p-6 pb-0 md:pb-0 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start justify-between">
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
              <span className="text-xs font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-widest">AI Interview Prep</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black theme-text">AI 前端面试突击 🚀</h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-2">猪宝加油！目标：深圳大厂，AI 全栈起飞！❤️</p>
          </div>

          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-4 lg:pb-6 scrollbar-hidden">
            {upcomingCompanies.length > 0 ? upcomingCompanies.map((c, i) => (
              <Card key={i} className="flex-none w-72 p-5 bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="absolute top-0 right-0 p-1 opacity-10">
                  <Building2 className="w-12 h-12" />
                </div>
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={c.scale === '大厂' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0">
                    {c.scale}
                  </Badge>
                  <span className="text-[10px] font-mono font-black text-primary animate-pulse">{formatCountdown(c.interviewDate)}</span>
                </div>
                <h4 className="font-bold text-base truncate group-hover:text-primary transition-colors">{c.name}</h4>
                <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1.5 opacity-70">
                  <MapPin className="w-3 h-3" /> {c.location} · {c.position}
                </p>
              </Card>
            )) : (
              <div className="flex items-center gap-3 p-5 bg-muted/50 rounded-2xl border border-dashed border-border text-muted-foreground w-full lg:w-72">
                <Calendar className="w-5 h-5 opacity-20" />
                <span className="text-xs font-medium">暂无待面试日程</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 min-h-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col gap-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 flex-none">
              <TabsList className="bg-muted/50 border border-border w-full sm:w-auto">
                <TabsTrigger value="overview" className="flex-1 sm:flex-none gap-2">
                  <LayoutGrid className="w-4 h-4" /> 总览
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex-1 sm:flex-none gap-2">
                  <BrainCircuit className="w-4 h-4" /> 知识点
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex-1 sm:flex-none gap-2">
                  <Calendar className="w-4 h-4" /> 日程
                </TabsTrigger>
              </TabsList>

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> 新增面试
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>新增面试日程</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">公司名称</Label>
                      <Input 
                        id="name" 
                        value={newCompany.name} 
                        onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                        placeholder="例如：腾讯"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="location">地点</Label>
                        <Input 
                          id="location" 
                          value={newCompany.location} 
                          onChange={e => setNewCompany({...newCompany, location: e.target.value})}
                          placeholder="深圳"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="scale">规模</Label>
                        <Select 
                          value={newCompany.scale} 
                          onValueChange={(v: any) => setNewCompany({...newCompany, scale: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择规模" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="大厂">大厂</SelectItem>
                            <SelectItem value="中厂">中厂</SelectItem>
                            <SelectItem value="小厂">小厂</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">面试时间</Label>
                      <Input 
                        id="date" 
                        type="datetime-local" 
                        value={newCompany.interviewDate}
                        onChange={e => setNewCompany({...newCompany, interviewDate: e.target.value})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddCompany}>确定添加</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <TabsContent value="overview" className="mt-2 outline-none">
                {/* 今日复习进度 - 彻底去卡片化，直接平铺在文档流 */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Today's Progress</span>
                      </div>
                      <h3 className="text-2xl font-black theme-text tracking-tight">今日复习进度</h3>
                      <p className="text-xs text-muted-foreground mt-2 opacity-70">猪宝加油！今天的面试知识点过关情况如下：</p>
                    </div>
                    <div className="flex items-baseline gap-2 bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10">
                      <span className="text-5xl md:text-6xl font-black text-primary tracking-tighter">
                        {tasks.filter(t => t.isCompleted).length}
                      </span>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-60">
                        / {tasks.length} 已过关
                      </span>
                    </div>
                  </div>
                  
                  <div className="relative pt-4">
                    <div className="w-full h-4 bg-muted/30 rounded-full overflow-hidden p-1 border border-border/20">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(var(--primary),0.2)]" 
                        style={{ width: `${(tasks.filter(t => t.isCompleted).length / (tasks.length || 1)) * 100}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-5 px-1 text-[10px] font-bold text-muted-foreground/30 uppercase tracking-[0.15em]">
                      <span>开始奋斗</span>
                      <span>渐入佳境</span>
                      <span>即将大功告成</span>
                      <span>目标完成</span>
                    </div>
                  </div>
                </div>
            </TabsContent>

            <TabsContent value="knowledge" className="flex-1 outline-none md:overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
              <Card className="flex-1 flex flex-col bg-card border-border shadow-sm md:overflow-hidden border-none sm:border-solid">
                <div className="p-4 border-b border-border bg-muted/30 flex-none">
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hidden">
                    {CATEGORIES.map(cat => (
                      <Badge key={cat} variant="outline" className="shrink-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors whitespace-nowrap">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-0 sm:p-4 space-y-3 md:overflow-y-auto custom-scrollbar">
                  {tasks.length > 0 ? tasks.map(task => (
                    <div 
                      key={task.taskId} 
                      onClick={() => toggleTask(task.taskId)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group",
                        task.isCompleted 
                          ? "bg-primary/5 border-primary/30 opacity-70" 
                          : "bg-background border-border hover:border-primary/50 hover:shadow-md"
                      )}
                    >
                      {task.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-[10px] py-0">{task.category}</Badge>
                          {task.completedAt && (
                            <span className="text-[10px] text-muted-foreground">已过关: {dayjs(task.completedAt).format('MM-DD HH:mm')}</span>
                          )}
                        </div>
                        <h4 className={cn("text-sm font-bold truncate", task.isCompleted && "line-through")}>{task.title}</h4>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  )) : (
                    <div className="py-20 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                      <BrainCircuit className="w-16 h-16 opacity-10" />
                      <p className="text-sm font-medium italic text-center px-6">D1 整理期：快去录入你要攻克的知识点吧！</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="schedule" className="flex-1 outline-none md:overflow-y-auto md:pr-2 custom-scrollbar mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                {sortedCompanies.map((c, i) => (
                  <Card key={i} className={cn(
                    "p-6 border-border shadow-sm hover:shadow-md transition-all relative overflow-hidden group",
                    c.location.includes('深圳') ? "bg-primary/5 border-primary/30" : "bg-card"
                  )}>
                    {c.location.includes('深圳') && (
                      <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-primary-foreground text-[10px] font-black rounded-bl-xl shadow-sm">
                        深圳核心目标
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-xl font-black text-primary border border-border">
                        {c.name[0]}
                      </div>
                      <div>
                        <h4 className="font-black theme-text text-lg">{c.name}</h4>
                        <Badge variant="outline" className="text-[10px]">{c.scale}</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <Target className="w-4 h-4" />
                        <span className="font-medium">{c.position}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{c.location}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-primary font-bold">
                        <Clock className="w-4 h-4" />
                        <span>{dayjs(c.interviewDate).format('YYYY-MM-DD HH:mm')}</span>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/60 tracking-tighter">
                        {dayjs(c.interviewDate).isAfter(currentTime) ? '离面试还有' : '面试已进行'}
                      </span>
                      <span className="text-sm font-mono font-black text-primary">{formatCountdown(c.interviewDate)}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
