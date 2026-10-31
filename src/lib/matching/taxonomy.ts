import type { Topic } from '../types';

export const REGULATED_FIELDS = new Set([
  'Medicine',
  'Dentistry',
  'Pharmacy',
  'Nursing',
  'Law',
  'Veterinary Medicine',
  'Clinical Psychology'
]);

// Map course Topic to ISCED-F fields
export const TOPIC_TO_FIELDS: Record<Topic, { field: string; weight: number }[]> = {
  data: [
    { field: 'Data Science', weight: 1.0 },
    { field: 'Artificial Intelligence', weight: 0.95 },
    { field: 'Computer Science', weight: 0.8 },
    { field: 'Statistics', weight: 0.75 }
  ],
  programming: [
    { field: 'Computer Science', weight: 1.0 },
    { field: 'Software Engineering', weight: 0.95 },
    { field: 'Data Science', weight: 0.7 },
    { field: 'Electrical Engineering', weight: 0.5 }
  ],
  practical: [
    { field: 'Computer Science', weight: 1.0 },
    { field: 'Software Engineering', weight: 0.9 },
    { field: 'Data Science', weight: 0.6 }
  ],
  systems: [
    { field: 'Computer Science', weight: 1.0 },
    { field: 'Electrical Engineering', weight: 0.85 },
    { field: 'Software Engineering', weight: 0.8 }
  ],
  theory: [
    { field: 'Computer Science', weight: 1.0 },
    { field: 'Mathematics', weight: 0.7 },
    { field: 'Data Science', weight: 0.6 }
  ],
  math: [
    { field: 'Mathematics', weight: 1.0 },
    { field: 'Physics', weight: 0.8 },
    { field: 'Computer Science', weight: 0.65 },
    { field: 'Economics', weight: 0.6 },
    { field: 'Data Science', weight: 0.6 },
    { field: 'Mechanical Engineering', weight: 0.6 },
    { field: 'Electrical Engineering', weight: 0.6 },
    { field: 'Civil Engineering', weight: 0.5 }
  ],
  stochastics: [
    { field: 'Statistics', weight: 1.0 },
    { field: 'Mathematics', weight: 0.9 },
    { field: 'Data Science', weight: 0.85 },
    { field: 'Economics', weight: 0.75 },
    { field: 'Finance', weight: 0.75 },
    { field: 'Computer Science', weight: 0.5 }
  ],
  cs: [
    { field: 'Computer Science', weight: 1.0 },
    { field: 'Software Engineering', weight: 0.85 },
    { field: 'Data Science', weight: 0.7 }
  ]
};

// Keyword patterns for fields not purely covered by the 8 CS/math topics
export const FIELD_KEYWORDS: { field: string; pattern: RegExp; broadCategory: string }[] = [
  { field: 'Medicine', pattern: /\b(anatomy|physiology|pathology|clinical|surgery|pediatric|oncology|internal medicine|pharmacology|medical|tibb|tibbiyot)\b/i, broadCategory: 'Health and Welfare' },
  { field: 'Dentistry', pattern: /\b(dentistry|dental|orthodontics|endodontics|prosthodontics|stomatology|periodont)\b/i, broadCategory: 'Health and Welfare' },
  { field: 'Pharmacy', pattern: /\b(pharmacy|pharmacology|pharmaceutical|drug delivery|pharmacotherapy|toxicology)\b/i, broadCategory: 'Health and Welfare' },
  { field: 'Nursing', pattern: /\b(nursing|nurse|patient care|midwifery|clinical nursing)\b/i, broadCategory: 'Health and Welfare' },
  { field: 'Public Health', pattern: /\b(public health|epidemiology|health policy|global health|biostatistics)\b/i, broadCategory: 'Health and Welfare' },
  { field: 'Law', pattern: /\b(law|legal|jurisprudence|constitutional|criminal law|civil law|tort|contract law|international law|hukuk|huquq)\b/i, broadCategory: 'Law' },
  { field: 'Economics', pattern: /\b(economics|microeconomics|macroeconomics|econometrics|monetary policy|game theory|development economics|iqtisad)\b/i, broadCategory: 'Social Sciences, Journalism and Information' },
  { field: 'Finance', pattern: /\b(finance|financial|banking|investment|corporate finance|portfolio|asset pricing|derivatives)\b/i, broadCategory: 'Business, Administration and Law' },
  { field: 'Accounting', pattern: /\b(accounting|audit|taxation|financial accounting|managerial accounting|bookkeeping|cost accounting)\b/i, broadCategory: 'Business, Administration and Law' },
  { field: 'Business Administration', pattern: /\b(management|marketing|business administration|operations|supply chain|strategy|human resources|entrepreneurship|organizational behavior)\b/i, broadCategory: 'Business, Administration and Law' },
  { field: 'Mechanical Engineering', pattern: /\b(thermodynamics|fluid mechanics|solid mechanics|mechanics of materials|kinematics|cad|robotics|heat transfer|manufacturing)\b/i, broadCategory: 'Engineering, Manufacturing and Construction' },
  { field: 'Electrical Engineering', pattern: /\b(circuit|circuits|signal processing|signals and systems|electromagnet|microelectronics|power systems|telecommunication|control systems|vlsi)\b/i, broadCategory: 'Engineering, Manufacturing and Construction' },
  { field: 'Civil Engineering', pattern: /\b(structural engineering|geotechnical|hydraulics|concrete|steel design|construction management|transportation engineering|soil mechanics)\b/i, broadCategory: 'Engineering, Manufacturing and Construction' },
  { field: 'Architecture', pattern: /\b(architectural design|urban planning|building design|architectural history|landscape architecture|spatial planning)\b/i, broadCategory: 'Engineering, Manufacturing and Construction' },
  { field: 'Physics', pattern: /\b(quantum mechanics|classical mechanics|electrodynamics|astrophysics|optics|condensed matter|nuclear physics|relativity|fizika)\b/i, broadCategory: 'Natural Sciences, Mathematics and Statistics' },
  { field: 'Chemistry', pattern: /\b(organic chemistry|inorganic chemistry|biochemistry|physical chemistry|analytical chemistry|spectroscopy|polymers|kimya)\b/i, broadCategory: 'Natural Sciences, Mathematics and Statistics' },
  { field: 'Biology', pattern: /\b(molecular biology|genetics|cell biology|microbiology|immunology|ecology|evolutionary biology|botany|zoology|biologiya)\b/i, broadCategory: 'Natural Sciences, Mathematics and Statistics' },
  { field: 'Psychology', pattern: /\b(cognitive psychology|developmental psychology|social psychology|neuropsychology|clinical psychology|psychopathology|psychological|psixologiya)\b/i, broadCategory: 'Social Sciences, Journalism and Information' },
  { field: 'Sociology', pattern: /\b(sociology|social theory|qualitative methods|social stratification|demography|sociological|sosyoloji)\b/i, broadCategory: 'Social Sciences, Journalism and Information' },
  { field: 'Political Science', pattern: /\b(political science|international relations|comparative politics|political theory|public policy|governance)\b/i, broadCategory: 'Social Sciences, Journalism and Information' },
  { field: 'Education', pattern: /\b(pedagogy|curriculum|educational psychology|teaching methods|didactics|instructional design|special education)\b/i, broadCategory: 'Education' },
  { field: 'Languages and Literature', pattern: /\b(linguistics|literature|german philology|english studies|romance studies|syntax|phonology|translation|literary theory)\b/i, broadCategory: 'Arts and Humanities' },
  { field: 'Philosophy', pattern: /\b(philosophy|epistemology|metaphysics|ethics|moral philosophy|existentialism|logic and philosophy)\b/i, broadCategory: 'Arts and Humanities' },
  { field: 'History', pattern: /\b(modern history|ancient history|medieval history|historiography|european history|world history|tarikh)\b/i, broadCategory: 'Arts and Humanities' },
  { field: 'Environmental Science', pattern: /\b(environmental science|climatology|sustainability|ecology|conservation|geology|earth science|geosciences)\b/i, broadCategory: 'Natural Sciences, Mathematics and Statistics' }
];

export function isRegulatedField(field: string): boolean {
  return REGULATED_FIELDS.has(field);
}

// Compute field-to-field academic relatedness score (0.0 to 1.0)
export function calculateFieldRelatedness(sourceField: string, targetField: string): number {
  if (!sourceField || !targetField) return 0;
  if (sourceField.toLowerCase() === targetField.toLowerCase()) return 1.0;

  // Known high-affinity sibling fields
  const affinityPairs: [string, string, number][] = [
    ['Computer Science', 'Data Science', 0.85],
    ['Computer Science', 'Artificial Intelligence', 0.9],
    ['Computer Science', 'Software Engineering', 0.95],
    ['Data Science', 'Artificial Intelligence', 0.95],
    ['Data Science', 'Statistics', 0.85],
    ['Data Science', 'Mathematics', 0.7],
    ['Mathematics', 'Statistics', 0.85],
    ['Mathematics', 'Physics', 0.7],
    ['Computer Science', 'Electrical Engineering', 0.65],
    ['Economics', 'Finance', 0.8],
    ['Economics', 'Business Administration', 0.7],
    ['Finance', 'Business Administration', 0.8],
    ['Accounting', 'Business Administration', 0.85],
    ['Accounting', 'Finance', 0.8],
    ['Medicine', 'Dentistry', 0.5],
    ['Medicine', 'Pharmacy', 0.45],
    ['Medicine', 'Biology', 0.4],
    ['Mechanical Engineering', 'Electrical Engineering', 0.55],
    ['Mechanical Engineering', 'Civil Engineering', 0.5],
    ['Mechanical Engineering', 'General Engineering', 0.8],
    ['Sociology', 'Political Science', 0.7],
    ['Psychology', 'Education', 0.6]
  ];

  for (const [a, b, score] of affinityPairs) {
    if (
      (a.toLowerCase() === sourceField.toLowerCase() && b.toLowerCase() === targetField.toLowerCase()) ||
      (b.toLowerCase() === sourceField.toLowerCase() && a.toLowerCase() === targetField.toLowerCase())
    ) {
      return score;
    }
  }

  return 0.1; // Default low background relatedness
}
