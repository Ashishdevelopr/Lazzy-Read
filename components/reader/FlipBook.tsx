'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useReaderStore } from '@/store/useReaderStore';
import { PageCanvas } from './PageCanvas';
import { HighlighterLayer } from './HighlighterLayer';
import { HighlightPopover } from './HighlightPopover';
import { BrightnessOverlay } from './BrightnessOverlay';
import type { Highlight } from '@/types';
import { renderPageToBitmap } from '@/lib/pdf/renderPage';

interface FlipBookProps {
  pdf: PDFDocumentProxy;
  bookId: string;
  onPageChange?: (page: number) => void;
}

const BUFFER = 2;

export function FlipBook({ pdf, bookId, onPageChange }: FlipBookProps) {
  void onPageChange;
  const { currentPage, highlights, settings, zoom, setZoom } = useReaderStore();
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const [pageDims, setPageDims] = useState<{ w: number; h: number } | null>(null);
  const [selectedHighlight, setSelectedHighlight] = useState<Highlight | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const isPinching = useRef(false);
  const lastDist = useRef(0);
  const lastPan = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const estimatedPageWidth = 595;
      const estimatedPageHeight = 842;
      const sx = clientWidth / estimatedPageWidth;
      const sy = clientHeight / estimatedPageHeight;
      const baseScale = Math.min(sx, sy, 1.5);
      setScale(baseScale > 0 ? baseScale : 1);
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const renderBuffer = async () => {
      const from = Math.max(1, currentPage - BUFFER);
      const to = Math.min(pdf.numPages, currentPage + BUFFER);
      for (let i = from; i <= to; i++) {
        renderPageToBitmap(pdf, i, scale * zoom, bookId).catch(() => {});
      }
    };
    if (scale > 0) renderBuffer();
  }, [currentPage, scale, zoom, pdf, bookId]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      isPinching.current = true;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && zoomRef.current > 1) {
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && isPinching.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = dist / lastDist.current;
      lastDist.current = dist;
      const newZoom = Math.max(1, Math.min(4, zoomRef.current * delta));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && zoomRef.current > 1) {
      const dx = e.touches[0].clientX - lastPan.current.x;
      const dy = e.touches[0].clientY - lastPan.current.y;
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  }, [setZoom]);

  const handleTouchEnd = useCallback(() => {
    isPinching.current = false;
    if (zoomRef.current <= 1) setPanOffset({ x: 0, y: 0 });
  }, []);

  const lastTap = useRef(0);
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      const newZoom = zoomRef.current > 1 ? 1 : 2;
      setZoom(newZoom);
      setPanOffset({ x: 0, y: 0 });
    }
    lastTap.current = now;
  }, [setZoom]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleDoubleTap}
      style={{ touchAction: zoom > 1 ? 'none' : 'auto' }}
    >
      <div
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPinching.current ? 'none' : 'transform 0.1s ease',
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <PageCanvas
          pdf={pdf}
          pageNum={currentPage}
          scale={scale}
          bookId={bookId}
          onDimensions={(w, h) => setPageDims({ w, h })}
        />

        {pageDims && (
          <HighlighterLayer
            pageNum={currentPage}
            bookId={bookId}
            pageWidth={pageDims.w}
            pageHeight={pageDims.h}
            highlights={highlights}
            onHighlightAdded={(h) => useReaderStore.getState().addHighlight(h)}
            onHighlightClick={setSelectedHighlight}
          />
        )}
      </div>

      <BrightnessOverlay brightness={settings.brightness} />

      {selectedHighlight && (
        <HighlightPopover
          highlight={selectedHighlight}
          onClose={() => setSelectedHighlight(null)}
        />
      )}
    </div>
  );
}
