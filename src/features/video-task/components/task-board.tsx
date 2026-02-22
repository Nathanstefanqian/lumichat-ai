import type { VideoTask, VideoTaskStatus } from '../types';
import { Button } from '@/components/ui/button';
import { Trash2, Camera, CheckCircle, Video, Film, Scissors, Check, Plus, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskBoardProps {
  tasks: VideoTask[];
  onUpdate: (id: string, updates: Partial<VideoTask>) => void;
  onDelete: (id: string) => void;
  onEdit: (task: VideoTask) => void;
  onAddSong: (artist: string) => void;
  isSelectionMode: boolean;
  selectedTaskIds: Set<string>;
  onToggleSelection: (id: string) => void;
}

const STATUS_CONFIG = {
  pending: { label: '待办', icon: Video, color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  filmed: { label: '已拍摄', icon: Film, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  edited: { label: '已剪辑', icon: Scissors, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  completed: { label: '已发布', icon: Check, color: 'text-green-600 bg-green-50 border-green-200' },
};

const ANGLE_LABELS: Record<string, string> = {
  'fisheye': '鱼眼镜头',
  'handheld-indoor': '手持竖屏室内',
  'handheld-outdoor': '手持竖屏室外',
  'fixed-indoor': '固定竖屏室内',
  'other': '其他',
};

export function TaskBoard({ 
  tasks, 
  onUpdate, 
  onDelete, 
  onEdit, 
  onAddSong, 
  isSelectionMode, 
  selectedTaskIds, 
  onToggleSelection 
}: TaskBoardProps) {
  // Safety check for tasks
  if (!Array.isArray(tasks)) {
    console.error('TaskBoard received invalid tasks:', tasks);
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 py-12">
        <p>数据加载错误，请刷新页面重试</p>
      </div>
    );
  }

  // Group tasks by artist
  const groupedTasks = tasks.reduce((acc, task) => {
    if (!acc[task.artist]) {
      acc[task.artist] = [];
    }
    acc[task.artist].push(task);
    return acc;
  }, {} as Record<string, VideoTask[]>);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4 py-12">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Camera className="w-8 h-8 opacity-50" />
        </div>
        <p>暂无拍摄计划，点击右上角新建</p>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 pb-12 space-y-6">
      {Object.entries(groupedTasks).map(([artist, artistTasks]) => (
        <div key={artist} className="break-inside-avoid mb-6">
          <div className="flex items-center justify-between bg-background/95 backdrop-blur py-2 border-b border-border mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              {artist}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                {artistTasks.length} 首
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full text-muted-foreground hover:text-primary"
                onClick={() => onAddSong(artist)}
                title="添加歌曲"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {artistTasks.map((task) => {
              const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
              const StatusIcon = status.icon;
              const isSelected = selectedTaskIds.has(task._id);
              
              return (
                <div 
                  key={task._id} 
                  className={cn(
                    "group relative bg-card border rounded-xl p-4 transition-all duration-300",
                    isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:shadow-lg hover:border-primary/20",
                    isSelectionMode && !isSelected && "opacity-60 hover:opacity-100"
                  )}
                  onClick={() => isSelectionMode && onToggleSelection(task._id)}
                >
                  {/* Selection Checkbox Overlay */}
                  {isSelectionMode && (
                    <div className="absolute top-3 right-3 z-20">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-background border-muted-foreground/40"
                      )}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h3 className="font-semibold text-foreground truncate pr-6" title={task.song}>
                      {task.song}
                    </h3>
                    {!isSelectionMode && (
                      <div className={cn("flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded border uppercase tracking-wider whitespace-nowrap", status.color)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {task.snippet && (
                      <div className="relative bg-muted/30 p-3 rounded-lg border border-border/50">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-l-lg"></div>
                        <p className="text-sm text-muted-foreground italic leading-relaxed line-clamp-3 pl-2">
                          "{task.snippet}"
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                        <Camera className="w-3.5 h-3.5" />
                        <span>{ANGLE_LABELS[task.angle] || task.angle}</span>
                      </div>
                      
                      {!isSelectionMode && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-200">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(task);
                            }}
                            title="编辑信息"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              const nextStatusMap: Record<VideoTaskStatus, VideoTaskStatus> = {
                                pending: 'filmed',
                                filmed: 'edited',
                                edited: 'completed',
                                completed: 'pending'
                              };
                              onUpdate(task._id, { status: nextStatusMap[task.status] });
                            }}
                            title="切换状态"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(task._id);
                            }}
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
