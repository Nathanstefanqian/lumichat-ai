import { useState, useEffect, useCallback } from 'react';
import { getExamTasks, updateExamTasks, type ExamTask } from '../api/exam-prep';

export const useExamTasks = () => {
  const [tasks, setTasks] = useState<ExamTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [reviewedTaskIds, setReviewedTaskIds] = useState<Set<string>>(new Set());

  const fetchTasks = async () => {
    try {
      const data = await getExamTasks();
      setTasks(data);
      setHasChanges(false);
      setReviewedTaskIds(new Set());
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTask = useCallback((taskId: string, type: 'interview' | 'written' | 'english') => {
    setTasks(prev => {
      const existing = prev.find(t => t.taskId === taskId);
      if (existing) {
        return prev.map(t => t.taskId === taskId ? { ...t, isCompleted: !t.isCompleted } : t);
      }
      return [...prev, { taskId, type, isCompleted: true }];
    });
    setHasChanges(true);
  }, []);

  const toggleReviewed = useCallback((taskId: string) => {
    setReviewedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
    setHasChanges(true);
  }, []);

  const saveTasks = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      const tasksToUpdate = tasks.map(t => ({
        taskId: t.taskId,
        type: t.type,
        isCompleted: t.isCompleted,
        isReviewing: reviewedTaskIds.has(t.taskId)
      }));
      await updateExamTasks(tasksToUpdate);
      setHasChanges(false);
      setReviewedTaskIds(new Set());
      await fetchTasks(); // 刷新以获取最新的 completedAt
    } catch (error) {
      console.error('Failed to save tasks:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return { tasks, loading, saving, hasChanges, reviewedTaskIds, toggleTask, toggleReviewed, saveTasks, refresh: fetchTasks };
};
