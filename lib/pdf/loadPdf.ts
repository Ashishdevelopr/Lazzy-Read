import type { PDFDocumentProxy } from 'pdfjs-dist';
import { configurePdfWorker } from './workerSetup';

export async function loadPdfFromBlob(blob: Blob): Promise<PDFDocumentProxy> {
  await configurePdfWorker();
  const pdfjsLib = await import('pdfjs-dist');
  const arrayBuffer = await blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  return pdf;
}

export async function extractMeta(pdf: PDFDocumentProxy): Promise<{ title?: string; author?: string }> {
  try {
    const meta = await pdf.getMetadata();
    const info = meta.info as Record<string, string>;
    return {
      title: info?.Title || undefined,
      author: info?.Author || undefined,
    };
  } catch {
    return {};
  }
}
