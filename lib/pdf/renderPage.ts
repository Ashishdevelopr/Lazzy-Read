import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist';

const MAX_CACHE = 10;
const pageCache = new Map<string, ImageBitmap>();
const cacheOrder: string[] = [];

function getCacheKey(bookId: string, pageNum: number, scale: number) {
  return `${bookId}-${pageNum}-${scale.toFixed(3)}`;
}

function evictIfNeeded() {
  while (cacheOrder.length >= MAX_CACHE) {
    const key = cacheOrder.shift()!;
    const bmp = pageCache.get(key);
    if (bmp) bmp.close();
    pageCache.delete(key);
  }
}

export function getCachedBitmap(bookId: string, pageNum: number, scale: number): ImageBitmap | undefined {
  const key = getCacheKey(bookId, pageNum, scale);
  return pageCache.get(key);
}

export function clearBookCache(bookId: string) {
  const keys = Array.from(pageCache.keys());
  for (const key of keys) {
    if (key.startsWith(`${bookId}-`)) {
      const bmp = pageCache.get(key);
      if (bmp) bmp.close();
      pageCache.delete(key);
      const idx = cacheOrder.indexOf(key);
      if (idx !== -1) cacheOrder.splice(idx, 1);
    }
  }
}

export async function renderPageToBitmap(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale: number,
  bookId: string
): Promise<ImageBitmap> {
  const key = getCacheKey(bookId, pageNum, scale);
  if (pageCache.has(key)) {
    return pageCache.get(key)!;
  }

  const page: PDFPageProxy = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await page.render({ canvas, viewport } as Parameters<typeof page.render>[0]).promise;
  page.cleanup();

  const bitmap = await createImageBitmap(canvas);
  evictIfNeeded();
  pageCache.set(key, bitmap);
  cacheOrder.push(key);

  return bitmap;
}

export async function makeThumbnail(pdf: PDFDocumentProxy, maxWidth = 200): Promise<string> {
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport.width;
  const scaledVp = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(scaledVp.width);
  canvas.height = Math.floor(scaledVp.height);

  await page.render({ canvas, viewport: scaledVp } as Parameters<typeof page.render>[0]).promise;
  page.cleanup();

  return canvas.toDataURL('image/jpeg', 0.8);
}

export async function getPageDimensions(
  pdf: PDFDocumentProxy,
  pageNum: number,
  scale: number
): Promise<{ width: number; height: number }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  page.cleanup();
  return { width: Math.floor(viewport.width), height: Math.floor(viewport.height) };
}
