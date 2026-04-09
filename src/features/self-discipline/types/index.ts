export interface WillpowerStatus {
  currentTokens: number;
  lastActionTime: string;
  streakDays: number;
  recoveryRate: number;
  nextTokenIn: number;
  isCoolingDown: boolean;
  lastLog: BehaviorLog | null;
  totalCount: number;
  aiReport: {
    score: number;
    summary: string;
    analysis: string;
    advice: string;
    updatedAt: string;
  } | null;
  guardianId?: number;
  isGuardianView?: boolean;
  wardId?: number | null;
  wardNickname?: string | null;
  wardAvatar?: string | null;
}

export interface BehaviorLog {
  _id: string;
  timestamp: string;
  location: string;
  triggers: string[];
  companion?: string;
  moodPost?: string;
  tokenConsumed: number;
  image?: string;
  note?: string;
  duration?: number;
}

export interface RecordBehaviorDto {
  location: string;
  triggers: string[];
  companion?: string;
  moodPost: string;
  image?: string;
  note?: string;
  duration?: number;
  timestamp?: string;
}
