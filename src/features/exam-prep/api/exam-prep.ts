import api from '@/lib/axios';

export interface ExamTask {
  taskId: string;
  type: 'interview' | 'written' | 'english';
  isCompleted: boolean;
  completedAt?: string;
}

export const getExamTasks = async (): Promise<ExamTask[]> => {
  return await api.get('/exam-prep/tasks');
};

export const updateExamTasks = async (tasks: {
  taskId: string;
  type: 'interview' | 'written' | 'english';
  isCompleted: boolean;
  isReviewing?: boolean;
}[]): Promise<any> => {
  return await api.post('/exam-prep/update', tasks);
};

export const getExamStats = async () => {
  return await api.get('/exam-prep/stats');
};
