export type Topic = 'math' | 'stochastics' | 'theory' | 'systems' | 'practical' | 'data' | 'programming' | 'cs';
export type CourseType = 'lecture' | 'seminar' | 'lab' | 'internship' | 'thesis' | 'project';
export type CreditSystem = 'ECTS' | 'UK CATS' | 'US Semester Hours' | 'local';

export type CourseReviewStatus = 'valid' | 'suspicious-credit' | 'potential-grade' | 'duplicate-title' | 'unconfirmed-conversion';

export type Course = {
  id: string;
  title: string;
  credits: number;
  creditSystem: CreditSystem;
  verifiedEcts: number | null;
  semester: string;
  type: CourseType;
  description: string;
  selectedTopic: Topic | '';
  page?: number;
  confirmed: boolean;
  grade?: string;
  reviewStatus?: CourseReviewStatus;
  reviewWarning?: string;
};

export type Rule = {
  id: string;
  label: string;
  minimum: number;
  topics: Topic[];
  excludedTypes?: CourseType[];
  parentId?: string;
  note?: string;
  sourceUrl: string;
};

export type DegreeLevel = 'Bachelor' | 'Master' | 'Doctorate' | 'State Examination' | 'Other';

export type Program = {
  id: string;
  university: string;
  name: string;
  city: string;
  country?: string;
  countryCode?: string;
  webpage?: string;
  sourceUrl: string;
  verified?: string;
  rules?: Rule[];
  conditions?: string[];
  note?: string;
  pathway?: string;
  degreeLevel?: DegreeLevel;
  degreeAward?: string;
  iscedFieldCode?: string;
  fieldOfStudy?: string;
  broadCategory?: string;
  totalCredits?: number;
  creditSystem?: string;
  teachingLanguages?: string[];
  officialProgramUrl?: string;
  academicAnalysisAvailability?: boolean;
  sourceProvider?: string;
  sourceLicense?: string;
};

export type Match = {
  courseId: string;
  ruleId: string;
  ects: number;
  reason: string;
  confidence: 'confirmed' | 'suggested';
  topic: Topic;
};

export type Coverage = {
  rule: Rule;
  ects: number;
  status: 'Requirement covered' | 'Evidence gap' | 'Needs review';
  matches: Match[];
};

export type Analysis = {
  program: Program;
  coverage: Coverage[];
  unmatched: Course[];
  warnings: string[];
  relevantEcts: number;
};
