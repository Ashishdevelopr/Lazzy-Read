import type { Progress, ReadingSession, GoalStatus } from '@/types';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function computeTargetPage(progress: Progress): number {
  const { startedAt, pagesPerDayGoal } = progress;
  const daysSinceStart = Math.floor((Date.now() - startedAt) / 86400000);
  return Math.max(1, 1 + daysSinceStart * pagesPerDayGoal);
}

export function computeGoalStatus(progress: Progress): GoalStatus {
  if (progress.currentPage <= 1 && progress.startedAt > Date.now() - 3600000) return 'not-started';
  const target = computeTargetPage(progress);
  const diff = progress.currentPage - target;
  if (diff >= 0) return 'ahead';
  if (diff >= -progress.pagesPerDayGoal) return 'on-track';
  return 'behind';
}

export function etaForBook(progress: Progress, pageCount: number): Date | null {
  if (progress.pagesPerDayGoal <= 0) return null;
  const remaining = pageCount - progress.currentPage;
  if (remaining <= 0) return new Date();
  const daysLeft = Math.ceil(remaining / progress.pagesPerDayGoal);
  const eta = new Date();
  eta.setDate(eta.getDate() + daysLeft);
  return eta;
}

export function daysToFinish(progress: Progress, pageCount: number): number {
  if (progress.pagesPerDayGoal <= 0) return Infinity;
  const remaining = pageCount - progress.currentPage;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / progress.pagesPerDayGoal);
}

export function computeStreak(sessions: ReadingSession[]): { current: number; longest: number } {
  if (sessions.length === 0) return { current: 0, longest: 0 };

  const dayMap = new Map<string, number>();
  for (const s of sessions) {
    dayMap.set(s.date, (dayMap.get(s.date) || 0) + s.pagesRead);
  }

  const days = Array.from(dayMap.keys())
    .filter((d) => (dayMap.get(d) || 0) >= 1)
    .sort()
    .reverse();

  if (days.length === 0) return { current: 0, longest: 0 };

  const today = todayStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  let current = 0;
  if (days[0] === today || days[0] === yesterday) {
    current = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
      if (diff === 1) current++;
      else break;
    }
  }

  let longest = 1;
  let run = 1;
  const sortedAsc = [...days].reverse();
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1]);
    const curr = new Date(sortedAsc[i]);
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { current, longest };
}

export function getPagesReadToday(sessions: ReadingSession[]): number {
  const today = todayStr();
  return sessions
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.pagesRead, 0);
}

export function getReadingDayMap(sessions: ReadingSession[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of sessions) {
    map[s.date] = (map[s.date] || 0) + s.pagesRead;
  }
  return map;
}

export class SessionTracker {
  private bookId: string;
  private startPage: number;
  private startTime: number;
  private lastPage: number;

  constructor(bookId: string, startPage: number) {
    this.bookId = bookId;
    this.startPage = startPage;
    this.lastPage = startPage;
    this.startTime = Date.now();
  }

  updatePage(page: number) {
    this.lastPage = Math.max(this.lastPage, page);
  }

  finish(): ReadingSession | null {
    const pagesRead = this.lastPage - this.startPage;
    if (pagesRead <= 0) return null;

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return {
      id: `${this.bookId}-${Date.now()}`,
      bookId: this.bookId,
      date,
      pagesRead,
      startPage: this.startPage,
      endPage: this.lastPage,
      durationMs: Date.now() - this.startTime,
    };
  }
}
