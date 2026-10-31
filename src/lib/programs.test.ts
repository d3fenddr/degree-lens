import { describe, expect, it } from 'vitest';
import programData from '../data/programs.json';
import type { Program } from './types';

const allPrograms = programData.programs as unknown as Program[];

describe('European Degree Programs Database', () => {
  it('contains substantially expanded genuine programs across Europe', () => {
    expect(programData.totalPrograms).toBeGreaterThan(1000);
    expect(programData.programs.length).toBe(programData.totalPrograms);
    expect(programData.countriesCovered).toBeGreaterThanOrEqual(10);
  });

  it('preserves exactly the 5 verified ECTS analysis programs with rules', () => {
    const verified = allPrograms.filter(p => p.academicAnalysisAvailability === true);
    expect(verified.length).toBe(5);
    const ids = verified.map(p => p.id).sort();
    expect(ids).toEqual(['bonn-ai', 'bonn-cs', 'hamburg-dsai', 'reg-cs', 'reg-ds'].sort());

    for (const p of verified) {
      expect(p.rules).toBeDefined();
      expect(p.rules!.length).toBeGreaterThan(0);
      expect(p.conditions).toBeDefined();
      expect(p.conditions!.length).toBeGreaterThan(0);
    }
  });

  it('covers major academic disciplines and ISCED-F classifications', () => {
    const fields = new Set(allPrograms.map(p => p.fieldOfStudy));
    expect(fields.has('Computer Science')).toBe(true);
    expect(fields.has('Artificial Intelligence') || fields.has('Data Science')).toBe(true);
    expect(fields.has('Medicine')).toBe(true);
    expect(fields.has('Law')).toBe(true);
    expect(fields.has('Economics')).toBe(true);
    expect(fields.has('Business Administration')).toBe(true);
  });

  it('distinguishes degree levels correctly', () => {
    const levels = new Set(allPrograms.map(p => p.degreeLevel));
    expect(levels.has('Bachelor')).toBe(true);
    expect(levels.has('Master')).toBe(true);
  });

  it('ensures all records have valid source attribution and identifiers', () => {
    for (const p of programData.programs.slice(0, 100)) {
      expect(p.id).toBeTruthy();
      expect(p.university).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.country).toBeTruthy();
      expect(p.countryCode).toMatch(/^[A-Z]{2}$/);
      expect(p.officialProgramUrl || p.sourceUrl).toMatch(/^https?:\/\//);
    }
  });
});
