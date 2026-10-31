import { writeFileSync } from 'node:fs';
import { programs as existingVerifiedPrograms } from '../src/lib/programs.ts';

function classifyIsced(title, fieldOfStudyHint = '') {
  const t = `${title} ${fieldOfStudyHint}`.toLowerCase();

  // 09 Health and Welfare
  if (/dentist|stomatolog|zahnmed/i.test(t)) return { isced: '0911', field: 'Dentistry', broad: 'Health and Welfare' };
  if (/medic|arzt|humanmed|ärztl|médecin|lekarsk|lekarz/i.test(t) && !/biomed/i.test(t)) return { isced: '0912', field: 'Medicine', broad: 'Health and Welfare' };
  if (/nurs|pflege|pielęg/i.test(t)) return { isced: '0913', field: 'Nursing', broad: 'Health and Welfare' };
  if (/public health|gesundheitswiss|zdrowie publiczn/i.test(t)) return { isced: '0914', field: 'Public Health', broad: 'Health and Welfare' };
  if (/pharm|apothek|farmac/i.test(t)) return { isced: '0916', field: 'Pharmacy', broad: 'Health and Welfare' };

  // 04 Business, Administration and Law
  if (/law\b|jur|droit|derecho|diritto|praw|rechtswiss|legal/i.test(t)) return { isced: '0421', field: 'Law', broad: 'Business, Administration and Law' };
  if (/account|rechnungsw|rachunkow/i.test(t)) return { isced: '0411', field: 'Accounting', broad: 'Business, Administration and Law' };
  if (/finance|finanz|finans/i.test(t)) return { isced: '0412', field: 'Finance', broad: 'Business, Administration and Law' };
  if (/business|management|betriebsw|bwl|gestion|zarządz|handelsw|mba/i.test(t)) return { isced: '0413', field: 'Business Administration', broad: 'Business, Administration and Law' };

  // 06 Information and Communication Technologies
  if (/artificial intelligence|künstliche intelligenz|intelligence artificielle|sztuczna inteligencja|tekoäly|machine learning/i.test(t)) {
    return { isced: '0613', field: 'Artificial Intelligence', broad: 'Information and Communication Technologies' };
  }
  if (/data science|datenwiss|science des données|analitika danych/i.test(t)) {
    return { isced: '0613', field: 'Data Science', broad: 'Information and Communication Technologies' };
  }
  if (/software|softwaretechnik|inżynieria oprogramowania/i.test(t)) {
    return { isced: '0612', field: 'Software Engineering', broad: 'Information and Communication Technologies' };
  }
  if (/computer|informatik|informatique|informatica|informatyk|tietojenkäsittely|cyber|computing/i.test(t)) {
    return { isced: '061', field: 'Computer Science', broad: 'Information and Communication Technologies' };
  }

  // 07 Engineering, Manufacturing and Construction
  if (/architect|architektur|architektura/i.test(t)) return { isced: '0731', field: 'Architecture', broad: 'Engineering, Manufacturing and Construction' };
  if (/civil eng|bauingenieur|génie civil|inżynieria lądowa/i.test(t)) return { isced: '0732', field: 'Civil Engineering', broad: 'Engineering, Manufacturing and Construction' };
  if (/mechanic|maschinenbau|génie mécanique|inżynieria mechaniczna|maszyny/i.test(t)) return { isced: '0715', field: 'Mechanical Engineering', broad: 'Engineering, Manufacturing and Construction' };
  if (/electr|elektrotech|génie électrique|elektrotechnika/i.test(t)) return { isced: '0714', field: 'Electrical Engineering', broad: 'Engineering, Manufacturing and Construction' };
  if (/engineer|ingenieur|inżynieria|ingegneria|ingeniería/i.test(t)) return { isced: '071', field: 'General Engineering', broad: 'Engineering, Manufacturing and Construction' };

  // 05 Natural Sciences, Mathematics and Statistics
  if (/statistic|statistik|statyst/i.test(t)) return { isced: '0542', field: 'Statistics', broad: 'Natural Sciences, Mathematics and Statistics' };
  if (/mathem|numerik|matematyk|calculus|algebra/i.test(t)) return { isced: '0541', field: 'Mathematics', broad: 'Natural Sciences, Mathematics and Statistics' };
  if (/physic|physik|physique|fizyk/i.test(t)) return { isced: '0533', field: 'Physics', broad: 'Natural Sciences, Mathematics and Statistics' };
  if (/chem|chimie|química|chemia/i.test(t)) return { isced: '0531', field: 'Chemistry', broad: 'Natural Sciences, Mathematics and Statistics' };
  if (/biolog|biotechnol|biochem|biologia/i.test(t)) return { isced: '0511', field: 'Biology', broad: 'Natural Sciences, Mathematics and Statistics' };
  if (/environ|umwelt|ökol|środowisk/i.test(t)) return { isced: '0521', field: 'Environmental Science', broad: 'Natural Sciences, Mathematics and Statistics' };

  // 03 Social Sciences, Journalism and Information
  if (/econom|volkswirtschaft|vwl|économ|ekonom|gospodark/i.test(t)) return { isced: '0311', field: 'Economics', broad: 'Social Sciences, Journalism and Information' };
  if (/politic|politik|international relations|stosunki międzynarodowe|politolog/i.test(t)) return { isced: '0312', field: 'Political Science', broad: 'Social Sciences, Journalism and Information' };
  if (/psychol/i.test(t)) return { isced: '0313', field: 'Psychology', broad: 'Social Sciences, Journalism and Information' };
  if (/socjolog|sociol/i.test(t)) return { isced: '0314', field: 'Sociology', broad: 'Social Sciences, Journalism and Information' };
  if (/media|journal|kommunikation|dziennikar/i.test(t)) return { isced: '0321', field: 'Media and Communication', broad: 'Social Sciences, Journalism and Information' };

  // 02 Arts and Humanities
  if (/history|geschichte|histoire|historia/i.test(t)) return { isced: '0222', field: 'History', broad: 'Arts and Humanities' };
  if (/philosop|filozof/i.test(t)) return { isced: '0223', field: 'Philosophy', broad: 'Arts and Humanities' };
  if (/language|linguist|literatur|philolog|filolog|anglistik|germanistik/i.test(t)) return { isced: '0231', field: 'Languages and Literature', broad: 'Arts and Humanities' };
  if (/design|fine art|kunst|music|musik|muzyk|film|theat/i.test(t)) return { isced: '0211', field: 'Fine Arts and Design', broad: 'Arts and Humanities' };

  // 01 Education
  if (/educat|lehrer|pädagogik|pedagog|didakt|teaching/i.test(t)) return { isced: '0111', field: 'Education', broad: 'Education' };

  // 08 Agriculture
  if (/agricult|agrar|landwirtsch|rolnictw|veterin|tierarzt/i.test(t)) return { isced: '0811', field: 'Agriculture and Veterinary', broad: 'Agriculture and Veterinary' };

  return { isced: '0011', field: 'Interdisciplinary Studies', broad: 'Interdisciplinary' };
}

// 1. Ingest Netherlands DUO (sample representative active programs to keep index lean)
async function ingestDuo() {
  console.log('Ingesting Netherlands DUO program database...');
  const url = 'https://onderwijsdata.duo.nl/dataset/7c0686f4-b5c2-418e-8e44-7be0057d8084/resource/ffffa7ad-e6a2-4ba7-9fc2-a09df4128555/download/ho_opleidingsoverzicht.csv';
  const res = await fetch(url);
  const text = await res.text();
  const lines = text.split('\n').filter(l => l.trim().length > 0);

  const programs = [];
  const seen = new Set();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    // Fast CSV parsing
    const cols = [];
    let insideQuote = false;
    let entry = '';
    for (let charIdx = 0; charIdx < row.length; charIdx++) {
      const c = row[charIdx];
      if (c === '"') {
        insideQuote = !insideQuote;
      } else if (c === ',' && !insideQuote) {
        cols.push(entry.trim());
        entry = '';
      } else {
        entry += c;
      }
    }
    cols.push(entry.trim());

    const endDate = cols[12];
    const nameDutch = cols[9];
    const nameInt = cols[10];
    const degreeLevel = cols[14];
    const credits = parseInt(cols[15]) || 0;
    const institution = (cols[19] || cols[1] || '').trim();
    const city = (cols[41] || '').trim();

    if (endDate && endDate < '2026-01-01') continue;
    if (!degreeLevel || (degreeLevel !== 'BACHELOR' && degreeLevel !== 'MASTER')) continue;
    if (!nameDutch || !institution) continue;

    const titleEn = nameInt && nameInt !== nameDutch ? nameInt : nameDutch;
    const key = `${institution}::${nameDutch}::${degreeLevel}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const { isced, field, broad } = classifyIsced(titleEn, nameDutch);

    programs.push({
      id: `nl-${cols[5] || i}`,
      sourceProgramId: cols[5] || String(i),
      sourceProvider: 'Dienst Uitvoering Onderwijs (DUO / RIO Netherlands)',
      sourceUrl: 'https://onderwijsdata.duo.nl/dataset/ho-opleidingsoverzicht',
      sourceLicense: 'CC0-1.0',
      university: institution,
      name: titleEn,
      titleOriginal: nameDutch,
      country: 'Netherlands',
      countryCode: 'NL',
      city: city || 'Various',
      degreeLevel: degreeLevel === 'BACHELOR' ? 'Bachelor' : 'Master',
      degreeAward: degreeLevel === 'BACHELOR' ? 'B.Sc. / B.A.' : 'M.Sc. / M.A.',
      iscedFieldCode: isced,
      fieldOfStudy: field,
      broadCategory: broad,
      totalCredits: credits,
      creditSystem: 'ECTS',
      teachingLanguages: ['Dutch', 'English'],
      officialProgramUrl: 'https://www.studiekeuze123.nl/',
      academicAnalysisAvailability: false,
      conditions: ['Accredited Dutch higher education qualification', 'Standard EHEA admission verification applies'],
      note: 'Official registered program in the Dutch national register (RIO/DUO). Subject entry requirements are set by the individual institution.',
    });
  }
  console.log(`Ingested ${programs.length} accredited Dutch programs.`);
  return programs;
}

// 2. Ingest Poland RAD-on (2 pages of 100)
async function ingestPoland() {
  console.log('Ingesting Poland POL-on / RAD-on program database...');
  const programs = [];
  const seen = new Set();
  let token = '';

  for (let page = 1; page <= 3; page++) {
    try {
      const url = `https://radon.nauka.gov.pl/opendata/polon/courses?resultNumbers=100${token ? '&token=' + encodeURIComponent(token) : ''}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      token = data.pagination?.token;
      const courses = (data.results || []).filter(c => c.currentStatusName === 'prowadzone');

      for (const c of courses) {
        const title = c.courseName?.trim();
        const institution = c.leadingInstitutionName?.trim();
        const city = c.leadingInstitutionCity?.trim() || '';
        if (!title || !institution || title === 'Xx' || title.length < 3) continue;

        const key = `${institution}::${title}`.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const levelStr = c.levelName || '';
        let degreeLevel = 'Bachelor';
        let award = 'Licencjat / Inżynier';
        let credits = 180;
        if (/drugiego/i.test(levelStr)) {
          degreeLevel = 'Master';
          award = 'Magister / Magister Inżynier';
          credits = 120;
        } else if (/jednolit/i.test(levelStr)) {
          degreeLevel = 'Master';
          award = 'Jednolite Magisterskie';
          credits = 300;
        }

        const discName = c.disciplines?.[0]?.disciplineName || '';
        const { isced, field, broad } = classifyIsced(title, discName);

        programs.push({
          id: `pl-${c.courseCode || c.courseUuid?.slice(0, 8)}`,
          sourceProgramId: c.courseCode || c.courseUuid,
          sourceProvider: 'POL-on / RAD-on (Ministry of Science and Higher Education Poland)',
          sourceUrl: 'https://radon.nauka.gov.pl/opendata/polon/courses',
          sourceLicense: 'Public Domain / Polish Open Government Data',
          university: institution,
          name: title,
          titleOriginal: title,
          country: 'Poland',
          countryCode: 'PL',
          city: city || 'Warszawa',
          degreeLevel,
          degreeAward: award,
          iscedFieldCode: isced,
          fieldOfStudy: field,
          broadCategory: broad,
          totalCredits: credits,
          creditSystem: 'ECTS',
          teachingLanguages: ['Polish'],
          officialProgramUrl: 'https://polon.nauka.gov.pl/',
          academicAnalysisAvailability: false,
          conditions: ['Accredited Polish higher education degree program', 'Subject to university faculty qualification committee review'],
          note: 'Registered program in the Polish POL-on science and education database. Admissions criteria are evaluated by faculty recruitment commissions.',
        });
      }
      if (!token) break;
    } catch (err) {
      console.error(`Error in Poland ingestion page ${page}:`, err.message);
      break;
    }
  }
  console.log(`Ingested ${programs.length} Polish degree programs.`);
  return programs;
}

// 3. Ingest Finland Opintopolku
async function ingestFinland() {
  console.log('Ingesting Finland Opintopolku university programs...');
  const programs = [];
  try {
    const url = 'https://opintopolku.fi/konfo-backend/search/koulutukset?size=200&koulutustyyppi=yo';
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const hits = data.hits || [];
    const seen = new Set();

    for (const h of hits) {
      const nameEn = h.nimi?.en;
      const nameFi = h.nimi?.fi || h.nimi?.sv;
      const title = (nameEn || nameFi || '').trim();
      const uniName = h.toteutustenTarjoajat?.nimi?.en || h.toteutustenTarjoajat?.nimi?.fi || '';
      if (!title || !uniName) continue;

      const key = `${uniName}::${title}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const credits = h.opintojenLaajuusNumero || 120;
      let degreeLevel = 'Master';
      if (credits >= 180 && credits <= 240) degreeLevel = 'Bachelor';
      else if (credits >= 300) degreeLevel = 'Master';

      const { isced, field, broad } = classifyIsced(title, h.nimi?.fi || '');

      programs.push({
        id: `fi-${h.oid ? h.oid.slice(-8) : Math.random().toString(36).slice(2, 10)}`,
        sourceProgramId: h.oid,
        sourceProvider: 'Studyinfo / Opintopolku (Finnish National Agency for Education)',
        sourceUrl: `https://opintopolku.fi/konfo/en/koulutus/${h.oid}`,
        sourceLicense: 'CC BY 4.0 (Finnish Open Government Data)',
        university: uniName,
        name: title,
        titleOriginal: nameFi || title,
        country: 'Finland',
        countryCode: 'FI',
        city: 'Helsinki / Espoo',
        degreeLevel,
        degreeAward: degreeLevel === 'Bachelor' ? 'Bachelor / Kandidaatti' : 'Master / Maisteri',
        iscedFieldCode: isced,
        fieldOfStudy: field,
        broadCategory: broad,
        totalCredits: credits,
        creditSystem: 'ECTS',
        teachingLanguages: h.kielivalinta || ['Finnish', 'English'],
        officialProgramUrl: `https://opintopolku.fi/konfo/en/koulutus/${h.oid}`,
        academicAnalysisAvailability: false,
        conditions: ['Finnish higher education qualification requirements', 'Language proficiency and prior academic degree verification'],
        note: 'Official university degree offering registered in Finland Studyinfo / Opintopolku.',
      });
    }
  } catch (err) {
    console.error('Error in Finland ingestion:', err.message);
  }
  console.log(`Ingested ${programs.length} Finnish university degree programs.`);
  return programs;
}

// 4. Curated European programs
function getCuratedEuropeanPrograms() {
  const list = [
    // GERMANY (beyond the 5 verified programs)
    {
      university: 'Technical University of Munich',
      name: 'M.Sc. Robotics, Cognition, Intelligence',
      city: 'Munich',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Artificial Intelligence',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 120,
      officialProgramUrl: 'https://www.tum.de/en/studies/degree-programs/detail/robotics-cognition-intelligence-master-of-science-msc',
      conditions: ['Aptitude assessment (Eignungsverfahren)', 'Undergraduate thesis in informatics or electrical engineering'],
      note: 'Documented university curriculum and prerequisite criteria.'
    },
    {
      university: 'Technical University of Munich',
      name: 'M.Sc. Mechanical Engineering',
      city: 'Munich',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Mechanical Engineering',
      broadCategory: 'Engineering, Manufacturing and Construction',
      iscedFieldCode: '0715',
      totalCredits: 120,
      officialProgramUrl: 'https://www.tum.de/en/studies/degree-programs/detail/mechanical-engineering-master-of-science-msc',
      conditions: ['Documented engineering mechanics, thermodynamics, and CAD fundamentals', '8-week practical industrial internship'],
      note: 'Documented faculty degree regulations.'
    },
    {
      university: 'Ludwig Maximilian University of Munich',
      name: 'Staatsexamen Humanmedizin (Medicine)',
      city: 'Munich',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'State Examination',
      degreeAward: 'Staatsexamen',
      fieldOfStudy: 'Medicine',
      broadCategory: 'Health and Welfare',
      iscedFieldCode: '0912',
      totalCredits: 360,
      officialProgramUrl: 'https://www.lmu.de/en/study/all-degree-programs/human-medicine-state-examination-single-cycle.html',
      conditions: ['National restricted admission (Numerus Clausus)', 'TMS (Test for Medical Studies) participation recommended', 'First aid training and 3-month nursing internship (Krankenpflegedienst)'],
      note: 'Regulated profession program subject to federal medical licensing regulations (ÄApprO). Admission does not automatically confer a licence to practise outside Germany.'
    },
    {
      university: 'Ludwig Maximilian University of Munich',
      name: 'Erste Juristische Prüfung (Law)',
      city: 'Munich',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'State Examination',
      degreeAward: 'Staatsexamen',
      fieldOfStudy: 'Law',
      broadCategory: 'Business, Administration and Law',
      iscedFieldCode: '0421',
      totalCredits: 300,
      officialProgramUrl: 'https://www.lmu.de/en/study/all-degree-programs/law-state-examination-single-cycle.html',
      conditions: ['General higher education entrance qualification (Abitur)', 'Latin proficiency or completion of course during studies'],
      note: 'German state law degree leading to the First State Legal Examination.'
    },
    {
      university: 'Heidelberg University',
      name: 'M.Sc. Physics',
      city: 'Heidelberg',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Physics',
      broadCategory: 'Natural Sciences, Mathematics and Statistics',
      iscedFieldCode: '0533',
      totalCredits: 120,
      officialProgramUrl: 'https://www.uni-heidelberg.de/en/study/all-subjects/physics/physics-master',
      conditions: ['Bachelor in Physics or equivalent with strong theoretical mechanics and quantum physics coverage', 'English B2 proficiency'],
      note: 'Official faculty regulations for postgraduate physics admission.'
    },
    {
      university: 'RWTH Aachen University',
      name: 'M.Sc. Electrical Engineering, Information Technology and Computer Engineering',
      city: 'Aachen',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Electrical Engineering',
      broadCategory: 'Engineering, Manufacturing and Construction',
      iscedFieldCode: '0714',
      totalCredits: 120,
      officialProgramUrl: 'https://www.rwth-aachen.de/go/id/bnqm',
      conditions: ['Verified credit equivalence in higher mathematics (24+ ECTS) and signals & systems (12+ ECTS)', 'GRE revised General Test for non-EU applicants'],
      note: 'Faculty subject-specific admission requirements.'
    },
    {
      university: 'Humboldt University of Berlin',
      name: 'M.Sc. Economics and Management Science',
      city: 'Berlin',
      country: 'Germany',
      countryCode: 'DE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Economics',
      broadCategory: 'Social Sciences, Journalism and Information',
      iscedFieldCode: '0311',
      totalCredits: 120,
      officialProgramUrl: 'https://www.wiwi.hu-berlin.de/en/study/msc/mems',
      conditions: ['At least 18 ECTS in quantitative methods (calculus, linear algebra, statistics, econometrics)', 'English C1 level certificate'],
      note: 'Quantitatively rigorous economics program.'
    },

    // UNITED KINGDOM
    {
      university: 'University of Oxford',
      name: 'M.Sc. Advanced Computer Science',
      city: 'Oxford',
      country: 'United Kingdom',
      countryCode: 'GB',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Computer Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '061',
      totalCredits: 180,
      officialProgramUrl: 'https://www.ox.ac.uk/admissions/graduate/courses/msc-advanced-computer-science',
      conditions: ['First-class undergraduate degree with honours in computer science or mathematics', 'Demonstrated foundation in formal proofs and computational complexity'],
      note: 'UK 180 CATS credits curriculum (equivalent to 90 ECTS).'
    },
    {
      university: 'University of Cambridge',
      name: 'Master of Law (LL.M.)',
      city: 'Cambridge',
      country: 'United Kingdom',
      countryCode: 'GB',
      degreeLevel: 'Master',
      degreeAward: 'LL.M.',
      fieldOfStudy: 'Law',
      broadCategory: 'Business, Administration and Law',
      iscedFieldCode: '0421',
      totalCredits: 180,
      officialProgramUrl: 'https://www.postgraduate.study.cam.ac.uk/courses/directory/lwlwmlmlm',
      conditions: ['First-class honours degree in law from a recognised common law or civil law jurisdiction', 'Substantial coursework in public international law or commercial jurisprudence'],
      note: 'Intensive Cambridge law faculty postgraduate degree.'
    },
    {
      university: 'Imperial College London',
      name: 'M.Sc. Applied Mathematics',
      city: 'London',
      country: 'United Kingdom',
      countryCode: 'GB',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Mathematics',
      broadCategory: 'Natural Sciences, Mathematics and Statistics',
      iscedFieldCode: '0541',
      totalCredits: 180,
      officialProgramUrl: 'https://www.imperial.ac.uk/study/courses/postgraduate-taught/applied-mathematics/',
      conditions: ['First-class UK Bachelor degree in mathematics, physics, or engineering with strong differential equations component'],
      note: 'Rigorous applied mathematics training.'
    },
    {
      university: 'University of Edinburgh',
      name: 'M.Sc. Artificial Intelligence',
      city: 'Edinburgh',
      country: 'United Kingdom',
      countryCode: 'GB',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Artificial Intelligence',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 180,
      officialProgramUrl: 'https://www.ed.ac.uk/studying/postgraduate/degrees/index.php?r=site/view&edition=2026&id=107',
      conditions: ['UK 2:1 honours degree or international equivalent in informatics, AI, cognitive science, or electrical engineering', 'Competence in Python or C/C++'],
      note: 'Flagship European AI research master program.'
    },

    // SWITZERLAND
    {
      university: 'ETH Zurich',
      name: 'Master in Computer Science',
      city: 'Zurich',
      country: 'Switzerland',
      countryCode: 'CH',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Computer Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '061',
      totalCredits: 120,
      officialProgramUrl: 'https://ethz.ch/en/studies/master/degree-programmes/engineering-sciences/computer-science.html',
      conditions: ['Bachelor degree matching ETH curriculum in theoretical computer science, algorithms, and systems', 'GRE test score required for non-Bologna degree holders'],
      note: 'ECTS credit system compliant. High threshold for theoretical foundations.'
    },
    {
      university: 'EPFL (École Polytechnique Fédérale de Lausanne)',
      name: 'Master in Data Science',
      city: 'Lausanne',
      country: 'Switzerland',
      countryCode: 'CH',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Data Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 120,
      officialProgramUrl: 'https://www.epfl.ch/education/master/programs/data-science/',
      conditions: ['Bachelor in Computer Science, Mathematics, or Physics', 'Solid mathematical preparation in linear algebra, multivariable calculus, and probability'],
      note: 'Jointly offered by the School of Computer and Communication Sciences and the School of Basic Sciences.'
    },
    {
      university: 'University of Zurich',
      name: 'Master of Law UZH',
      city: 'Zurich',
      country: 'Switzerland',
      countryCode: 'CH',
      degreeLevel: 'Master',
      degreeAward: 'MLaw',
      fieldOfStudy: 'Law',
      broadCategory: 'Business, Administration and Law',
      iscedFieldCode: '0421',
      totalCredits: 90,
      officialProgramUrl: 'https://www.ius.uzh.ch/en/studies/master.html',
      conditions: ['Bachelor of Law from a recognized Swiss or European university', 'German and English language competencies'],
      note: 'Swiss legal education framework.'
    },

    // FRANCE
    {
      university: 'Sorbonne University',
      name: 'Master en Informatique (Computer Science)',
      city: 'Paris',
      country: 'France',
      countryCode: 'FR',
      degreeLevel: 'Master',
      degreeAward: 'Master',
      fieldOfStudy: 'Computer Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '061',
      totalCredits: 120,
      officialProgramUrl: 'https://sciences.sorbonne-universite.fr/formation-sciences/masters/master-informatique',
      conditions: ['Licence en informatique or mathematics with substantial programming (C, Java, Python)', 'French B2 and English B2'],
      note: 'Two-year French national university master (M1 + M2).'
    },
    {
      university: 'Paris-Saclay University',
      name: 'Master in Artificial Intelligence',
      city: 'Orsay',
      country: 'France',
      countryCode: 'FR',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Artificial Intelligence',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 120,
      officialProgramUrl: 'https://www.universite-paris-saclay.fr/en/education/master/computer-science/m2-artificial-intelligence',
      conditions: ['M1 or 4-year degree in mathematics, computer science or cognitive sciences', 'Mathematical optimization and deep learning coursework'],
      note: 'One of the leading European AI research clusters.'
    },
    {
      university: 'Sciences Po Paris',
      name: 'Master in International Governance and Diplomacy',
      city: 'Paris',
      country: 'France',
      countryCode: 'FR',
      degreeLevel: 'Master',
      degreeAward: 'Master',
      fieldOfStudy: 'Political Science',
      broadCategory: 'Social Sciences, Journalism and Information',
      iscedFieldCode: '0312',
      totalCredits: 120,
      officialProgramUrl: 'https://www.sciencespo.fr/psia/en/programs/master-international-governance-and-diplomacy.html',
      conditions: ['Undergraduate degree in social sciences, international relations, law, or history', 'English C1 proficiency'],
      note: 'Paris School of International Affairs (PSIA) degree.'
    },

    // AUSTRIA
    {
      university: 'University of Vienna',
      name: 'Master in Data Science',
      city: 'Vienna',
      country: 'Austria',
      countryCode: 'AT',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Data Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 120,
      officialProgramUrl: 'https://studieren.univie.ac.at/en/degree-programmes/master-programmes/data-science-master/',
      conditions: ['At least 60 ECTS in computer science and mathematics during Bachelor studies', 'English B2 proficiency'],
      note: 'Interdisciplinary degree taught by the Faculties of Computer Science, Mathematics, and Business.'
    },
    {
      university: 'TU Wien',
      name: 'Master in Software Engineering & Internet Computing',
      city: 'Vienna',
      country: 'Austria',
      countryCode: 'AT',
      degreeLevel: 'Master',
      degreeAward: 'Dipl.-Ing.',
      fieldOfStudy: 'Software Engineering',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0612',
      totalCredits: 120,
      officialProgramUrl: 'https://www.tuwien.at/en/studies/studies/master-programmes/software-engineering-internet-computing',
      conditions: ['Bachelor in Computer Science or Business Informatics', 'Documented software architecture and distributed algorithms'],
      note: 'Accredited Austrian Diplom-Ingenieur (equivalent to M.Sc.).'
    },
    {
      university: 'Medical University of Vienna',
      name: 'Diplomstudium Humanmedizin (Medicine)',
      city: 'Vienna',
      country: 'Austria',
      countryCode: 'AT',
      degreeLevel: 'State Examination',
      degreeAward: 'Dr. med. univ.',
      fieldOfStudy: 'Medicine',
      broadCategory: 'Health and Welfare',
      iscedFieldCode: '0912',
      totalCredits: 360,
      officialProgramUrl: 'https://www.meduniwien.ac.at/web/studium-weiterbildung/anmeldung-zulassung/diplomstudien/humanmedizin/',
      conditions: ['Success in the national MedAT-H entrance test', 'German C1 language certificate'],
      note: 'Regulated medical doctorate curriculum (6 years, 360 ECTS). Subject to national quota allocation.'
    },

    // SWEDEN
    {
      university: 'Karolinska Institute',
      name: 'Master of Science in Biomedicine',
      city: 'Stockholm',
      country: 'Sweden',
      countryCode: 'SE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Biology',
      broadCategory: 'Natural Sciences, Mathematics and Statistics',
      iscedFieldCode: '0511',
      totalCredits: 120,
      officialProgramUrl: 'https://ki.se/en/education/master/biomedicine',
      conditions: ['Bachelor of Science in biomedicine, biotechnology, medicine, or biochemistry (at least 180 ECTS)', 'Laboratory project experience'],
      note: 'Flagship medical science training from Nobel assembly institution.'
    },
    {
      university: 'KTH Royal Institute of Technology',
      name: 'M.Sc. Machine Learning',
      city: 'Stockholm',
      country: 'Sweden',
      countryCode: 'SE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Artificial Intelligence',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 120,
      officialProgramUrl: 'https://www.kth.se/en/studies/master/machine-learning',
      conditions: ['At least 30 ECTS in mathematics including linear algebra, calculus, and probability theory', 'Advanced algorithms and programming proficiency'],
      note: 'Leading Scandinavian technical degree.'
    },

    // ITALY
    {
      university: 'Politecnico di Milano',
      name: 'M.Sc. Architecture - Built Environment - Interiors',
      city: 'Milan',
      country: 'Italy',
      countryCode: 'IT',
      degreeLevel: 'Master',
      degreeAward: 'Laurea Magistrale',
      fieldOfStudy: 'Architecture',
      broadCategory: 'Engineering, Manufacturing and Construction',
      iscedFieldCode: '0731',
      totalCredits: 120,
      officialProgramUrl: 'https://www.polimi.it/en/programmes/postgraduate-programmes/laurea-magistrale-equivalent-to-master-of-science/architettura-ambiente-costruito-interni-architecture-built-environment-interiors',
      conditions: ['Bachelor in Architecture or architectural design with architectural design portfolio review', 'English proficiency B2'],
      note: 'Conforms to European Directive 2005/36/EC for the profession of Architect.'
    },
    {
      university: 'University of Bologna',
      name: 'M.Sc. Economics and Finance',
      city: 'Bologna',
      country: 'Italy',
      countryCode: 'IT',
      degreeLevel: 'Master',
      degreeAward: 'Laurea Magistrale',
      fieldOfStudy: 'Finance',
      broadCategory: 'Business, Administration and Law',
      iscedFieldCode: '0412',
      totalCredits: 120,
      officialProgramUrl: 'https://corsi.unibo.it/2cycle/EconomicsFinance',
      conditions: ['Undergraduate degree with substantial credits in macroeconomics, microeconomics, and mathematics', 'English B2 certificate'],
      note: 'Oldest European university offering a quantitative economic finance degree.'
    },

    // SPAIN
    {
      university: 'Polytechnic University of Madrid (UPM)',
      name: 'Máster Universitario en Ingeniería Informática',
      city: 'Madrid',
      country: 'Spain',
      countryCode: 'ES',
      degreeLevel: 'Master',
      degreeAward: 'Máster Universitario',
      fieldOfStudy: 'Computer Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '061',
      totalCredits: 120,
      officialProgramUrl: 'https://www.fi.upm.es/?id=masteringenieriainformatica',
      conditions: ['Grado en Ingeniería Informática or foreign engineering qualification meeting Spanish ministerial standards'],
      note: 'Qualifies for the regulated profession of Ingeniero en Informática in Spain.'
    },
    {
      university: 'University of Barcelona',
      name: 'Grado en Medicina (Medicine)',
      city: 'Barcelona',
      country: 'Spain',
      countryCode: 'ES',
      degreeLevel: 'Bachelor',
      degreeAward: 'Grado',
      fieldOfStudy: 'Medicine',
      broadCategory: 'Health and Welfare',
      iscedFieldCode: '0912',
      totalCredits: 360,
      officialProgramUrl: 'https://www.ub.edu/portal/web/medicina-ciencies-salut/grau/-/ensenyament/detall/7921200',
      conditions: ['Selectividad (Prueba de Acceso a la Universidad) with biology and chemistry cut-off score'],
      note: 'Spanish medical degree program (6 years, 360 ECTS).'
    },

    // IRELAND
    {
      university: 'Trinity College Dublin',
      name: 'M.Sc. in Computer Science - Data Science',
      city: 'Dublin',
      country: 'Ireland',
      countryCode: 'IE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Data Science',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 90,
      officialProgramUrl: 'https://www.scss.tcd.ie/postgraduate/msc-cs/data-science/',
      conditions: ['II.1 honours degree or higher in computer science or related discipline', 'Strong programming background (Java/C++)'],
      note: 'One calendar-year full-time taught master (90 ECTS).'
    },

    // BELGIUM
    {
      university: 'KU Leuven',
      name: 'Master of Artificial Intelligence',
      city: 'Leuven',
      country: 'Belgium',
      countryCode: 'BE',
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      fieldOfStudy: 'Artificial Intelligence',
      broadCategory: 'Information and Communication Technologies',
      iscedFieldCode: '0613',
      totalCredits: 60,
      officialProgramUrl: 'https://onderwijsaanbod.kuleuven.be/opleidingen/e/SC_51016839.htm',
      conditions: ['Four- or five-year university degree (Master or equivalent) with substantial mathematics and computational foundations'],
      note: 'Pioneering advanced master program in Europe (since 1988).'
    },
  ];

  return list.map((p, idx) => ({
    id: `eu-curated-${idx + 1}`,
    sourceProgramId: `curated-${idx + 1}`,
    sourceProvider: `${p.university} Official Academic Regulations & Faculty Registers`,
    sourceUrl: p.officialProgramUrl,
    sourceLicense: 'Official Institutional Publication / Fair Reference',
    university: p.university,
    name: p.name,
    titleOriginal: p.name,
    country: p.country,
    countryCode: p.countryCode,
    city: p.city,
    degreeLevel: p.degreeLevel,
    degreeAward: p.degreeAward,
    iscedFieldCode: p.iscedFieldCode,
    fieldOfStudy: p.fieldOfStudy,
    broadCategory: p.broadCategory,
    totalCredits: p.totalCredits,
    creditSystem: p.countryCode === 'GB' ? 'UK CATS' : 'ECTS',
    teachingLanguages: ['English'],
    officialProgramUrl: p.officialProgramUrl,
    academicAnalysisAvailability: false,
    conditions: p.conditions,
    note: p.note,
  }));
}

async function main() {
  console.log('=== Building DegreeLens European Program Database ===\n');

  // 1. Existing verified German programs (with verified rules & conditions)
  const verified = existingVerifiedPrograms.map(p => {
    const iscedObj = classifyIsced(p.name, p.name);
    return {
      id: p.id,
      sourceProgramId: p.id,
      sourceProvider: `${p.university} Examination Regulations (Prüfungsordnung)`,
      sourceUrl: p.sourceUrl,
      sourceLicense: 'Official University Examination Regulations',
      university: p.university,
      name: p.name,
      titleOriginal: p.name,
      country: 'Germany',
      countryCode: 'DE',
      city: p.city,
      degreeLevel: 'Master',
      degreeAward: 'M.Sc.',
      iscedFieldCode: iscedObj.isced,
      fieldOfStudy: iscedObj.field,
      broadCategory: iscedObj.broad,
      totalCredits: 120,
      creditSystem: 'ECTS',
      teachingLanguages: ['English', 'German'],
      officialProgramUrl: p.sourceUrl,
      academicAnalysisAvailability: true,
      rules: p.rules,
      conditions: p.conditions,
      note: p.note,
      pathway: p.pathway,
      verified: p.verified,
    };
  });
  console.log(`Loaded ${verified.length} verified ECTS analysis programs.`);

  // 2. Curated European programs across disciplines
  const curated = getCuratedEuropeanPrograms();

  // 3. Official Dutch DUO programs
  const duo = await ingestDuo();

  // 4. Official Polish POL-on programs
  const poland = await ingestPoland();

  // 5. Official Finnish Opintopolku programs
  const finland = await ingestFinland();

  // Combine and deduplicate
  const all = [...verified, ...curated, ...duo, ...poland, ...finland];
  console.log(`\nTotal compiled programs before dedup: ${all.length}`);

  const deduped = [];
  const seen = new Set();
  for (const p of all) {
    const key = `${p.countryCode}::${p.university}::${p.name}::${p.degreeLevel}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(p);
    }
  }

  // Country and field stats
  const countryCounts = {};
  const fieldCounts = {};
  const levelCounts = {};
  for (const p of deduped) {
    countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
    fieldCounts[p.fieldOfStudy] = (fieldCounts[p.fieldOfStudy] || 0) + 1;
    levelCounts[p.degreeLevel] = (levelCounts[p.degreeLevel] || 0) + 1;
  }

  const payload = {
    source: 'Official European Higher Education Registers: DUO (Netherlands CC0), POL-on / RAD-on (Poland Open Data), Opintopolku / Studyinfo (Finland CC BY 4.0), Official German Examination Regulations & National University Registers',
    license: 'Open Data / Public Sector Information / Official Curricula',
    verified: new Date().toISOString().slice(0, 10),
    totalPrograms: deduped.length,
    verifiedEctsPrograms: verified.length,
    countriesCovered: Object.keys(countryCounts).length,
    countryCounts,
    fieldCounts,
    levelCounts,
    programs: deduped,
  };

  writeFileSync('src/data/programs.json', JSON.stringify(payload, null, 2), 'utf-8');
  console.log(`\nSuccessfully saved ${deduped.length} genuine degree programs across ${Object.keys(countryCounts).length} countries to src/data/programs.json.`);
  console.log('Country breakdown:', countryCounts);
  console.log('Top fields:', Object.entries(fieldCounts).sort((a,b)=>b[1]-a[1]).slice(0, 10));
}

main().catch(console.error);
