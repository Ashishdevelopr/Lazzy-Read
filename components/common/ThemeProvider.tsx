'use client';

import { useEffect } from 'react';
import { useReaderStore } from '@/store/useReaderStore';
import { getSettings } from '@/lib/storage/db';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings, setSettings } = useReaderStore();

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      document.documentElement.setAttribute('data-theme', s.theme);
    });
  }, [setSettings]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  return <>{children}</>;
}
