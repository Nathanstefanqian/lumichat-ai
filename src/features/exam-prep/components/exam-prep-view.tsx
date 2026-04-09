import { useState, useEffect } from 'react';
import { useExamTasks } from '../hooks/use-exam-tasks';
import { TaskCard } from './task-card';
import { ProgressStats } from './progress-stats';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Loader2, Sparkles, Save, History, BrainCircuit, Clock as ClockIcon, Zap, MessageSquareQuote, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';

const WRITTEN_EXAM_DATE = '2026-03-28 13:30:00';
const INTERVIEW_EXAM_DATE = '2026-03-29 08:30:00';

const INTERVIEW_QUESTIONS = [
  "老电影修复",
  "什么是 VR、AR、MR 和 XR？它们之间有什么联系 and 区别？",
  "学院最近建设了 LED 虚拟拍摄棚，你了解 LED 虚拟拍摄（Virtual Production）吗？它和传统绿幕有什么区别？",
  "什么是“数字人”？它涉及哪些关键技术？",
  "什么是“动作捕捉 (Motion Capture)”？有哪些主流的技术路线？",
  "什么是“粒子系统”？在电影特效中有什么用？",
  "什么是“纹理映射 (Texture Mapping)”？",
  "计算机图形学中如何处理“光的明暗”？(Phong 模型)",
  "“实时渲染”与“离线渲染”有什么区别？",
  "数字水印",
  "数字电影",
  "虚幻引擎, Nanite, Lumen",
  "数字特效制作过程",
  "NPR",
  "你的简历提到“AI 聊天应用”，这和电影技术有什么关系？",
  "您能谈谈对多模态 AIGC 的理解吗？",
  "什么是“Agent (智能体)”？它和传统的 AI 模型有什么区别？",
  "什么是“RAG (检索增强生成)”？为什么它比微调 (Fine-tuning) 更适合知识库问答？",
  "什么是“AI Memory (记忆)”？如何在多轮对话中保持上下文？",
  "什么是“上下文工程 (Context Engineering)”？",
  "什么是“提示词工程 (Prompt Engineering)”？你有什么心得？",
  "你在 React 项目中用到了 SSE（Server-Sent Events），这在 AI 应用中有什么作用？",
  "你的“知识库项目中”中，如何解决大模型“幻觉（Hallucination）”的问题？",
  "计算机图形学（CG）和计算机视觉（CV）有什么区别？在电影中如何结合？",
  "谈谈大语言模型 (LLM) 的基本原理.",
  "具身智能",
  "谈谈 Unity 中的一些核心概念？",
  "摄影的三要素是什么？它们之间有什么关系？(互易律)",
  "在光线较暗的场景拍摄月亮，如何获得清晰且低噪点的图像？(降噪)",
  "请解释一下各种图像格式（JPG, PNG, GIF, WebP）的区别，以及在电影存储中用什么？",
  "三维重建, NERF, 可微渲染, 体素模型, 点云模型",
  "什么是 SLAM 技术？它在 AR 中起到什么作用？",
  "说说你对扩散模型的理解.",
  "常见的生成模型有哪些？",
  "机械学习 vs 深度学习",
  "深度学习的基础是什么？(神经网络三要素)",
  "用一句话解释什么是“人工智能 (AI)”？",
  "卷积神经网络",
  "神经网络 循环神经网络",
  "Transformer",
  "用一句话解释什么是“数据结构 (Data Structure)”？",
  "用一句话解释什么是“算法 (Algorithm)”？",
  "数组（Array）和链表（Linked List）的区别？",
  "栈（Stack）和队列（Queue）的区别？在计算机中有什么应用？",
  "常见的排序算法有哪些？快排（Quick Sort）的时间复杂度是多少？",
  "什么是哈希表（Hash Table）？它是如何解决冲突的？",
  "什么是二叉树（Binary Tree）？平衡二叉树（AVL）有什么意义？",
  "(高数) 导数和微分的几何意义是什么？在深度学习中有什么用？",
  "(线代) 特征值和特征向量的几何意义是什么？",
  "(高数) 什么是傅里叶变换 (Fourier Transform)？它在图像处理中有什么应用？",
  "计算机网络常识有哪些？",
  "你这个项目是干嘛的?解决了什么问题?适用于哪些领域?",
  "闭环审计是什么意思? 你是如何评估幻觉生成率的? 你是如何理解 RAGAS 的?",
  "LCEL 是什么? ",
  "RecursiveCharacterTextSplitter 是什么? 它是在什么阶段处理的?",
  "你理解的 RAG 是什么?",
  "长对话场景下的上下文工作, 滑动窗口是如何工作的? 摘要压缩机制是如何工作的?",
  "你了解多 agent 协同工作吗? 如何实现, 举个例子?",
  "你对 agent 是如何理解的?",
  "针对不同的提示词, 你如何进行 A/B 测试?",
  "你是如何理解 Tracing 全链路? 序列化为JSON 是为了起什么作用?",
  "在你的项目里, 什么地方会触发到 Function Calling? 什么地方会用到 MCP 协议?(举例)",
  "和拍约拍平台解决的是怎么样一个业务问题?",
  "日期时间选择器在摄影预约问题下你是如何处理的?",
  "照片渲染问题, 你们的照片普遍采用什么样的格式? 存储体积和大小有没有做过优化? 如何优化的上传速度?"
];

const WRITTEN_QUESTIONS = [
  "CG 概念 + 图形图像", "CG 和 CV 和 DIP", "LOD", "计算机动画", "走样与反走样",
  "二维图像显示步骤", "多边形扫描转换 + 着色模式", "有效边表填充算法", "边缘填充算法",
  "多边形种子填充算法", "扫描线种子填充算法", "Cohen-sutherland 裁剪算法 + 中点分割算法",
  "Liang-Barsky 算法", "Sutherland-Hodegeman", "几何变换 (矩阵)", "三维图像显示步骤 (矩阵)",
  "平行投影 透视投影 三视图", "曲线拟合", "贝塞尔曲线", "B 样条曲线", "分形几何",
  "三维物体的模型结构", "消隐的定义 消隐算法", "背面剔除算法", "Z-buffer 算法",
  "深度排序算法", "光照模型 局部光照模型 全局光照模型", "真实感图形学",
  "Phong 光照模型(光线衰减)", "Gouraud 和 Phong 明暗处理技术",
  "包围盒算法和空间分割算法都运用了层次结构模型", "光线追踪原理 辐射传输算法",
  "纹理映射", "实时渲染 离线渲染 延时渲染", "HDR", "数字图像处理",
  "定义 + 内容 + 数字化过程", "VSR 超分辨率", "图像增强", "直方图均衡化",
  "锐化和平滑的常用方法.", "图像卷积.", "傅里叶变换", "快速傅里叶变换",
  "图像退化与复原的比较", "逆滤波(模态框图)与维纳滤波", "信噪比与峰值信噪比",
  "形态学处理的概念", "开运算闭运算膨胀腐蚀(公式应用)", "中值均值滤波 椒盐高斯噪声",
  "图像分割定义", "边缘提取(二阶与一阶)", "全局阈值处理", "最大类间法",
  "区域生长分割合并算法", "自动分水岭算法", "颜色模型 RGB 与 CMYK", "HSLHSIHSV",
  "彩色空间子采样/空间转换", "JPEG 的压缩过程.", "图像压缩.", "小波与 DCT 编码.", "哈夫曼编码过程."
];

const ENGLISH_QUESTIONS = [
  "Why did you choose this major? (为什么选择这个专业?)",
  "Why did you choose our university? (为什么选择这个学校?)",
  "What is your plan for the next three years? (读研期间的三年规划?)",
  "Tell me about your hometown. (介绍你的家乡)",
  "Tell me about your family. (介绍你的家庭)",
  "Talk about your undergraduate life. (谈谈你对本科生活的看法)",
  "What are your hobbies or interests? (你的兴趣爱好是什么?)",
  "What is your favorite book or movie? (你最喜欢的书或电影?)",
  "What are your personality traits? (你的性格特点是什么?)",
  "What do you like to do in your spare time? (你空闲时间喜欢做什么?)",
  "Please introduce your best friend. (介绍一下你最好的朋友)",
  "What is your understanding of AI Agents? (你对 AI Agent 的理解?)",
  "What if you find research very difficult? (如果科研很难怎么办?)",
  "What are your strengths and weaknesses? (你的优缺点是什么?)",
  "How do you handle stress? (你如何应对压力?)",
  "What will you do if you do not pass the exam? (如果你没考上怎么办?)"
];

const ReviewTaskItem = ({ task, isSelected, onToggle, title, timeText }: {
  task: { taskId: string };
  isSelected: boolean;
  onToggle: () => void;
  title: string;
  timeText: string;
}) => (
  <div key={task.taskId} className="relative group">
    <TaskCard 
      id={task.taskId}
      title={title}
      isCompleted={isSelected}
      onToggle={onToggle}
    />
    <div className="absolute top-2 right-2 px-3 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 text-[10px] font-black rounded-full shadow-sm flex items-center gap-1 pointer-events-none">
      <ClockIcon className="w-3 h-3" />
      已过去 {timeText}
    </div>
  </div>
);

export const ExamPrepView = () => {
  const { tasks, loading, saving, hasChanges, reviewedTaskIds, toggleTask, toggleReviewed, saveTasks } = useExamTasks();
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (targetDate: string) => {
    const diff = dayjs(targetDate).diff(currentTime);
    if (diff <= 0) return '考试进行中/已结束';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${days}天 ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = async () => {
    try {
      await saveTasks();
      toast.success('保存成功！猪宝继续加油呀～❤️');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('保存失败了，重新试试看？');
    }
  };

  const interviewCompleted = tasks.filter(t => t.type === 'interview' && t.isCompleted).length;
  const writtenCompleted = tasks.filter(t => t.type === 'written' && t.isCompleted).length;
  const englishCompleted = tasks.filter(t => t.type === 'english' && t.isCompleted).length;

  // 每日进度逻辑：只计算“今天”完成的题目 (用于 Daily Goal)
  const todayStart = dayjs().startOf('day');
  const interviewToday = tasks.filter(t => 
    t.type === 'interview' && t.isCompleted && t.completedAt && dayjs(t.completedAt).isAfter(todayStart)
  ).length;
  const writtenToday = tasks.filter(t => 
    t.type === 'written' && t.isCompleted && t.completedAt && dayjs(t.completedAt).isAfter(todayStart)
  ).length;
  const englishToday = tasks.filter(t => 
    t.type === 'english' && t.isCompleted && t.completedAt && dayjs(t.completedAt).isAfter(todayStart)
  ).length;

  // 艾宾浩斯复习逻辑：按照秒实时更新
  const reviewTasks = tasks.filter(t => {
    if (!t.isCompleted || !t.completedAt) return false;
    const completedTime = dayjs(t.completedAt);
    const hoursSinceCompletion = currentTime.diff(completedTime, 'hour');
    // 为了让宝宝能看到复习任务，我们把范围扩大到 7 天内完成的任务
    // 或者只要是已完成的任务都显示在复习列表里，直到被标记为“已复习”
    return hoursSinceCompletion <= 168; // 7 天内
  });

  const reviewInterviewTasks = reviewTasks.filter(t => t.type === 'interview');
  const reviewWrittenTasks = reviewTasks.filter(t => t.type === 'written');
  const reviewEnglishTasks = reviewTasks.filter(t => t.type === 'english');

  const interviewLeftDays = dayjs(INTERVIEW_EXAM_DATE).diff(currentTime, 'day');

  const formatTimeSince = (date: string) => {
    const seconds = currentTime.diff(dayjs(date), 'second');
    if (seconds < 60) return `${seconds} 秒`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    return `${hours} 小时`;
  };

  const getQuestionTitle = (taskId: string) => {
    const [type, indexStr] = taskId.split('-');
    const index = parseInt(indexStr) - 1;
    if (type === 'interview') return `${index + 1}. ${INTERVIEW_QUESTIONS[index]}`;
    if (type === 'written') return `${index + 1}. ${WRITTEN_QUESTIONS[index]}`;
    if (type === 'english') return `${index + 1}. ${ENGLISH_QUESTIONS[index]}`;
    return taskId;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background relative">
      {/* Header */}
      <div className={cn(
        "border-b border-border bg-card/50 backdrop-blur-sm shrink-0 transition-all duration-500 ease-in-out overflow-hidden",
        isHeaderCollapsed ? "max-h-0 py-0 border-none opacity-0" : "max-h-[1000px] py-6 opacity-100"
      )}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Exam Prep Master</span>
              </div>
              <h2 className="text-3xl font-black theme-text">复试突击战 🚀</h2>
              <p className="text-sm text-muted-foreground mt-2">猪宝加油！每天 20+20，南通 ✈️ 深圳在等你！❤️</p>
              
              {/* 实时倒计时卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                  <div className="p-2 bg-rose-500/20 rounded-xl">
                    <Zap className="w-4 h-4 text-rose-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">笔试倒计时</p>
                    <p className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                      {formatCountdown(WRITTEN_EXAM_DATE)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <div className="p-2 bg-amber-500/20 rounded-xl">
                    <MessageSquareQuote className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">面试倒计时</p>
                    <p className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">
                      {formatCountdown(INTERVIEW_EXAM_DATE)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={saving || !hasChanges}
                className={cn(
                  "h-10 px-6 rounded-2xl shadow-xl transition-all duration-300 w-full md:w-auto",
                  hasChanges 
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30 scale-105" 
                    : "bg-muted text-muted-foreground shadow-none grayscale opacity-60"
                )}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                <span className="font-bold">保存今日进度</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <ProgressStats 
              completed={interviewToday} 
              total={INTERVIEW_QUESTIONS.length} 
              overallCompleted={interviewCompleted}
              label="中文面试" 
              dailyGoal={20}
            />
            <ProgressStats 
              completed={writtenToday} 
              total={WRITTEN_QUESTIONS.length} 
              overallCompleted={writtenCompleted}
              label="笔试考点" 
              dailyGoal={20}
            />
            <ProgressStats 
              completed={englishToday} 
              total={ENGLISH_QUESTIONS.length} 
              overallCompleted={englishCompleted}
              label="英语口语" 
              dailyGoal={8}
            />
          </div>
        </div>
      </div>

      {/* Divider Collapse Button */}
      <div className="relative z-30 h-[1px] flex items-center justify-center bg-border">
        <button
          onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
          className={cn(
            "absolute flex items-center justify-center transition-all duration-300",
            "h-5 w-12 rounded-full border border-border bg-background shadow-sm hover:shadow-md hover:bg-muted text-muted-foreground hover:text-primary",
            "group overflow-hidden"
          )}
          title={isHeaderCollapsed ? "展开面板" : "收起面板"}
        >
          {isHeaderCollapsed ? (
            <ChevronDown className="w-3.5 h-3.5 animate-bounce-subtle group-hover:scale-110 transition-transform" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="max-w-5xl mx-auto h-full px-4 md:px-6 py-4">
          <Tabs defaultValue="interview" className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 shrink-0">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-full overflow-x-auto pb-2 scrollbar-hidden">
                  <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex min-w-full md:min-w-0">
                    <TabsTrigger value="interview" className="rounded-lg px-4 py-2 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
                      面试题目 ({INTERVIEW_QUESTIONS.length})
                    </TabsTrigger>
                    <TabsTrigger value="written" className="rounded-lg px-4 py-2 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    笔试题目 ({WRITTEN_QUESTIONS.length})
                  </TabsTrigger>
                  <TabsTrigger value="english" className="rounded-lg px-4 py-2 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    英语口语 ({ENGLISH_QUESTIONS.length})
                  </TabsTrigger>
                  <TabsTrigger value="ebbinghaus" className="rounded-lg px-4 py-2 text-sm whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm text-orange-600 font-bold">
                    艾宾浩斯复习 ({reviewTasks.length})
                  </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <div className="hidden md:flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full whitespace-nowrap flex-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="whitespace-nowrap">目标：每日完成各 20 道</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 relative">
              <ScrollArea className="h-full pr-4 -mr-4">
                <TabsContent value="interview" className="m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-8">
                    {INTERVIEW_QUESTIONS.map((q, index) => {
                      const id = `interview-${index + 1}`;
                      const isCompleted = tasks.some(t => t.taskId === id && t.isCompleted);
                      return (
                        <TaskCard 
                          key={id}
                          id={id}
                          title={`${index + 1}. ${q}`}
                          isCompleted={isCompleted}
                          onToggle={() => toggleTask(id, 'interview')}
                        />
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="written" className="m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
                    {WRITTEN_QUESTIONS.map((q, index) => {
                      const id = `written-${index + 1}`;
                      const isCompleted = tasks.some(t => t.taskId === id && t.isCompleted);
                      return (
                        <TaskCard 
                          key={id}
                          id={id}
                          title={`${index + 1}. ${q}`}
                          isCompleted={isCompleted}
                          onToggle={() => toggleTask(id, 'written')}
                        />
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="english" className="m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-8">
                    {ENGLISH_QUESTIONS.map((q, index) => {
                      const id = `english-${index + 1}`;
                      const isCompleted = tasks.some(t => t.taskId === id && t.isCompleted);
                      return (
                        <TaskCard 
                          key={id}
                          id={id}
                          title={`${index + 1}. ${q}`}
                          isCompleted={isCompleted}
                          onToggle={() => toggleTask(id, 'english')}
                        />
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="ebbinghaus" className="m-0 focus-visible:outline-none">
                  <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200/50 dark:border-orange-800/30 p-6 rounded-3xl mb-6">
                    <div className="flex items-center gap-3 mb-2">
                      <BrainCircuit className="w-6 h-6 text-orange-500" />
                      <h3 className="text-lg font-bold text-orange-600 dark:text-orange-400">艾宾浩斯复习提醒 (秒级实时)</h3>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        根据遗忘曲线规律，这里实时显示你攻克题目后的时长。
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed font-bold">
                        勾选题目并点击 “保存进度” 代表已完成一轮复习，时间将重新计时。✨ (离面试还剩 {interviewLeftDays} 天)
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-10 pb-10">
                    {/* 中文面试复习 */}
                    {reviewInterviewTasks.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className="w-1 h-4 bg-blue-500 rounded-full" />
                          <h4 className="text-sm font-bold theme-text">中文面试复习 ({reviewInterviewTasks.length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {reviewInterviewTasks.map((task) => (
                            <ReviewTaskItem 
                              key={task.taskId}
                              task={task}
                              isSelected={reviewedTaskIds.has(task.taskId)}
                              onToggle={() => toggleReviewed(task.taskId)}
                              title={getQuestionTitle(task.taskId)}
                              timeText={formatTimeSince(task.completedAt!)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 笔试考点复习 */}
                    {reviewWrittenTasks.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className="w-1 h-4 bg-rose-500 rounded-full" />
                          <h4 className="text-sm font-bold theme-text">笔试考点复习 ({reviewWrittenTasks.length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {reviewWrittenTasks.map((task) => (
                            <ReviewTaskItem 
                              key={task.taskId}
                              task={task}
                              isSelected={reviewedTaskIds.has(task.taskId)}
                              onToggle={() => toggleReviewed(task.taskId)}
                              title={getQuestionTitle(task.taskId)}
                              timeText={formatTimeSince(task.completedAt!)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 英语口语复习 */}
                    {reviewEnglishTasks.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-2">
                          <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                          <h4 className="text-sm font-bold theme-text">英语口语复习 ({reviewEnglishTasks.length})</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {reviewEnglishTasks.map((task) => (
                            <ReviewTaskItem 
                              key={task.taskId}
                              task={task}
                              isSelected={reviewedTaskIds.has(task.taskId)}
                              onToggle={() => toggleReviewed(task.taskId)}
                              title={getQuestionTitle(task.taskId)}
                              timeText={formatTimeSince(task.completedAt!)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {reviewTasks.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                        <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
                        <h4 className="text-lg font-bold text-muted-foreground">今天暂时没有复习任务哦</h4>
                        <p className="text-sm text-muted-foreground mt-1 px-10">
                          等明天这个时候，这里就会出现你今天努力背诵的内容啦！先去攻克新的题目吧～
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
