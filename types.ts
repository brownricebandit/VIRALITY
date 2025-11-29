export interface SocialCaption {
  platform: string;
  title?: string;
  caption: string;
  hashtags: string[];
  strategy: string;
  maxLength?: number;
}

export interface AnalysisResult {
  transcriptSummary: string;
  keywords: string[];
  captions: SocialCaption[];
  audienceAnalysis: string;
}

export interface VideoFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'queued' | 'analyzing' | 'complete' | 'error';
  analysis?: AnalysisResult;
  error?: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  READING = 'READING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}