import { useState, useEffect, useCallback } from 'react';
import { 
  getInterviewTasks, 
  syncInterviewTasks, 
  getInterviewCompanies, 
  addInterviewCompany,
  type InterviewTask,
  type InterviewCompany 
} from '../api/interview-prep';
import dayjs from 'dayjs';

export const useInterviewPrep = () => {
  const [tasks, setTasks] = useState<InterviewTask[]>([]);
  const [companies, setCompanies] = useState<InterviewCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksData, companiesData] = await Promise.all([
        getInterviewTasks(),
        getInterviewCompanies()
      ]);
      setTasks(tasksData);
      setCompanies(companiesData);
    } catch (error) {
      console.error('Failed to fetch interview prep data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleTask = useCallback(async (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.taskId === taskId 
        ? { ...t, isCompleted: !t.isCompleted, completedAt: !t.isCompleted ? new Date().toISOString() : null } 
        : t
    ));
    // 立即同步到后端
    const task = tasks.find(t => t.taskId === taskId);
    if (task) {
      await syncInterviewTasks([{ 
        taskId, 
        isCompleted: !task.isCompleted, 
        completedAt: !task.isCompleted ? new Date().toISOString() : null 
      }]);
    }
  }, [tasks]);

  const addCompany = async (company: InterviewCompany) => {
    const newCompany = await addInterviewCompany(company);
    setCompanies(prev => [...prev, newCompany].sort((a, b) => 
      dayjs(a.interviewDate).diff(dayjs(b.interviewDate))
    ));
    return newCompany;
  };

  return {
    tasks,
    companies,
    loading,
    saving,
    toggleTask,
    addCompany,
    refresh: fetchData
  };
};
