import { useState, useRef, useEffect } from 'react';
import {
  ImageIcon,
  Sparkles,
  Loader2,
  Maximize2,
  X,
  Settings2,
  Upload,
  Trash2,
  Coins,
  Download,
} from 'lucide-react';
import { generateImage, uploadReferenceImage, getHistory, deleteHistory, getTotalCost, type GeneratedImage as ApiGeneratedImage } from '../api/image-gen';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ParticleLoader } from '@/components/ui/particle-loader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

const ASPECT_RATIOS = [
  { label: '1:1', value: '1:1', description: '正方形 (头像/社交媒体)' },
  { label: '16:9', value: '16:9', description: '横屏 (壁纸/视频封面)' },
  { label: '9:16', value: '9:16', description: '竖屏 (手机壁纸/海报)' },
  { label: '4:3', value: '4:3', description: '标准 (传统照片)' },
  { label: '3:4', value: '3:4', description: '竖向 (人像摄影)' },
];

export function ImageGenView() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // History
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [totalCost, setTotalCost] = useState<{ amount: number; currency: string }>({
    amount: 0,
    currency: 'CNY',
  });

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data.map((item: ApiGeneratedImage) => ({
        id: item._id,
        url: item.url,
        prompt: item.prompt,
        timestamp: new Date(item.createdAt).getTime(),
      })));
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  const fetchTotalCost = async () => {
    try {
      const data = await getTotalCost();
      setTotalCost({ amount: data.totalCost, currency: data.currency });
    } catch (error) {
      console.error('Failed to fetch total cost', error);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchTotalCost();
  }, []);

  // Progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + Math.random() * 5;
          if (prev < 99) return prev + Math.random() * 0.5;
          return prev;
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Advanced settings
  const [model, setModel] = useState('doubao-seedream-5-0-260128');
  const [size, setSize] = useState('2K');
  const [customWidth, setCustomWidth] = useState(2048);
  const [customHeight, setCustomHeight] = useState(2048);
  const [sizeMode, setSizeMode] = useState<'resolution' | 'custom'>('resolution');
  const [promptOptimizer, setPromptOptimizer] = useState(false);
  const [aigcWatermark, setAigcWatermark] = useState(true);
  const [seed, setSeed] = useState<string>('');
  const [numImages, setNumImages] = useState(1);
  const [guidanceScale, setGuidanceScale] = useState(2.5);
  const [sequentialGeneration, setSequentialGeneration] = useState<'auto' | 'disabled'>('disabled');
  const [isStream, setIsStream] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png'>('jpeg');

  // Image to Image
  const [mode, setMode] = useState<'text-to-image' | 'image-to-image'>(
    'text-to-image',
  );
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    if (mode === 'image-to-image' && referenceImages.length === 0) {
      toast.error('请上传至少一张参考图');
      return;
    }

    setIsGenerating(true);
    try {
      const options: any = {
        model,
        watermark: aigcWatermark,
        seed: seed ? parseInt(seed, 10) : undefined,
        reference_images: mode === 'image-to-image' ? referenceImages : undefined,
        size: sizeMode === 'resolution' ? size : `${customWidth}x${customHeight}`,
        sequential_image_generation: sequentialGeneration,
        stream: isStream,
        optimize_prompt_options: promptOptimizer ? { mode: 'standard' } : undefined,
      };

      if (model.includes('5.0')) {
        options.output_format = outputFormat;
        if (isWebSearch) {
          options.tools = [{ type: 'web_search' }];
        }
      }

      if (model.includes('3.0')) {
        options.guidance_scale = guidanceScale;
      }

      if (sequentialGeneration === 'auto') {
        options.sequential_image_generation_options = {
          max_images: numImages,
        };
      }

      const result = await generateImage(prompt, options);
      
      if (result && result.imageUrl) {
        setImageUrl(result.imageUrl);
        await fetchHistory();
        await fetchTotalCost();
        toast.success('图片生成成功');
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : '生成失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url: string, filename?: string) => {
    try {
      const response = await fetch(url, { mode: 'cors' }).catch(() => null);
      if (response && response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || `lumi-ai-gen-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('download', filename || '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.info('由于浏览器安全限制，请在打开的新窗口中右键点击图片选择“另存为”');
      }
    } catch (error) {
      console.error('Download failed', error);
      window.open(url, '_blank');
      toast.error('下载失败，请在打开的页面中右键另存为');
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteHistory(id);
      setHistory((prev) => prev.filter((img) => img.id !== id));
      await fetchTotalCost();
      if (imageUrl && history.find((img) => img.id === id)?.url === imageUrl) {
        const remaining = history.filter((img) => img.id !== id);
        setImageUrl(remaining.length > 0 ? remaining[0].url : null);
      }
      toast.success('图片已删除');
    } catch (error) {
      console.error('Failed to delete image', error);
      toast.error('删除失败');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('图片大小不能超过 50MB');
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadReferenceImage(file);
      const res = (response as unknown) as { url: string };
      
      let fullUrl = res.url;
      if (fullUrl.startsWith('/')) {
         fullUrl = window.location.origin + fullUrl;
      }
      
      setReferenceImages(prev => [...prev, fullUrl].slice(0, 14));
      toast.success('参考图上传成功');
    } catch (error) {
      console.error(error);
      toast.error('上传失败');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeReferenceImage = (index: number) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex-1 p-4 md:p-8 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 theme-muted overflow-y-auto scrollbar-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧控制区 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="theme-surface rounded-3xl shadow-sm border p-6 flex flex-col gap-4">
              <Tabs
                defaultValue="text-to-image"
                onValueChange={(v) =>
                  setMode(v as 'text-to-image' | 'image-to-image')
                }
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="text-to-image">文生图</TabsTrigger>
                  <TabsTrigger value="image-to-image">图生图</TabsTrigger>
                </TabsList>

                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">创意描述</h3>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="描述你想要生成的画面，例如：一只在大海冲浪的赛博朋克猫..."
                  className="w-full h-40 resize-none rounded-xl border border-input bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-4"
                />

                <TabsContent value="image-to-image" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>参考图 (Reference Images)</Label>
                      <span className="text-[10px] opacity-50">{referenceImages.length}/14</span>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {referenceImages.map((url, index) => (
                        <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border">
                          <img src={url} alt={`Ref ${index}`} className="w-full h-full object-cover" />
                          <button 
                            onClick={() => removeReferenceImage(index)}
                            className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      
                      {referenceImages.length < 14 && (
                        <div
                          className="border-2 border-dashed border-input rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors aspect-square relative"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          {isUploading && (
                            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p className="text-[10px] text-muted-foreground">支持多图融合，最多 14 张</p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-3 pt-2">
                <h3 className="font-semibold text-sm theme-subtle">图片比例</h3>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map((ratio) => (
                    <button
                      key={ratio.value}
                      onClick={() => setAspectRatio(ratio.value)}
                      className={cn(
                        'px-3 py-2 rounded-lg text-sm border transition-all',
                        aspectRatio === ratio.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-muted border-input',
                      )}
                      title={ratio.description}
                    >
                      {ratio.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm theme-subtle">
                    高级设置
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>模型选择</Label>
                    <Select value={model} onValueChange={(v) => {
                      setModel(v);
                      if (v.includes('5-0')) setSize('2K');
                      else if (v.includes('4-5') || v.includes('4-0')) setSize('2K');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择模型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="doubao-seedream-5-0-260128">Doubao-Seedream 5.0 Lite</SelectItem>
                        <SelectItem value="doubao-seedream-4-5-251128">Doubao-Seedream 4.5</SelectItem>
                        <SelectItem value="doubao-seedream-4-0-250828">Doubao-Seedream 4.0</SelectItem>
                        <SelectItem value="doubao-seedream-3-0-t2i-250415">Doubao-Seedream 3.0</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>尺寸模式</Label>
                    <Tabs value={sizeMode} onValueChange={(v) => setSizeMode(v as any)} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="resolution">预设分辨率</TabsTrigger>
                        <TabsTrigger value="custom">自定义像素</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {sizeMode === 'resolution' ? (
                    <div className="space-y-2">
                      <Label>分辨率</Label>
                      <Select value={size} onValueChange={setSize}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择分辨率" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2K">2K</SelectItem>
                          {model.includes('5-0') && <SelectItem value="3K">3K</SelectItem>}
                          {model.includes('4-5') && <SelectItem value="4K">4K</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[10px]">宽度 (px)</Label>
                        <Input 
                          type="number" 
                          value={customWidth} 
                          onChange={(e) => setCustomWidth(parseInt(e.target.value))} 
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">高度 (px)</Label>
                        <Input 
                          type="number" 
                          value={customHeight} 
                          onChange={(e) => setCustomHeight(parseInt(e.target.value))} 
                          className="h-8"
                        />
                      </div>
                      <p className="col-span-2 text-[10px] opacity-50">
                        总像素需在 368.64w - {model.includes('5-0') ? '1040.45w' : '1677.72w'} 之间
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sequential-gen">生成组图</Label>
                      <p className="text-[10px] theme-subtle">基于参考图生成一系列关联图片</p>
                    </div>
                    <Switch
                      id="sequential-gen"
                      checked={sequentialGeneration === 'auto'}
                      onCheckedChange={(checked) => setSequentialGeneration(checked ? 'auto' : 'disabled')}
                    />
                  </div>

                  {model.includes('5.0') && (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="web-search">联网搜索</Label>
                          <p className="text-[10px] theme-subtle">搜索互联网内容提升时效性</p>
                        </div>
                        <Switch
                          id="web-search"
                          checked={isWebSearch}
                          onCheckedChange={setIsWebSearch}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>输出格式</Label>
                        <Select value={outputFormat} onValueChange={(v: any) => setOutputFormat(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="jpeg">JPEG</SelectItem>
                            <SelectItem value="png">PNG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="stream-mode">流式输出</Label>
                      <p className="text-[10px] theme-subtle">即时返回每张生成结果</p>
                    </div>
                    <Switch
                      id="stream-mode"
                      checked={isStream}
                      onCheckedChange={setIsStream}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt-optimizer">智能优化提示词</Label>
                    <Switch
                      id="prompt-optimizer"
                      checked={promptOptimizer}
                      onCheckedChange={setPromptOptimizer}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="watermark">添加水印</Label>
                      <p className="text-xs theme-subtle">在图片右下角添加标识</p>
                    </div>
                    <Switch
                      id="watermark"
                      checked={aigcWatermark}
                      onCheckedChange={setAigcWatermark}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seed">随机种子 (Seed)</Label>
                    <Input
                      id="seed"
                      type="number"
                      placeholder="留空为随机"
                      value={seed}
                      onChange={(e) => setSeed(e.target.value)}
                    />
                  </div>

                  {sequentialGeneration === 'auto' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>组图最大生成数量</Label>
                        <span className="text-xs font-mono text-primary">{numImages} 张</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={numImages}
                        onChange={(e) => setNumImages(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <p className="text-[10px] theme-subtle">参考图 + 生成图总数不超过 15</p>
                    </div>
                  )}

                  {model.includes('3.0') && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>引导强度 (CFG Scale)</Label>
                        <span className="text-xs font-mono text-primary">{guidanceScale.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={guidanceScale}
                        onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-3 mt-4 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    正在绘制中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    开始生成
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 右侧展示区 */}
          <div className="lg:col-span-8">
            <div className="theme-surface rounded-3xl shadow-sm border h-[600px] flex items-center justify-center theme-muted relative overflow-hidden group">
              {isGenerating ? (
                <div className="relative w-full h-full flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                  <ParticleLoader progress={progress} />
                </div>
              ) : imageUrl ? (
                <div className="relative w-full h-full bg-black/5 flex items-center justify-center p-4">
                  <img
                    src={imageUrl}
                    alt="Generated"
                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      onClick={() => handleDownload(imageUrl)}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium shadow-lg hover:scale-105 transition-transform"
                    >
                      <Download className="w-5 h-5" />
                      下载图片
                    </button>
                    <button
                      onClick={() => setIsPreviewOpen(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium shadow-lg hover:scale-105 transition-transform"
                    >
                      <Maximize2 className="w-5 h-5" />
                      查看大图
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4 p-6">
                  <div className="flex flex-col items-center gap-4 opacity-50">
                    <ImageIcon className="w-20 h-20" />
                    <p className="text-lg">您的杰作将在这里呈现</p>
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Section */}
            {history.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg theme-text">历史作品</h3>
                  <div className="flex items-center gap-4 text-sm theme-subtle">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                      <Coins className="w-4 h-4" />
                      <span>
                        {totalCost.currency} {totalCost.amount.toFixed(2)}
                      </span>
                    </div>
                    <span>{history.length} 张图片</span>
                  </div>
                </div>
                
                {/* 滚动容器 */}
                <div className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40 transition-colors">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                    {history.map((img) => (
                      <div
                        key={img.id}
                        className={cn(
                          'relative group aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all bg-muted',
                          imageUrl === img.url
                            ? 'ring-2 ring-primary ring-offset-2'
                            : 'hover:border-primary',
                        )}
                        onClick={() => setImageUrl(img.url)}
                      >
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(img.url);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors transform hover:scale-110"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, img.id)}
                            className="p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors transform hover:scale-110"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {imageUrl && (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={imageUrl}
                  alt="Full Preview"
                  className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                />
                <button
                  onClick={() => handleDownload(imageUrl)}
                  className="flex items-center gap-2 px-8 py-3 bg-white text-black rounded-full font-bold shadow-2xl hover:scale-105 transition-transform"
                >
                  <Download className="w-6 h-6" />
                  保存图片到本地
                </button>
              </div>
            )}
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors">
              <X className="w-8 h-8" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
