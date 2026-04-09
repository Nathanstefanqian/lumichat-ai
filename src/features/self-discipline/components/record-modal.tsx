import { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, User, MapPin, Brain, Clock, Image as ImageIcon, X, MessageSquare } from 'lucide-react';
import type { RecordBehaviorDto } from '../types';
import { format, subMinutes } from 'date-fns';
import api from '@/lib/axios';
import { toast } from 'sonner';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: RecordBehaviorDto) => Promise<void>;
  isSubmitting: boolean;
}

const PRESET_LOCATIONS = ['卧室', '浴室', '卫生间', '酒店', '客厅'];
const PRESET_TRIGGERS = ['无聊', '压力', '深夜', '社交媒体', '孤独', '刷到诱导内容', '奖励自己', '小欣妍勾引'];

const TIME_OFFSETS = [
  { label: '刚刚', value: 0 },
  { label: '10分钟前', value: 10 },
  { label: '30分钟前', value: 30 },
  { label: '1小时前', value: 60 },
  { label: '2小时前', value: 120 },
  { label: '自定义', value: -1 },
];

export const RecordModal = ({ isOpen, onClose, onConfirm, isSubmitting }: RecordModalProps) => {
  const [location, setLocation] = useState('卧室');
  const [customLocation, setCustomLocation] = useState('');
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [companion, setCompanion] = useState('');
  const [moodPost, setMoodPost] = useState('疲惫');
  const [timeOffset, setTimeOffset] = useState(0);
  const [customTime, setCustomTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [note, setNote] = useState('');
  const [image, setImage] = useState('');
  const [duration, setDuration] = useState('15');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers(prev => 
      prev.includes(trigger) ? prev.filter(t => t !== trigger) : [...prev, trigger]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片不能超过 5MB 哦');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/common/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = (response as any).data || response;
      setImage(data.url);
      toast.success('图片上传成功');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('上传图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const finalTimestamp = useMemo(() => {
    if (timeOffset === -1) return new Date(customTime).toISOString();
    if (timeOffset === 0) return new Date().toISOString();
    return subMinutes(new Date(), timeOffset).toISOString();
  }, [timeOffset, customTime]);

  const handleSubmit = async () => {
    const finalLocation = customLocation || location;
    await onConfirm({
      location: finalLocation,
      triggers: selectedTriggers,
      companion,
      moodPost,
      note,
      image,
      duration: Number(duration),
      timestamp: finalTimestamp,
    });
    // Reset form
    setSelectedTriggers([]);
    setCompanion('');
    setCustomLocation('');
    setTimeOffset(0);
    setNote('');
    setImage('');
    setDuration('15');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            戒色结算
          </DialogTitle>
          <DialogDescription>
            宝宝，虽然刚才没忍住打了一架，但记录下来能帮咱们分析诱因，下次一定能坚持更久！
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
          {/* 破戒时间选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> 破戒时间
            </Label>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {TIME_OFFSETS.map(offset => (
                  <Badge
                    key={offset.label}
                    variant={timeOffset === offset.value ? "default" : "outline"}
                    className="cursor-pointer transition-colors px-3 py-1"
                    onClick={() => setTimeOffset(offset.value)}
                  >
                    {offset.label}
                  </Badge>
                ))}
              </div>
              {timeOffset === -1 && (
                <Input 
                  type="datetime-local"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full"
                />
              )}
              <p className="text-[10px] text-muted-foreground italic">
                选定的时间: {format(new Date(finalTimestamp), 'yyyy-MM-dd HH:mm:ss')}
              </p>
            </div>
          </div>

          {/* 地点选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> 破戒地点
            </Label>
            <div className="flex gap-2">
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="选择地点" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_LOCATIONS.map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                  <SelectItem value="custom">自定义...</SelectItem>
                </SelectContent>
              </Select>
              {location === 'custom' && (
                <Input 
                  placeholder="输入新地点" 
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  className="flex-1"
                />
              )}
            </div>
          </div>

          {/* 诱因选择 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Brain className="w-4 h-4" /> 破戒诱因 (多选)
            </Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TRIGGERS.map(trigger => (
                <Badge
                  key={trigger}
                  variant={selectedTriggers.includes(trigger) ? "default" : "outline"}
                  className="cursor-pointer transition-colors"
                  onClick={() => toggleTrigger(trigger)}
                >
                  {trigger}
                </Badge>
              ))}
            </div>
          </div>

          {/* 持续时长 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> 持续时长 (分钟)
            </Label>
            <div className="flex items-center gap-4">
              <Input 
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-24"
                min="1"
              />
              <span className="text-sm text-muted-foreground italic">
                宝宝，这次战斗了多久？(建议如实填写，有助于 AI 分析)
              </span>
            </div>
          </div>

          {/* 记录备注 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> 破戒感言 / 教训 (选填)
            </Label>
            <Textarea 
              placeholder="宝宝，当时是怎么想的？写下来引以为戒吧..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none h-20"
            />
          </div>

          {/* 图片上传 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" /> 上传截图 / 罪证 (选填)
            </Label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-24 h-24 border-dashed flex flex-col gap-2 relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {image ? (
                  <>
                    <img src={image} className="w-full h-full object-cover" alt="upload preview" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <ImageIcon className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{isUploading ? '上传中...' : '点击上传'}</span>
                  </>
                )}
              </Button>
              {image && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImage('')}
                  className="text-destructive text-xs flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> 移除图片
                </Button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          </div>

          {/* 结算心情 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="w-4 h-4" /> 贤者时间的心情
            </Label>
            <Select value={moodPost} onValueChange={setMoodPost}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="疲惫">😫 疲惫不堪</SelectItem>
                <SelectItem value="空虚">🕳️ 极度空虚</SelectItem>
                <SelectItem value="后悔">😔 充满悔意</SelectItem>
                <SelectItem value="满足">😌 短暂满足</SelectItem>
                <SelectItem value="无感">😐 毫无波澜</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isUploading}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? '正在结算...' : '确认破戒'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
