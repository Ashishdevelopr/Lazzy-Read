'use client';

interface StreakCardProps {
  current: number;
  longest: number;
  totalPages: number;
  totalBooks: number;
  avgPagesPerDay: number;
}

export function StreakCard({ current, longest, totalPages, totalBooks, avgPagesPerDay }: StreakCardProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)]">
        <div className="text-3xl mb-1">🔥</div>
        <div className="text-2xl font-bold text-[var(--fg)]">{current}</div>
        <div className="text-xs text-[var(--muted)]">Current streak</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">Best: {longest} days</div>
      </div>
      <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)]">
        <div className="text-3xl mb-1">📖</div>
        <div className="text-2xl font-bold text-[var(--fg)]">{totalPages.toLocaleString()}</div>
        <div className="text-xs text-[var(--muted)]">Pages read</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">{avgPagesPerDay.toFixed(1)}/day avg</div>
      </div>
      <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)] col-span-2">
        <div className="text-3xl mb-1">✅</div>
        <div className="text-2xl font-bold text-[var(--fg)]">{totalBooks}</div>
        <div className="text-xs text-[var(--muted)]">Books finished</div>
      </div>
    </div>
  );
}
