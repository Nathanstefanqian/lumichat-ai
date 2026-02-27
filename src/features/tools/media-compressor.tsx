import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { Upload, FileVideo, X, Check, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { uploadMedia } from './api/media';
import { cn } from '@/lib/utils';

export function MediaCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [compressedPreviewUrl, setCompressedPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  
  // Settings
  const [maxSizeMB, setMaxSizeMB] = useState(1);
  const [maxWidthOrHeight, setMaxWidthOrHeight] = useState(1920);
  const [useWebWorker] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (compressedPreviewUrl) URL.revokeObjectURL(compressedPreviewUrl);
    };
  }, [previewUrl, compressedPreviewUrl]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      handleFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    // Reset state
    setFile(selectedFile);
    setCompressedFile(null);
    setUploadedUrl(null);
    setUploadProgress(0);
    
    // Create preview
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    if (file.type.startsWith('video/')) {
      toast.info('视频压缩功能暂不支持，将直接上传原文件');
      setCompressedFile(file); // Treat original as "compressed" for upload flow
      return;
    }

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: maxWidthOrHeight,
        useWebWorker: useWebWorker,
        fileType: file.type as string,
      };

      const compressed = await imageCompression(file, options);
      setCompressedFile(compressed);
      
      const url = URL.createObjectURL(compressed);
      setCompressedPreviewUrl(url);
      
      toast.success(`压缩成功: ${(compressed.size / 1024 / 1024).toFixed(2)} MB`);
    } catch (error) {
      console.error(error);
      toast.error('压缩失败，请重试');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleUpload = async () => {
    const fileToUpload = compressedFile || file;
    if (!fileToUpload) return;

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const response = await uploadMedia(fileToUpload, 'compressed-media', (progress: number) => {
        setUploadProgress(progress);
      });
      
      setUploadedUrl(response.url);
      toast.success('上传成功！');
    } catch (error) {
      console.error(error);
      toast.error('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const copyUrl = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      toast.success('链接已复制');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
        图片/视频压缩工具
      </h1>
      <p className="text-muted-foreground mb-8">
        压缩图片和视频，并上传到云端存储。支持自定义压缩参数。
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Upload & Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>上传文件</CardTitle>
              <CardDescription>支持 JPG, PNG, WEBP, MP4 等格式</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                  file ? "border-primary/50 bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileSelect}
                  accept="image/*,video/*"
                />
                
                {file ? (
                  <div className="flex flex-col items-center gap-4">
                    {file.type.startsWith('image/') ? (
                      <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-sm">
                        <img src={previewUrl || ''} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <FileVideo className="w-16 h-16 text-blue-500" />
                    )}
                    <div className="text-center">
                      <p className="font-medium truncate max-w-[200px]">{file.name}</p>
                      <p className="text-sm text-muted-foreground">{formatSize(file.size)}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      setCompressedFile(null);
                    }}>
                      <X className="w-4 h-4 mr-2" />
                      移除
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="font-medium">点击或拖拽文件上传</p>
                    <p className="text-xs text-muted-foreground">最大支持 50MB (图片) / 2GB (视频)</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>压缩设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>目标大小 (MB)</Label>
                  <span className="text-sm font-medium">{maxSizeMB} MB</span>
                </div>
                <Slider 
                  value={[maxSizeMB]} 
                  min={0.1} 
                  max={10} 
                  step={0.1} 
                  onValueChange={(vals: number[]) => setMaxSizeMB(vals[0])}
                />
                <p className="text-xs text-muted-foreground">压缩后的文件将尽量不超过此大小</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>最大宽/高 (px)</Label>
                  <span className="text-sm font-medium">{maxWidthOrHeight} px</span>
                </div>
                <Slider 
                  value={[maxWidthOrHeight]} 
                  min={100} 
                  max={4096} 
                  step={100} 
                  onValueChange={(vals: number[]) => setMaxWidthOrHeight(vals[0])}
                />
                <p className="text-xs text-muted-foreground">保持原始宽高比缩放</p>
              </div>

              <Button 
                className="w-full" 
                onClick={handleCompress} 
                disabled={!file || isCompressing || (file?.type.startsWith('video/') && false)}
              >
                {isCompressing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    正在压缩...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {file?.type.startsWith('video/') ? '准备上传 (视频暂不压缩)' : '开始压缩'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Result */}
        <div className="space-y-6">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>处理结果</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {compressedFile || (file && file.type.startsWith('video/')) ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">原始大小</p>
                      <p className="text-lg font-bold">{file ? formatSize(file.size) : '-'}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">压缩后大小</p>
                      <p className="text-lg font-bold text-green-500">
                        {compressedFile ? formatSize(compressedFile.size) : (file ? formatSize(file.size) : '-')}
                      </p>
                    </div>
                  </div>

                  {compressedFile && file && (
                    <div className="text-center text-sm text-muted-foreground">
                      压缩率: {((1 - compressedFile.size / file.size) * 100).toFixed(1)}%
                    </div>
                  )}

                  {isUploading ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>正在上传...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : uploadedUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 rounded-lg border border-green-500/20">
                        <Check className="w-5 h-5" />
                        <span className="font-medium">上传成功！</span>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>文件链接</Label>
                        <div className="flex gap-2">
                          <Input readOnly value={uploadedUrl} className="font-mono text-sm" />
                          <Button size="icon" variant="outline" onClick={copyUrl}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <Button onClick={handleUpload} className="w-full" size="lg">
                        <Upload className="w-4 h-4 mr-2" />
                        上传到云端
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        上传后将生成永久访问链接
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[200px]">
                  <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p>请先上传并压缩文件</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
