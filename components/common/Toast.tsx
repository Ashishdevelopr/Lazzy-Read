'use client';

import { useEffect, useState, useCallback } from 'react';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null;

export function addToast(message: string, type: ToastType = 'info') {
  if (addToastFn) addToastFn(message, type);
}

const typeStyles: Record<ToastType, string> = {
  info: 'bg-[var(--surface)] border-[var(--border-color)] text-[var(--fg)]',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    addToastFn = add;
    return () => { addToastFn = null; };
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className={`fade-in px-4 py-3 rounded-xl border shadow-lg text-sm font-medium ${typeStyles[t.type]}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
