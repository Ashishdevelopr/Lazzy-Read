'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getBook, getFile, getProgress, saveProgress, saveBook, getHighlightsForBook, getAllSessions, saveSession } from '@/lib/storage/db';
import { useReaderStore } from '@/store/useReaderStore';
import { FlipBook } from '@/components/reader/FlipBook';
import { ReaderChrome } from '@/components/reader/ReaderChrome';
import { TapZones } from '@/components/reader/TapZones';
import { ToastContainer } from '@/components/common/Toast';
import { SessionTracker } from '@/lib/goals';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { ReadingSession } from '@/types';

export default function ReaderClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get('id') ?? '';

  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const sessionRef = useRef<SessionTracker | null>(null);

  const {
    setCurrentBook,
    setCurrentPage,
    setProgress,
    setHighlights,
    currentPage,
    progress,
    toggleChrome,
    highlighterMode,
  } = useReaderStore();

  useEffect(() => {
    if (!bookId) {
      setError('No book specified');
      setLoading(false);
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const book = await getBook(bookId);
        if (!book) {
          if (mounted) { setError('Book not found. It may have been deleted.'); setLoading(false); }
          return;
        }

        const [file, prog, highlights, sess] = await Promise.all([
          getFile(book.fileKey),
          getProgress(bookId),
          getHighlightsForBook(bookId),
          getAllSessions().then((all) => all.filter((s) => s.bookId === bookId)),
        ]);

        if (!file) {
          if (mounted) { setError('Book file not found in storage.'); setLoading(false); }
          return;
        }

        const { loadPdfFromBlob } = await import('@/lib/pdf/loadPdf');
        const loadedPdf = await loadPdfFromBlob(file);

        if (!mounted) return;

        const currentProg = prog ?? {
          bookId,
          currentPage: 1,
          pagesPerDayGoal: 10,
          startedAt: Date.now(),
          bookmarks: [],
        };

        setCurrentBook(book);
        setCurrentPage(currentProg.currentPage);
        setProgress(currentProg);
        setHighlights(highlights);
        setPdf(loadedPdf);
        setSessions(sess);
        setLoading(false);

        await saveBook({ ...book, lastOpenedAt: Date.now() });
        sessionRef.current = new SessionTracker(bookId, currentProg.currentPage);
      } catch (err) {
        console.error(err);
        if (mounted) { setError('Failed to load the book. Please try again.'); setLoading(false); }
      }
    };
    load();
    return () => { mounted = false; };
  }, [bookId, setCurrentBook, setCurrentPage, setProgress, setHighlights]);

  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        const session = sessionRef.current.finish();
        if (session) saveSession(session).catch(console.error);
      }
    };
  }, []);

  const handlePageChange = useCallback(async (page: number) => {
    setCurrentPage(page);
    sessionRef.current?.updatePage(page);

    if (progress) {
      const updated = { ...progress, currentPage: Math.max(page, progress.currentPage) };
      setProgress(updated);
      await saveProgress(updated);
    }
  }, [progress, setCurrentPage, setProgress]);

  const goToPage = useCallback((page: number) => {
    if (!pdf) return;
    const clamped = Math.max(1, Math.min(pdf.numPages, page));
    handlePageChange(clamped);
  }, [pdf, handlePageChange]);

  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);
  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);

  if (loading) {
    return (
      <div className="reader-container flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted)]">Loading book…</p>
        </div>
      </div>
    );
  }

  if (error || !pdf) {
    return (
      <div className="reader-container flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--fg)] mb-2">Oops!</p>
          <p className="text-sm text-[var(--muted)] mb-6">{error ?? 'Could not load PDF'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] font-semibold text-sm"
          >
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-container">
      <FlipBook
        pdf={pdf}
        bookId={bookId}
        onPageChange={handlePageChange}
      />

      {!highlighterMode && (
        <TapZones
          onPrev={goPrev}
          onNext={goNext}
          onToggleChrome={toggleChrome}
        />
      )}

      <ReaderChrome
        onPrev={goPrev}
        onNext={goNext}
        onJump={goToPage}
        sessions={sessions}
      />

      <ToastContainer />
    </div>
  );
}
