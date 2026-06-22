'use client';

import type { Book, Progress, ReadingSession } from '@/types';
import { computeStreak, getPagesReadToday } from '@/lib/goals';

interface OverallSummaryProps {
  books: Book[];
  progressMap: Map<string, Progress>;
  sessions: ReadingSession[];
}

export function OverallSummary({ books, progressMap, sessions }: OverallSummaryProps) {
  const { current: streak } = computeStreak(sessions);
  const todayPages = getPagesReadToday(sessions);
  const finished = books.filter((b) => {
    const p = progressMap.get(b.id);
    return p && p.currentPage >= b.pageCount;
  }).length;

  const stats = [
    { label: 'Books', value: books.length, icon: '📚' },
    { label: 'Finished', value: finished, icon: '✅' },
    { label: 'Streak', value: `${streak}d`, icon: '🔥' },
    { label: 'Today', value: `${todayPages}p`, icon: '📖' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="bg-[var(--card)] rounded-xl p-3 text-center border border-[var(--border-color)]">
          <div className="text-xl mb-1">{s.icon}</div>
          <div className="text-lg font-bold text-[var(--fg)]">{s.value}</div>
          <div className="text-xs text-[var(--muted)]">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
