'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useReaderStore } from '@/store/useReaderStore';
import { saveSettings, getSettings, exportData, importData } from '@/lib/storage/db';
import { ThemeSwitcher } from '@/components/common/ThemeSwitcher';
import { ToastContainer, addToast } from '@/components/common/Toast';

export default function SettingsPage() {
  const { settings, setSettings } = useReaderStore();
  const [storageInfo, setStorageInfo] = useState<{ used: number; quota: number } | null>(null);
  const [persistStatus, setPersistStatus] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
    if (navigator.storage?.estimate) {
      navigator.storage.estimate().then(({ usage, quota }) => {
        if (usage !== undefined && quota !== undefined) {
          setStorageInfo({ used: usage, quota });
        }
      });
    }
    if (navigator.storage?.persisted) {
      navigator.storage.persisted().then(setPersistStatus);
    }
  }, [setSettings]);

  const updateSetting = async <K extends keyof typeof settings>(key: K, value: typeof settings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await saveSettings(next);
  };

  const handleExport = async () => {
    try {
      const json = await exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pagepace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('Data exported!', 'success');
    } catch {
      addToast('Export failed', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      await importData(text);
      addToast('Data imported successfully!', 'success');
    } catch {
      addToast('Import failed — invalid file', 'error');
    }
    e.target.value = '';
  };

  const handleRequestPersist = async () => {
    if (navigator.storage?.persist) {
      const granted = await navigator.storage.persist();
      setPersistStatus(granted);
      addToast(granted ? 'Persistent storage granted!' : 'Persistent storage not granted', granted ? 'success' : 'warning');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24">
      <header className="sticky top-0 z-10 bg-[var(--bg)]/90 backdrop-blur-sm border-b border-[var(--border-color)] px-4 py-3 flex items-center gap-3">
        <Link href="/" className="p-2 rounded-xl hover:bg-[var(--surface)] text-[var(--muted)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>
        <h1 className="text-base font-semibold text-[var(--fg)]">Settings</h1>
      </header>

      <main className="px-4 py-4 max-w-2xl mx-auto space-y-4">
        <section className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)]">
          <h2 className="font-semibold text-sm text-[var(--fg)] mb-3">Theme</h2>
          <ThemeSwitcher />
        </section>

        <section className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)] space-y-4">
          <h2 className="font-semibold text-sm text-[var(--fg)]">Reader</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--fg)]">Page flip sound</p>
              <p className="text-xs text-[var(--muted)]">Paper sfx on page turn</p>
            </div>
            <button onClick={() => updateSetting('flipSound', !settings.flipSound)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.flipSound ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.flipSound ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--fg)]">Two-page spread</p>
              <p className="text-xs text-[var(--muted)]">Show two pages in landscape</p>
            </div>
            <button onClick={() => updateSetting('doublePageOnLandscape', !settings.doublePageOnLandscape)}
              className={`relative w-12 h-6 rounded-full transition-colors ${settings.doublePageOnLandscape ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings.doublePageOnLandscape ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[var(--fg)]">Brightness</p>
              <span className="text-xs text-[var(--muted)]">{Math.round(settings.brightness * 100)}%</span>
            </div>
            <input type="range" min="50" max="100" value={Math.round(settings.brightness * 100)}
              onChange={(e) => updateSetting('brightness', parseInt(e.target.value, 10) / 100)}
              className="scrubber-thumb w-full" />
          </div>
        </section>

        <section className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)] space-y-3">
          <h2 className="font-semibold text-sm text-[var(--fg)]">Storage</h2>
          {storageInfo && (
            <div>
              <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                <span>{formatBytes(storageInfo.used)} used</span>
                <span>{formatBytes(storageInfo.quota)} quota</span>
              </div>
              <div className="h-2 rounded-full bg-[var(--border-color)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.min(100, (storageInfo.used / storageInfo.quota) * 100)}%` }} />
              </div>
            </div>
          )}
          {persistStatus !== null && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fg)]">Persistent storage</p>
                <p className="text-xs text-[var(--muted)]">{persistStatus ? 'Granted — data safe from eviction' : 'Not granted'}</p>
              </div>
              {!persistStatus && (
                <button onClick={handleRequestPersist} className="px-3 py-1.5 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] text-xs font-semibold">Request</button>
              )}
              {persistStatus && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
          )}
        </section>

        <section className="bg-[var(--card)] rounded-2xl p-4 border border-[var(--border-color)] space-y-3">
          <h2 className="font-semibold text-sm text-[var(--fg)]">Data</h2>
          <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--surface)] text-[var(--fg)] text-sm text-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export all data (JSON)
          </button>
          <label className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--surface)] text-[var(--fg)] text-sm cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import data from backup
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </section>

        <p className="text-center text-xs text-[var(--muted)] pb-4">PagePace — All data stored locally on your device</p>
      </main>

      <ToastContainer />
    </div>
  );
}
