export type IndicLanguage = 'Marathi' | 'Hindi' | 'English' | 'Mixed';

export type PageStatus = 'draft' | 'transcribing' | 'transcribed' | 'reviewed';

export interface NotePage {
  id: string;
  pageNumber: number;
  title: string;
  imageBase64: string; // Data URL or URL
  imageFileName: string;
  text: string;
  status: PageStatus;
  chapterId?: string;
  illegibleCount: number;
  charCount: number;
  wordCount: number;
  ocrLatencyMs?: number;
  ocrTokens?: { input?: number; output?: number };
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  synopsis?: string;
  order: number;
  pageIds: string[];
}

export interface Project {
  id: string;
  title: string;
  author: string;
  subject?: string;
  language: IndicLanguage;
  category: 'textbook' | 'study_notes' | 'monograph' | 'notebook';
  description?: string;
  createdAt: string;
  updatedAt: string;
  pages: NotePage[];
  chapters: Chapter[];
}

export interface UserVaultData {
  version: number;
  exportedAt: string;
  activeProjectId: string;
  projects: Project[];
}
