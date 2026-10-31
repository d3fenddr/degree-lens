import type { Program } from '../types';
import type { UserPreferences } from './matching.types';

export const DEFAULT_PREFERENCES: UserPreferences = {
  preferredCountries: [],
  countryMode: 'all',
  preferredUniversities: [],
  universityMode: 'any',
  preferredDisciplines: [],
  disciplineMode: 'any',
  intendedDegreeLevel: 'Any',
  languages: [],
  languageMode: 'any',
  verifiedOnly: false
};

export function matchesHardConstraints(program: Program, preferences: UserPreferences): { matches: boolean; reason?: string } {
  // 1. Verified ECTS filter
  if (preferences.verifiedOnly && !program.academicAnalysisAvailability) {
    return { matches: false, reason: 'Program does not have verified ECTS requirements.' };
  }

  // 2. Strict country restriction
  if (preferences.countryMode === 'strict' && preferences.preferredCountries.length > 0) {
    if (!program.country || !preferences.preferredCountries.includes(program.country)) {
      return { matches: false, reason: `Country (${program.country || 'Unknown'}) not in selected countries.` };
    }
  }

  // 3. Strict university restriction
  if (preferences.universityMode === 'strict' && preferences.preferredUniversities.length > 0) {
    const uniLower = program.university.toLowerCase();
    const isMatched = preferences.preferredUniversities.some(u => u.toLowerCase() === uniLower || uniLower.includes(u.toLowerCase()));
    if (!isMatched) {
      return { matches: false, reason: `Institution (${program.university}) not in selected universities.` };
    }
  }

  // 4. Mandatory discipline restriction
  if (preferences.disciplineMode === 'mandatory' && preferences.preferredDisciplines.length > 0) {
    const programField = program.fieldOfStudy?.toLowerCase() || '';
    const broadCategory = program.broadCategory?.toLowerCase() || '';
    const isMatched = preferences.preferredDisciplines.some(d => {
      const dLower = d.toLowerCase();
      return programField.includes(dLower) || dLower.includes(programField) || broadCategory.includes(dLower);
    });
    if (!isMatched) {
      return { matches: false, reason: `Field (${program.fieldOfStudy || 'Unknown'}) not in required disciplines.` };
    }
  }

  // 5. Intended degree level restriction
  if (preferences.intendedDegreeLevel && preferences.intendedDegreeLevel !== 'Any') {
    if (program.degreeLevel && program.degreeLevel !== preferences.intendedDegreeLevel) {
      return { matches: false, reason: `Degree level (${program.degreeLevel}) does not match intended level (${preferences.intendedDegreeLevel}).` };
    }
  }

  // 6. Strict language restriction
  if (preferences.languageMode === 'strict' && preferences.languages.length > 0) {
    const programLangs = (program.teachingLanguages || []).map(l => l.toLowerCase());
    if (programLangs.length > 0) {
      const hasLang = preferences.languages.some(lang => programLangs.includes(lang.toLowerCase()));
      if (!hasLang) {
        return { matches: false, reason: `Teaching language (${program.teachingLanguages?.join(', ')}) does not match preferred languages.` };
      }
    }
  }

  return { matches: true };
}
