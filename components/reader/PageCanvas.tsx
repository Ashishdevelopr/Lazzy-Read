'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPageToBitmap, getCachedBitmap } from '@/lib/pdf/renderPage';

interface PageCanvasProps {
  pdf: PDFDocumentProxy;
  pageNum: number;
  scale: number;
  bookId: string;
  onDimensions?: (w: number, h: number) => void;
}

export function PageCanvas({ pdf, pageNum, scale, bookId, onDimensions }: PageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderRef = useRef<{ page: number; scale: number } | null>(null);

  const render = useCallback(async () => {
    if (!canvasRef.current) return;
    const cached = getCachedBitmap(bookId, pageNum, scale);
    let bitmap = cached;

    if (!bitmap) {
      bitmap = await renderPageToBitmap(pdf, pageNum, scale, bookId);
    }

    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    canvasRef.current.width = bitmap.width;
    canvasRef.current.height = bitmap.height;
    ctx.drawImage(bitmap, 0, 0);

    if (onDimensions) onDimensions(bitmap.width, bitmap.height);
    renderRef.current = { page: pageNum, scale };
  }, [pdf, pageNum, scale, bookId, onDimensions]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full max-h-full"
      style={{ display: 'block', touchAction: 'none' }}
    />
  );
}
