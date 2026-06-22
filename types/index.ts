export type Book = {
  id: string;
  title: string;
  author?: string;
  pageCount: number;
  coverDataUrl?: string;
  fileKey: string;
  addedAt: number;
  lastOpenedAt?: number;
};

export type Progress = {
  bookId: string;
  currentPage: number;
  pagesPerDayGoal: number;
  startedAt: number;
  bookmarks: number[];
};

export type Highlight = {
  id: string;
  bookId: string;
  page: number;
  rect: { x: number; y: number; w: number; h: number };
  color: 'yellow' | 'green' | 'blue' | 'pink';
  note?: string;
  createdAt: number;
};

export type ReadingSession = {
  id: string;
  bookId: string;
  date: string;
  pagesRead: number;
  startPage: number;
  endPage: number;
  durationMs: number;
};

export type Settings = {
  theme: 'light' | 'sepia' | 'dark' | 'night';
  flipSound: boolean;
  doublePageOnLandscape: boolean;
  brightness: number;
  syncEnabled: boolean;
};

export type GoalStatus = 'on-track' | 'ahead' | 'behind' | 'not-started';
