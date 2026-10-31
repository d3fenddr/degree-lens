import type { Course, Program } from '../types';
import { analyze } from '../engine';
import { buildExplanation } from './explanations';
import type { Recommendation, RecommendationResults, RecommendationSortOption, UserPreferences } from './matching.types';
import { matchesHardConstraints } from './preferences';
import { buildAcademicProfile } from './profile';
import { calculateFieldRelatedness, isRegulatedField } from './taxonomy';

export function rankPrograms(
  catalogPrograms: Program[],
  courses: Course[],
  preferences: UserPreferences,
  sortOption: RecommendationSortOption = 'verifiedFirst',
  profileMetadata?: {
    previousDegreeField?: string;
    previousDegreeLevel?: string;
    degreeStatus?: 'completed' | 'in_progress' | 'unknown';
  }
): RecommendationResults {
  const profile = buildAcademicProfile(courses, profileMetadata);
  const hasAcademicEvidence = profile.confirmedCourseCount > 0 && profile.verifiedEcts > 0;

  // Track applied filters for UI reporting
  const appliedFilters: { label: string; count?: number }[] = [];
  if (preferences.preferredCountries.length > 0) {
    appliedFilters.push({
      label: `Countries (${preferences.preferredCountries.length}): ${preferences.preferredCountries.slice(0, 3).join(', ')}${preferences.preferredCountries.length > 3 ? '...' : ''}`
    });
  }
  if (preferences.preferredDisciplines.length > 0) {
    appliedFilters.push({
      label: `Disciplines (${preferences.preferredDisciplines.length}): ${preferences.preferredDisciplines.join(', ')}`
    });
  }
  if (preferences.intendedDegreeLevel && preferences.intendedDegreeLevel !== 'Any') {
    appliedFilters.push({ label: `Level: ${preferences.intendedDegreeLevel}` });
  }
  if (preferences.preferredUniversities.length > 0) {
    appliedFilters.push({ label: `Universities (${preferences.preferredUniversities.length})` });
  }
  if (preferences.verifiedOnly) {
    appliedFilters.push({ label: 'Verified ECTS rules only' });
  }

  // If no courses and no preferences, return empty without fabricated recommendations
  if (courses.length === 0 && appliedFilters.length === 0) {
    return {
      totalFound: 0,
      verifiedCount: 0,
      potentialCount: 0,
      items: [],
      appliedFilters
    };
  }

  const recommendations: Recommendation[] = [];

  for (const program of catalogPrograms) {
    // 1. Hard constraint filter check
    const hardCheck = matchesHardConstraints(program, preferences);
    if (!hardCheck.matches) continue;

    const isVerified = Boolean(program.academicAnalysisAvailability);
    let verifiedAnalysis = undefined;
    let score = 0;

    // 2. Verified ECTS calculation
    if (isVerified) {
      verifiedAnalysis = analyze(courses, program);
      const coveredRules = verifiedAnalysis.coverage.filter(c => c.status === 'Requirement covered').length;
      const totalRules = Math.max(1, verifiedAnalysis.coverage.length);
      const coverageFraction = coveredRules / totalRules;

      // Base 35 points for having verified rules + up to 35 for coverage fraction
      score += 25 + Math.round(coverageFraction * 35);

      // Volume of verified relevant ECTS (up to 15 points)
      score += Math.min(15, Math.round((verifiedAnalysis.relevantEcts / 60) * 15));
    } else {
      // Potential academic match scoring
      // A. Discipline alignment (up to 40 pts)
      const progField = program.fieldOfStudy || '';
      let bestFieldScore = 0;

      if (profile.dominantField) {
        bestFieldScore = Math.max(bestFieldScore, calculateFieldRelatedness(profile.dominantField, progField) * 35);
      }

      for (const inf of profile.inferredFields.slice(0, 3)) {
        const related = calculateFieldRelatedness(inf.field, progField);
        const weighted = related * 30 * (inf.confidence === 'high' ? 1.0 : inf.confidence === 'medium' ? 0.75 : 0.5);
        if (weighted > bestFieldScore) bestFieldScore = weighted;
      }

      score += Math.round(bestFieldScore);

      // B. Coursework topic volume (up to 25 pts)
      if (hasAcademicEvidence) {
        const relevantTopics = ['math', 'data', 'programming', 'practical', 'systems', 'theory'] as const;
        const relevantEcts = relevantTopics.reduce((sum, t) => sum + (profile.topicDistribution[t] || 0), 0);
        score += Math.min(25, Math.round((relevantEcts / 60) * 25));
      }
    }

    // C. Soft preference boosts (up to 20 pts)
    if (program.country && preferences.preferredCountries.includes(program.country)) {
      score += 7;
    }

    if (preferences.preferredUniversities.some(u => u.toLowerCase() === program.university.toLowerCase())) {
      score += 8;
    }

    if (preferences.preferredDisciplines.some(d => d.toLowerCase() === (program.fieldOfStudy || '').toLowerCase())) {
      score += 5;
    }

    // Clamp score
    const relevanceScore = Math.max(5, Math.min(98, score));

    // Tags
    const tags: string[] = [];
    if (isVerified) tags.push('Verified ECTS');
    if (program.degreeLevel) tags.push(program.degreeLevel);
    if (program.country) tags.push(program.country);
    if (isRegulatedField(program.fieldOfStudy || '')) tags.push('Regulated Field');

    const explanation = buildExplanation(program, profile, preferences, verifiedAnalysis);

    recommendations.push({
      program,
      matchType: isVerified ? 'verified' : 'potential',
      relevanceScore,
      explanation,
      verifiedAnalysis,
      isRegulated: isRegulatedField(program.fieldOfStudy || ''),
      tags,
      missingRequirementsNote: !isVerified
        ? 'Prerequisites must be checked directly against the university examination office.'
        : undefined
    });
  }

  // 3. Sorting
  recommendations.sort((a, b) => {
    if (sortOption === 'verifiedFirst') {
      if (a.matchType === 'verified' && b.matchType !== 'verified') return -1;
      if (b.matchType === 'verified' && a.matchType !== 'verified') return 1;
      return b.relevanceScore - a.relevanceScore;
    }
    if (sortOption === 'relevance') {
      return b.relevanceScore - a.relevanceScore;
    }
    if (sortOption === 'university') {
      return a.program.university.localeCompare(b.program.university);
    }
    if (sortOption === 'country') {
      const cA = a.program.country || '';
      const cB = b.program.country || '';
      return cA.localeCompare(cB) || b.relevanceScore - a.relevanceScore;
    }
    if (sortOption === 'degreeLevel') {
      const lA = a.program.degreeLevel || '';
      const lB = b.program.degreeLevel || '';
      return lA.localeCompare(lB) || b.relevanceScore - a.relevanceScore;
    }
    return b.relevanceScore - a.relevanceScore;
  });

  const verifiedCount = recommendations.filter(r => r.matchType === 'verified').length;
  const potentialCount = recommendations.length - verifiedCount;

  return {
    totalFound: recommendations.length,
    verifiedCount,
    potentialCount,
    items: recommendations,
    appliedFilters
  };
}
