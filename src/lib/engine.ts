import type { Analysis, Course, Match, Program, Topic } from './types';
import { courseSchema } from './schema';

const signals: [Topic, RegExp][] = [
  ['stochastics', /probabilit|wahrscheinlichkeit|statistic|statistik|stochast|bayes|random process|ehtimal|ihtimal/],
  ['theory', /algorithm|algorithmen|data structures|datenstrukturen|automata|automaten|complexity|komplexitat|computability|formal language|formale sprach|graph theory|graphentheorie|logic|logik/],
  ['systems', /operating system|betriebssystem|computer architect|rechnerarchitektur|network|netzwerk|distributed system|verteilte system|embedded|rechnernetze/],
  ['programming', /programming|programmier|coding|java\b|python\b|c\+\+|object.oriented|obyekt.yonumlu/],
  ['practical', /database|datenbank|software engineering|softwaretechnik|information system|informationssystem|security|sicherheit|visualization|visualisierung|graphics|grafik/],
  ['data', /machine learning|maschinelles lernen|artificial intelligence|kunstliche intelligenz|data science|datenwissenschaft|deep learning|big data|data mining|neural network|suni intellekt/],
  ['math', /linear algebra|lineare algebra|analysis|calculus|numerical|numerik|mathemat|geometry|geometrie|discrete math|diskrete mathematik|optimization|optimierung|riyaziyyat/],
];

export function normalizeTitle(title: string) {
  return title.toLocaleLowerCase('en').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9+]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function suggestTopics(course: Pick<Course, 'title' | 'description'>): Topic[] {
  const title = normalizeTitle(course.title);
  const description = normalizeTitle(course.description);
  const titleHits = signals.filter(([, pattern]) => pattern.test(title)).map(([topic]) => topic);
  return titleHits.length ? titleHits : signals.filter(([, pattern]) => pattern.test(description)).map(([topic]) => topic);
}

export function verifiedCredits(course: Course): number | null {
  if (!course.confirmed || !courseSchema.safeParse(course).success) return null;
  const value = course.creditSystem === 'ECTS' ? course.credits : course.verifiedEcts;
  return value !== null && Number.isFinite(value) && value > 0 && value <= 60 ? value : null;
}

export function analyze(courses: Course[], program: Program): Analysis {
  const parents = program.rules.filter(rule => !rule.parentId);
  const allocated = new Map<string, number>();
  const matches: Match[] = [];
  const candidates = courses.flatMap(course => {
    const ects = verifiedCredits(course);
    if (ects === null) return [];
    const topics = course.selectedTopic ? [course.selectedTopic] : suggestTopics(course);
    if (!course.selectedTopic) return [];
    return parents.flatMap(rule => topics.some(topic => rule.topics.includes(topic)) && !rule.excludedTypes?.includes(course.type)
      ? [{ course, rule, ects, topic: topics[0] }] : []);
  });
  // Specific rules take priority; remaining credits can flow to broad "further" categories.
  const options = (courseId: string) => candidates.filter(candidate => candidate.course.id === courseId).length;
  candidates.sort((a, b) => a.rule.topics.length - b.rule.topics.length || options(a.course.id) - options(b.course.id) || a.rule.id.localeCompare(b.rule.id) || a.course.id.localeCompare(b.course.id));
  for (const { course, rule, ects, topic } of candidates) {
    const remainingCourse = ects - (allocated.get(course.id) ?? 0);
    const remainingRule = rule.minimum - matches.filter(match => match.ruleId === rule.id).reduce((sum, match) => sum + match.ects, 0);
    const amount = Math.min(remainingCourse, remainingRule);
    if (amount <= 0) continue;
    matches.push({ courseId: course.id, ruleId: rule.id, ects: amount, topic, confidence: 'confirmed', reason: `${course.title} was assigned to ${rule.label} by the user.` });
    allocated.set(course.id, (allocated.get(course.id) ?? 0) + amount);
  }
  const coverage = program.rules.map(rule => {
    const ruleMatches = rule.parentId
      ? matches.filter(match => match.ruleId === rule.parentId && rule.topics.includes(match.topic))
      : matches.filter(match => match.ruleId === rule.id);
    const ects = ruleMatches.reduce((sum, match) => sum + match.ects, 0);
    const unresolved = courses.some(course => {
      if (verifiedCredits(course) !== null || rule.excludedTypes?.includes(course.type)) return false;
      const topics = course.selectedTopic ? [course.selectedTopic] : suggestTopics(course);
      return topics.some(topic => rule.topics.includes(topic));
    });
    return { rule, ects, matches: ruleMatches, status: (ects >= rule.minimum ? 'Requirement covered' : unresolved ? 'Needs review' : 'Evidence gap') as 'Requirement covered' | 'Evidence gap' | 'Needs review' };
  });
  const unmatched = courses.filter(course => !allocated.has(course.id));
  const warnings = [
    ...courses.filter(course => !course.confirmed || verifiedCredits(course) === null).map(course => `${course.title || 'Untitled course'}: ECTS equivalence needs confirmation.`),
    ...courses.filter(course => verifiedCredits(course) !== null && !course.selectedTopic).map(course => `${course.title}: review the suggested topic and confirm a mapping.`),
  ];
  return { program, coverage, unmatched, warnings, relevantEcts: [...allocated.values()].reduce((sum, ects) => sum + ects, 0) };
}
