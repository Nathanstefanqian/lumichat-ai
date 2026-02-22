import { useEffect, useState } from 'react';
import { Plus, Sparkles, Trash2, CheckSquare, XSquare } from 'lucide-react';
import type { VideoTask } from '../types';
import { videoTaskApi } from '../api';
import { TaskBoard } from './task-board';
import { AddTaskModal } from './add-task-modal';
import { EditTaskModal } from './edit-task-modal';
import { AutoGenerateModal } from './auto-generate-modal';
import { Button } from '@/components/ui/button';

export function VideoPlannerPage() {
  const [tasks, setTasks] = useState<VideoTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<VideoTask | null>(null);
  const [defaultArtist, setDefaultArtist] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Selection state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  const fetchTasks = async () => {
    try {
      const data = await videoTaskApi.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleTaskCreated = () => {
    fetchTasks();
    setIsModalOpen(false);
    setDefaultArtist(undefined);
  };

  const handleCloseAddModal = () => {
    setIsModalOpen(false);
    setDefaultArtist(undefined);
  };

  const handleTaskUpdated = async (id: string, updates: Partial<VideoTask>) => {
    try {
      await videoTaskApi.update(id, updates);
      fetchTasks();
    } catch (error) {
      console.error('Failed to update task', error);
    }
  };

  const handleTaskDeleted = async (id: string) => {
    try {
      await videoTaskApi.delete(id);
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  };

  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      await videoTaskApi.generateAuto();
      fetchTasks();
      setIsAutoGenerateOpen(false);
    } catch (error) {
      console.error('Failed to auto generate tasks', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedTaskIds.size === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedTaskIds.size} 个任务吗？`)) return;

    try {
      await videoTaskApi.deleteBatch(Array.from(selectedTaskIds));
      setSelectedTaskIds(new Set());
      setIsSelectionMode(false);
      fetchTasks();
    } catch (error) {
      console.error('Failed to batch delete tasks', error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('确定要清空所有任务吗？此操作不可恢复！')) return;
    
    try {
      await videoTaskApi.deleteAll();
      fetchTasks();
    } catch (error) {
      console.error('Failed to delete all tasks', error);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedTaskIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTaskIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedTaskIds.size === tasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(tasks.map(t => t._id)));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 border-b border-border gap-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">音乐视频制作清单</h1>
        
        {isSelectionMode ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <span className="text-sm text-muted-foreground mr-2 whitespace-nowrap">
              已选 {selectedTaskIds.size} 项
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              className="gap-2 whitespace-nowrap"
            >
              <CheckSquare className="w-4 h-4" />
              {selectedTaskIds.size === tasks.length ? '取消全选' : '全选'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedTaskIds.size === 0}
              className="gap-2 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              删除选中
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsSelectionMode(false);
                setSelectedTaskIds(new Set());
              }}
              className="gap-2 whitespace-nowrap"
            >
              <XSquare className="w-4 h-4" />
              退出选择
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
             <Button
              variant="ghost"
              onClick={() => setIsSelectionMode(true)}
              className="gap-2 text-muted-foreground hover:text-foreground whitespace-nowrap"
            >
              <CheckSquare className="w-4 h-4" />
              批量管理
            </Button>
            <Button
              variant="ghost"
              onClick={handleDeleteAll}
              className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              清空
            </Button>
            <div className="w-px h-6 bg-border mx-2 hidden md:block"></div>
            <Button
              variant="outline"
              onClick={() => setIsAutoGenerateOpen(true)}
              className="gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              AI 生成
            </Button>
            <button
              onClick={() => {
                setDefaultArtist(undefined);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap ml-auto md:ml-0"
            >
              <Plus className="w-4 h-4" />
              新建企划
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6 scrollbar-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            加载中...
          </div>
        ) : (
          <TaskBoard 
            tasks={tasks} 
            onUpdate={handleTaskUpdated}
            onDelete={handleTaskDeleted}
            onEdit={setEditingTask}
            onAddSong={(artist: string) => {
              setDefaultArtist(artist);
              setIsModalOpen(true);
            }}
            isSelectionMode={isSelectionMode}
            selectedTaskIds={selectedTaskIds}
            onToggleSelection={toggleSelection}
          />
        )}
      </div>

      {isModalOpen && (
        <AddTaskModal 
          isOpen={isModalOpen} 
          onClose={handleCloseAddModal} 
          onSuccess={handleTaskCreated}
          defaultArtist={defaultArtist}
        />
      )}

      {editingTask && (
        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={() => {
            fetchTasks();
            setEditingTask(null);
          }}
          task={editingTask}
        />
      )}

      <AutoGenerateModal
        isOpen={isAutoGenerateOpen}
        onClose={() => setIsAutoGenerateOpen(false)}
        onConfirm={handleAutoGenerate}
        isLoading={isGenerating}
      />
    </div>
  );
}
