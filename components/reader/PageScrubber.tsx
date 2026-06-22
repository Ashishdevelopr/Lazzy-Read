'use client';

import { useState, useRef } from 'react';

interface PageScrubberProps {
  currentPage: number;
  pageCount: number;
  onJump: (page: number) => void;
}

export function PageScrubber({ currentPage, pageCount, onJump }: PageScrubberProps) {
  const [hovering, setHovering] = useState(false);
  const previewRef = useRef(currentPage);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    previewRef.current = parseInt(e.target.value, 10);
  };

  const handleCommit = () => {
    onJump(previewRef.current);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 w-full">
      {hovering && (
        <div
          className="absolute bottom-16 bg-[var(--card)] text-[var(--fg)] text-xs font-medium px-2 py-1 rounded-lg border border-[var(--border-color)] shadow-md pointer-events-none"
          style={{ left: `calc(${((previewRef.current - 1) / Math.max(1, pageCount - 1)) * 100}% - 20px)` }}
        >
          {previewRef.current}
        </div>
      )}
      <span className="text-xs text-white/70 w-8 text-right shrink-0">{currentPage}</span>
      <input
        type="range"
        min={1}
        max={pageCount}
        defaultValue={currentPage}
        onChange={handleChange}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className="scrubber-thumb flex-1"
      />
      <span className="text-xs text-white/70 w-8 shrink-0">{pageCount}</span>
    </div>
  );
}
