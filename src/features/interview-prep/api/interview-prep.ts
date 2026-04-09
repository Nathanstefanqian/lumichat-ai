import api from '@/lib/axios';

export interface InterviewTask {
  taskId: string;
  category: string;
  title: string;
  content: string;
  isCompleted: boolean;
  completedAt: string | null;
  reviewHistory: string[];
}

export interface InterviewCompany {
  _id?: string;
  name: string;
  position: string;
  location: string;
  scale: '大厂' | '中厂' | '小厂';
  importance: number;
  interviewDate: string;
  status: 'pending' | 'offered' | 'rejected' | 'completed';
}

export const getInterviewTasks = async (): Promise<InterviewTask[]> => {
  const response = await api.get('/exam-prep/interview/tasks');
  return response as any;
};

export const syncInterviewTasks = async (tasks: Partial<InterviewTask>[]): Promise<any> => {
  const response = await api.post('/exam-prep/interview/tasks/sync', tasks);
  return response;
};

export const getInterviewCompanies = async (): Promise<InterviewCompany[]> => {
  const response = await api.get('/exam-prep/interview/companies');
  return response as any;
};

export const addInterviewCompany = async (company: InterviewCompany): Promise<InterviewCompany> => {
  const response = await api.post('/exam-prep/interview/companies', company);
  return response as any;
};
