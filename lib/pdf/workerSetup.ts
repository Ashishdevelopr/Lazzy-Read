let workerConfigured = false;

export async function configurePdfWorker() {
  if (workerConfigured) return;
  workerConfigured = true;

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}
