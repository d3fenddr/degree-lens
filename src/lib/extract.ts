import type { Course } from './types';

const linePattern = /^(.{4,100}?)\s+(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:ECTS|CP|credits?|LP)?\s*$/i;
export function parseTranscriptPages(pages: string[]): Course[] {
  return pages.flatMap((text, page) => text.split(/\n/).flatMap(line => {
    const clean = line.replace(/\s+/g, ' ').trim();
    const match = clean.match(linePattern);
    if (!match || /^(total|summe|gesamt|semester|grade|note|credit)/i.test(match[1])) return [];
    const credits = Number(match[2].replace(',', '.'));
    if (credits <= 0 || credits > 30) return [];
    return [{ id: crypto.randomUUID(), title: match[1].trim(), credits, creditSystem: 'local' as const, verifiedEcts: null, semester: '', type: 'lecture' as const, description: '', selectedTopic: '' as const, confirmed: false, page: page + 1 }];
  }));
}

export async function extractPdf(file: File): Promise<{ courses: Course[]; pages: string[] }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) throw new Error('Choose a PDF document.');
  if (file.size > 10 * 1024 * 1024) throw new Error('PDF files must be 10 MB or smaller.');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  if (pdf.numPages > 30) throw new Error('PDF files must be 30 pages or fewer.');
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    let previousY: number | null = null;
    let text = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5];
      text += previousY !== null && Math.abs(y - previousY) > 3 ? '\n' : ' ';
      text += item.str;
      previousY = y;
    }
    pages.push(text);
  }
  return { pages, courses: parseTranscriptPages(pages) };
}
