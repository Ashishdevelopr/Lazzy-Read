'use client';

import { useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveBook, saveFile, saveProgress } from '@/lib/storage/db';
import { addToast } from '@/components/common/Toast';
import type { Book } from '@/types';

interface AddBookDropzoneProps {
  onBookAdded: (book: Book) => void;
}

const MAX_SIZE_WARN = 50 * 1024 * 1024;

export function AddBookDropzone({ onBookAdded }: AddBookDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.pdf') && file.type !== 'application/pdf') {
      addToast('Please upload a PDF file', 'error');
      return;
    }
    if (file.size > MAX_SIZE_WARN) {
      addToast(`Large file (${(file.size / 1024 / 1024).toFixed(0)}MB) may hit storage limits`, 'warning');
    }

    setLoading(true);
    try {
      const { loadPdfFromBlob, extractMeta } = await import('@/lib/pdf/loadPdf');
      const { makeThumbnail } = await import('@/lib/pdf/renderPage');

      const pdf = await loadPdfFromBlob(file);
      const meta = await extractMeta(pdf);
      const pageCount = pdf.numPages;
      const coverDataUrl = await makeThumbnail(pdf);

      const id = uuidv4();
      const fileKey = `file-${id}`;

      const title = meta.title?.trim() || file.name.replace(/\.pdf$/i, '');
      const book: Book = {
        id,
        title,
        author: meta.author?.trim() || undefined,
        pageCount,
        coverDataUrl,
        fileKey,
        addedAt: Date.now(),
      };

      await saveFile(fileKey, file);
      await saveBook(book);
      await saveProgress({
        bookId: id,
        currentPage: 1,
        pagesPerDayGoal: 10,
        startedAt: Date.now(),
        bookmarks: [],
      });

      onBookAdded(book);
      addToast(`"${title}" added!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to load PDF. Please try another file.', 'error');
    } finally {
      setLoading(false);
    }
  }, [onBookAdded]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all select-none ${
        dragging ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]' : 'border-[var(--border-color)] hover:border-[var(--accent)] hover:bg-[var(--surface)]'
      } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" onChange={onFileChange} className="hidden" />
      {loading ? (
        <>
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[var(--muted)]">Processing PDF…</p>
        </>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7-7 7 7"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="font-medium text-sm text-[var(--fg)]">Drop a PDF here</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">or tap to browse</p>
          </div>
        </>
      )}
    </div>
  );
}
