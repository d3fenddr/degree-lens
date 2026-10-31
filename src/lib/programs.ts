import type { Program, Rule, Topic } from './types';
import programCatalog from '../data/programs.json';

const regDs = 'https://www.uni-regensburg.de/en/informatics-data-science/study/prospective-students/msc-data-science/application-admission';
const regCs = 'https://www.uni-regensburg.de/en/informatics-data-science/study/prospective-students/msc-computer-science/application-amp-admission';
const bonn = 'https://www.informatik.uni-bonn.de/en/studies/master-programs/master-program-application';
const hamburg = 'https://www.inf.uni-hamburg.de/en/studies/master/dsai.html';
const rule = (id: string, label: string, minimum: number, topics: Topic[], sourceUrl: string, extra: Partial<Rule> = {}): Rule => ({ id, label, minimum, topics, sourceUrl, ...extra });

const regConditions = [
  'Recognized degree with at least six semesters / 180 credits and grade 2.5 or better; a pending degree may qualify with at least 138 ECTS and a provisional grade.',
  'English B2 evidence; English-medium study alone is insufficient unless the thesis was written in English.',
  'VPD from uni-assist for applicants with a non-German entrance qualification or first degree; GRE Quantitative 164 where the first degree is outside Lisbon Convention countries; APS for China, India or Vietnam where applicable.',
  'Curricular analysis form, module catalog and application documents are required; a second-stage essay may apply.',
];
const bonnConditions = [
  'A recognized Computer Science or related bachelor degree; relatedness and equivalence require university assessment.',
  'A scientific bachelor thesis worth at least 12 ECTS must meet the university’s scientific writing standards; thesis content cannot be confirmed from credits alone.',
  'English C1 evidence and required application documents must be reviewed separately.',
  'All eligible applications enter a selection procedure; meeting coursework minima does not guarantee admission.',
];

export const verifiedPrograms: Program[] = [
  { id: 'reg-ds', university: 'University of Regensburg', name: 'M.Sc. Data Science', city: 'Regensburg', country: 'Germany', countryCode: 'DE', webpage: regDs, sourceUrl: regDs, verified: '2026-10-31', academicAnalysisAvailability: true, degreeLevel: 'Master', degreeAward: 'M.Sc.', fieldOfStudy: 'Data Science', broadCategory: 'Information and Communication Technologies', iscedFieldCode: '0613', totalCredits: 120, creditSystem: 'ECTS', note: 'Full category total is 54 ECTS. Aptitude assessment can allow admission from 30 ECTS with up to 24 ECTS made up during the master’s program; the university decides the outcome.', conditions: regConditions, rules: [
    rule('rds-data', 'Data Science / Statistics / Machine Learning', 18, ['data', 'stochastics'], regDs),
    rule('rds-math', 'Mathematics', 18, ['math', 'stochastics'], regDs),
    rule('rds-prog', 'Programming', 6, ['programming'], regDs),
    rule('rds-further', 'Further relevant modules', 12, ['data', 'math', 'stochastics', 'programming', 'theory', 'systems', 'practical', 'cs'], regDs),
  ] },
  { id: 'reg-cs', university: 'University of Regensburg', name: 'M.Sc. Computer Science', city: 'Regensburg', country: 'Germany', countryCode: 'DE', webpage: regCs, sourceUrl: regCs, verified: '2026-10-31', academicAnalysisAvailability: true, degreeLevel: 'Master', degreeAward: 'M.Sc.', fieldOfStudy: 'Computer Science', broadCategory: 'Information and Communication Technologies', iscedFieldCode: '061', totalCredits: 120, creditSystem: 'ECTS', note: 'Full category total is 78 ECTS. Aptitude assessment can allow admission from 60 ECTS with missing credits made up during the master’s program; the university decides the outcome.', conditions: regConditions, rules: [
    rule('rcs-theory', 'Theoretical Computer Science', 12, ['theory'], regCs),
    rule('rcs-systems', 'Computer Engineering', 12, ['systems'], regCs),
    rule('rcs-practical', 'Practical Computer Science', 12, ['practical', 'programming'], regCs),
    rule('rcs-further', 'Further Computer Science', 24, ['theory', 'systems', 'practical', 'programming', 'data', 'cs'], regCs),
    rule('rcs-math', 'Mathematics', 18, ['math', 'stochastics'], regCs),
  ] },
  ...(['Artificial Intelligence', 'Computer Science'] as const).map((name): Program => ({
    id: name === 'Artificial Intelligence' ? 'bonn-ai' : 'bonn-cs', university: 'University of Bonn', name: `M.Sc. ${name}`, city: 'Bonn', country: 'Germany', countryCode: 'DE', webpage: bonn, sourceUrl: bonn, verified: '2026-10-31', academicAnalysisAvailability: true, degreeLevel: 'Master', degreeAward: 'M.Sc.', fieldOfStudy: name === 'Artificial Intelligence' ? 'Artificial Intelligence' : 'Computer Science', broadCategory: 'Information and Communication Technologies', iscedFieldCode: name === 'Artificial Intelligence' ? '0613' : '061', totalCredits: 120, creditSystem: 'ECTS', note: 'The bachelor thesis is an additional requirement. Coursework matching cannot verify its scientific standard. Theoretical algorithms exclude programming-only work.', conditions: [...bonnConditions, ...(name === 'Artificial Intelligence' ? ['Summer entry is restricted unless at least 15 transferable master-level ECTS were earned previously.'] : [])], rules: [
      rule('bonn-math', 'Mathematical foundations', 18, ['math', 'stochastics'], bonn, { excludedTypes: ['internship', 'thesis', 'project'] }),
      rule('bonn-theory', 'Algorithm theory, complexity & formal languages', 14, ['theory'], bonn, { excludedTypes: ['internship', 'thesis', 'project'], note: 'Programming-only courses and practical work do not count.' }),
      rule('bonn-practical', 'Programming, software & information systems', name === 'Artificial Intelligence' ? 20 : 18, ['programming', 'practical', 'data'], bonn, { excludedTypes: ['internship', 'thesis', 'project'], note: 'Hardware and operating systems do not count.' }),
    ]
  })),
  { id: 'hamburg-dsai', university: 'University of Hamburg', name: 'M.Sc. Data Science and Artificial Intelligence', city: 'Hamburg', country: 'Germany', countryCode: 'DE', webpage: hamburg, sourceUrl: hamburg, verified: '2026-10-31', pathway: 'Computer science related bachelor degree pathway (1b)', academicAnalysisAvailability: true, degreeLevel: 'Master', degreeAward: 'M.Sc.', fieldOfStudy: 'Data Science', broadCategory: 'Information and Communication Technologies', iscedFieldCode: '0613', totalCredits: 120, creditSystem: 'ECTS', note: 'Stochastics is included within Mathematics, not added to it. This analysis covers pathway 1b only; the university also offers a separate specified Hamburg degree pathway.', conditions: [
    'A computer science related bachelor degree for pathway 1b; equivalence to the Hamburg Informatik curriculum requires university review.',
    'English C1 or a listed alternative such as IELTS 6.5 or TOEFL 90; an English-taught degree is generally insufficient as proof.',
    'Official application documents and submission within the published application period are mandatory.',
    'If the degree is pending, no more than 30 ECTS may remain, coursework minima must already be fulfilled, and thesis registration must be evidenced where applicable.',
    'Meeting minimum requirements does not guarantee selection; grade, degree content and relevant modules are assessed by a committee.',
  ], rules: [
    rule('hh-math', 'Mathematics', 24, ['math', 'stochastics'], hamburg, { excludedTypes: ['internship', 'thesis'] }),
    rule('hh-stoch', 'Including Stochastics', 6, ['stochastics'], hamburg, { parentId: 'hh-math', note: 'Subset of the 24 ECTS mathematics total.' }),
    rule('hh-cs', 'Computer Science', 60, ['theory', 'systems', 'practical', 'programming', 'data', 'cs'], hamburg, { excludedTypes: ['internship', 'thesis'] }),
  ] },
];

export const programs: Program[] = programCatalog.programs as unknown as Program[];

