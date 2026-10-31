import type { Course, Topic } from '../types';
import { verifiedCredits } from '../engine';
import type { AcademicProfile, InferredField } from './matching.types';
import { FIELD_KEYWORDS, TOPIC_TO_FIELDS } from './taxonomy';

const ALL_TOPICS: Topic[] = ['math', 'stochastics', 'theory', 'systems', 'practical', 'programming', 'data', 'cs'];

export function buildAcademicProfile(
  courses: Course[],
  metadata?: {
    previousDegreeField?: string;
    previousDegreeLevel?: string;
    degreeStatus?: 'completed' | 'in_progress' | 'unknown';
  }
): AcademicProfile {
  const confirmed = courses.filter(c => c.confirmed && verifiedCredits(c) !== null);
  const unconfirmed = courses.filter(c => !c.confirmed || verifiedCredits(c) === null);

  const topicDistribution: Record<Topic, number> = {
    math: 0,
    stochastics: 0,
    theory: 0,
    systems: 0,
    practical: 0,
    programming: 0,
    data: 0,
    cs: 0
  };

  let totalCredits = 0;
  let verifiedEcts = 0;

  for (const c of courses) {
    totalCredits += c.credits || 0;
  }

  for (const c of confirmed) {
    const ects = verifiedCredits(c) || 0;
    verifiedEcts += ects;
    if (c.selectedTopic && ALL_TOPICS.includes(c.selectedTopic as Topic)) {
      topicDistribution[c.selectedTopic as Topic] += ects;
    }
  }

  // Field weighting map: field -> { score, courseCount, ectsSum }
  const fieldAccumulator = new Map<string, { weight: number; courseCount: number; ectsSum: number }>();

  // 1. Topic contributions from confirmed courses
  for (const [topicStr, ects] of Object.entries(topicDistribution)) {
    if (ects <= 0) continue;
    const topic = topicStr as Topic;
    const mapped = TOPIC_TO_FIELDS[topic] || [];
    for (const { field, weight } of mapped) {
      const current = fieldAccumulator.get(field) || { weight: 0, courseCount: 0, ectsSum: 0 };
      current.weight += ects * weight;
      current.ectsSum += ects;
      current.courseCount += 1;
      fieldAccumulator.set(field, current);
    }
  }

  // 2. Keyword hits from confirmed course titles and descriptions
  for (const c of confirmed) {
    const text = `${c.title} ${c.description || ''}`;
    const ects = verifiedCredits(c) || 0;
    for (const { field, pattern } of FIELD_KEYWORDS) {
      if (pattern.test(text)) {
        const current = fieldAccumulator.get(field) || { weight: 0, courseCount: 0, ectsSum: 0 };
        current.weight += ects * 0.9;
        current.ectsSum += ects;
        current.courseCount += 1;
        fieldAccumulator.set(field, current);
      }
    }
  }

  // 3. Explicit previous degree field if provided
  if (metadata?.previousDegreeField && metadata.previousDegreeField.trim()) {
    const explicit = metadata.previousDegreeField.trim();
    const current = fieldAccumulator.get(explicit) || { weight: 0, courseCount: 0, ectsSum: 0 };
    // Provide a solid baseline boost if declared
    current.weight += 30;
    current.courseCount += 1;
    fieldAccumulator.set(explicit, current);
  }

  // Format inferred fields
  const inferredFields: InferredField[] = Array.from(fieldAccumulator.entries())
    .map(([field, data]) => {
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (data.weight >= 30 && data.courseCount >= 3) confidence = 'high';
      else if (data.weight >= 12 && data.courseCount >= 2) confidence = 'medium';

      return {
        field,
        weight: Math.round(data.weight * 10) / 10,
        confidence,
        evidenceCourseCount: data.courseCount,
        ectsSum: Math.round(data.ectsSum * 10) / 10
      };
    })
    .sort((a, b) => b.weight - a.weight);

  // Top topics by verified ECTS
  const topTopics = ALL_TOPICS
    .filter(t => topicDistribution[t] > 0)
    .sort((a, b) => topicDistribution[b] - topicDistribution[a]);

  const dominantField = inferredFields.length > 0 ? inferredFields[0].field : null;

  return {
    totalCourses: courses.length,
    confirmedCourseCount: confirmed.length,
    unconfirmedCourseCount: unconfirmed.length,
    totalCredits: Math.round(totalCredits * 10) / 10,
    verifiedEcts: Math.round(verifiedEcts * 10) / 10,
    topicDistribution,
    topTopics,
    inferredFields,
    dominantField,
    completedDegreeLevel: metadata?.previousDegreeLevel,
    previousDegreeField: metadata?.previousDegreeField,
    degreeStatus: metadata?.degreeStatus || 'unknown'
  };
}
