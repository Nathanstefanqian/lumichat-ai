import { useState } from 'react';
import { X, Plus, Trash2, Camera, Music, Mic2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { videoTaskApi } from '../api';
import type { VideoTaskAngle } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultArtist?: string;
}

const ANGLE_OPTIONS: { value: VideoTaskAngle; label: string }[] = [
  { value: 'fisheye', label: '鱼眼镜头' },
  { value: 'handheld-indoor', label: '手持竖屏室内' },
  { value: 'handheld-outdoor', label: '手持竖屏室外' },
  { value: 'fixed-indoor', label: '固定竖屏室内' },
  { value: 'other', label: '其他' },
];

interface SongItem {
  id: string;
  song: string;
  snippet: string;
  angle: VideoTaskAngle;
}

export function AddTaskModal({ isOpen, onClose, onSuccess, defaultArtist }: AddTaskModalProps) {
  const [artist, setArtist] = useState(defaultArtist || '');
  const [songs, setSongs] = useState<SongItem[]>([
    { id: '1', song: '', snippet: '', angle: 'handheld-indoor' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddSong = () => {
    setSongs([
      ...songs,
      { id: Date.now().toString(), song: '', snippet: '', angle: 'handheld-indoor' },
    ]);
  };

  const handleRemoveSong = (id: string) => {
    if (songs.length === 1) return;
    setSongs(songs.filter((s) => s.id !== id));
  };

  const handleUpdateSong = (id: string, field: keyof SongItem, value: string) => {
    setSongs(
      songs.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = async () => {
    if (!artist.trim()) return;
    const validSongs = songs.filter(s => s.song.trim());
    if (validSongs.length === 0) return;

    setIsSubmitting(true);
    try {
      // Create tasks sequentially to maintain order (or parallel)
      await Promise.all(
        validSongs.map((song) =>
          videoTaskApi.create({
            artist,
            song: song.song,
            snippet: song.snippet,
            angle: song.angle,
          })
        )
      );
      onSuccess();
    } catch (error) {
      console.error('Failed to create tasks', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-background w-full max-w-2xl rounded-xl shadow-2xl border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">新建拍摄企划</h2>
            <p className="text-sm text-muted-foreground mt-1">批量添加待拍摄的音乐视频任务</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="artist">歌手名称</Label>
            <div className="relative">
              <Mic2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="artist"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="例如: 陈奕迅"
                className="pl-9"
                autoFocus={!defaultArtist}
                readOnly={!!defaultArtist}
                disabled={!!defaultArtist}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>歌曲清单 ({songs.length})</Label>
              <Button variant="outline" size="sm" onClick={handleAddSong} className="h-8 gap-1">
                <Plus className="w-3.5 h-3.5" />
                添加歌曲
              </Button>
            </div>

            <div className="space-y-4">
              {songs.map((song) => (
                <div key={song.id} className="group relative bg-muted/30 border border-border rounded-lg p-4 space-y-4 transition-all hover:border-primary/50">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleRemoveSong(song.id)}
                      disabled={songs.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-8">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">歌名</Label>
                      <div className="relative">
                        <Music className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={song.song}
                          onChange={(e) => handleUpdateSong(song.id, 'song', e.target.value)}
                          placeholder="歌曲名称"
                          className="pl-9 bg-background"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">拍摄角度</Label>
                      <div className="relative">
                        <Camera className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9 appearance-none"
                          value={song.angle}
                          onChange={(e) => handleUpdateSong(song.id, 'angle', e.target.value)}
                        >
                          {ANGLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">歌词片段 (选填)</Label>
                    <textarea
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="输入该片段的代表歌词..."
                      value={song.snippet}
                      onChange={(e) => handleUpdateSong(song.id, 'snippet', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !artist.trim() || !songs[0].song.trim()}>
            {isSubmitting ? '创建中...' : `创建 ${songs.filter(s => s.song.trim()).length} 个任务`}
          </Button>
        </div>
      </div>
    </div>
  );
}
