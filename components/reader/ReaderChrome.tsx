'use client';

import Link from 'next/link';
import { useReaderStore } from '@/store/useReaderStore';
import { PageScrubber } from './PageScrubber';
import { GoalProgressBadge } from './GoalProgressBadge';
import type { ReadingSession } from '@/types';

interface ReaderChromeProps {
  onPrev: () => void;
  onNext: () => void;
  onJump: (page: number) => void;
  sessions: ReadingSession[];
}

export function ReaderChrome({ onPrev, onNext, onJump, sessions }: ReaderChromeProps) {
  const { currentBook, currentPage, progress, chromeVisible, highlighterMode, setHighlighterMode } =
    useReaderStore();

  if (!currentBook) return null;

  return (
    <>
      <div className={`absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 py-3 bg-gradient-to-b from-black/60 to-transparent transition-all duration-300 ${
        chromeVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <Link href="/" className="p-2 rounded-full bg-black/30 text-white" aria-label="Back to library">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate leading-tight">{currentBook.title}</p>
          <p className="text-white/60 text-xs">Page {currentPage} of {currentBook.pageCount}</p>
        </div>
        <GoalProgressBadge progress={progress} sessions={sessions} />
        <button
          onClick={() => setHighlighterMode(!highlighterMode)}
          className={`p-2 rounded-full transition-colors ${
            highlighterMode ? 'bg-yellow-400 text-black' : 'bg-black/30 text-white'
          }`}
          aria-label="Toggle highlighter"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <Link href={`/book?id=${currentBook.id}`} className="p-2 rounded-full bg-black/30 text-white" aria-label="Book details">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
          </svg>
        </Link>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black/60 to-transparent pb-safe transition-all duration-300 ${
        chromeVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="flex items-center px-3 py-2 gap-2">
          <button onClick={onPrev} disabled={currentPage <= 1} className="p-2 rounded-full bg-black/30 text-white disabled:opacity-30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div className="flex-1 relative">
            <PageScrubber currentPage={currentPage} pageCount={currentBook.pageCount} onJump={onJump} />
          </div>
          <button onClick={onNext} disabled={currentPage >= currentBook.pageCount} className="p-2 rounded-full bg-black/30 text-white disabled:opacity-30">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
