import { describe, expect, it } from 'vitest';
import { parseTranscriptLine, parseTranscriptPages, inferCourseType } from './extract';

describe('Transcript Extraction Bug Audit & Regression Tests', () => {
  it('parses clean English transcript line with ECTS', () => {
    const course = parseTranscriptLine('Linear Algebra 6 ECTS', 1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Linear Algebra');
    expect(course?.credits).toBe(6);
    expect(course?.creditSystem).toBe('ECTS');
    expect(course?.page).toBe(1);
  });

  it('handles German Transcript of Records with decimal comma and grade', () => {
    const course = parseTranscriptLine('Mathematik I für Informatiker 8,0 LP 1,7 Bestanden', 1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Mathematik I für Informatiker');
    expect(course?.credits).toBe(8.0);
    expect(course?.grade).toBe('1,7');
    expect(course?.reviewStatus).toBe('valid');
  });

  it('handles pipe-delimited table row correctly', () => {
    const course = parseTranscriptLine('CS201 | Data Structures & Algorithms | 6.0 ECTS | A | Pass', 2);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Data Structures & Algorithms');
    expect(course?.credits).toBe(6);
    expect(course?.page).toBe(2);
  });

  it('handles tab-delimited row with semester and grade', () => {
    const course = parseTranscriptLine('Software Engineering\t6 ECTS\tWS 2022/23\t1.3', 1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Software Engineering');
    expect(course?.credits).toBe(6);
    expect(course?.semester).toBe('WS 2022/23');
    expect(course?.grade).toBe('1.3');
  });

  it('disambiguates credits and grades when both appear on the row', () => {
    const course = parseTranscriptLine('Operating Systems 5 ECTS 2.3', 1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Operating Systems');
    expect(course?.credits).toBe(5);
    expect(course?.grade).toBe('2.3');
  });

  it('handles decimal commas in credits without explicit unit label', () => {
    const course = parseTranscriptLine('Wahrscheinlichkeitstheorie und Statistik 7,5 1,3', 1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Wahrscheinlichkeitstheorie und Statistik');
    expect(course?.credits).toBe(7.5);
    expect(course?.grade).toBe('1,3');
  });

  it('recognizes non-ECTS UK CATS credits', () => {
    const course = parseTranscriptLine('Distributed Systems 20 CATS', 1);
    expect(course).not.toBeNull();
    expect(course?.title).toBe('Distributed Systems');
    expect(course?.credits).toBe(20);
    expect(course?.creditSystem).toBe('UK CATS');
  });

  it('infers course types accurately', () => {
    expect(inferCourseType('Physics Laboratory')).toBe('lab');
    expect(inferCourseType('Praktikum Softwareentwicklung')).toBe('lab');
    expect(inferCourseType('Advanced Seminar on Machine Learning')).toBe('seminar');
    expect(inferCourseType('Bachelorarbeit / Bachelor Thesis')).toBe('thesis');
    expect(inferCourseType('Industry Internship')).toBe('internship');
    expect(inferCourseType('Software Engineering Project')).toBe('project');
    expect(inferCourseType('Linear Algebra')).toBe('lecture');
  });

  it('filters out transcript summary lines and headers', () => {
    expect(parseTranscriptLine('Total Credits Earned: 180 ECTS')).toBeNull();
    expect(parseTranscriptLine('Gesamtsumme Leistungspunkte: 120')).toBeNull();
    expect(parseTranscriptLine('Transcript of Records - Official Document')).toBeNull();
    expect(parseTranscriptLine('Page 2 of 4')).toBeNull();
    expect(parseTranscriptLine('Matrikelnummer: 98765432')).toBeNull();
  });

  it('flags duplicate titles across multi-page transcript', () => {
    const pages = [
      'Calculus I 6 ECTS\nAlgorithms 6 ECTS',
      'Calculus I 6 ECTS\nDatabase Systems 6 ECTS'
    ];
    const courses = parseTranscriptPages(pages);
    expect(courses.length).toBe(4);
    const duplicates = courses.filter(c => c.reviewStatus === 'duplicate-title');
    expect(duplicates.length).toBe(1);
    expect(duplicates[0].title).toBe('Calculus I');
    expect(duplicates[0].page).toBe(2);
  });

  it('flags potential grades captured as credits when units are missing', () => {
    const course = parseTranscriptLine('Artificial Intelligence 1.7', 1);
    expect(course).not.toBeNull();
    expect(course?.reviewStatus).toBe('potential-grade');
    expect(course?.reviewWarning).toContain('Verify this is not a grade');
  });

  it('flags unusually high credits for review', () => {
    const course = parseTranscriptLine('Full Semester Block 45 ECTS', 1);
    expect(course).not.toBeNull();
    expect(course?.reviewStatus).toBe('suspicious-credit');
  });
});
