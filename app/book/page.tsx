import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const BookDetailContent = dynamic(() => import('./BookDetailClient'), { ssr: false });

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]"><div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
      <BookDetailContent />
    </Suspense>
  );
}
