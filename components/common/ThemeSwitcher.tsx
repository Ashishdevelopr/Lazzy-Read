'use client';

import { useReaderStore } from '@/store/useReaderStore';
import { saveSettings } from '@/lib/storage/db';
import type { Settings } from '@/types';

const themes: { value: Settings['theme']; label: string; preview: string }[] = [
  { value: 'light', label: 'Light', preview: 'bg-white text-gray-900 border-gray-200' },
  { value: 'sepia', label: 'Sepia', preview: 'bg-[#f5f0e8] text-[#3d2b1f] border-[#d5cbbe]' },
  { value: 'dark', label: 'Dark', preview: 'bg-gray-800 text-gray-100 border-gray-700' },
  { value: 'night', label: 'Night', preview: 'bg-[#0f0f0f] text-[#ff8c42] border-[#2a1a0a]' },
];

export function ThemeSwitcher() {
  const { settings, setSettings } = useReaderStore();

  const changeTheme = async (theme: Settings['theme']) => {
    const next = { ...settings, theme };
    setSettings(next);
    await saveSettings(next);
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {themes.map((t) => (
        <button key={t.value} onClick={() => changeTheme(t.value)}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
            t.preview
          } ${settings.theme === t.value ? 'ring-2 ring-[var(--accent)] ring-offset-1' : 'opacity-80'}`}>
          <div className={`w-8 h-8 rounded-md border ${t.preview}`} />
          <span className="text-xs font-medium">{t.label}</span>
        </button>
      ))}
    </div>
  );
}
