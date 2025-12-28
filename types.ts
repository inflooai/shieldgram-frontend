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
  SELF_HARM = 'SELF_HARM'
}

export interface ModerationResult {
  riskLevel: CommentRiskLevel;
  confidenceScore: number;
  explanation: string;
  suggestedAction: 'APPROVE' | 'HIDE' | 'DELETE' | 'REPORT';
}

export interface DemoComment {
  id: string;
  author: string;
  text: string;
  avatarUrl: string;
  timestamp: string;
}

export type PolicyType = 'Spam' | 'Hate speech' | 'Sexual Content' | 'Harrassment' | 'Violence' | 'Self harm';

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
}