import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ReaderClient = dynamic(() => import('./ReaderClient'), { ssr: false });

export default function ReaderPage() {
  return (
    <Suspense fallback={<div className="reader-container flex items-center justify-center"><div className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" /></div>}>
      <ReaderClient />
    </Suspense>
  );
}
