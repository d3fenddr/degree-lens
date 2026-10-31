import type { Analysis, DegreeLevel, Program, Topic } from '../types';

export type PreferenceMode = 'all' | 'strict' | 'preferred';

export type UserPreferences = {
  preferredCountries: string[];
  countryMode: 'all' | 'strict' | 'preferred';
  preferredUniversities: string[];
  universityMode: 'any' | 'strict' | 'preferred';
  preferredDisciplines: string[];
  disciplineMode: 'any' | 'mandatory' | 'preferred';
  intendedDegreeLevel: 'Any' | DegreeLevel;
  languages: string[];
  languageMode: 'any' | 'strict';
  verifiedOnly: boolean;
};

export type InferredField = {
  field: string;
  weight: number;
  confidence: 'high' | 'medium' | 'low';
  evidenceCourseCount: number;
  ectsSum: number;
};

export type AcademicProfile = {
  totalCourses: number;
  confirmedCourseCount: number;
  unconfirmedCourseCount: number;
  totalCredits: number;
  verifiedEcts: number;
  topicDistribution: Record<Topic, number>;
  topTopics: Topic[];
  inferredFields: InferredField[];
  dominantField: string | null;
  completedDegreeLevel?: string;
  previousDegreeField?: string;
  degreeStatus?: 'completed' | 'in_progress' | 'unknown';
};

export type MatchExplanation = {
  summary: string;
  reasons: string[];
  warnings: string[];
  matchedCriteria: { label: string; detail: string }[];
};

export type Recommendation = {
  program: Program;
  matchType: 'verified' | 'potential';
  relevanceScore: number; // 0 to 100 documented relevance score (NOT admission probability)
  explanation: MatchExplanation;
  verifiedAnalysis?: Analysis;
  missingRequirementsNote?: string;
  isRegulated: boolean;
  tags: string[];
};

export type RecommendationSortOption = 'relevance' | 'verifiedFirst' | 'university' | 'country' | 'degreeLevel';

export type RecommendationResults = {
  totalFound: number;
  verifiedCount: number;
  potentialCount: number;
  items: Recommendation[];
  appliedFilters: { label: string; count?: number }[];
};
