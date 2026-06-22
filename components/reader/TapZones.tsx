'use client';

interface TapZonesProps {
  onPrev: () => void;
  onNext: () => void;
  onToggleChrome: () => void;
}

export function TapZones({ onPrev, onNext, onToggleChrome }: TapZonesProps) {
  return (
    <div className="absolute inset-0 z-20 grid grid-cols-3 pointer-events-auto select-none">
      <div className="h-full cursor-pointer active:bg-black/5" onClick={onPrev} aria-label="Previous page" />
      <div className="h-full cursor-pointer" onClick={onToggleChrome} aria-label="Toggle UI" />
      <div className="h-full cursor-pointer active:bg-black/5" onClick={onNext} aria-label="Next page" />
    </div>
  );
}
