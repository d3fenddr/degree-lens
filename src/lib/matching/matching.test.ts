import { describe, expect, it } from 'vitest';
import type { Course } from '../types';
import { programs, verifiedPrograms } from '../programs';
import {
  DEFAULT_PREFERENCES,
  matchesHardConstraints,
  rankPrograms,
  type UserPreferences
} from './index';

function testCourse(
  title: string,
  credits: number,
  topic: Course['selectedTopic'],
  confirmed = true,
  creditSystem: Course['creditSystem'] = 'ECTS',
  verifiedEcts: number | null = credits
): Course {
  return {
    id: crypto.randomUUID(),
    title,
    credits,
    creditSystem,
    verifiedEcts,
    semester: 'WS 2023',
    type: 'lecture',
    description: '',
    selectedTopic: topic,
    confirmed
  };
}

const mathCourses: Course[] = [
  testCourse('Linear Algebra I', 8, 'math'),
  testCourse('Analysis I', 8, 'math'),
  testCourse('Probability & Measure Theory', 6, 'stochastics'),
  testCourse('Differential Equations', 6, 'math')
];

const csCourses: Course[] = [
  testCourse('Data Structures and Algorithms', 8, 'theory'),
  testCourse('Operating Systems', 6, 'systems'),
  testCourse('Software Engineering', 6, 'practical'),
  testCourse('Functional Programming', 6, 'programming')
];

describe('Intelligent University Matching Engine', () => {
  it('1. Mathematics-heavy student receives mathematically relevant recommendations', () => {
    const results = rankPrograms(programs, mathCourses, DEFAULT_PREFERENCES, 'relevance');
    expect(results.totalFound).toBeGreaterThan(0);
    const topFields = results.items.slice(0, 10).map(r => r.program.fieldOfStudy);
    const hasMathOrData = topFields.some(f => f === 'Mathematics' || f === 'Statistics' || f === 'Data Science');
    expect(hasMathOrData).toBe(true);
  });

  it('2. Computer Science-heavy student receives CS-related recommendations', () => {
    const results = rankPrograms(programs, csCourses, DEFAULT_PREFERENCES, 'relevance');
    expect(results.totalFound).toBeGreaterThan(0);
    const topFields = results.items.slice(0, 10).map(r => r.program.fieldOfStudy);
    const hasCs = topFields.some(f => f === 'Computer Science' || f === 'Software Engineering' || f === 'Artificial Intelligence');
    expect(hasCs).toBe(true);
  });

  it('3. An unrelated program is not ranked as a close academic match for CS background', () => {
    const results = rankPrograms(programs, csCourses, DEFAULT_PREFERENCES, 'relevance');
    const csProg = results.items.find(r => r.program.fieldOfStudy === 'Computer Science');
    const lawProg = results.items.find(r => r.program.fieldOfStudy === 'Law');
    if (csProg && lawProg) {
      expect(csProg.relevanceScore).toBeGreaterThan(lawProg.relevanceScore);
    }
  });

  it('4. Strict country selection is strictly respected', () => {
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      preferredCountries: ['Netherlands'],
      countryMode: 'strict'
    };
    const results = rankPrograms(programs, csCourses, pref);
    expect(results.totalFound).toBeGreaterThan(0);
    for (const item of results.items) {
      expect(item.program.country).toBe('Netherlands');
    }
  });

  it('5. Multiple selected countries work correctly under strict mode', () => {
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      preferredCountries: ['Germany', 'Poland'],
      countryMode: 'strict'
    };
    const results = rankPrograms(programs, csCourses, pref);
    expect(results.totalFound).toBeGreaterThan(0);
    for (const item of results.items) {
      expect(['Germany', 'Poland']).toContain(item.program.country);
    }
  });

  it('6. University restrictions work correctly', () => {
    const targetUni = 'University of Regensburg';
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      preferredUniversities: [targetUni],
      universityMode: 'strict'
    };
    const results = rankPrograms(programs, csCourses, pref);
    expect(results.totalFound).toBeGreaterThan(0);
    for (const item of results.items) {
      expect(item.program.university).toBe(targetUni);
    }
  });

  it('7. Degree-level restrictions work correctly', () => {
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      intendedDegreeLevel: 'Master'
    };
    const results = rankPrograms(programs, csCourses, pref);
    expect(results.totalFound).toBeGreaterThan(0);
    for (const item of results.items) {
      expect(item.program.degreeLevel).toBe('Master');
    }
  });

  it('8. Language preferences behave correctly under strict mode', () => {
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      languages: ['English'],
      languageMode: 'strict'
    };
    const results = rankPrograms(programs, csCourses, pref);
    expect(results.totalFound).toBeGreaterThan(0);
    for (const item of results.items) {
      if (item.program.teachingLanguages && item.program.teachingLanguages.length > 0) {
        expect(item.program.teachingLanguages).toContain('English');
      }
    }
  });

  it('9. Missing language information is handled honestly without false rejection', () => {
    const programWithoutLang = { ...verifiedPrograms[0], teachingLanguages: undefined };
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      languages: ['English'],
      languageMode: 'strict'
    };
    const check = matchesHardConstraints(programWithoutLang, pref);
    expect(check.matches).toBe(true);
  });

  it('10. Changes to courses update recommendations dynamically', () => {
    const resA = rankPrograms(programs, mathCourses, DEFAULT_PREFERENCES, 'relevance');
    const resB = rankPrograms(programs, csCourses, DEFAULT_PREFERENCES, 'relevance');
    expect(resA.items[0].program.id).not.toBe(resB.items[0].program.id);
  });

  it('11. Changes to credits update verified requirement coverage', () => {
    const baseCourse = testCourse('Advanced Linear Algebra', 18, 'math');
    const resFull = rankPrograms(verifiedPrograms, [baseCourse], DEFAULT_PREFERENCES);
    const regDsFull = resFull.items.find(r => r.program.id === 'reg-ds');

    const reducedCourse = { ...baseCourse, credits: 6, verifiedEcts: 6 };
    const resReduced = rankPrograms(verifiedPrograms, [reducedCourse], DEFAULT_PREFERENCES);
    const regDsReduced = resReduced.items.find(r => r.program.id === 'reg-ds');

    expect(regDsFull?.verifiedAnalysis?.relevantEcts).toBeGreaterThan(
      regDsReduced?.verifiedAnalysis?.relevantEcts || 0
    );
  });

  it('12. Unknown credit conversions are not treated as verified ECTS', () => {
    const localCourse = testCourse('Algorithm Design', 10, 'theory', true, 'local', null);
    const res = rankPrograms(verifiedPrograms, [localCourse], DEFAULT_PREFERENCES);
    const regCs = res.items.find(r => r.program.id === 'reg-cs');
    expect(regCs?.verifiedAnalysis?.relevantEcts).toBe(0);
  });

  it('13. Programs without verified admission rules are labeled potential matches', () => {
    const unverifiedProgram = programs.find(p => !p.academicAnalysisAvailability);
    expect(unverifiedProgram).toBeDefined();
    if (unverifiedProgram) {
      const res = rankPrograms([unverifiedProgram], csCourses, DEFAULT_PREFERENCES);
      expect(res.items[0].matchType).toBe('potential');
      expect(res.items[0].explanation.warnings.some(w => w.includes('Potential academic match'))).toBe(true);
    }
  });

  it('14. Regulated disciplines receive explicit review warnings', () => {
    const medProgram = programs.find(p => p.fieldOfStudy === 'Medicine');
    if (medProgram) {
      const res = rankPrograms([medProgram], csCourses, DEFAULT_PREFERENCES);
      expect(res.items[0].isRegulated).toBe(true);
      expect(res.items[0].explanation.warnings.some(w => w.includes('Regulated profession warning'))).toBe(true);
    }
  });

  it('15. Identical inputs produce stable, deterministic ranking', () => {
    const run1 = rankPrograms(programs.slice(0, 100), csCourses, DEFAULT_PREFERENCES, 'relevance');
    const run2 = rankPrograms(programs.slice(0, 100), csCourses, DEFAULT_PREFERENCES, 'relevance');
    expect(run1.items.map(i => i.program.id)).toEqual(run2.items.map(i => i.program.id));
    expect(run1.items.map(i => i.relevanceScore)).toEqual(run2.items.map(i => i.relevanceScore));
  });

  it('16. Empty profiles do not produce fabricated personalized academic matches', () => {
    const res = rankPrograms(programs, [], DEFAULT_PREFERENCES);
    expect(res.items.length).toBe(0);
    expect(res.totalFound).toBe(0);
  });

  it('17. Contradictory preferences produce a clear empty state', () => {
    const pref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      preferredCountries: ['Iceland'],
      countryMode: 'strict',
      preferredUniversities: ['University of Regensburg'], // In Germany
      universityMode: 'strict'
    };
    const res = rankPrograms(programs, csCourses, pref);
    expect(res.totalFound).toBe(0);
    expect(res.items.length).toBe(0);
  });

  it('18. Removing a filter correctly restores matching records', () => {
    const strictPref: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      preferredCountries: ['Poland'],
      countryMode: 'strict'
    };
    const resFiltered = rankPrograms(programs, csCourses, strictPref);
    const resAll = rankPrograms(programs, csCourses, { ...strictPref, countryMode: 'all', preferredCountries: [] });
    expect(resAll.totalFound).toBeGreaterThan(resFiltered.totalFound);
  });

  it('19. Unconfirmed coursework does not produce confirmed ECTS coverage', () => {
    const unconfirmed = csCourses.map(c => ({ ...c, confirmed: false }));
    const res = rankPrograms(verifiedPrograms, unconfirmed, DEFAULT_PREFERENCES);
    for (const item of res.items) {
      expect(item.verifiedAnalysis?.relevantEcts).toBe(0);
    }
  });

  it('20. Double counting prevention and nested rules are preserved', () => {
    const probCourse = testCourse('Probability & Stochastics', 6, 'stochastics');
    const res = rankPrograms(verifiedPrograms, [probCourse], DEFAULT_PREFERENCES);
    const hamburg = res.items.find(r => r.program.id === 'hamburg-dsai');
    expect(hamburg).toBeDefined();
    // Stochastics is nested inside Math in Hamburg; relevant ECTS must be 6, not doubled to 12
    expect(hamburg?.verifiedAnalysis?.relevantEcts).toBe(6);
  });
});
