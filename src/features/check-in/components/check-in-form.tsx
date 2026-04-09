import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Image as ImageIcon, X, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { submitCheckIn } from '../api';

interface CheckInFormProps {
  onSuccess: () => void;
}

export const CheckInForm: React.FC<CheckInFormProps> = ({ onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过 5MB');
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('请上传打卡截图哦');
      return;
    }

    setIsUploading(true);
    try {
      // 1. 上传到 OSS
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/common/upload?folder=checkin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      }) as unknown as { url: string } | string;
      const imageUrl = typeof uploadRes === 'string' ? uploadRes : uploadRes.url;

      // 2. 提交打卡
      const result = await submitCheckIn({
        type: 'word',
        imageUrls: [imageUrl],
        content
      });

      toast.success(result.encouragement || '打卡成功！积分 +10', {
        icon: <Sparkles className="w-5 h-5 text-yellow-500" />
      });
      
      // 重置表单
      removeFile();
      setContent('');
      onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : '打卡失败，请稍后再试';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full theme-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-border/50">
        <CardTitle className="text-xl flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-blue-500" />
          每日单词打卡
        </CardTitle>
        <CardDescription>上传今天的单词背诵截图，开启元气满满的一天！</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer
                flex flex-col items-center justify-center gap-3 min-h-[200px]
                ${previewUrl ? 'border-blue-500/50 bg-blue-50/5 dark:bg-blue-900/5' : 'border-border hover:border-blue-400 hover:bg-muted/50'}
              `}
            >
              {previewUrl ? (
                <div className="relative w-full h-full flex justify-center">
                  <img src={previewUrl} alt="Preview" className="max-h-[300px] rounded-lg shadow-md object-contain" />
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(); }}
                    className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-700 dark:text-slate-300">点击或拖拽上传截图</p>
                    <p className="text-xs text-slate-400 mt-1">支持 JPG, PNG, GIF (最大 5MB)</p>
                  </div>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-400 ml-1">
                今日感言 (可选)
              </label>
              <Textarea 
                placeholder="记单词的时候在想什么呢？" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none rounded-xl focus-visible:ring-blue-500 border-border bg-background"
                rows={3}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isUploading || !file}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                正在同步到云端...
              </>
            ) : (
              '立即提交打卡'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
