export enum CommentRiskLevel {
  SAFE = 'SAFE',
  SPAM = 'SPAM',
  TOXIC = 'TOXIC',
  INAPPROPRIATE = 'INAPPROPRIATE',
  HATE_SPEECH = 'HATE_SPEECH',
  SEXUAL = 'SEXUAL',
  RACISM = 'RACISM',
  HARASSMENT = 'HARASSMENT',
  VIOLENCE = 'VIOLENCE',
  SELF_HARM = 'SELF_HARM',
  PROFANITY = 'PROFANITY',
  NEGATIVITY = 'NEGATIVITY'
}

export interface ModerationResult {
  riskLevel: CommentRiskLevel;
  confidenceScore: number;
  explanation: string;
  suggestedAction: 'APPROVE' | 'HIDE';
}

export interface DemoComment {
  id: string;
  author: string;
  text: string;
  avatarUrl: string;
  timestamp: string;
}

export type PolicyType = 'Profanity' | 'Sexual Content' | 'Hate speech' | 'Self harm' | 'Violence' | 'Negativity' | 'Harassment' | 'Spam' | 'General';

export interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface ModeratedCommentLog {
  id: string;
  author: string;
  text: string;
  riskLevel: CommentRiskLevel;
  timestamp: string;
  actionTaken: string;
  commenter_id?: string;
}