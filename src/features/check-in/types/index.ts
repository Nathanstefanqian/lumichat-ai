export interface CheckInRecord {
  id: string;
  userId: string;
  type: string;
  imageUrl: string;
  content?: string;
  pointsEarned: number;
  encouragement: string;
  createdAt: string;
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
