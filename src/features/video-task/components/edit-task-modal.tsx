import { useEffect, useState } from 'react';
import { X, Save, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { videoTaskApi } from '../api';
import type { VideoTask, VideoTaskAngle } from '../types';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: VideoTask;
}

const ANGLE_OPTIONS: { value: VideoTaskAngle; label: string }[] = [
  { value: 'fisheye', label: '鱼眼镜头' },
  { value: 'handheld-indoor', label: '手持竖屏室内' },
  { value: 'handheld-outdoor', label: '手持竖屏室外' },
  { value: 'fixed-indoor', label: '固定竖屏室内' },
  { value: 'other', label: '其他' },
];

export function EditTaskModal({ isOpen, onClose, onSuccess, task }: EditTaskModalProps) {
  const [artist, setArtist] = useState(task.artist);
  const [song, setSong] = useState(task.song);
  const [snippet, setSnippet] = useState(task.snippet || '');
  const [angle, setAngle] = useState<VideoTaskAngle>(task.angle);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (isOpen) {
      setArtist(task.artist);
      setSong(task.song);
      setSnippet(task.snippet || '');
      setAngle(task.angle);
    }
  }, [isOpen, task]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!artist.trim() || !song.trim()) return;

    setIsSubmitting(true);
    try {
      await videoTaskApi.update(task._id, {
        artist,
        song,
        snippet,
        angle,
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to update task', error);
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-lg rounded-xl shadow-2xl border border-border flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">编辑拍摄企划</h2>
            <p className="text-sm text-muted-foreground mt-1">修改音乐视频任务信息</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="edit-artist">歌手名称</Label>
            <div className="relative">
              <Mic2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="edit-artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-song">歌曲名称</Label>
            <Input
              id="edit-song"
              value={song}
              onChange={(e) => setSong(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-snippet">歌词片段</Label>
            <textarea
              id="edit-snippet"
              value={snippet}
              onChange={(e) => setSnippet(e.target.value)}
              placeholder="记录想要拍摄的歌词片段..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>拍摄角度</Label>
            <select
              value={angle}
              onChange={(e) => setAngle(e.target.value as VideoTaskAngle)}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {ANGLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/30 rounded-b-xl">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !artist.trim() || !song.trim()} className="gap-2">
            <Save className="w-4 h-4" />
            保存修改
          </Button>
        </div>
      </div>
    </div>
  );
}
