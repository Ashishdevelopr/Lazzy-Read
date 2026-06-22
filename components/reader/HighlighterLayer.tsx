'use client';

import { useRef, useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { saveHighlight } from '@/lib/storage/db';
import { useReaderStore } from '@/store/useReaderStore';
import type { Highlight } from '@/types';

interface HighlighterLayerProps {
  pageNum: number;
  bookId: string;
  pageWidth: number;
  pageHeight: number;
  highlights: Highlight[];
  onHighlightAdded: (h: Highlight) => void;
  onHighlightClick: (h: Highlight) => void;
}

export function HighlighterLayer({
  pageNum,
  bookId,
  highlights,
  onHighlightAdded,
  onHighlightClick,
}: HighlighterLayerProps) {
  const { highlighterMode } = useReaderStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const getCoords = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!highlighterMode) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const coords = getCoords(e);
    startRef.current = coords;
    setDrawing({ x: coords.x, y: coords.y, w: 0, h: 0 });
  }, [highlighterMode, getCoords]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!highlighterMode || !startRef.current) return;
    const coords = getCoords(e);
    const sx = startRef.current.x;
    const sy = startRef.current.y;
    setDrawing({
      x: Math.min(sx, coords.x),
      y: Math.min(sy, coords.y),
      w: Math.abs(coords.x - sx),
      h: Math.abs(coords.y - sy),
    });
  }, [highlighterMode, getCoords]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onPointerUp = useCallback(async (_e: React.PointerEvent) => {
    if (!highlighterMode || !startRef.current || !drawing) return;
    startRef.current = null;

    if (drawing.w < 0.01 || drawing.h < 0.005) {
      setDrawing(null);
      return;
    }

    const highlight: Highlight = {
      id: uuidv4(),
      bookId,
      page: pageNum,
      rect: { x: drawing.x, y: drawing.y, w: drawing.w, h: drawing.h },
      color: 'yellow',
      createdAt: Date.now(),
    };

    await saveHighlight(highlight);
    onHighlightAdded(highlight);
    setDrawing(null);
  }, [highlighterMode, drawing, bookId, pageNum, onHighlightAdded]);

  const pageHighlights = highlights.filter((h) => h.page === pageNum);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ cursor: highlighterMode ? 'crosshair' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {pageHighlights.map((h) => (
        <div
          key={h.id}
          className="highlight-overlay"
          data-color={h.color}
          style={{
            left: `${h.rect.x * 100}%`,
            top: `${h.rect.y * 100}%`,
            width: `${h.rect.w * 100}%`,
            height: `${h.rect.h * 100}%`,
          }}
          onClick={(e) => { e.stopPropagation(); onHighlightClick(h); }}
        />
      ))}

      {drawing && (
        <div
          className="absolute pointer-events-none border-2 border-yellow-400 bg-yellow-200/30"
          style={{
            left: `${drawing.x * 100}%`,
            top: `${drawing.y * 100}%`,
            width: `${drawing.w * 100}%`,
            height: `${drawing.h * 100}%`,
          }}
        />
      )}
    </div>
  );
}
