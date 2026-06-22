'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllBooks, getProgress, getAllSessions } from '@/lib/storage/db';
import { BookCard } from '@/components/library/BookCard';
import { AddBookDropzone } from '@/components/library/AddBookDropzone';
import { OverallSummary } from '@/components/library/OverallSummary';
import { ToastContainer } from '@/components/common/Toast';
import type { Book, Progress, ReadingSession } from '@/types';

export default function LibraryPage() {
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

  const handleBookAdded = (book: Book) => {
    setBooks((prev) => [book, ...prev]);
    setProgressMap((prev) => {
      const next = new Map(prev);
      next.set(book.id, { bookId: book.id, currentPage: 1, pagesPerDayGoal: 10, startedAt: Date.now(), bookmarks: [] });
      return next;
    });
  };

  const handleDelete = (id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
    setProgressMap((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleGoalUpdated = (bookId: string, goal: number) => {
    setProgressMap((prev) => {
      const next = new Map(prev);
      const p = prev.get(bookId);
      if (p) next.set(bookId, { ...p, pagesPerDayGoal: goal });
      return next;
    });
  };

  return (
    <div className="min-h-full bg-[var(--bg)] pb-24">
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--border-color)] px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--fg)]">PagePace</h1>
          <p className="text-xs text-[var(--muted)]">Your reading library</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/stats" className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--muted)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </Link>
          <Link href="/settings" className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--muted)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </Link>
        </div>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {books.length > 0 && (
              <div className="mb-6">
                <OverallSummary books={books} progressMap={progressMap} sessions={sessions} />
              </div>
            )}

            <div className="mb-4">
              <AddBookDropzone onBookAdded={handleBookAdded} />
            </div>

            {books.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📚</div>
                <h2 className="text-lg font-semibold text-[var(--fg)] mb-2">No books yet</h2>
                <p className="text-sm text-[var(--muted)]">Upload a PDF above to get started</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">
                    Your Books ({books.length})
                  </h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {books.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      progress={progressMap.get(book.id) ?? null}
                      onDelete={handleDelete}
                      onGoalUpdated={handleGoalUpdated}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <ToastContainer />
    </div>
  );
}
