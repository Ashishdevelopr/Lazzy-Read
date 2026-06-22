'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ring } from '@/components/common/Ring';
import { Modal } from '@/components/common/Modal';
import { deleteBook, saveProgress } from '@/lib/storage/db';
import { addToast } from '@/components/common/Toast';
import { daysToFinish, computeGoalStatus } from '@/lib/goals';
import type { Book, Progress } from '@/types';

interface BookCardProps {
  book: Book;
  progress: Progress | null;
  onDelete: (id: string) => void;
  onGoalUpdated: (bookId: string, goal: number) => void;
}

const statusColors = {
  'on-track': 'text-blue-500',
  'ahead': 'text-green-500',
  'behind': 'text-red-500',
  'not-started': 'text-[var(--muted)]',
};

const statusLabels = {
  'on-track': 'On track',
  'ahead': 'Ahead',
  'behind': 'Behind',
  'not-started': 'Not started',
};

export function BookCard({ book, progress, onDelete, onGoalUpdated }: BookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [goalModal, setGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState(progress?.pagesPerDayGoal?.toString() ?? '10');

  const percent = progress ? Math.min(100, Math.round((progress.currentPage / book.pageCount) * 100)) : 0;
  const status = progress ? computeGoalStatus(progress) : 'not-started';
  const days = progress ? daysToFinish(progress, book.pageCount) : null;

  const handleDelete = async () => {
    setMenuOpen(false);
    await deleteBook(book.id);
    onDelete(book.id);
    addToast(`"${book.title}" removed`, 'info');
  };

  const handleGoalSave = async () => {
    const goal = parseInt(goalInput, 10);
    if (!goal || goal < 1) return;
    if (!progress) return;
    const updated = { ...progress, pagesPerDayGoal: goal };
    await saveProgress(updated);
    onGoalUpdated(book.id, goal);
    setGoalModal(false);
  };

  return (
    <>
      <div className="relative bg-[var(--card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-color)] fade-in group">
        <Link href={`/read?id=${book.id}`} className="block">
          <div className="aspect-[2/3] bg-[var(--surface)] relative overflow-hidden">
            {book.coverDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={book.coverDataUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
                </svg>
              </div>
            )}
            <div className="absolute top-2 right-2">
              <Ring percent={percent} size={36} stroke={4}>
                <span className="text-[9px] font-bold text-white drop-shadow-md">{percent}%</span>
              </Ring>
            </div>
          </div>
        </Link>
        <div className="p-3">
          <Link href={`/read?id=${book.id}`}>
            <h3 className="font-semibold text-sm text-[var(--fg)] line-clamp-2 leading-tight">{book.title}</h3>
            {book.author && <p className="text-xs text-[var(--muted)] mt-0.5 truncate">{book.author}</p>}
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs font-medium ${statusColors[status]}`}>{statusLabels[status]}</span>
            {days !== null && days > 0 && days < Infinity && <span className="text-xs text-[var(--muted)]">{days}d left</span>}
            {days === 0 && <span className="text-xs text-green-500 font-medium">Done!</span>}
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--border-color)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-[var(--muted)] mt-1">{progress?.currentPage ?? 1} / {book.pageCount} pages</p>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); setMenuOpen(true); }}
          className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Book options"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="8" cy="13" r="1.5"/>
          </svg>
        </button>
      </div>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title={book.title}>
        <div className="flex flex-col gap-2">
          <Link href={`/book?id=${book.id}`} onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--surface)] text-[var(--fg)] text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
            Book Details
          </Link>
          <button onClick={() => { setMenuOpen(false); setGoalModal(true); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--surface)] text-[var(--fg)] text-sm text-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
            Edit Goal
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 text-sm text-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>
            </svg>
            Delete Book
          </button>
        </div>
      </Modal>

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
    </>
  );
}
