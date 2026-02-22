import { useState } from 'react';
import { ImageIcon, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { generateImage } from '../api/image-gen';
import { toast } from 'sonner';

export function ImageGenView() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入提示词');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateImage(prompt);
      // api client returns the 'data' field from response structure
      // which contains { imageUrl: string }
      if (result && result.imageUrl) {
          setImageUrl(result.imageUrl);
          toast.success('图片生成成功');
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : '生成失败，请重试';
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-8 theme-muted overflow-y-auto scrollbar-hidden">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 theme-accent rounded-2xl shadow-sm">
            <ImageIcon className="w-8 h-8 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold theme-text">AI 创意工坊</h2>
            <p className="theme-subtle">将您的想象转化为令人惊叹的视觉艺术</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="theme-surface rounded-3xl shadow-sm border p-6 flex flex-col gap-4 h-[500px]">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">创意描述</h3>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="描述你想要生成的画面，例如：一只在大海冲浪的赛博朋克猫..."
              className="flex-1 resize-none rounded-xl border border-input bg-background p-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all mt-auto"
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

          <div className="theme-surface rounded-3xl shadow-sm border h-[500px] flex items-center justify-center theme-muted relative overflow-hidden group">
             {imageUrl ? (
               <div className="relative w-full h-full bg-black/5">
                 <img src={imageUrl} alt="Generated" className="w-full h-full object-contain" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <button 
                     onClick={() => window.open(imageUrl, '_blank')}
                     className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-full font-medium text-sm hover:bg-gray-100 transition-colors"
                   >
                     <ExternalLink className="w-4 h-4" />
                     查看原图
                   </button>
                 </div>
               </div>
             ) : (
               <div className="text-center space-y-2 p-6">
                 {isGenerating ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <p className="theme-subtle animate-pulse">AI 正在挥洒创意...</p>
                    </div>
                 ) : (
                    <>
                        <Sparkles className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="font-medium theme-text">生成结果展示区</p>
                        <p className="text-sm theme-subtle">您的杰作将在这里呈现</p>
                    </>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
