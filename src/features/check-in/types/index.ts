export interface CheckInRecord {
  _id: string; // MongoDB 使用 _id
  userId: string;
  type: 'word' | 'training' | 'correction';
  imageUrls: string[];
  promptImageUrls?: string[]; // 题目/原文图片
  imageUrl?: string; // 兼容旧数据
  content?: string;
  paperId?: string;
  section?: string;
  totalQuestions?: number;
  correctQuestions?: number;
  score?: number;
  pointsEarned: number;
  encouragement: string;
  createdAt: string;
  essayResult?: {
    score15: number;
    score710: number;
    grade: string;
    comments: string;
    grammarFixes: Array<{
      original: string;
      corrected: string;
      explanation: string;
    }>;
    polishedEssay: string;
  };
}

export interface CheckInReward {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  weekNum: number;
  year: number;
  isActive: boolean;
}

export interface CheckInStats {
  totalDays: number;
  currentPoints: number;
  consecutiveDays: number;
}
