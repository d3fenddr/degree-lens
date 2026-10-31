import type { Course, CourseType, CreditSystem, CourseReviewStatus } from './types';

// Regex patterns for header/footer noise filtering
const IGNORED_LINE_PATTERNS = [
  /^(?:total|summe|gesamt|gesamtsumme|subtotal|cumulative|average|gpa|credits?\s+earned|erworbene\s+leistungspunkte)/i,
  /^(?:transcript\s+of\s+records|academic\s+record|notenspiegel|notenübersicht|zeugnis|leistungsübersicht)/i,
  /^(?:page\s+\d+|seite\s+\d+|date\s+of\s+issue|ausstellungsdatum|student\s+id|matrikelnummer|geboren\s+am)/i,
  /^(?:university|universität|hochschule|faculty|fakultät|department|degree|abschluss|bachelor|master)\b/i,
];

// Detect course type from title or type string
export function inferCourseType(text: string): CourseType {
  const t = text.toLowerCase();
  if (/seminar|colloquium|proseminar|hauptseminar/i.test(t)) return 'seminar';
  if (/lab\b|laboratory|praktikum|labor|practical\s+training/i.test(t)) return 'lab';
  if (/internship|berufspraktikum|praxisphase|placement/i.test(t)) return 'internship';
  if (/thesis|abschlussarbeit|bachelorarbeit|masterarbeit|dissertation|project\s+thesis/i.test(t)) return 'thesis';
  if (/project|projekt|capstone|team\s+project|studienprojekt/i.test(t)) return 'project';
  return 'lecture';
}

// Parse a single text line into course data
export function parseTranscriptLine(line: string, pageNumber = 1): Course | null {
  const normalized = line.replace(/[\u2013\u2014]/g, '-').trim();
  if (normalized.length < 5 || normalized.length > 250) return null;

  // Filter summary or header rows
  for (const pattern of IGNORED_LINE_PATTERNS) {
    if (pattern.test(normalized)) return null;
  }

  let title = '';
  let credits: number | null = null;
  let creditSystem: CreditSystem = 'ECTS';
  let grade = '';
  let semester = '';
  let reviewStatus: CourseReviewStatus = 'valid';
  let reviewWarning = '';

  // Check for pipe-delimited, tab-delimited, or semicolon-delimited columns
  const isDelimited = normalized.includes('|') || normalized.includes('\t') || normalized.includes(';');
  const tokens = isDelimited
    ? normalized.split(/[|\t;]/).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean)
    : [];
  const clean = normalized.replace(/\s+/g, ' ').trim();

  if (tokens.length >= 2) {
    // Delimited row parsing: find title, credits, grade, semester
    let candidateCode = '';
    let candidateTitle = '';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Check for credit token (e.g. "6.0 ECTS", "6,0", "6 CP")
      const creditMatch = token.match(/^(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:ECTS|CP|LP|credits?|cr|Leistungspunkte|CATS)?$/i);
      if (creditMatch && credits === null) {
        const val = Number(creditMatch[1].replace(',', '.'));
        if (val > 0 && val <= 60) {
          credits = val;
          if (/cats/i.test(token)) creditSystem = 'UK CATS';
          continue;
        }
      }

      // Check for semester token (e.g. "WS 2022/23", "SoSe 2023", "Fall 2022", "Sem 1")
      if (/(?:ws|ss|sose|wi-se|winter|summer|fall|spring|semester|sem|term)\s*[\d/-]+/i.test(token)) {
        semester = token;
        continue;
      }

      // Check for grade token (e.g. "1,3", "1.7", "A+", "Pass", "Passed", "Sehr gut")
      if (/^(?:\d[.,]\d{1,2}|[A-F][+-]?|pass|passed|bestanden|sehr gut|gut|befriedigend)$/i.test(token) && !grade) {
        grade = token;
        continue;
      }

      // Identify course codes vs descriptive titles
      if (/^[A-Z]{2,6}[- ]?\d{2,5}[A-Z]?$/i.test(token)) {
        candidateCode = token;
        continue;
      }

      if (token.length >= 3 && !/^\d+$/.test(token)) {
        if (!candidateTitle || token.length > candidateTitle.length) {
          candidateTitle = token;
        }
      }
    }

    title = candidateTitle || candidateCode;
  } else {
    // Freeform text line parsing

    // 1. Look for explicit credit label with units: e.g. "Linear Algebra 6,0 ECTS" or "Algorithms (6 CP) Note 1.3"
    const explicitUnitMatch = clean.match(/(.*?)(?:^|\s+)(\d{1,2}(?:[.,]\d{1,2})?)\s*(ECTS|CP|LP|credits?|cr|Leistungspunkte|CATS|KP)\b(.*?)$/i);

    if (explicitUnitMatch) {
      title = explicitUnitMatch[1].trim();
      const rawCredit = explicitUnitMatch[2].replace(',', '.');
      credits = Number(rawCredit);
      const unit = explicitUnitMatch[3].toUpperCase();
      if (unit === 'CATS') creditSystem = 'UK CATS';

      const remainder = explicitUnitMatch[4].trim();
      // Look for grade in remainder
      const gradeMatch = remainder.match(/(?:grade|note|status)?[:\s]*(\d[.,]\d|[A-F][+-]?|pass|passed|bestanden)/i);
      if (gradeMatch) grade = gradeMatch[1];
    } else {
      // 2. Look for trailing or embedded numeric pattern: title followed by numbers (credits and optionally grade)
      // e.g. "Mathematik I 8,0 1,7" or "Database Systems 6.0 85%"
      const numbersMatch = clean.match(/^(.*?)\s+(\d{1,2}(?:[.,]\d{1,2})?)(?:\s+(\d[.,]\d|[A-F][+-]?|pass|passed|bestanden|failed))?\s*$/i);
      if (numbersMatch) {
        title = numbersMatch[1].trim();
        const candidateCredit = Number(numbersMatch[2].replace(',', '.'));
        grade = numbersMatch[3] || '';

        credits = candidateCredit;
      }
    }
  }

  // Final sanity checks on course title and credits
  if (!title || title.length < 3) return null;
  if (/^(?:page|seite|modul|module|course|fach|titel|bezeichnung|credits|grade|note)\b/i.test(title)) return null;
  if (credits === null || credits <= 0 || credits > 60) return null;

  // Check if candidate credit looks like a grade score (e.g. 1.3, 1.7, 2.3, 2.7, 3.3, 3.7)
  if (!grade && credits >= 1.0 && credits <= 4.0 && credits % 1 !== 0) {
    reviewStatus = 'potential-grade';
    reviewWarning = `Review value: ${credits} resembles a grade score rather than module credits. Verify this is not a grade.`;
  } else if (credits < 1) {
    reviewStatus = 'suspicious-credit';
    reviewWarning = `Unusually low credit value (${credits}).`;
  } else if (credits > 30) {
    reviewStatus = 'suspicious-credit';
    reviewWarning = `High credit value (${credits}). Verify module structure.`;
  }

  return {
    id: crypto.randomUUID(),
    title,
    credits,
    creditSystem,
    verifiedEcts: creditSystem === 'ECTS' ? credits : null,
    semester,
    type: inferCourseType(title),
    description: '',
    selectedTopic: '',
    confirmed: false,
    page: pageNumber,
    grade,
    reviewStatus,
    reviewWarning,
  };
}

export function parseTranscriptPages(pages: string[]): Course[] {
  const allCourses: Course[] = [];
  const seenTitles = new Map<string, number>();

  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const lines = pages[pageIdx].split(/\r?\n/);
    for (const line of lines) {
      const course = parseTranscriptLine(line, pageIdx + 1);
      if (!course) continue;

      // Duplicate title detection
      const normalizedTitle = course.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      const count = seenTitles.get(normalizedTitle) || 0;
      seenTitles.set(normalizedTitle, count + 1);

      if (count >= 1 && course.reviewStatus === 'valid') {
        course.reviewStatus = 'duplicate-title';
        course.reviewWarning = `Duplicate title detected (${course.title}). Verify retake or distinct course.`;
      }

      allCourses.push(course);
    }
  }

  return allCourses;
}

export async function extractPdf(file: File): Promise<{ courses: Course[]; pages: string[]; textCharCount: number }> {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Please choose a valid PDF document (.pdf).');
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('PDF files must be 10 MB or smaller.');
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  let pdf;
  try {
    pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/password/i.test(msg)) {
      throw new Error('This PDF is password-protected. Please upload an unprotected version or enter courses manually.');
    }
    throw new Error('Could not read this PDF. The file may be corrupted or use an unsupported PDF version.');
  }

  if (pdf.numPages > 30) {
    throw new Error('PDF files must be 30 pages or fewer.');
  }

  const pages: string[] = [];
  let totalChars = 0;

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

    totalChars += text.trim().length;
    pages.push(text);
  }

  const courses = parseTranscriptPages(pages);

  return { pages, courses, textCharCount: totalChars };
}
