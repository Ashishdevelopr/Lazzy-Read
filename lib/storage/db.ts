import type { Book, Progress, Highlight, ReadingSession, Settings } from '@/types';

let localforage: typeof import('localforage') | null = null;

async function getLF() {
  if (!localforage) {
    localforage = (await import('localforage')).default;
  }
  return localforage;
}

function makeStore(name: string) {
  return {
    async get() {
      const lf = await getLF();
      return lf.createInstance({ name: 'pagepace', storeName: name });
    },
  };
}

const STORES = {
  books: makeStore('books'),
  files: makeStore('files'),
  progress: makeStore('progress'),
  highlights: makeStore('highlights'),
  sessions: makeStore('sessions'),
  settings: makeStore('settings'),
};

// Books
export async function getBook(id: string): Promise<Book | null> {
  const store = await STORES.books.get();
  return store.getItem<Book>(id);
}

export async function getAllBooks(): Promise<Book[]> {
  const store = await STORES.books.get();
  const books: Book[] = [];
  await store.iterate<Book, void>((val) => { books.push(val); });
  return books.sort((a, b) => b.addedAt - a.addedAt);
}

export async function saveBook(book: Book): Promise<void> {
  const store = await STORES.books.get();
  await store.setItem(book.id, book);
}

export async function deleteBook(id: string): Promise<void> {
  const booksStore = await STORES.books.get();
  const filesStore = await STORES.files.get();
  const progressStore = await STORES.progress.get();
  const highlightsStore = await STORES.highlights.get();
  const sessionsStore = await STORES.sessions.get();

  const book = await booksStore.getItem<Book>(id);
  if (book) {
    await filesStore.removeItem(book.fileKey);
  }
  await booksStore.removeItem(id);
  await progressStore.removeItem(id);

  const toDeleteHighlights: string[] = [];
  await highlightsStore.iterate<Highlight, void>((val, key) => {
    if (val.bookId === id) toDeleteHighlights.push(key);
  });
  for (const k of toDeleteHighlights) await highlightsStore.removeItem(k);

  const toDeleteSessions: string[] = [];
  await sessionsStore.iterate<ReadingSession, void>((val, key) => {
    if (val.bookId === id) toDeleteSessions.push(key);
  });
  for (const k of toDeleteSessions) await sessionsStore.removeItem(k);
}

// Files
export async function saveFile(key: string, blob: Blob): Promise<void> {
  const store = await STORES.files.get();
  await store.setItem(key, blob);
}

export async function getFile(key: string): Promise<Blob | null> {
  const store = await STORES.files.get();
  return store.getItem<Blob>(key);
}

// Progress
export async function getProgress(bookId: string): Promise<Progress | null> {
  const store = await STORES.progress.get();
  return store.getItem<Progress>(bookId);
}

export async function saveProgress(progress: Progress): Promise<void> {
  const store = await STORES.progress.get();
  await store.setItem(progress.bookId, progress);
}

// Highlights
export async function getHighlightsForBook(bookId: string): Promise<Highlight[]> {
  const store = await STORES.highlights.get();
  const highlights: Highlight[] = [];
  await store.iterate<Highlight, void>((val) => {
    if (val.bookId === bookId) highlights.push(val);
  });
  return highlights.sort((a, b) => a.page - b.page || a.createdAt - b.createdAt);
}

export async function saveHighlight(highlight: Highlight): Promise<void> {
  const store = await STORES.highlights.get();
  await store.setItem(highlight.id, highlight);
}

export async function deleteHighlight(id: string): Promise<void> {
  const store = await STORES.highlights.get();
  await store.removeItem(id);
}

// Sessions
export async function saveSession(session: ReadingSession): Promise<void> {
  const store = await STORES.sessions.get();
  await store.setItem(session.id, session);
}

export async function getSessionsForBook(bookId: string): Promise<ReadingSession[]> {
  const store = await STORES.sessions.get();
  const sessions: ReadingSession[] = [];
  await store.iterate<ReadingSession, void>((val) => {
    if (val.bookId === bookId) sessions.push(val);
  });
  return sessions;
}

export async function getAllSessions(): Promise<ReadingSession[]> {
  const store = await STORES.sessions.get();
  const sessions: ReadingSession[] = [];
  await store.iterate<ReadingSession, void>((val) => { sessions.push(val); });
  return sessions;
}

// Settings
const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  flipSound: false,
  doublePageOnLandscape: true,
  brightness: 1.0,
  syncEnabled: false,
};

export async function getSettings(): Promise<Settings> {
  const store = await STORES.settings.get();
  const saved = await store.getItem<Partial<Settings>>('settings');
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(settings: Settings): Promise<void> {
  const store = await STORES.settings.get();
  await store.setItem('settings', settings);
}

// Export/Import
export async function exportData(): Promise<string> {
  const [books, allProgress, allHighlights, allSessions, settings] = await Promise.all([
    getAllBooks(),
    (async () => {
      const store = await STORES.progress.get();
      const items: Progress[] = [];
      await store.iterate<Progress, void>((v) => { items.push(v); });
      return items;
    })(),
    (async () => {
      const store = await STORES.highlights.get();
      const items: Highlight[] = [];
      await store.iterate<Highlight, void>((v) => { items.push(v); });
      return items;
    })(),
    getAllSessions(),
    getSettings(),
  ]);
  return JSON.stringify({ books, progress: allProgress, highlights: allHighlights, sessions: allSessions, settings }, null, 2);
}

export async function importData(json: string): Promise<void> {
  const data = JSON.parse(json) as {
    books?: Book[];
    progress?: Progress[];
    highlights?: Highlight[];
    sessions?: ReadingSession[];
    settings?: Settings;
  };

  if (data.books) {
    for (const b of data.books) await saveBook(b);
  }
  if (data.progress) {
    for (const p of data.progress) await saveProgress(p);
  }
  if (data.highlights) {
    for (const h of data.highlights) await saveHighlight(h);
  }
  if (data.sessions) {
    for (const s of data.sessions) await saveSession(s);
  }
  if (data.settings) {
    await saveSettings(data.settings);
  }
}
