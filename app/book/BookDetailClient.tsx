'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBook, getProgress, saveProgress, getHighlightsForBook, getSessionsForBook, deleteHighlight } from '@/lib/storage/db';
import { addToast, ToastContainer } from '@/components/common/Toast';
import { Modal } from '@/components/common/Modal';
import { Ring } from '@/components/common/Ring';
import { etaForBook, computeGoalStatus, computeStreak, getPagesReadToday, computeTargetPage } from '@/lib/goals';
import type { Book, Progress, Highlight, ReadingSession } from '@/types';

const statusLabels = {
  'on-track': '🔵 On track',
  'ahead': '🟢 Ahead',
  'behind': '🔴 Behind',
  'not-started': '⚪ Not started',
};

export default function BookDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('id') ?? '';

  const [book, setBook] = useState<Book | null>(null);
  const [progress, setProgressState] = useState<Progress | null>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    if (!bookId) { router.push('/'); return; }
    const load = async () => {
      const [bk, prog, hl, sess] = await Promise.all([
        getBook(bookId),
        getProgress(bookId),
        getHighlightsForBook(bookId),
        getSessionsForBook(bookId),
      ]);
      if (!bk) { router.push('/'); return; }
      setBook(bk);
      setProgressState(prog);
      setHighlights(hl);
      setSessions(sess);
      setGoalInput(String(prog?.pagesPerDayGoal ?? 10));
      setLoading(false);
    };
    load();
  }, [bookId, router]);

  const handleGoalSave = async () => {
    const goal = parseInt(goalInput, 10);
    if (!goal || goal < 1 || !progress) return;
    const updated = { ...progress, pagesPerDayGoal: goal };
    await saveProgress(updated);
    setProgressState(updated);
    setGoalModal(false);
    addToast('Goal updated!', 'success');
  };

  const handleDeleteHighlight = async (id: string) => {
    await deleteHighlight(id);
    setHighlights((prev) => prev.filter((h) => h.id !== id));
    addToast('Highlight removed', 'info');
  };

  if (loading || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pct = progress ? Math.min(100, Math.round((progress.currentPage / book.pageCount) * 100)) : 0;
  const status = progress ? computeGoalStatus(progress) : 'not-started';
  const eta = progress ? etaForBook(progress, book.pageCount) : null;
  const { current: streak } = computeStreak(sessions);
  const todayPages = getPagesReadToday(sessions);
  const targetPage = progress ? computeTargetPage(progress) : 1;

  const groupedHighlights = highlights.reduce<Record<number, Highlight[]>>((acc, h) => {
    if (!acc[h.page]) acc[h.page] = [];
    acc[h.page].push(h);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--muted)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[var(--fg)] truncate">{book.title}</h1>
          {book.author && <p className="text-xs text-[var(--muted)]">{book.author}</p>}
        </div>
        <Link
          href={`/read?id=${book.id}`}
          className="px-4 py-2 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold"
        >
          Read
        </Link>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)]">
          <div className="flex items-center gap-4">
            <Ring percent={pct} size={72} stroke={6}>
              <span className="text-sm font-bold text-[var(--fg)]">{pct}%</span>
            </Ring>
            <div className="flex-1">
              <p className="text-xl font-bold text-[var(--fg)]">{progress?.currentPage ?? 1} <span className="text-sm font-normal text-[var(--muted)]">/ {book.pageCount} pages</span></p>
              <p className="text-sm text-[var(--muted)] mt-0.5">{statusLabels[status]}</p>
              {eta && eta > new Date() && (
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  ETA: {eta.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-[var(--fg)]">Reading Goal</h2>
            <button onClick={() => setGoalModal(true)} className="text-xs text-[var(--accent)] font-medium">Edit</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--fg)]">{progress?.pagesPerDayGoal ?? 10}</p>
              <p className="text-xs text-[var(--muted)]">pages/day</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--fg)]">{todayPages}</p>
              <p className="text-xs text-[var(--muted)]">today</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-[var(--fg)]">{streak}</p>
              <p className="text-xs text-[var(--muted)]">day streak</p>
            </div>
          </div>
          {progress && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                <span>Today&apos;s target: page {targetPage}</span>
                <span>{todayPages}/{progress.pagesPerDayGoal} pages</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${Math.min(100, (todayPages / progress.pagesPerDayGoal) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border-color)]">
          <div className="px-4 py-3 border-b border-[var(--border-color)]">
            <h2 className="font-semibold text-sm text-[var(--fg)]">Highlights ({highlights.length})</h2>
          </div>
          {highlights.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-[var(--muted)]">No highlights yet. Tap the highlighter in the reader to annotate.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {Object.entries(groupedHighlights).map(([page, hs]) => (
                <div key={page} className="px-4 py-3">
                  <p className="text-xs font-semibold text-[var(--muted)] mb-2">Page {page}</p>
                  {hs.map((h) => (
                    <div key={h.id} className="flex items-start gap-3 mb-2">
                      <Link href={`/read?id=${book.id}&page=${h.page}`} className="flex-1">
                        <div className="rounded-lg p-2 text-sm" style={{ backgroundColor: { yellow: '#fef9c3', green: '#dcfce7', blue: '#dbeafe', pink: '#fce7f3' }[h.color] }}>
                          {h.note ? <p className="text-[var(--fg)]">{h.note}</p> : <p className="text-[var(--muted)] italic text-xs">Rectangle highlight — tap to view</p>}
                        </div>
                      </Link>
                      <button onClick={() => handleDeleteHighlight(h.id)} className="p-1 text-[var(--muted)] hover:text-red-500">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal open={goalModal} onClose={() => setGoalModal(false)} title="Daily Reading Goal">
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-[var(--muted)] block mb-2">Pages per day</label>
            <input type="number" min="1" max="500" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-[var(--fg)] text-base" />
          </div>
          <button onClick={handleGoalSave} className="w-full py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-sm">Save Goal</button>
        </div>
      </Modal>

      <ToastContainer />
    </div>
  );
}
