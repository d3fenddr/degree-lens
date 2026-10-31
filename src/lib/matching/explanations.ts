import type { Analysis, Program, Topic } from '../types';
import type { AcademicProfile, MatchExplanation, UserPreferences } from './matching.types';
import { isRegulatedField } from './taxonomy';

const TOPIC_LABELS: Record<Topic, string> = {
  math: 'Mathematics',
  stochastics: 'Stochastics & Statistics',
  theory: 'Theoretical Computer Science',
  systems: 'Computer Engineering & Systems',
  practical: 'Practical Computer Science & Databases',
  programming: 'Software Development & Programming',
  data: 'Data Science & Machine Learning',
  cs: 'Computer Science'
};

export function buildExplanation(
  program: Program,
  profile: AcademicProfile,
  preferences: UserPreferences,
  verifiedAnalysis?: Analysis
): MatchExplanation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const matchedCriteria: { label: string; detail: string }[] = [];
  const isRegulated = isRegulatedField(program.fieldOfStudy || '');

  // 1. Verified Coursework Matching Explanation
  if (program.academicAnalysisAvailability && verifiedAnalysis) {
    const coveredCount = verifiedAnalysis.coverage.filter(c => c.status === 'Requirement covered').length;
    const totalCount = verifiedAnalysis.coverage.length;
    reasons.push(
      `Verified coursework analysis: ${coveredCount} of ${totalCount} documented category requirements are met by your confirmed credits.`
    );
    matchedCriteria.push({
      label: 'Verified ECTS Coverage',
      detail: `${verifiedAnalysis.relevantEcts} ECTS allocated across documented admission categories.`
    });

    const gapRules = verifiedAnalysis.coverage.filter(c => c.status === 'Evidence gap');
    if (gapRules.length > 0) {
      warnings.push(
        `Coursework evidence gap in: ${gapRules.map(g => `${g.rule.label} (${Math.max(0, g.rule.minimum - g.ects)} ECTS needed)`).join(', ')}.`
      );
    }

    if (verifiedAnalysis.warnings.length > 0) {
      warnings.push(...verifiedAnalysis.warnings.slice(0, 2));
    }
  } else {
    // 2. Potential Match Explanation
    warnings.push(
      'Potential academic match: specific prerequisite course thresholds for this program have not been verified in the local engine. Consult official university admission regulations.'
    );
  }

  // 3. Regulated Field Warning
  if (isRegulated) {
    warnings.push(
      `Regulated profession warning: ${program.fieldOfStudy} admission requires formal qualifying credentials and statutory state recognition; related coursework alone does not confer eligibility.`
    );
  }

  // 4. Academic Field & Coursework Synergies
  const programField = program.fieldOfStudy || '';
  const matchingInferred = profile.inferredFields.find(f => f.field.toLowerCase() === programField.toLowerCase());
  if (matchingInferred && matchingInferred.ectsSum > 0) {
    reasons.push(
      `Direct academic background: you have ${matchingInferred.ectsSum} confirmed ECTS across ${matchingInferred.evidenceCourseCount} courses in ${programField}.`
    );
    matchedCriteria.push({
      label: 'Subject Alignment',
      detail: `${matchingInferred.ectsSum} ECTS documented in ${programField}.`
    });
  } else if (profile.dominantField) {
    reasons.push(
      `Interdisciplinary relevance: your primary background in ${profile.dominantField} aligns with ${program.broadCategory || programField}.`
    );
  }

  // 5. Significant Topic Overlaps
  for (const topic of profile.topTopics.slice(0, 2)) {
    const ects = profile.topicDistribution[topic];
    if (ects >= 12) {
      const topicName = TOPIC_LABELS[topic] || topic;
      matchedCriteria.push({
        label: topicName,
        detail: `${ects} confirmed ECTS in ${topicName}.`
      });
    }
  }

  // 6. User Preferences Alignment
  if (program.country && preferences.preferredCountries.includes(program.country)) {
    reasons.push(`Country alignment: matches your preference for ${program.country}.`);
    matchedCriteria.push({
      label: 'Location',
      detail: `${program.country} (${program.city})`
    });
  }

  if (preferences.preferredUniversities.some(u => u.toLowerCase() === program.university.toLowerCase())) {
    reasons.push(`Institution alignment: matches your selected institution ${program.university}.`);
    matchedCriteria.push({
      label: 'Institution',
      detail: program.university
    });
  }

  if (program.degreeLevel && preferences.intendedDegreeLevel === program.degreeLevel) {
    matchedCriteria.push({
      label: 'Degree Level',
      detail: program.degreeAward || program.degreeLevel
    });
  }

  // Summary headline
  const summary = program.academicAnalysisAvailability && verifiedAnalysis
    ? `Verified evaluation: ${verifiedAnalysis.relevantEcts} ECTS allocated across ${verifiedAnalysis.coverage.length} categories.`
    : `Potential match based on ${profile.dominantField || 'coursework'} synergies and stated study preferences.`;

  return {
    summary,
    reasons,
    warnings,
    matchedCriteria
  };
}
