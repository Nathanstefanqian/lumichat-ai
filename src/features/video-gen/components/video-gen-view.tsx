import { useState, useRef, useEffect } from 'react';
import {
  Video,
  Sparkles,
  Loader2,
  X,
  Settings2,
  Upload,
  Trash2,
  Download,
  Play,
  Type,
  Clock,
  Monitor,
  Maximize2,
  Smartphone,
  Layers,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  createVideoTask,
  getVideoTasks,
  deleteVideoTask,
  uploadReferenceMedia,
} from '../api';
import type { 
  VideoTaskResponse, 
  VideoRatio, 
  VideoResolution, 
  VideoModelType,
  VideoContentInput 
} from '../types';

const RATIOS: { label: string; value: VideoRatio; icon: any }[] = [
  { label: '16:9', value: '16:9', icon: Monitor },
  { label: '9:16', value: '9:16', icon: Smartphone },
  { label: '21:9', value: '21:9', icon: Maximize2 },
  { label: '4:3', value: '4:3', icon: Monitor },
  { label: '3:4', value: '3:4', icon: Smartphone },
  { label: '1:1', value: '1:1', icon: Layers },
];

export function VideoGenView() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState<VideoTaskResponse[]>([]);
  const [selectedTask, setSelectedTask] = useState<VideoTaskResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Settings
  const [model, setModel] = useState<VideoModelType>('doubao-seedance-2-0-260128');
  const [ratio, setRatio] = useState<VideoRatio>('16:9');
  const [resolution, setResolution] = useState<VideoResolution>('720p');
  const [duration, setDuration] = useState(5);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [seed, setSeed] = useState<string>('');
  const [isDraft] = useState(false);

  // Media Inputs
  const [mediaInputs, setMediaInputs] = useState<VideoContentInput[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = async () => {
    try {
      const data = await getVideoTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => {
      const hasRunningTask = tasks.some(t => t.status === 'running' || t.status === 'pending');
      if (hasRunningTask) {
        fetchTasks();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [tasks]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const type = file.type.split('/')[0] as any;
        if (!['image', 'video', 'audio'].includes(type)) {
          toast.error(`不支持的文件类型: ${file.type}`);
          continue;
        }
        
        const { url } = await uploadReferenceMedia(file);
        const newInput: VideoContentInput = {
          type,
          [`${type}_url`]: url
        };
        setMediaInputs(prev => [...prev, newInput]);
      }
      toast.success('素材上传成功');
    } catch (error) {
      toast.error('上传失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && mediaInputs.length === 0) {
      toast.error('请输入提示词或上传参考素材');
      return;
    }

    setIsGenerating(true);
    try {
      const content: VideoContentInput[] = [];
      if (prompt.trim()) {
        content.push({ type: 'text', text: prompt });
      }
      content.push(...mediaInputs);

      const dto = {
        model,
        content,
        ratio,
        resolution,
        duration,
        generate_audio: generateAudio,
        seed: seed ? parseInt(seed, 10) : undefined,
        draft: isDraft,
      };

      await createVideoTask(dto);
      toast.success('任务创建成功，正在排队生成...');
      setPrompt('');
      setMediaInputs([]);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.message || '创建任务失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteVideoTask(taskId);
      setTasks(prev => prev.filter(t => t.task_id !== taskId));
      toast.success('任务已删除');
    } catch (error) {
      toast.error('删除失败');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 bg-card/30 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight theme-text">AI 视频创作中心</h1>
            <p className="text-xs text-muted-foreground mt-1 font-medium opacity-70">基于 Seedance 2.0 导演级视频生成引擎</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5 font-bold">
            <Zap className="w-3 h-3 mr-1 fill-primary" />
            Seedance 2.0 Pro
          </Badge>
          <Button variant="ghost" size="icon" onClick={fetchTasks} className="rounded-xl hover:bg-primary/5">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Input Area */}
        <div className="flex-1 flex flex-col p-4 lg:p-8 overflow-y-auto custom-scrollbar space-y-6 lg:space-y-8">
          {/* Prompt Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">视频提示词</h3>
            </div>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要生成的画面，例如：一只可爱的猫咪在赛博朋克风格的房间里写代码，全息投影效果..."
                className="w-full h-32 lg:h-40 p-4 lg:p-6 rounded-2xl lg:rounded-3xl bg-card border-border/40 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all outline-none resize-none text-sm font-medium leading-relaxed group-hover:border-border transition-colors shadow-sm"
              />
              <div className="absolute bottom-4 right-6 flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground/40 bg-muted/30 px-2 py-1 rounded-md">
                  {prompt.length} / 500
                </span>
              </div>
            </div>
          </div>

          {/* Media Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">多模态参考素材</h3>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-dashed border-border hover:border-primary/50 hover:bg-primary/5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Upload className="w-3 h-3 mr-2" />}
                上传素材
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*,video/*,audio/*"
              />
            </div>

            <div className="min-h-[160px] lg:min-h-[200px] rounded-2xl lg:rounded-3xl border-2 border-dashed border-border/40 bg-card/30 flex flex-col items-center justify-center p-4 lg:p-8 transition-colors hover:bg-card/50">
              {mediaInputs.length === 0 ? (
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-2 lg:mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 lg:w-8 lg:h-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs lg:text-sm font-bold text-muted-foreground/60 tracking-tight">点击或拖拽上传图片、视频、音频参考素材</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 w-full">
                  {mediaInputs.map((input, idx) => (
                    <div key={idx} className="group relative aspect-square rounded-xl lg:rounded-2xl overflow-hidden bg-muted border border-border/40 shadow-sm">
                      {input.type === 'image' && (
                        <img src={input.image_url} className="w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => setMediaInputs(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className="bg-black/50 backdrop-blur-md border-none text-[10px] uppercase font-black">{input.type}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="space-y-4 pb-8 lg:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">任务历史</h3>
              </div>
              <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">最近 {tasks.length} 个任务</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {tasks.map((task) => (
                <div 
                  key={task.task_id} 
                  className="group bg-card/40 border border-border/40 rounded-2xl lg:rounded-3xl overflow-hidden hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/5 flex flex-col"
                >
                  <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
                    {task.status === 'succeeded' || task.status === 'success' ? (
                      <div className="w-full h-full relative">
                        {task.cover_url ? (
                          <img src={task.cover_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Video className="w-10 h-10 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="rounded-xl shadow-lg hover:scale-110 transition-transform"
                            onClick={() => {
                              setSelectedTask(task);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </Button>
                          {task.video_url && (
                            <Button 
                              variant="secondary" 
                              size="icon" 
                              className="rounded-xl shadow-lg hover:scale-110 transition-transform"
                              asChild
                            >
                              <a href={task.video_url} download target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : task.status === 'failed' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                          <X className="w-5 h-5 text-destructive" />
                        </div>
                        <span className="text-xs font-black text-destructive uppercase tracking-tighter">生成失败</span>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 leading-tight">{task.error_message}</p>
                      </div>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-muted/30">
                        <div className="relative">
                          <Loader2 className="w-10 h-10 text-primary animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-1 h-1 bg-primary rounded-full animate-ping" />
                          </div>
                        </div>
                        <div className="text-center">
                          <span className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">
                            {task.status === 'pending' ? '排队中...' : 
                             task.status === 'running' ? '正在渲染中...' : 
                             '处理中...'}
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-1">AI 导演正在思考画面...</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 lg:p-5 flex-1 flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <code className="text-[10px] font-bold text-muted-foreground/40 font-mono tracking-tighter bg-muted/50 px-2 py-0.5 rounded">#{task.task_id.slice(-6)}</code>
                      <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{new Date(task.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-lg text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleDeleteTask(task.task_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Settings Sidebar */}
        <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-border/40 bg-card/20 backdrop-blur-sm p-6 lg:p-8 overflow-y-auto custom-scrollbar shrink-0">
          <div className="space-y-8 lg:space-y-10">
            <div className="flex items-center gap-3">
              <Settings2 className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-black uppercase tracking-[0.2em] theme-text">参数配置面板</h3>
            </div>

            {/* Model Selection */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">模型版本</Label>
              <Select value={model} onValueChange={(v: any) => setModel(v)}>
                <SelectTrigger className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-card border-border/40 focus:ring-primary/5 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border/40 shadow-2xl">
                  <SelectItem value="doubao-seedance-2-0-260128" className="rounded-xl my-1">Seedance 2.0 Pro (极致品质)</SelectItem>
                  <SelectItem value="doubao-seedance-2-0-fast-260128" className="rounded-xl my-1">Seedance 2.0 Fast (草稿模式)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ratio Selection */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">画面比例</Label>
              <div className="grid grid-cols-3 gap-2 lg:gap-3">
                {RATIOS.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.value}
                      onClick={() => setRatio(r.value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 p-3 lg:p-4 rounded-xl lg:rounded-2xl border transition-all hover:scale-[1.02] active:scale-95",
                        ratio === r.value 
                          ? "bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10" 
                          : "bg-card border-border/40 text-muted-foreground hover:border-border hover:bg-card/80"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-black tracking-tighter">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resolution */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">分辨率</Label>
              <div className="flex p-1 bg-muted/50 rounded-xl lg:rounded-2xl border border-border/40">
                {(['480p', '720p'] as VideoResolution[]).map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    className={cn(
                      "flex-1 py-2 lg:py-3 rounded-lg lg:rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      resolution === res ? "bg-card text-primary shadow-sm" : "text-muted-foreground/60 hover:text-muted-foreground"
                    )}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">视频时长</Label>
                <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{duration}s</span>
              </div>
              <Slider 
                value={[duration]} 
                onValueChange={([v]) => setDuration(v)} 
                max={15} 
                min={4} 
                step={1}
                className="py-4"
              />
            </div>

            {/* Toggles */}
            <div className="space-y-4 lg:space-y-6 pt-2 lg:pt-4 border-t border-border/20">
              <div className="flex items-center justify-between group">
                <div className="space-y-1">
                  <Label className="text-xs font-black tracking-tight group-hover:text-primary transition-colors">自动配音</Label>
                  <p className="text-[10px] text-muted-foreground/60 font-medium">AI 生成匹配画面的音效或音乐</p>
                </div>
                <Switch checked={generateAudio} onCheckedChange={setGenerateAudio} className="data-[state=checked]:bg-primary" />
              </div>

              <div className="flex items-center justify-between group opacity-50 cursor-not-allowed">
                <div className="space-y-1">
                  <Label className="text-xs font-black tracking-tight group-hover:text-primary transition-colors">草稿渲染模式</Label>
                  <p className="text-[10px] text-muted-foreground/60 font-medium">更快的生成速度，用于快速迭代想法</p>
                </div>
                <Switch checked={isDraft} disabled className="data-[state=checked]:bg-primary" />
              </div>
            </div>

            {/* Seed */}
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">随机种子 (SEED)</Label>
              <div className="relative">
                <Input 
                  value={seed} 
                  onChange={(e) => setSeed(e.target.value)} 
                  placeholder="留空则由系统随机分配"
                  className="h-12 lg:h-14 rounded-xl lg:rounded-2xl bg-card border-border/40 pl-4 pr-12 text-xs font-bold"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-1.5 h-8 lg:h-9 w-8 lg:w-9 rounded-xl hover:bg-primary/5 text-primary/40 hover:text-primary"
                  onClick={() => setSeed(Math.floor(Math.random() * 1000000).toString())}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              className="w-full h-14 lg:h-16 rounded-2xl lg:rounded-3xl text-base lg:text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-0.98 transition-all group overflow-hidden"
              onClick={handleGenerate}
              disabled={isGenerating || isUploading}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                  导演正在创作中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3 fill-white" />
                  开启视频生成
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl p-0 bg-black overflow-hidden border-none rounded-3xl shadow-2xl">
          {selectedTask && (
            <div className="relative group">
              <video 
                src={selectedTask.video_url} 
                controls 
                autoPlay 
                className="w-full h-auto max-h-[80vh] block shadow-2xl"
              />
              <div className="absolute top-6 left-8 flex flex-col gap-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className="w-fit bg-primary/80 backdrop-blur-md border-none px-4 py-1.5 text-xs font-black uppercase tracking-widest">
                  Seedance 2.0 Render
                </Badge>
                <div className="bg-black/60 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <p className="text-white/80 text-sm font-medium leading-relaxed max-w-md">
                    {selectedTask.task_id}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
