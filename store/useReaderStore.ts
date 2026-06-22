'use client';

import { create } from 'zustand';
import type { Book, Progress, Highlight, Settings } from '@/types';

interface ReaderStore {
  currentBook: Book | null;
  currentPage: number;
  progress: Progress | null;
  highlights: Highlight[];
  settings: Settings;
  chromeVisible: boolean;
  highlighterMode: boolean;
  zoom: number;

  setCurrentBook: (book: Book | null) => void;
  setCurrentPage: (page: number) => void;
  setProgress: (progress: Progress | null) => void;
  setHighlights: (highlights: Highlight[]) => void;
  addHighlight: (h: Highlight) => void;
  removeHighlight: (id: string) => void;
  updateHighlight: (h: Highlight) => void;
  setSettings: (settings: Settings) => void;
  setChromeVisible: (v: boolean) => void;
  toggleChrome: () => void;
  setHighlighterMode: (v: boolean) => void;
  setZoom: (z: number) => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  flipSound: false,
  doublePageOnLandscape: true,
  brightness: 1.0,
  syncEnabled: false,
};

export const useReaderStore = create<ReaderStore>((set) => ({
  currentBook: null,
  currentPage: 1,
  progress: null,
  highlights: [],
  settings: DEFAULT_SETTINGS,
  chromeVisible: true,
  highlighterMode: false,
  zoom: 1,

  setCurrentBook: (book) => set({ currentBook: book }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setProgress: (progress) => set({ progress }),
  setHighlights: (highlights) => set({ highlights }),
  addHighlight: (h) => set((state) => ({ highlights: [...state.highlights, h] })),
  removeHighlight: (id) => set((state) => ({ highlights: state.highlights.filter((h) => h.id !== id) })),
  updateHighlight: (h) =>
    set((state) => ({
      highlights: state.highlights.map((old) => (old.id === h.id ? h : old)),
    })),
  setSettings: (settings) => set({ settings }),
  setChromeVisible: (v) => set({ chromeVisible: v }),
  toggleChrome: () => set((state) => ({ chromeVisible: !state.chromeVisible })),
  setHighlighterMode: (v) => set({ highlighterMode: v }),
  setZoom: (z) => set({ zoom: z }),
}));
