import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  Sparkles, 
  BookOpen, 
  Headphones, 
  PenTool, 
  Languages, 
  Calendar,
  CheckCircle2,
  Timer,
  Target,
  Minimize2,
  Maximize2 as FullscreenIcon,
  ChevronLeftCircle,
  ChevronRightCircle,
  Settings2,
  RotateCcw
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import api from '@/lib/axios';
import { submitCheckIn } from '../api';
import type { CheckInRecord } from '../types';
import dayjs from 'dayjs';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import imageCompression from 'browser-image-compression';

const CET4_EXAM_DATE = '2026-06-13T09:00:00';
const CET4_PAPERS = [
  '2024-06-A', '2024-06-B', '2024-06-C',
  '2024-12-A', '2024-12-B', '2024-12-C',
  '2025-06-A', '2025-06-B', '2025-06-C',
  '2025-12-A', '2025-12-B', '2025-12-C',
];

const SCHEDULE = [
  { 
    day: 1, 
    label: '阅读理解 - 仔细阅读', 
    section: 'reading-careful', 
    icon: BookOpen, 
    color: 'text-blue-500', 
    bg: 'bg-blue-500/10', 
    limit: '20分钟',
    content: '包含两篇仔细阅读，每篇5题，共10题。主要考察细节理解、推理判断及词义理解。',
    questions: 10 
  },
  { 
    day: 2, 
    label: '长篇阅读 + 词汇理解', 
    section: 'reading-long-vocab', 
    icon: BookOpen, 
    color: 'text-indigo-500', 
    bg: 'bg-indigo-500/10', 
    limit: '20分钟',
    content: '长篇阅读(段落匹配)10题 + 选词填空10题。考察快速信息定位及词汇运用能力。',
    questions: 20
  },
  { 
    day: 3, 
    label: '听力理解', 
    section: 'listening', 
    icon: Headphones, 
    color: 'text-purple-500', 
    bg: 'bg-purple-500/10', 
    limit: '25分钟',
    content: '短篇新闻7题 + 长对话8题 + 听力篇章10题。总共25题。',
    questions: 25
  },
  { 
    day: 4, 
    label: '写作', 
    section: 'writing', 
    icon: PenTool, 
    color: 'text-orange-500', 
    bg: 'bg-orange-500/10', 
    limit: '30分钟',
    content: '根据所给题目要求，写一篇120-180词的短文。',
    questions: 0
  },
  { 
    day: 5, 
    label: '翻译', 
    section: 'translation', 
    icon: Languages, 
    color: 'text-emerald-500', 
    bg: 'bg-emerald-500/10', 
    limit: '30分钟',
    content: '将一段140-160个汉字组成的段落翻译成英文。考察汉英转换及语法运用能力。',
    questions: 0
  },
];

interface CET4CheckInProps {
  onSuccess: () => void;
  history: {
    items: CheckInRecord[];
    total: number;
  };
}

export const CET4CheckIn: React.FC<CET4CheckInProps> = ({ onSuccess, history }) => {
  const [files, setFileGroups] = useState<{ [key: string]: File[] }>({
    word: [],
    training: [],
    correction: [],
    essay_prompt: [] // 新增：作文题目截图
  });
  const [previews, setPreviewGroups] = useState<{ [key: string]: string[] }>({
    word: [],
    training: [],
    correction: [],
    essay_prompt: [] // 新增：作文题目预览
  });
  const [content, setContent] = useState('');
  const [correctCount, setCorrectCount] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [previewData, setPreviewData] = useState<{urls: string[], index: number} | null>(null);
  const [ocrConfirmData, setOcrConfirmData] = useState<{
    wordCount: number;
    date: string;
    originalData: any;
  } | null>(null);
  const [manualWordCount, setManualWordCount] = useState<string>('');
  const [manualTaskIndex, setManualTaskIndex] = useState<number | null>(null);
  
  // 作文批改相关状态
  const [essayEditData, setEssayEditData] = useState<{
    text: string;
    promptText?: string;
    originalData: any;
    promptImageUrls?: string[]; // 新增：题目图片 URL
  } | null>(null);
  const [promptEditData, setPromptEditData] = useState<{
    text: string;
    originalData: any;
    promptImageUrls?: string[]; // 新增：题目图片 URL
  } | null>(null);
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<any | null>(null);
  const [isEssayFullscreen, setIsEssayFullscreen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState<'word' | 'training' | 'correction' | 'essay_prompt'>('word');

  // 1. 倒计时逻辑
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const countdown = useMemo(() => {
    const diff = dayjs(CET4_EXAM_DATE).diff(currentTime);
    if (diff <= 0) return '考试进行中/已结束';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${days}天 ${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [currentTime]);

  // 2. 今日任务逻辑
  const todayTask = useMemo(() => {
    if (manualTaskIndex !== null) {
      return SCHEDULE[manualTaskIndex];
    }
    const dayOfWeek = currentTime.day(); // 0 (Sun) to 6 (Sat)
    if (dayOfWeek === 0 || dayOfWeek === 6) return null;
    return SCHEDULE[dayOfWeek - 1];
  }, [currentTime, manualTaskIndex]);

  // 3. 试卷进度逻辑
  const currentPaperIndex = useMemo(() => {
    // 专项训练从 24 年 6 月 A 套开始，历史总数推算
    const completedTrainingCount = history?.total || 0; 
    return Math.floor(completedTrainingCount / 15); 
  }, [history?.total]);

  const currentPaper = CET4_PAPERS[currentPaperIndex % CET4_PAPERS.length];

  const handleOcrConfirm = async () => {
    if (!ocrConfirmData) return;
    
    const count = parseInt(manualWordCount);
    if (isNaN(count) || count <= 0) {
      toast.error('请输入有效的单词个数哦');
      return;
    }

    setIsUploading(true);
    try {
      const finalResult = await submitCheckIn({
        ...ocrConfirmData.originalData,
        // 将手动输入的单词数存入内容中，方便后端或者展示使用
        content: `今日背诵 ${count} 个单词 ${ocrConfirmData.originalData.content || ''} OCR_CONFIRMED`.trim()
      });
      toast.success(finalResult.encouragement || '打卡成功！积分奖励已发放 ✨', {
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />
      });
      
      // 重置状态
      setFileGroups(prev => ({ ...prev, word: [] }));
      setPreviewGroups(prev => ({ ...prev, word: [] }));
      setContent('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || '确认打卡失败');
    } finally {
      setIsUploading(false);
      setOcrConfirmData(null);
    }
  };

  const handleEssayGrade = async () => {
    if (!essayEditData) return;
    
    setIsGrading(true);
    setGradingResult(null);
    try {
      const isTranslation = todayTask?.section === 'translation';
      const endpoint = isTranslation ? '/ai/translation/grade' : '/ai/essay/grade';
      const body = isTranslation 
        ? { text: essayEditData.text, originalText: essayEditData.promptText }
        : { text: essayEditData.text, topic: essayEditData.promptText };

      const res = await api.post<any>(endpoint, body);
      setGradingResult(res);
    } catch (error: any) {
      toast.error(error.message || 'AI 批改失败，请重试');
    } finally {
      setIsGrading(false);
    }
  };

  const handleEssayConfirm = async () => {
    if (!essayEditData) return;
    
    setIsUploading(true);
    try {
      const finalResult = await submitCheckIn({
        ...essayEditData.originalData,
        content: `【AI批改作文】\n${essayEditData.text}\n\n${gradingResult ? `AI评分：${gradingResult.score15}/15 (${gradingResult.score710}/710)\n评价：${gradingResult.comments}` : ''}`.trim(),
        essayResult: gradingResult // 将 AI 批改结果传给后端持久化
      });
      toast.success(finalResult.encouragement || '作文打卡成功！积分已发放 ✨', {
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />
      });
      
      // 重置状态
      setFileGroups(prev => ({ ...prev, training: [] }));
      setPreviewGroups(prev => ({ ...prev, training: [] }));
      setContent('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || '提交失败');
    } finally {
      setIsUploading(false);
      setEssayEditData(null);
      setGradingResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    // 单词打卡或作文题目只允许上传一张
    if (activeType === 'word' || activeType === 'essay_prompt') {
      const file = selectedFiles[0];
      setFileGroups(prev => ({ ...prev, [activeType]: [file] }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewGroups(prev => ({ ...prev, [activeType]: [reader.result as string] }));
      };
      reader.readAsDataURL(file);
      return;
    }

    const validFiles = selectedFiles.filter(f => {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} 超过 20MB，已跳过`);
        return false;
      }
      return true;
    });

    setFileGroups(prev => ({
      ...prev,
      [activeType]: [...prev[activeType], ...validFiles].slice(0, 3) // 最多3张
    }));

    setPreviewGroups(prev => ({
      ...prev,
      [activeType]: [...prev[activeType], ...validFiles.map(f => URL.createObjectURL(f))].slice(0, 3)
    }));
  };

  const removeFile = (type: string, index: number) => {
    setFileGroups(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev].filter((_, i) => i !== index)
    }));
    setPreviewGroups(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (type: 'word' | 'training' | 'correction' | 'essay_prompt') => {
    const currentFiles = files[type];
    if (currentFiles.length === 0) {
      toast.error('请先上传图片哦');
      return;
    }

    if (type === 'training' && todayTask && todayTask.questions > 0) {
      if (!correctCount || isNaN(Number(correctCount))) {
        toast.error('请输入正确题数哦');
        return;
      }
      if (Number(correctCount) > todayTask.questions) {
        toast.error(`正确题数不能超过总题数 ${todayTask.questions} 哦`);
        return;
      }
    }

    setIsUploading(true);
    try {
      // 1. 批量上传到 OSS (带压缩)
      const imageUrls: string[] = [];
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      for (const file of currentFiles) {
        let fileToUpload = file;
        
        // 压缩图片
        try {
          fileToUpload = await imageCompression(file, compressionOptions);
        } catch (compressionError) {
          console.warn('Compression failed, using original file:', compressionError);
        }

        const formData = new FormData();
        formData.append('file', fileToUpload);
        const uploadRes = await api.post('/common/upload?folder=checkin', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        }) as unknown as { url: string } | string;
        imageUrls.push(typeof uploadRes === 'string' ? uploadRes : uploadRes.url);
      }

      // 2. 提交打卡
      const data: {
        type: string;
        imageUrls: string[];
        content: string;
        paperId?: string;
        section?: string;
        totalQuestions?: number;
        correctQuestions?: number;
      } = {
        type,
        imageUrls,
        content: type === 'word' ? content : `欣妍完成了 ${currentPaper} 的 ${todayTask?.label} 训练！`
      };

      if (type !== 'word' && todayTask) {
        data.paperId = currentPaper;
        data.section = todayTask.section;
        if (type === 'training' && todayTask.questions > 0) {
          data.totalQuestions = todayTask.questions;
          data.correctQuestions = Number(correctCount);
        }
      }

      console.log('Submitting check-in:', data);

      // 如果是手动触发的题目识别 (essay_prompt 类型)
      if (type === 'essay_prompt') {
        toast.loading(todayTask?.section === 'translation' ? '正在识别翻译原文...' : '正在识别作文题目...', { id: 'ocr-loading' });
        try {
          const ocrRes = await api.post('/ai/essay/ocr', { 
            imageUrl: imageUrls[0],
            type: 'standard'
          }) as any;
          toast.dismiss('ocr-loading');
          if (ocrRes && ocrRes.success) {
            setPromptEditData({
              text: ocrRes.text,
              originalData: data,
              promptImageUrls: imageUrls // 保存题目图片
            });
            setIsUploading(false);
            return;
          }
        } catch (e) {
          toast.dismiss('ocr-loading');
        }
      }

      // 如果是写作任务，根据是否有 pendingPrompt 决定是识别题目还是识别作文
      if (type === 'training' && todayTask?.section === 'writing') {
        const pendingPromptText = (window as any)._pendingPromptText;
        const pendingPromptImages = (window as any)._pendingPromptImages;
        
        if (!pendingPromptText) {
          // 1. 识别题目
          toast.loading('正在识别作文题目...', { id: 'ocr-loading' });
          try {
            const ocrRes = await api.post('/ai/essay/ocr', { 
              imageUrl: imageUrls[0],
              type: 'standard'
            }) as any;
            toast.dismiss('ocr-loading');
            if (ocrRes && ocrRes.success) {
              setPromptEditData({
                text: ocrRes.text,
                originalData: data,
                promptImageUrls: imageUrls // 保存题目图片
              });
              setIsUploading(false);
              return;
            }
          } catch (e) {
            toast.dismiss('ocr-loading');
          }
        } else {
          // 2. 识别作文
          toast.loading('正在识别手写作文...', { id: 'ocr-loading' });
          try {
            const ocrRes = await api.post('/ai/essay/ocr', { 
              imageUrl: imageUrls[0],
              type: 'handwritten'
            }) as any;
            toast.dismiss('ocr-loading');
            if (ocrRes && ocrRes.success) {
              setEssayEditData({
                text: ocrRes.text,
                promptText: pendingPromptText,
                originalData: {
                  ...data,
                  promptImageUrls: pendingPromptImages // 合并题目图片
                }
              });
              // 清除临时存储
              delete (window as any)._pendingPromptText;
              delete (window as any)._pendingPromptImages;
              setIsUploading(false);
              return;
            }
          } catch (e) {
            toast.dismiss('ocr-loading');
          }
        }
      }

      // 如果是翻译任务
      if (type === 'training' && todayTask?.section === 'translation') {
        const pendingOriginalText = (window as any)._pendingOriginalText;
        const pendingOriginalImages = (window as any)._pendingOriginalImages;
        
        if (!pendingOriginalText) {
          // 1. 识别原文
          toast.loading('正在识别翻译原文...', { id: 'ocr-loading' });
          try {
            const ocrRes = await api.post('/ai/essay/ocr', { 
              imageUrl: imageUrls[0],
              type: 'standard'
            }) as any;
            toast.dismiss('ocr-loading');
            if (ocrRes && ocrRes.success) {
              setPromptEditData({
                text: ocrRes.text,
                originalData: data,
                promptImageUrls: imageUrls // 保存原文图片
              });
              setIsUploading(false);
              return;
            }
          } catch (e) {
            toast.dismiss('ocr-loading');
          }
        } else {
          // 2. 识别译文
          toast.loading('正在识别手写译文...', { id: 'ocr-loading' });
          try {
            const ocrRes = await api.post('/ai/essay/ocr', { 
              imageUrl: imageUrls[0],
              type: 'handwritten'
            }) as any;
            toast.dismiss('ocr-loading');
            if (ocrRes && ocrRes.success) {
              setEssayEditData({
                text: ocrRes.text,
                promptText: pendingOriginalText, // 借用这个字段存原文
                originalData: {
                  ...data,
                  promptImageUrls: pendingOriginalImages // 合并原文图片
                }
              });
              // 清除临时存储
              delete (window as any)._pendingOriginalText;
              delete (window as any)._pendingOriginalImages;
              setIsUploading(false);
              return;
            }
          } catch (e) {
            toast.dismiss('ocr-loading');
          }
        }
      }

      const result = await submitCheckIn(data);
      console.log('Check-in response:', result);

      if (result.ocrPending && result.ocrInfo) {
        console.log('OCR pending, showing custom confirm dialog');
        setOcrConfirmData({
          wordCount: result.ocrInfo.wordCount,
          date: result.ocrInfo.date,
          originalData: data
        });
        setManualWordCount(result.ocrInfo.wordCount.toString());
        return; // 等待用户通过自定义弹窗确认
      } else {
        console.log('Direct check-in success (no OCR or already confirmed)');
        toast.success(result.encouragement || '打卡成功！积分奖励已发放 ✨', {
          icon: <Sparkles className="w-5 h-5 text-yellow-500" />
        });
      }
      
      // 重置
      setFileGroups(prev => ({ ...prev, [type]: [] }));
      setPreviewGroups(prev => ({ ...prev, [type]: [] }));
      if (type === 'word') setContent('');
      if (type === 'training') setCorrectCount('');
      onSuccess();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '打卡失败，请稍后再试';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const isCompletedToday = (type: string) => {
    const today = dayjs().startOf('day');
    return history?.items?.some(h => 
      h.type === type && 
      dayjs(h.createdAt).isAfter(today) &&
      (type === 'word' || (h.section === todayTask?.section && h.paperId === currentPaper))
    ) || false;
  };

  const handlePromptConfirm = async () => {
    if (!promptEditData) return;
    
    // 隐藏题目确认弹窗
    const currentPromptText = promptEditData.text;
    const isTranslation = todayTask?.section === 'translation';
    setPromptEditData(null);
    
    // 提示宝宝上传手写作品
    toast(isTranslation ? '原文已识别！现在请上传宝宝的手写翻译照片吧 📸' : '题目已识别！现在请上传宝宝的手写作文照片吧 📸', {
      duration: 5000,
      icon: <PenTool className="w-5 h-5 text-blue-500" />
    });

    // 重新打开文件选择器
    setActiveType('training');
    setTimeout(() => {
      if (isTranslation) {
        (window as any)._pendingOriginalText = currentPromptText;
        (window as any)._pendingOriginalImages = promptEditData.promptImageUrls;
      } else {
        (window as any)._pendingPromptText = currentPromptText;
        (window as any)._pendingPromptImages = promptEditData.promptImageUrls;
      }
      fileInputRef.current?.click();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* 4. OCR 确认弹窗 */}
      <Dialog open={!!ocrConfirmData} onOpenChange={(open) => !open && setOcrConfirmData(null)}>
        <DialogContent className="w-[90vw] max-w-[360px] p-0 overflow-hidden bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-white/20 dark:border-slate-800/50 shadow-2xl rounded-[24px]">
          <div className="relative p-6 space-y-5">
            {/* 背景装饰 */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-rose-500/10 blur-3xl -z-10" />
            
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500/20 to-orange-500/20 rounded-2xl flex items-center justify-center border border-rose-500/10">
                <Sparkles className="w-6 h-6 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                  确认打卡信息 ✨
                </h3>
                <p className="text-[13px] text-slate-500 dark:text-slate-400">
                  宝宝，核对一下单词数对不对哦
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-slate-400 dark:text-slate-500 ml-1">
                  今日背诵单词 (可手动调整)
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={manualWordCount}
                    onChange={(e) => setManualWordCount(e.target.value)}
                    className="w-full bg-slate-100/50 dark:bg-slate-800/50 border-none rounded-xl px-4 py-3 text-xl font-black text-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all text-center"
                    placeholder="请输入单词数"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-rose-500/50 group-focus-within:text-rose-500 transition-colors">
                    WORDS
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-2 bg-slate-100/30 dark:bg-slate-800/30 rounded-lg border border-slate-100/50 dark:border-slate-800/50">
                <span className="text-[12px] text-slate-400">识别日期</span>
                <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{ocrConfirmData?.date}</span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <Button 
                variant="ghost" 
                className="flex-1 h-11 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setOcrConfirmData(null)}
                disabled={isUploading}
              >
                取消
              </Button>
              <Button 
                className="flex-[1.5] h-11 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white border-none rounded-xl shadow-lg shadow-rose-500/25 transition-all active:scale-[0.98]"
                onClick={handleOcrConfirm}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span className="font-bold">确认提交</span>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. 作文题目 OCR 结果编辑弹窗 */}
      <Dialog 
        open={!!promptEditData} 
        onOpenChange={(open) => {
          if (!open && !isUploading) {
            setPromptEditData(null);
          }
        }}
      >
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden theme-card transition-all duration-300 flex flex-col border-border shadow-2xl [&>button]:hidden",
            "w-[95vw] max-w-[650px] rounded-[24px] max-h-[80vh]"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-none">
                  {todayTask?.section === 'translation' ? '核对翻译原文' : '核对作文题目'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {todayTask?.section === 'translation' 
                    ? '宝宝，我帮你识别了翻译原文，看看对不对 ✨' 
                    : '宝宝，我帮你识别了题目截图，看看对不对 ✨'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1 bg-background">
            <div className="space-y-3 flex-1 flex flex-col min-h-[200px]">
              <label className="text-sm font-bold text-foreground flex items-center gap-2">
                <Languages className="w-4 h-4 text-blue-500" />
                题目原文
              </label>
              <Textarea
                value={promptEditData?.text}
                onChange={(e) => setPromptEditData(prev => prev ? { ...prev, text: e.target.value } : null)}
                className="w-full flex-1 bg-muted/20 border-border rounded-xl px-4 py-3 text-sm leading-relaxed focus:ring-blue-500/20 transition-all resize-none"
                placeholder="识别到的题目内容..."
              />
            </div>
          </div>

          <div className="p-4 md:p-6 border-t bg-muted/20 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-11 rounded-xl font-bold"
              onClick={() => setPromptEditData(null)}
            >
              取消
            </Button>
            <Button 
              className="flex-[2] h-11 font-bold rounded-xl shadow-lg bg-blue-600 hover:bg-blue-700"
              onClick={handlePromptConfirm}
            >
              题目没问题，去传作文 📸
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 5. 作文 OCR 结果编辑与 AI 批改弹窗 */}
      <Dialog 
        open={!!essayEditData} 
        onOpenChange={(open) => {
          if (!open && !isUploading && !isGrading) {
            setEssayEditData(null);
          }
        }}
      >
        <DialogContent 
          className={cn(
            "p-0 overflow-hidden theme-card transition-all duration-300 flex flex-col border-border shadow-2xl [&>button]:hidden",
            isEssayFullscreen 
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
                <h3 className="font-bold text-base leading-none">
                  {todayTask?.section === 'translation' ? '翻译批改与建议' : '作文批改与建议'}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {isGrading ? '正在为你进行深度批改...' : '宝宝，内容已经识别好了，开始批改吧 ✨'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setIsEssayFullscreen(!isEssayFullscreen)}
              >
                {isEssayFullscreen ? <Minimize2 className="w-4 h-4" /> : <FullscreenIcon className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={() => {
                  if (!isUploading && !isGrading) {
                    setEssayEditData(null);
                  }
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-background">
            <div className="space-y-6 flex flex-col">
              {/* 作文内容编辑区 */}
              <div className="space-y-3 flex-1 flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between px-1">
                  <label className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Languages className="w-4 h-4 text-primary" />
                    {todayTask?.section === 'translation' ? '翻译作品' : '作文原文'}
                  </label>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider italic">
                    宝宝可以在这里微调文字哦
                  </span>
                </div>
                <Textarea
                  value={essayEditData?.text}
                  onChange={(e) => setEssayEditData(prev => prev ? { ...prev, text: e.target.value } : null)}
                  className="w-full flex-1 bg-muted/20 border-border rounded-xl px-4 py-3 text-sm leading-relaxed focus:ring-primary/20 transition-all resize-none"
                  placeholder="识别到的作文内容..."
                />
              </div>

              {/* AI 批改结果 */}
              {gradingResult && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-6">
                  {/* 评分板块 */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-primary/5 border-primary/20 shadow-none rounded-2xl">
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">15分制评分</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-primary">{gradingResult.score15}</span>
                          <span className="text-xs font-bold text-primary/40">/ 15</span>
                        </div>
                        <div className="mt-2 px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold text-primary">
                          {gradingResult.grade}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-indigo-500/5 border-indigo-500/20 shadow-none rounded-2xl">
                      <CardContent className="p-4 flex flex-col items-center text-center">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">710分制换算</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-indigo-500">{gradingResult.score710}</span>
                          <span className="text-xs font-bold text-indigo-500/40">/ 710</span>
                        </div>
                        <div className="mt-2 px-2 py-0.5 bg-indigo-500/10 rounded-full text-[10px] font-bold text-indigo-500">
                          {todayTask?.section === 'translation' ? '翻译权重分' : '作文权重分'}
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
                        "{gradingResult.comments}"
                      </p>
                    </CardContent>
                  </Card>

                  {/* 病句诊断 */}
                  {gradingResult.grammarFixes?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold flex items-center gap-2 ml-1">
                        <X className="w-4 h-4 text-destructive" />
                        病句诊断与优化
                      </h4>
                      <div className="space-y-3">
                        {gradingResult.grammarFixes.map((fix: any, idx: number) => (
                          <div key={idx} className="p-4 rounded-xl border bg-muted/10 space-y-2.5">
                            <div className="flex gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-destructive/10 text-destructive rounded h-fit mt-0.5">ERR</span>
                              <p className="text-sm text-muted-foreground line-through decoration-destructive/30">{fix.original}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded h-fit mt-0.5">FIX</span>
                              <p className="text-sm font-bold text-foreground">{fix.corrected}</p>
                            </div>
                            <div className="pl-10 text-xs text-muted-foreground flex items-center gap-2 italic">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              {fix.explanation}
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
                      {todayTask?.section === 'translation' ? '欣妍为你润色译文' : '欣妍为你润色版'}
                    </h4>
                    <div className="p-5 rounded-2xl border-2 border-primary/10 bg-primary/5 text-sm leading-relaxed text-foreground text-justify font-medium">
                      {gradingResult.polishedEssay}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 md:p-6 border-t bg-muted/20 flex gap-3">
            <Button 
              variant="outline" 
              className="flex-1 h-11 rounded-xl font-bold"
              onClick={() => !isUploading && !isGrading && setEssayEditData(null)}
              disabled={isUploading || isGrading}
            >
              取消
            </Button>
            
            {!gradingResult ? (
              <Button 
                className="flex-[2] h-11 font-bold rounded-xl shadow-lg"
                onClick={handleEssayGrade}
                disabled={isGrading}
              >
                {isGrading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                开始智能批改
              </Button>
            ) : (
              <Button 
                className="flex-[2] h-11 font-bold rounded-xl shadow-lg"
                onClick={handleEssayConfirm}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                确认并保存记录
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 1. 顶部倒计时和进度 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 theme-card bg-gradient-to-br from-rose-500/10 to-orange-500/10 border-rose-500/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Timer className="w-24 h-24 rotate-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Timer className="w-5 h-5" />
              四级决战倒计时
            </CardTitle>
            <CardDescription>2026年6月13日 09:00</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black font-mono tracking-tighter text-rose-600 dark:text-rose-400">
              {countdown}
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase">
                <span>12套卷子总进度</span>
                <span>{Math.min(Math.round((history.total / 60) * 100), 100)}%</span>
              </div>
              <Progress value={Math.min((history.total / 60) * 100, 100)} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="theme-card bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-primary flex items-center gap-2">
              <Target className="w-5 h-5" />
              冲刺目标
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">目标总分</span>
              <span className="text-2xl font-black text-primary">500+</span>
            </div>
            <div className="p-3 bg-background rounded-xl border border-dashed text-xs text-muted-foreground leading-relaxed">
              “笨猪，只要每天进步一点点，我们就能在深圳准时相见！❤️”
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. 今日任务板块 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2.1 每日单词打卡 */}
        <Card className={cn("theme-card overflow-hidden transition-all", isCompletedToday('word') && "opacity-60 grayscale")}>
          <CardHeader className="bg-blue-500/5 border-b border-border/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-500" />
                1. 每日单词打卡
              </CardTitle>
              {isCompletedToday('word') && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            </div>
            <CardDescription>不背单词截图 (目标: 120个)</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {!isCompletedToday('word') ? (
              <>
                <ImageUploader 
                  previews={previews.word} 
                  onUpload={() => { setActiveType('word'); fileInputRef.current?.click(); }} 
                  onRemove={(i: number) => removeFile('word', i)} 
                  onPreview={(urls, index) => setPreviewData({ urls, index })}
                />
                <Textarea 
                  placeholder="记单词的心得..." 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="resize-none rounded-xl bg-muted/30"
                />
                <Button 
                  onClick={() => handleSubmit('word')}
                  disabled={isUploading || files.word.length === 0}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 font-bold rounded-xl"
                >
                  {isUploading && activeType === 'word' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  提交单词打卡
                </Button>
              </>
            ) : (
              <div className="py-10 text-center space-y-2">
                <div className="inline-flex p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <p className="font-bold text-emerald-600">今日单词任务已达成！</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2.2 专项训练打卡 */}
        <Card className={cn("theme-card overflow-hidden", !todayTask && "opacity-50")}>
          <CardHeader className={cn("border-b border-border/50", todayTask?.bg)}>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg flex items-center gap-2">
                {todayTask ? <todayTask.icon className={cn("w-5 h-5", todayTask.color)} /> : <Calendar className="w-5 h-5" />}
                2. 今日专项训练
              </CardTitle>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold border border-border/50 bg-background/50 hover:bg-background transition-all rounded-md">
                      <Settings2 className="w-3 h-3 mr-1" />
                      手动切换
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-xl border-border/50 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90">
                    <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1.5">
                      选择训练题型
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border/50" />
                    {SCHEDULE.map((task, idx) => (
                      <DropdownMenuItem 
                        key={task.section}
                        onClick={() => setManualTaskIndex(idx)}
                        className={cn(
                          "flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors text-xs font-medium",
                          todayTask?.section === task.section 
                            ? "bg-primary/10 text-primary" 
                            : "hover:bg-muted"
                        )}
                      >
                        <task.icon className={cn("w-3.5 h-3.5", task.color)} />
                        <span>{task.label}</span>
                        {todayTask?.section === task.section && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                    {manualTaskIndex !== null && (
                      <>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <DropdownMenuItem 
                          onClick={() => setManualTaskIndex(null)}
                          className="flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer hover:bg-rose-500/10 text-rose-500 text-xs font-bold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          重置为今日计划
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-[10px] font-black px-2 py-1 bg-background/50 rounded-md uppercase tracking-wider border border-border/50">
                  {currentPaper}
                </div>
              </div>
            </div>
            <CardDescription>
              {todayTask ? `${todayTask.label} (限时: ${todayTask.limit})` : '周末休息时间，好好充电哦～'}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {todayTask ? (
              <div className="space-y-6">
                {/* 1. 题目/原文上传 (针对写作和翻译任务) */}
                {(todayTask.section === 'writing' || todayTask.section === 'translation') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px]">1</span>
                        {todayTask.section === 'translation' ? '上传翻译原文' : '上传作文题目'}
                      </h4>
                      {isCompletedToday('training') && <span className="text-[10px] font-bold text-emerald-500">已同步</span>}
                    </div>
                    {!isCompletedToday('training') && (
                      <>
                        <ImageUploader 
                          previews={previews.essay_prompt} 
                          onUpload={() => { setActiveType('essay_prompt'); fileInputRef.current?.click(); }} 
                          onRemove={(i: number) => removeFile('essay_prompt', i)} 
                          onPreview={(urls, index) => setPreviewData({ urls, index })}
                        />
                        <Button 
                          size="sm"
                          variant="secondary"
                          onClick={() => handleSubmit('essay_prompt')}
                          disabled={isUploading || files.essay_prompt.length === 0}
                          className="w-full h-10 font-bold rounded-xl"
                        >
                          {todayTask.section === 'translation' ? '识别原文截图' : '识别题目截图'}
                        </Button>
                      </>
                    )}
                    <div className="h-[1px] bg-border/50 my-4" />
                  </div>
                )}

                {/* 2. 成果上传 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">
                        {(todayTask.section === 'writing' || todayTask.section === 'translation') ? '2' : 'A'}
                      </span>
                      {todayTask.section === 'writing' ? '上传作文成果' : 
                       todayTask.section === 'translation' ? '上传翻译成果' : 
                       '训练成果拍照'}
                    </h4>
                    {isCompletedToday('training') && <span className="text-[10px] font-bold text-emerald-500">已完成</span>}
                  </div>
                  {!isCompletedToday('training') ? (
                    <>
                      <div className="p-3 bg-muted/20 rounded-xl border border-dashed mb-3">
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {todayTask.content}
                        </p>
                      </div>
                      <ImageUploader 
                        previews={previews.training} 
                        onUpload={() => { setActiveType('training'); fileInputRef.current?.click(); }} 
                        onRemove={(i: number) => removeFile('training', i)} 
                        onPreview={(urls, index) => setPreviewData({ urls, index })}
                      />
                      {todayTask.questions > 0 && (
                        <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border">
                          <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">做对了几题？</span>
                          <input 
                            type="number" 
                            value={correctCount}
                            onChange={(e) => setCorrectCount(e.target.value)}
                            placeholder={`共 ${todayTask.questions} 题`}
                            className="flex-1 bg-transparent border-none text-sm font-black focus:outline-none focus:ring-0"
                          />
                        </div>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => handleSubmit('training')}
                        disabled={isUploading || files.training.length === 0}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl"
                      >
                        提交训练打卡
                      </Button>
                    </>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      训练打卡已成功，太棒了！
                    </div>
                  )}
                </div>

                <div className="h-[1px] bg-border/50" />

                {/* 订正打卡 */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">B</span>
                      订正总结拍照
                    </h4>
                    {isCompletedToday('correction') && <span className="text-[10px] font-bold text-emerald-500">已完成</span>}
                  </div>
                  {!isCompletedToday('correction') ? (
                    <>
                      <ImageUploader 
                        previews={previews.correction} 
                        onUpload={() => { setActiveType('correction'); fileInputRef.current?.click(); }} 
                        onRemove={(i: number) => removeFile('correction', i)} 
                        onPreview={(urls, index) => setPreviewData({ urls, index })}
                      />
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleSubmit('correction')}
                        disabled={isUploading || files.correction.length === 0}
                        className="w-full h-10 border-indigo-200 dark:border-indigo-800 text-indigo-600 font-bold rounded-xl"
                      >
                        提交订正总结
                      </Button>
                    </>
                  ) : (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      订正打卡已成功，欣妍真细心！
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center space-y-4">
                <div className="inline-flex p-4 bg-primary/10 rounded-3xl text-primary animate-bounce-subtle">
                  <Calendar className="w-10 h-10" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">周末愉快！</h4>
                  <p className="text-sm text-muted-foreground px-10">休息是为了更好地冲刺，去喝杯奶茶奖励一下自己吧！☕️</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        multiple
        className="hidden" 
      />

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
    </div>
  );
};

const ImageUploader: React.FC<{ 
  previews: string[], 
  onUpload: () => void, 
  onRemove: (i: number) => void,
  onPreview: (urls: string[], index: number) => void
}> = ({ previews, onUpload, onRemove, onPreview }) => (
  <div className="grid grid-cols-3 gap-2">
    {previews.map((url, i) => (
      <div key={i} className="aspect-square relative rounded-xl overflow-hidden border bg-muted group cursor-zoom-in" onClick={() => onPreview(previews, i)}>
        <img src={url} alt="Preview" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <FullscreenIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(i); }} 
          className="absolute top-1 right-1 p-1.5 bg-black/60 hover:bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
    {previews.length < 3 && (
      <button 
        onClick={onUpload}
        className="aspect-square flex flex-col items-center justify-center rounded-xl border border-dashed border-primary/30 hover:bg-primary/5 transition-colors text-primary/40 hover:text-primary"
      >
        <Upload className="w-6 h-6 mb-1" />
        <span className="text-[10px] font-bold">上传图片</span>
      </button>
    )}
  </div>
);
