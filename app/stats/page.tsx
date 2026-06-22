'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllBooks, getAllSessions, getProgress } from '@/lib/storage/db';
import { CalendarHeatmap } from '@/components/stats/CalendarHeatmap';
import { StreakCard } from '@/components/stats/StreakCard';
import { BookProgressRow } from '@/components/stats/BookProgressRow';
import { computeStreak, getReadingDayMap } from '@/lib/goals';
import type { Book, Progress, ReadingSession } from '@/types';

export default function StatsPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, Progress>>(new Map());
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [bks, sess] = await Promise.all([getAllBooks(), getAllSessions()]);
      const map = new Map<string, Progress>();
      await Promise.all(bks.map(async (b) => {
        const p = await getProgress(b.id);
        if (p) map.set(b.id, p);
      }));
      setBooks(bks);
      setProgressMap(map);
      setSessions(sess);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { current: streak, longest } = computeStreak(sessions);
  const dayMap = getReadingDayMap(sessions);
  const totalPages = sessions.reduce((s, r) => s + r.pagesRead, 0);
  const readingDays = Object.values(dayMap).filter((n) => n > 0).length;
  const avgPerDay = readingDays > 0 ? totalPages / readingDays : 0;
  const finishedBooks = books.filter((b) => {
    const p = progressMap.get(b.id);
    return p && p.currentPage >= b.pageCount;
  }).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--muted)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-[var(--fg)]">Reading Stats</h1>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-6">
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-lg font-semibold text-[var(--fg)] mb-2">No stats yet</h2>
            <p className="text-sm text-[var(--muted)]">Start reading to see your stats here</p>
          </div>
        ) : (
          <>
            <StreakCard current={streak} longest={longest} totalPages={totalPages} totalBooks={finishedBooks} avgPagesPerDay={avgPerDay} />
            <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)]">
              <h2 className="font-semibold text-sm text-[var(--fg)] mb-4">Reading Activity</h2>
              <CalendarHeatmap dayMap={dayMap} />
              <div className="flex items-center gap-2 mt-3 text-xs text-[var(--muted)]">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`heatmap-cell ${['bg-[var(--border-color)]', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'][i]}`} />
                ))}
                <span>More</span>
              </div>
            </div>
            {books.length > 0 && (
              <div className="bg-[var(--card)] rounded-2xl border border-[var(--border-color)]">
                <div className="px-4 py-3 border-b border-[var(--border-color)]">
                  <h2 className="font-semibold text-sm text-[var(--fg)]">Book Progress</h2>
                </div>
                <div className="px-4 divide-y divide-[var(--border-color)]">
                  {books.map((b) => (
                    <BookProgressRow key={b.id} book={b} progress={progressMap.get(b.id) ?? null} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
