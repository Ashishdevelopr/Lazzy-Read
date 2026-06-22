'use client';

interface BrightnessOverlayProps {
  brightness: number;
}

export function BrightnessOverlay({ brightness }: BrightnessOverlayProps) {
  if (brightness >= 1.0) return null;
  const opacity = 1 - brightness;
  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ backgroundColor: `rgba(0,0,0,${opacity})` }}
    />
  );
}
