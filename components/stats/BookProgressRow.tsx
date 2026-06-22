'use client';

import Link from 'next/link';
import type { Book, Progress } from '@/types';
import { etaForBook } from '@/lib/goals';

interface BookProgressRowProps {
  book: Book;
  progress: Progress | null;
}

export function BookProgressRow({ book, progress }: BookProgressRowProps) {
  const pct = progress ? Math.min(100, Math.round((progress.currentPage / book.pageCount) * 100)) : 0;
  const eta = progress ? etaForBook(progress, book.pageCount) : null;
  const etaStr = eta && eta > new Date()
    ? eta.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : pct >= 100 ? 'Finished!' : 'Set a goal';

  return (
    <Link href={`/book?id=${book.id}`} className="flex items-center gap-3 py-2">
      <div className="w-10 h-14 rounded-lg bg-[var(--surface)] overflow-hidden shrink-0">
        {book.coverDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverDataUrl} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--fg)] truncate">{book.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-[var(--muted)] shrink-0">{pct}%</span>
        </div>
        <p className="text-xs text-[var(--muted)] mt-0.5">ETA: {etaStr}</p>
      </div>
    </Link>
  );
}
