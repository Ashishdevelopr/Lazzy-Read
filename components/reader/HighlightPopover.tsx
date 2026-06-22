'use client';

import { useState } from 'react';
import { saveHighlight, deleteHighlight } from '@/lib/storage/db';
import { useReaderStore } from '@/store/useReaderStore';
import type { Highlight } from '@/types';

interface HighlightPopoverProps {
  highlight: Highlight | null;
  onClose: () => void;
}

const COLORS: Highlight['color'][] = ['yellow', 'green', 'blue', 'pink'];
const COLOR_LABELS: Record<Highlight['color'], string> = {
  yellow: '#fde047',
  green: '#86efac',
  blue: '#93c5fd',
  pink: '#f9a8d4',
};

export function HighlightPopover({ highlight, onClose }: HighlightPopoverProps) {
  const { updateHighlight, removeHighlight } = useReaderStore();
  const [note, setNote] = useState(highlight?.note ?? '');

  if (!highlight) return null;

  const handleColorChange = async (color: Highlight['color']) => {
    const updated = { ...highlight, color };
    await saveHighlight(updated);
    updateHighlight(updated);
  };

  const handleNoteSave = async () => {
    const updated = { ...highlight, note: note.trim() || undefined };
    await saveHighlight(updated);
    updateHighlight(updated);
    onClose();
  };

  const handleDelete = async () => {
    await deleteHighlight(highlight.id);
    removeHighlight(highlight.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="bg-[var(--card)] rounded-t-2xl w-full max-w-sm p-4 fade-in shadow-xl border-t border-[var(--border-color)]" onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-[var(--border-color)] mx-auto mb-4" />
        <h4 className="font-semibold text-sm text-[var(--fg)] mb-3">Highlight</h4>
        <div className="flex gap-2 mb-4">
          {COLORS.map((c) => (
            <button key={c} onClick={() => handleColorChange(c)}
              className={`w-8 h-8 rounded-full transition-all ${highlight.color === c ? 'ring-2 ring-offset-2 ring-[var(--accent)] scale-110' : ''}`}
              style={{ backgroundColor: COLOR_LABELS[c] }} />
          ))}
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note…" rows={3}
          className="w-full px-3 py-2 rounded-xl border border-[var(--border-color)] bg-[var(--surface)] text-[var(--fg)] text-sm resize-none mb-3" />
        <div className="flex gap-2">
          <button onClick={handleDelete} className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium">Delete</button>
          <button onClick={handleNoteSave} className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-[var(--accent-fg)] text-sm font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}
