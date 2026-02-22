import { X, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AutoGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

export function AutoGenerateModal({ isOpen, onClose, onConfirm, isLoading }: AutoGenerateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-md rounded-xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AI 自动生成企划
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full" disabled={isLoading}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          <p className="text-muted-foreground">
            此操作将自动生成 5 位热门歌手及其各 5 首热门歌曲的拍摄企划（共 25 个任务）。
            <br /><br />
            生成过程可能需要几秒钟，确定要继续吗？
          </p>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/30 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                确认生成
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
