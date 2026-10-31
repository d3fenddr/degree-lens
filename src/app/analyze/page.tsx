'use client';

import { Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileUp,
  Filter,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud
} from 'lucide-react';
import { useWorkspace } from '../../components/workspace';
import { demoNames } from '../../lib/demo';
import { extractPdf } from '../../lib/extract';
import { suggestTopics } from '../../lib/engine';
import { programs } from '../../lib/programs';
import type { Course, CreditSystem, DegreeLevel, Topic } from '../../lib/types';
import {
  rankPrograms,
  type RecommendationSortOption
} from '../../lib/matching';

const topics: [Topic, string][] = [
  ['math', 'Mathematics'],
  ['stochastics', 'Stochastics'],
  ['theory', 'Theoretical CS'],
  ['systems', 'Computer Engineering'],
  ['practical', 'Practical CS'],
  ['programming', 'Programming'],
  ['data', 'Data Science / AI'],
  ['cs', 'Other Computer Science']
];

const AVAILABLE_COUNTRIES = [
  'Germany',
  'Netherlands',
  'United Kingdom',
  'France',
  'Switzerland',
  'Austria',
  'Sweden',
  'Italy',
  'Spain',
  'Poland',
  'Finland',
  'Ireland',
  'Belgium'
];

const MAJOR_DISCIPLINES = [
  'Computer Science',
  'Data Science',
  'Artificial Intelligence',
  'Software Engineering',
  'Mathematics',
  'Statistics',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Medicine',
  'Dentistry',
  'Pharmacy',
  'Economics',
  'Finance',
  'Business Administration',
  'Law',
  'Psychology',
  'Physics',
  'Chemistry',
  'Biology',
  'Architecture'
];

type WizardStepId = 1 | 2 | 3 | 4;

interface StepMeta {
  id: WizardStepId;
  kicker: string;
  badge: string;
  label: string;
  fullTitle: string;
  desc: string;
}

const WIZARD_STEPS: StepMeta[] = [
  {
    id: 1,
    kicker: '01 / ACADEMIC BACKGROUND',
    badge: 'Step 01',
    label: 'Background',
    fullTitle: 'Academic Background',
    desc: 'Transcript upload & degree details'
  },
  {
    id: 2,
    kicker: '02 / REVIEW & VERIFICATION',
    badge: 'Step 02',
    label: 'Coursework',
    fullTitle: 'Coursework Review',
    desc: 'Verify, edit & confirm credits'
  },
  {
    id: 3,
    kicker: '03 / STUDY PREFERENCES',
    badge: 'Step 03',
    label: 'Preferences',
    fullTitle: 'Study Preferences',
    desc: 'Countries, fields & degree levels'
  },
  {
    id: 4,
    kicker: '04 / MATCHING RESULTS',
    badge: 'Step 04',
    label: 'Results',
    fullTitle: 'Matching Recommendations',
    desc: 'Ranked candidate programs'
  }
];

const STEP_TITLES: Record<WizardStepId, string> = {
  1: 'Step 1: Academic Background | DegreeLens',
  2: 'Step 2: Coursework Review | DegreeLens',
  3: 'Step 3: Study Preferences | DegreeLens',
  4: 'Step 4: Matching Programs | DegreeLens',
};

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="shell page-wrap"><p>Loading academic analysis wizard…</p></div>}>
      <AnalyzeWizardContent />
    </Suspense>
  );
}

function AnalyzeWizardContent() {
  const {
    courses,
    setCourses,
    loadDemo,
    profile,
    preferences,
    setPreferences,
    academicBackground,
    setAcademicBackground,
    shortlistIds,
    toggleShortlist,
    selected,
    setSelected
  } = useWorkspace();

  const searchParams = useSearchParams();
  const urlStep = parseInt(searchParams.get('step') || '', 10);
  const [localStep, setLocalStep] = useState<WizardStepId>(1);
  const currentStep: WizardStepId = (urlStep >= 1 && urlStep <= 4) ? (urlStep as WizardStepId) : localStep;

  const [highestVisitedStep, setHighestVisitedStep] = useState<WizardStepId>(() => {
    if (typeof window === 'undefined') return 1;
    const p = new URLSearchParams(window.location.search);
    const s = parseInt(p.get('step') || '1', 10);
    return (s >= 1 && s <= 4 ? s : 1) as WizardStepId;
  });
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);

  // Local state
  const [busy, setBusy] = useState(false);
  const [pdfError, setPdfError] = useState('');
  const [rawPages, setRawPages] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  // UX Feedback states
  const [liveAnnouncement, setLiveAnnouncement] = useState('');
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');
  const [sortOption, setSortOption] = useState<RecommendationSortOption>('verifiedFirst');
  const [hasRunMatching, setHasRunMatching] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  const announceId = useId();

  // Handle browser back/forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const s = parseInt(p.get('step') || '1', 10);
      if (s >= 1 && s <= 4) {
        setLocalStep(s as WizardStepId);
        setHighestVisitedStep(prev => Math.max(prev, s) as WizardStepId);
        setStepValidationError(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // When currentStep changes: focus heading, scroll to top smoothly, and update document.title
  useEffect(() => {
    const title = STEP_TITLES[currentStep] || 'Analysis Wizard | DegreeLens';
    if (typeof document !== 'undefined') {
      document.title = title;
    }

    // Scroll to top of wizard
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Set focus on step heading for screen readers & keyboard navigation (unless adding a course)
    const timer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.title = title;
      }
      if (!newlyAddedId) {
        stepHeadingRef.current?.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentStep, newlyAddedId]);

  // Focus newly added course row in Step 2
  useEffect(() => {
    if (newlyAddedId && currentStep === 2) {
      const focusTitle = () => {
        const cardEl = document.getElementById(`course-card-${newlyAddedId}`);
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const titleInput = document.getElementById(`course-title-${newlyAddedId}`);
        if (titleInput) {
          titleInput.focus();
        }
      };

      focusTitle();
      const focusTimer = setTimeout(focusTitle, 50);

      const timer = setTimeout(() => {
        setNewlyAddedId(null);
      }, 2000);
      return () => {
        clearTimeout(focusTimer);
        clearTimeout(timer);
      };
    }
  }, [newlyAddedId, currentStep]);

  // Navigate to step with validation & URL sync
  function goToStep(targetStep: WizardStepId, skipValidation = false) {
    if (!skipValidation && targetStep > currentStep) {
      // Validate step 1 progression
      if (currentStep === 1) {
        if (courses.length === 0) {
          setStepValidationError('Please upload a transcript PDF, select a sample profile, or add your coursework to continue.');
          return;
        }
      }

      // Validate step 2 progression
      if (currentStep === 2) {
        if (courses.length === 0) {
          setStepValidationError('At least one course is required to evaluate degree program entry requirements. Please add a course.');
          return;
        }
        const hasInvalid = courses.some(c => !c.title.trim() || c.credits <= 0);
        if (hasInvalid) {
          setStepValidationError('Please ensure all course entries have a title and positive credits before proceeding.');
          return;
        }
      }

      // Validate step 3 progression
      if (currentStep === 3) {
        if (preferences.countryMode === 'strict' && preferences.preferredCountries.length === 0) {
          setStepValidationError("You selected 'Strict only' country mode, but no countries are selected. Please select at least one country or change mode to 'All countries'.");
          return;
        }
        if (preferences.universityMode === 'strict' && preferences.preferredUniversities.length === 0) {
          setStepValidationError("You selected 'Strict only' institution mode, but no universities are selected. Please select at least one university or change mode to 'Any institution'.");
          return;
        }
        if (preferences.disciplineMode === 'mandatory' && preferences.preferredDisciplines.length === 0) {
          setStepValidationError("You selected 'Mandatory' discipline mode, but no disciplines are selected. Please select at least one discipline or change mode to 'Any field'.");
          return;
        }
      }
    }

    setStepValidationError(null);
    setLocalStep(targetStep);
    setHighestVisitedStep(prev => Math.max(prev, targetStep) as WizardStepId);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('step', String(targetStep));
      window.history.pushState({ step: targetStep }, '', url.toString());
    }

    const stepInfo = WIZARD_STEPS.find(s => s.id === targetStep);
    setLiveAnnouncement(`Navigated to ${stepInfo?.badge}: ${stepInfo?.fullTitle}.`);
  }

  function updateCourse(id: string, patch: Partial<Course>) {
    setCourses(courses.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCourse() {
    const newId = crypto.randomUUID();
    const newCourse: Course = {
      id: newId,
      title: '',
      credits: 6,
      creditSystem: 'ECTS',
      verifiedEcts: 6,
      semester: '',
      type: 'lecture',
      description: '',
      selectedTopic: '',
      confirmed: false,
      reviewStatus: 'valid'
    };

    setCourses([newCourse, ...courses]);
    setNewlyAddedId(newId);
    setStepValidationError(null);

    // If on Step 1, transition to Step 2 immediately to edit the course
    if (currentStep === 1) {
      goToStep(2, true);
      setLiveAnnouncement('New course row added at the top. Keyboard focus moved to course title input. Navigated to Step 2: Coursework Review.');
    } else {
      setLiveAnnouncement('New course row added at the top. Keyboard focus moved to course title input.');
    }
  }

  const eligibleUnconfirmed = useMemo(() => {
    return courses.filter(
      c =>
        !c.confirmed &&
        c.title.trim() !== '' &&
        c.credits > 0 &&
        c.credits <= 60 &&
        (c.creditSystem === 'ECTS' ? true : c.verifiedEcts !== null && c.verifiedEcts > 0)
    );
  }, [courses]);

  const suspiciousOrIncompleteCount = useMemo(() => {
    return courses.filter(
      c =>
        !c.confirmed &&
        (!c.title.trim() ||
          c.credits <= 0 ||
          c.credits > 60 ||
          (c.creditSystem !== 'ECTS' && !c.verifiedEcts) ||
          c.reviewStatus === 'potential-grade' ||
          c.reviewStatus === 'suspicious-credit')
    ).length;
  }, [courses]);

  function confirmEligibleReviewedCourses() {
    if (eligibleUnconfirmed.length === 0) return;

    const eligibleIds = new Set(eligibleUnconfirmed.map(c => c.id));
    const countConfirmed = eligibleUnconfirmed.length;

    setCourses(
      courses.map(c => {
        if (eligibleIds.has(c.id)) {
          return { ...c, confirmed: true };
        }
        return c;
      })
    );

    const msg = `Confirmed ${countConfirmed} course${countConfirmed === 1 ? '' : 's'}. ${suspiciousOrIncompleteCount} course${suspiciousOrIncompleteCount === 1 ? '' : 's'} remain unconfirmed for manual verification.`;
    setConfirmationNotice(msg);
    setLiveAnnouncement(msg);
  }

  async function loadFile(file?: File) {
    if (!file) return;
    setPdfError('');
    setStepValidationError(null);
    setBusy(true);
    try {
      const result = await extractPdf(file);
      setRawPages(result.pages);
      setCourses(result.courses);
      if (!result.courses.length) {
        setPdfError('No reliable course rows were detected. The PDF may be scanned, image-only, or use an unsupported layout. You can add courses manually below.');
      } else {
        setLiveAnnouncement(`Extracted ${result.courses.length} courses from PDF.`);
        // Automatically advance to Step 2 to review the extracted coursework
        goToStep(2, true);
      }
    } catch (e) {
      setPdfError(e instanceof Error ? e.message : 'Could not read this PDF. Try another file or enter courses manually.');
    } finally {
      setBusy(false);
    }
  }

  function handleSelectDemo(name: string) {
    loadDemo(name);
    setPdfError('');
    setRawPages([]);
    setConfirmationNotice(null);
    setStepValidationError(null);
    // Advance to Step 2 to review the loaded profile
    goToStep(2, true);
    setLiveAnnouncement(`Loaded ${name} sample profile. Navigated to Step 2: Coursework Review.`);
  }

  // Preference handlers
  function toggleCountry(country: string) {
    const current = preferences.preferredCountries;
    const next = current.includes(country) ? current.filter(c => c !== country) : [...current, country];
    setPreferences({
      ...preferences,
      preferredCountries: next,
      countryMode: next.length > 0 ? (preferences.countryMode === 'all' ? 'preferred' : preferences.countryMode) : 'all'
    });
  }

  function toggleDiscipline(discipline: string) {
    const current = preferences.preferredDisciplines;
    const next = current.includes(discipline) ? current.filter(d => d !== discipline) : [...current, discipline];
    setPreferences({
      ...preferences,
      preferredDisciplines: next
    });
  }

  function resetPreferences() {
    setPreferences({
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
    });
    setLiveAnnouncement('Preferences reset to default values.');
  }

  // Compute matching results declaratively
  const matchingResults = useMemo(() => {
    if (!hasRunMatching) return null;
    return rankPrograms(programs, courses, preferences, sortOption, academicBackground);
  }, [hasRunMatching, courses, preferences, sortOption, academicBackground]);

  // Run matching recommendations and advance to Step 4
  function handleFindMatchingPrograms() {
    if (courses.length === 0) {
      setStepValidationError('Please upload a transcript PDF, select a sample profile, or add at least one course before calculating recommendations.');
      return;
    }
    const hasInvalid = courses.some(c => !c.title.trim() || c.credits <= 0);
    if (hasInvalid) {
      setStepValidationError('Please ensure all course entries have a title and positive credits before calculating recommendations.');
      return;
    }
    if (preferences.countryMode === 'strict' && preferences.preferredCountries.length === 0) {
      setStepValidationError("You selected 'Strict only' country mode, but no countries are selected. Please select at least one country or change mode to 'All countries'.");
      return;
    }
    if (preferences.universityMode === 'strict' && preferences.preferredUniversities.length === 0) {
      setStepValidationError("You selected 'Strict only' institution mode, but no universities are selected. Please select at least one university or change mode to 'Any institution'.");
      return;
    }
    if (preferences.disciplineMode === 'mandatory' && preferences.preferredDisciplines.length === 0) {
      setStepValidationError("You selected 'Mandatory' discipline mode, but no disciplines are selected. Please select at least one discipline or change mode to 'Any field'.");
      return;
    }
    setStepValidationError(null);
    setHasRunMatching(true);
    goToStep(4, true);
  }

  function toggleProgramComparison(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  }

  const confirmedCount = useMemo(() => courses.filter(c => c.confirmed).length, [courses]);
  const totalVerifiedEcts = useMemo(() => {
    return courses
      .filter(c => c.confirmed)
      .reduce((sum, c) => sum + (c.creditSystem === 'ECTS' ? c.credits : c.verifiedEcts || 0), 0);
  }, [courses]);

  // Filtered universities based on selected countries
  const filteredUniversities = useMemo(() => {
    const q = universitySearch.toLowerCase().trim();
    const uniSet = new Set<string>();
    for (const p of programs) {
      if (preferences.preferredCountries.length > 0 && p.country && !preferences.preferredCountries.includes(p.country)) {
        continue;
      }
      if (q && !p.university.toLowerCase().includes(q)) {
        continue;
      }
      uniSet.add(p.university);
    }
    return Array.from(uniSet).sort();
  }, [preferences.preferredCountries, universitySearch]);

  const activeStepMeta = WIZARD_STEPS.find(s => s.id === currentStep)!;

  return (
    <div className="shell page-wrap">
      <title>{STEP_TITLES[currentStep] || 'Analysis Wizard | DegreeLens'}</title>
      {/* Accessible live region for announcements */}
      <div id={announceId} className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* ========================================================================= */}
      {/* HORIZONTAL PROGRESS INDICATOR (1 → 2 → 3 → 4) */}
      {/* ========================================================================= */}
      <nav aria-label="Analysis wizard steps" className="wizard-progress-bar" role="tablist">
        {WIZARD_STEPS.map(step => {
          const isActive = step.id === currentStep;
          const isCompleted = step.id < currentStep || (step.id === 1 && courses.length > 0) || (step.id === 2 && confirmedCount > 0);
          const isAccessible = step.id <= highestVisitedStep || isCompleted || (step.id === 2 && courses.length > 0);

          return (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`wizard-step-tab ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              onClick={() => goToStep(step.id)}
              disabled={!isAccessible && !isActive}
              aria-current={isActive ? 'step' : undefined}
              title={`Step ${step.id}: ${step.fullTitle}`}
              aria-label={`Step ${step.id}: ${step.fullTitle}${isActive ? ' (current)' : isCompleted ? ' (completed)' : ''}`}
            >
              <div className="wizard-step-badge">
                {isCompleted && !isActive ? (
                  <Check size={12} style={{ color: '#425c58' }} />
                ) : (
                  <span>0{step.id}</span>
                )}
                <span>{step.label}</span>
              </div>
              <div className="wizard-step-label">{step.fullTitle}</div>
              <div className="wizard-step-desc">{step.desc}</div>
            </button>
          );
        })}
      </nav>

      {/* Inline Validation Alert */}
      {stepValidationError && (
        <div className="wizard-validation-alert" role="alert">
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <strong>Action required:</strong> {stepValidationError}
          </div>
          <button
            type="button"
            onClick={() => setStepValidationError(null)}
            style={{ background: 'none', border: 'none', color: '#93511f', fontSize: '11px', textDecoration: 'underline' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: UPLOAD TRANSCRIPT OR ENTER ACADEMIC BACKGROUND */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <section aria-labelledby="step-1-heading">
          <div className="page-intro">
            <span className="kicker">{activeStepMeta.kicker}</span>
            <h1
              id="step-1-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="step-heading-focus"
            >
              Build your coursework profile.
            </h1>
            <p>
              Upload a transcript PDF or start with a sample profile. All PDF extraction occurs locally in your browser session. Complete coursework evidence is used to evaluate academic entry requirements across Europe.
            </p>
          </div>

          <div className="input-grid">
            <div
              className={`upload-card ${drag ? 'dragging' : ''}`}
              onDragOver={e => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={e => {
                e.preventDefault();
                setDrag(false);
                void loadFile(e.dataTransfer.files[0]);
              }}
            >
              <div className="upload-icon">
                <UploadCloud />
              </div>
              <h2>Drop your transcript here</h2>
              <p>Text-based PDF, up to 10 MB and 30 pages. Processing stays entirely in your browser session.</p>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="visually-hidden"
                aria-label="Upload transcript PDF"
                onChange={e => void loadFile(e.target.files?.[0])}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="button button-small" onClick={() => inputRef.current?.click()} disabled={busy}>
                  <FileUp size={16} />
                  {busy ? 'Reading PDF…' : 'Choose a PDF'}
                </button>
                <button type="button" className="button button-outline button-small" onClick={addCourse}>
                  <Plus size={16} /> Add course manually
                </button>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#666' }}>
                <ShieldCheck size={14} style={{ color: '#425c58' }} />
                <span>Zero server uploads · Private client-side execution</span>
              </div>
            </div>

            <div className="demo-card">
              <span className="kicker">PRE-CONFIGURED DATASETS</span>
              <h2>Explore with a sample profile.</h2>
              <p>These synthetic profiles illustrate coursework matching and entry requirement evaluation.</p>
              <div className="demo-options">
                {demoNames.map(name => (
                  <button
                    key={name}
                    type="button"
                    className={profile === name ? 'demo-option chosen' : 'demo-option'}
                    onClick={() => handleSelectDemo(name)}
                  >
                    <span>{name}</span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
              <small>Samples are synthetic and do not represent actual student records.</small>
            </div>
          </div>

          {/* Degree background context inputs */}
          <div style={{ marginTop: '20px', background: '#fff', border: '1px solid var(--line)', padding: '18px 22px', borderRadius: '2px', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 12px' }}>Previous Degree Information (Optional Context)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '14px', minWidth: 0, width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#555', display: 'grid', gap: '4px', minWidth: 0, maxWidth: '100%' }}>
                Completed / Prior Degree Level
                <select
                  value={academicBackground.previousDegreeLevel}
                  onChange={e => setAcademicBackground({ ...academicBackground, previousDegreeLevel: e.target.value })}
                  style={{ height: '38px', border: '1px solid #d8e1ea', borderRadius: '2px', padding: '0 8px', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                >
                  <option value="Bachelor">Bachelor (B.Sc. / B.A. / 3-4 years)</option>
                  <option value="Master">Master (M.Sc. / M.A.)</option>
                  <option value="Other">Other / Dual Qualification</option>
                </select>
              </label>
              <label style={{ fontSize: '12px', color: '#555', display: 'grid', gap: '4px', minWidth: 0, maxWidth: '100%' }}>
                Main Prior Study Field
                <input
                  value={academicBackground.previousDegreeField}
                  onChange={e => setAcademicBackground({ ...academicBackground, previousDegreeField: e.target.value })}
                  placeholder="e.g. Computer Science, Mathematics"
                  style={{ height: '38px', border: '1px solid #d8e1ea', borderRadius: '2px', padding: '0 8px', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                />
              </label>
              <label style={{ fontSize: '12px', color: '#555', display: 'grid', gap: '4px', minWidth: 0, maxWidth: '100%' }}>
                Degree Status
                <select
                  value={academicBackground.degreeStatus}
                  onChange={e => setAcademicBackground({ ...academicBackground, degreeStatus: e.target.value as 'completed' | 'in_progress' | 'unknown' })}
                  style={{ height: '38px', border: '1px solid #d8e1ea', borderRadius: '2px', padding: '0 8px', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}
                >
                  <option value="completed">Completed Degree (Graduated)</option>
                  <option value="in_progress">In Progress (Final Year / Pending Thesis)</option>
                  <option value="unknown">Not Specified</option>
                </select>
              </label>
            </div>
          </div>

          {pdfError && (
            <div className="alert" role="alert" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginTop: '16px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{pdfError}</div>
            </div>
          )}

          {/* Step 1 Navigation Row */}
          <div className="wizard-nav-row">
            <span style={{ fontSize: '13px', color: '#666' }}>
              {courses.length > 0 ? (
                <span><strong>{courses.length}</strong> course{courses.length === 1 ? '' : 's'} currently loaded in workspace.</span>
              ) : (
                'Upload a PDF or choose a sample to start.'
              )}
            </span>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                className="button"
                onClick={() => goToStep(2)}
              >
                Review courses {courses.length > 0 ? `(${courses.length})` : ''} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: REVIEW COURSEWORK & EDIT */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <section aria-labelledby="step-2-heading">
          <div className="page-intro">
            <span className="kicker">{activeStepMeta.kicker}</span>
            <h1
              id="step-2-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="step-heading-focus"
            >
              Course editor <span className="count-badge">{courses.length}</span>
            </h1>
            <p>
              Verify detected credit numbers, credit systems, and subject topics. Unconfirmed credits are excluded from verified ECTS calculations.
            </p>
          </div>

          {/* Top Actions for Course Editor */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {eligibleUnconfirmed.length > 0 && (
                <button
                  type="button"
                  className="button button-small"
                  onClick={confirmEligibleReviewedCourses}
                  title={`Confirms ${eligibleUnconfirmed.length} complete, valid courses without affecting unresolved records.`}
                >
                  <CheckCircle2 size={16} />
                  Confirm {eligibleUnconfirmed.length} reviewed course{eligibleUnconfirmed.length === 1 ? '' : 's'}
                </button>
              )}
              <button className="button button-outline button-small" onClick={addCourse}>
                <Plus size={16} /> Add course
              </button>
            </div>

            {/* Course stats strip */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '13px', color: '#555' }}>
              <span><strong>{confirmedCount}</strong> of {courses.length} confirmed</span>
              <span><strong>{totalVerifiedEcts}</strong> verified ECTS</span>
              {suspiciousOrIncompleteCount > 0 && (
                <span style={{ color: '#b45309' }}>• {suspiciousOrIncompleteCount} need review</span>
              )}
            </div>
          </div>

          {/* Confirmation feedback banner */}
          {confirmationNotice && (
            <div
              style={{
                margin: '12px 0',
                padding: '10px 14px',
                background: '#f2f8f5',
                border: '1px solid #c8e3d6',
                borderRadius: '2px',
                fontSize: '12px',
                color: '#245d43',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{confirmationNotice}</span>
              <button
                onClick={() => setConfirmationNotice(null)}
                style={{ background: 'none', border: 'none', color: '#245d43', fontSize: '11px', textDecoration: 'underline' }}
              >
                Dismiss
              </button>
            </div>
          )}

          {courses.length === 0 ? (
            <div className="empty-state">
              <FileUp size={28} />
              <h3>No courses added yet</h3>
              <p>Go back to upload a transcript PDF, choose a sample profile, or add a course manually.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
                <button className="button button-small" onClick={() => goToStep(1)}>
                  <ArrowLeft size={16} /> Back to upload
                </button>
                <button className="button button-outline button-small" onClick={addCourse}>
                  <Plus size={16} /> Add course manually
                </button>
              </div>
            </div>
          ) : (
            <div className="course-list">
              {courses.map((course, index) => {
                const hasWarning = course.reviewStatus && course.reviewStatus !== 'valid';
                const canConfirm = Boolean(
                  course.title.trim() &&
                    course.credits > 0 &&
                    course.credits <= 60 &&
                    (course.creditSystem === 'ECTS' ? true : course.verifiedEcts !== null && course.verifiedEcts > 0)
                );
                const isNewlyAdded = course.id === newlyAddedId;

                return (
                  <article
                    id={`course-card-${course.id}`}
                    className={`course-card ${isNewlyAdded ? 'new-course-highlight' : ''}`}
                    key={course.id}
                    style={hasWarning ? { borderLeft: '3px solid #d97706' } : undefined}
                  >
                    <div className="course-number">{String(index + 1).padStart(2, '0')}</div>
                    <div className="course-fields">
                      <div className="course-top">
                        <label style={{ flex: 1 }}>
                          Course title
                          <input
                            id={`course-title-${course.id}`}
                            value={course.title}
                            maxLength={120}
                            onChange={e => updateCourse(course.id, { title: e.target.value, confirmed: false })}
                            placeholder="e.g. Linear Algebra"
                          />
                        </label>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${course.title || 'course'}`}
                          onClick={() => {
                            setCourses(courses.filter(c => c.id !== course.id));
                            setLiveAnnouncement(`Deleted course ${course.title || 'row'}.`);
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>

                      {/* Warning banner */}
                      {hasWarning && (
                        <div
                          style={{
                            marginTop: '8px',
                            padding: '6px 10px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: '2px',
                            fontSize: '11px',
                            color: '#92400e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <AlertCircle size={14} />
                          <span>
                            {course.reviewWarning ||
                              (course.reviewStatus === 'potential-grade'
                                ? `Review value: ${course.credits} resembles a grade score rather than module credits. Verify this is not a grade.`
                                : course.reviewStatus === 'suspicious-credit'
                                ? `Suspicious credit count (${course.credits}). Please verify against official transcript.`
                                : course.reviewStatus === 'duplicate-title'
                                ? `Duplicate title "${course.title}". Verify whether this is a repeated course or distinct module.`
                                : 'Non-ECTS credit system requires verified equivalent.')}
                          </span>
                        </div>
                      )}

                      <div className="field-grid">
                        <label>
                          Credits
                          <input
                            type="number"
                            min="0.1"
                            max="60"
                            step="0.1"
                            value={course.credits}
                            onChange={e => updateCourse(course.id, { credits: Number(e.target.value), confirmed: false })}
                          />
                        </label>

                        <label>
                          Credit system
                          <select
                            value={course.creditSystem}
                            onChange={e =>
                              updateCourse(course.id, {
                                creditSystem: e.target.value as CreditSystem,
                                verifiedEcts: e.target.value === 'ECTS' ? course.credits : null,
                                confirmed: false
                              })
                            }
                          >
                            <option value="ECTS">ECTS</option>
                            <option value="UK CATS">UK CATS</option>
                            <option value="US Semester Hours">US Semester Hours</option>
                            <option value="local">Local / unknown</option>
                          </select>
                        </label>

                        <label>
                          Course type
                          <select
                            value={course.type}
                            onChange={e => updateCourse(course.id, { type: e.target.value as Course['type'] })}
                          >
                            {['lecture', 'seminar', 'lab', 'internship', 'thesis', 'project'].map(x => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Semester
                          <input
                            value={course.semester}
                            maxLength={20}
                            onChange={e => updateCourse(course.id, { semester: e.target.value })}
                            placeholder="Optional"
                          />
                        </label>
                      </div>

                      {course.creditSystem !== 'ECTS' && (
                        <label className="conversion-field">
                          Verified ECTS equivalent
                          <input
                            type="number"
                            min="0.1"
                            max="60"
                            step="0.1"
                            value={course.verifiedEcts ?? ''}
                            onChange={e =>
                              updateCourse(course.id, {
                                verifiedEcts: e.target.value ? Number(e.target.value) : null,
                                confirmed: false
                              })
                            }
                            placeholder="Enter verified ECTS equivalent"
                          />
                          <small>
                            {course.creditSystem === 'UK CATS' && 'Typical UK conversion: 2 CATS = 1 ECTS. '}
                            {course.creditSystem === 'US Semester Hours' && 'Typical US conversion: 1 US credit = ~2 ECTS. '}
                            Confirm with your institution’s documented diploma supplement. No unverified assumptions.
                          </small>
                        </label>
                      )}

                      <div className="field-grid field-grid-bottom">
                        <label>
                          Subject mapping
                          <select
                            value={course.selectedTopic}
                            onChange={e => updateCourse(course.id, { selectedTopic: e.target.value as Topic | '' })}
                          >
                            <option value="">Choose a topic</option>
                            {topics.map(([id, label]) => (
                              <option key={id} value={id}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label>
                          Description / evidence
                          <input
                            value={course.description}
                            maxLength={300}
                            onChange={e => updateCourse(course.id, { description: e.target.value })}
                            placeholder="Optional module details or syllabus topics"
                          />
                        </label>
                      </div>

                      <div className="course-bottom">
                        <span>
                          {course.page ? `PDF page ${course.page} · ` : ''}
                          {course.selectedTopic
                            ? 'Mapping selected'
                            : `Suggested: ${
                                suggestTopics(course)
                                  .map(x => topics.find(t => t[0] === x)?.[1])
                                  .filter(Boolean)
                                  .join(', ') || 'Needs review'
                              }`}
                        </span>

                        <label className="confirm-check">
                          <input
                            type="checkbox"
                            checked={course.confirmed}
                            disabled={!canConfirm}
                            onChange={e => updateCourse(course.id, { confirmed: e.target.checked })}
                          />
                          Confirm credits
                        </label>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {rawPages.length > 0 && (
            <details className="raw-text" style={{ marginTop: '24px' }}>
              <summary>Review extracted PDF text ({rawPages.length} pages)</summary>
              {rawPages.map((text, i) => (
                <div key={i}>
                  <h3>Page {i + 1}</h3>
                  <pre>{text}</pre>
                </div>
              ))}
            </details>
          )}

          {/* Step 2 Navigation Row */}
          <div className="wizard-nav-row">
            <button
              type="button"
              className="button button-outline"
              onClick={() => goToStep(1)}
            >
              <ArrowLeft size={16} /> Academic background
            </button>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/programs/" className="button button-outline" style={{ minHeight: '39px' }}>
                Choose programs <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                className="button button-outline"
                onClick={handleFindMatchingPrograms}
                title="Quickly calculate recommendations with current preferences"
              >
                <Sparkles size={16} /> Find matching programs
              </button>
              <button
                type="button"
                className="button"
                onClick={() => goToStep(3)}
              >
                Study preferences <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: STUDY PREFERENCES */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <section aria-labelledby="step-3-heading">
          <div className="page-intro">
            <span className="kicker">{activeStepMeta.kicker}</span>
            <h1
              id="step-3-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="step-heading-focus"
            >
              Where & what do you want to study?
            </h1>
            <p>
              Set preferred countries, universities, disciplines, and degree levels to filter European recommendations.
            </p>
          </div>

          <div className="preference-grid">
            {/* Countries Selector */}
            <div className="preference-card">
              <h3>
                <span>Preferred Countries ({preferences.preferredCountries.length})</span>
                <select
                  value={preferences.countryMode}
                  onChange={e => setPreferences({ ...preferences, countryMode: e.target.value as 'all' | 'strict' | 'preferred' })}
                  style={{ width: 'auto', height: '28px', fontSize: '11px', padding: '0 6px' }}
                  aria-label="Country filter mode"
                >
                  <option value="all">All countries</option>
                  <option value="preferred">Prioritize</option>
                  <option value="strict">Strict only</option>
                </select>
              </h3>
              <input
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search country..."
                aria-label="Search countries"
                style={{ height: '32px', marginBottom: '8px' }}
              />
              <div className="chip-container">
                {AVAILABLE_COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).map(country => {
                  const active = preferences.preferredCountries.includes(country);
                  return (
                    <button
                      key={country}
                      type="button"
                      className={`filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleCountry(country)}
                    >
                      {country}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Universities Selector */}
            <div className="preference-card">
              <h3>
                <span>Preferred Institutions ({preferences.preferredUniversities.length})</span>
                <select
                  value={preferences.universityMode}
                  onChange={e => setPreferences({ ...preferences, universityMode: e.target.value as 'any' | 'strict' | 'preferred' })}
                  style={{ width: 'auto', height: '28px', fontSize: '11px', padding: '0 6px' }}
                  aria-label="University filter mode"
                >
                  <option value="any">Any institution</option>
                  <option value="preferred">Prioritize</option>
                  <option value="strict">Strict only</option>
                </select>
              </h3>
              <input
                value={universitySearch}
                onChange={e => setUniversitySearch(e.target.value)}
                placeholder="Search universities..."
                aria-label="Search universities"
                style={{ height: '32px', marginBottom: '8px' }}
              />
              <div className="chip-container">
                {filteredUniversities.slice(0, 30).map(uni => {
                  const active = preferences.preferredUniversities.includes(uni);
                  return (
                    <button
                      key={uni}
                      type="button"
                      className={`filter-chip ${active ? 'active' : ''}`}
                      onClick={() => {
                        const next = active
                          ? preferences.preferredUniversities.filter(u => u !== uni)
                          : [...preferences.preferredUniversities, uni];
                        setPreferences({ ...preferences, preferredUniversities: next });
                      }}
                    >
                      {uni}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Disciplines Selector */}
            <div className="preference-card">
              <h3>
                <span>Academic Disciplines ({preferences.preferredDisciplines.length})</span>
                <select
                  value={preferences.disciplineMode}
                  onChange={e => setPreferences({ ...preferences, disciplineMode: e.target.value as 'any' | 'mandatory' | 'preferred' })}
                  style={{ width: 'auto', height: '28px', fontSize: '11px', padding: '0 6px' }}
                  aria-label="Discipline filter mode"
                >
                  <option value="any">Any field</option>
                  <option value="preferred">Prioritize</option>
                  <option value="mandatory">Mandatory</option>
                </select>
              </h3>
              <div className="chip-container" style={{ maxHeight: '160px' }}>
                {MAJOR_DISCIPLINES.map(discipline => {
                  const active = preferences.preferredDisciplines.includes(discipline);
                  return (
                    <button
                      key={discipline}
                      type="button"
                      className={`filter-chip ${active ? 'active' : ''}`}
                      onClick={() => toggleDiscipline(discipline)}
                    >
                      {discipline}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Degree Level & Options */}
            <div className="preference-card">
              <h3 style={{ margin: '0 0 10px' }}>Level & Verification</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                <label style={{ fontSize: '12px', color: '#555', display: 'grid', gap: '4px' }}>
                  Intended Degree Level
                  <select
                    value={preferences.intendedDegreeLevel}
                    onChange={e => setPreferences({ ...preferences, intendedDegreeLevel: e.target.value as 'Any' | DegreeLevel })}
                    style={{ height: '36px' }}
                  >
                    <option value="Any">All degree levels</option>
                    <option value="Master">Master (M.Sc. / M.A.)</option>
                    <option value="Bachelor">Bachelor (B.Sc. / B.A.)</option>
                    <option value="State Examination">State Examination / Integrated</option>
                  </select>
                </label>

                <label style={{ fontSize: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={preferences.verifiedOnly}
                    onChange={e => setPreferences({ ...preferences, verifiedOnly: e.target.checked })}
                  />
                  Show only programs with verified ECTS rules
                </label>
              </div>
            </div>
          </div>

          {/* Active preference chips */}
          {(preferences.preferredCountries.length > 0 ||
            preferences.preferredDisciplines.length > 0 ||
            preferences.preferredUniversities.length > 0 ||
            preferences.intendedDegreeLevel !== 'Any' ||
            preferences.verifiedOnly) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px', fontSize: '12px' }}>
              <span style={{ color: '#666', fontWeight: 600 }}>Active filters:</span>
              {preferences.preferredCountries.map(c => (
                <span key={c} className="active-filter-badge" onClick={() => toggleCountry(c)}>
                  {c} ✕
                </span>
              ))}
              {preferences.preferredDisciplines.map(d => (
                <span key={d} className="active-filter-badge" onClick={() => toggleDiscipline(d)}>
                  {d} ✕
                </span>
              ))}
              {preferences.intendedDegreeLevel !== 'Any' && (
                <span className="active-filter-badge" onClick={() => setPreferences({ ...preferences, intendedDegreeLevel: 'Any' })}>
                  {preferences.intendedDegreeLevel} ✕
                </span>
              )}
              {preferences.verifiedOnly && (
                <span className="active-filter-badge" onClick={() => setPreferences({ ...preferences, verifiedOnly: false })}>
                  Verified Rules Only ✕
                </span>
              )}
              <button
                type="button"
                onClick={resetPreferences}
                style={{ background: 'none', border: 'none', color: '#666', textDecoration: 'underline', fontSize: '11px', cursor: 'pointer' }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Step 3 Navigation Row */}
          <div className="wizard-nav-row">
            <button
              type="button"
              className="button button-outline"
              onClick={() => goToStep(2)}
            >
              <ArrowLeft size={16} /> Coursework review
            </button>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button"
                onClick={handleFindMatchingPrograms}
                style={{ minHeight: '48px', padding: '0 24px', fontSize: '15px' }}
              >
                <Sparkles size={18} /> Find matching programs
              </button>
              <Link href="/programs/" className="button button-outline" style={{ minHeight: '48px' }}>
                Choose programs <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: MATCHING RESULTS & RECOMMENDATIONS */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <section id="matching-results-section" aria-labelledby="step-4-heading">
          <div className="page-intro">
            <span className="kicker">{activeStepMeta.kicker}</span>
            <h1
              id="step-4-heading"
              ref={stepHeadingRef}
              tabIndex={-1}
              className="step-heading-focus"
            >
              Programs matching your academic profile
            </h1>
            <p>
              {matchingResults ? (
                <span>
                  Found <strong>{matchingResults.totalFound.toLocaleString('en-US')}</strong> relevant program suggestions ({matchingResults.verifiedCount} with verified coursework rules, {matchingResults.potentialCount} potential academic matches).
                </span>
              ) : (
                'Calculate personalized recommendations based on your verified coursework and study preferences.'
              )}
            </p>
          </div>

          {/* Wizard Step 4 Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: '#f5f5f3', border: '1px solid var(--line)', padding: '12px 18px', borderRadius: '2px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() => goToStep(2)}
              >
                Edit coursework ({courses.length})
              </button>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() => goToStep(3)}
              >
                Adjust preferences
              </button>
              <button
                type="button"
                className="button button-outline button-small"
                onClick={() => setHasRunMatching(true)}
              >
                <RotateCcw size={14} /> Recalculate
              </button>
            </div>

            {/* Sorting controls */}
            <label style={{ fontSize: '12px', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} /> Sort by:
              <select
                value={sortOption}
                onChange={e => setSortOption(e.target.value as RecommendationSortOption)}
                style={{ height: '36px', border: '1px solid #d8e1ea', borderRadius: '2px', padding: '0 8px' }}
                aria-label="Sort recommendations"
              >
                <option value="verifiedFirst">Verified coursework rules first</option>
                <option value="relevance">Academic relevance score</option>
                <option value="university">University name</option>
                <option value="country">Country</option>
                <option value="degreeLevel">Degree level</option>
              </select>
            </label>
          </div>

          {/* Shortlist summary bar */}
          {shortlistIds.length > 0 && (
            <div style={{ margin: '18px 0', padding: '12px 18px', background: '#fff', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookmarkCheck size={16} style={{ color: '#425c58' }} /> {shortlistIds.length} program{shortlistIds.length === 1 ? '' : 's'} saved in your browser shortlist.
              </span>
              <Link href="/results/" className="text-link" style={{ fontSize: '13px' }}>
                View comparison / shortlist →
              </Link>
            </div>
          )}

          {!matchingResults || matchingResults.items.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '30px' }}>
              <h3>No programs match your current filter combination</h3>
              <p>Try loosening strict country or university restrictions to view broader European opportunities.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' }}>
                <button className="button button-small" onClick={() => goToStep(3)}>
                  Adjust preferences
                </button>
                <button className="button button-outline button-small" onClick={resetPreferences}>
                  Reset preferences
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: '28px', display: 'grid', gap: '20px' }}>
              {matchingResults.items.slice(0, 40).map(rec => {
                const { program, matchType, relevanceScore, explanation, verifiedAnalysis, isRegulated } = rec;
                const isShort = shortlistIds.includes(program.id);
                const isSelected = selected.includes(program.id);
                const isExpanded = expandedCards[program.id] ?? false;

                return (
                  <article
                    key={program.id}
                    className={`match-card ${matchType}`}
                  >
                    {/* Top Row: Meta & Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {matchType === 'verified' ? (
                          <span className="verified-pill">Verified Coursework Match</span>
                        ) : (
                          <span className="city-pill" style={{ background: '#f5f5f3', color: '#444' }}>
                            Potential Match · Unverified Requirements
                          </span>
                        )}
                        <span className="city-pill">
                          {program.city}{program.country ? `, ${program.country}` : ''}
                        </span>
                        {program.degreeLevel && (
                          <span className="city-pill" style={{ background: '#f5f5f3' }}>
                            {program.degreeAward || program.degreeLevel}
                          </span>
                        )}
                        {program.fieldOfStudy && (
                          <span className="city-pill" style={{ background: '#f5f5f3' }}>
                            {program.fieldOfStudy}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="match-score-badge" title="Documented relevance indicator (not admission probability)">
                          Relevance: {relevanceScore}%
                        </span>
                        <button
                          type="button"
                          className={isShort ? 'button button-small' : 'button button-outline button-small'}
                          onClick={() => toggleShortlist(program.id)}
                          style={{ minHeight: '32px', padding: '0 10px', fontSize: '11px' }}
                          aria-label={`Toggle shortlist for ${program.name}`}
                        >
                          {isShort ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          {isShort ? 'Shortlisted' : 'Shortlist'}
                        </button>
                      </div>
                    </div>

                    {/* Program titles */}
                    <div>
                      <div className="uni-name" style={{ marginTop: '4px' }}>{program.university}</div>
                      <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '4px 0 6px' }}>{program.name}</h3>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>{explanation.summary}</p>
                    </div>

                    {/* Regulated warning */}
                    {isRegulated && (
                      <div className="match-warning-banner">
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                          <strong>Regulated academic discipline:</strong> Formal qualification assessment and official university admissions approval are mandatory. Subject similarity does not guarantee eligibility.
                        </span>
                      </div>
                    )}

                    {/* Verified ECTS coverage bar (if verified match) */}
                    {matchType === 'verified' && verifiedAnalysis && (
                      <div style={{ background: '#f7fafc', border: '1px solid #e2e8f0', padding: '14px 18px', borderRadius: '2px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>Category ECTS Fulfillment</span>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>
                            {verifiedAnalysis.coverage.filter(c => c.status === 'Requirement covered').length} / {verifiedAnalysis.coverage.length} Requirements Covered
                          </span>
                        </div>
                        <div style={{ display: 'grid', gap: '6px' }}>
                          {verifiedAnalysis.coverage.map(c => (
                            <div key={c.rule.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555' }}>
                              <span>{c.rule.label}</span>
                              <strong>{c.ects} / {c.rule.minimum} ECTS ({c.status})</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* "Why this matches" list */}
                    <div className="match-why-list">
                      <strong>Why this program was suggested:</strong>
                      <ul>
                        {explanation.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                      {explanation.warnings.length > 0 && (
                        <div style={{ marginTop: '8px', color: '#b45309', fontSize: '11px' }}>
                          {explanation.warnings.map((w, i) => (
                            <p key={i} style={{ margin: '3px 0' }}>• {w}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--line)' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        {matchType === 'verified' && (
                          <button
                            type="button"
                            className={isSelected ? 'button button-small' : 'button button-outline button-small'}
                            onClick={() => toggleProgramComparison(program.id)}
                            disabled={!isSelected && selected.length >= 3}
                            style={{ minHeight: '34px', fontSize: '12px' }}
                          >
                            {isSelected ? 'Selected for comparison' : 'Compare in results'}
                          </button>
                        )}
                        <a
                          href={program.sourceUrl || program.officialProgramUrl || program.webpage || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link"
                          style={{ fontSize: '12px' }}
                        >
                          Official university source <ArrowUpRight size={14} />
                        </a>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedCards({ ...expandedCards, [program.id]: !isExpanded })}
                        style={{ background: 'none', border: 'none', color: '#666', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                      >
                        {isExpanded ? 'Less details' : 'More details'}
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>

                    {/* Collapsible details */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px', background: '#f5f5f3', borderTop: '1px solid #dededa', fontSize: '12px', color: '#555' }}>
                        <p style={{ margin: '0 0 8px' }}>
                          <strong>Source Provider:</strong> {program.sourceProvider || 'Official European Educational Register'}
                        </p>
                        {program.conditions && program.conditions.length > 0 && (
                          <div>
                            <strong>Documented Entry Conditions:</strong>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                              {program.conditions.map((c, i) => (
                                <li key={i}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {program.note && <p style={{ margin: '8px 0 0' }}><strong>Note:</strong> {program.note}</p>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* Step 4 Navigation Row */}
          <div className="wizard-nav-row">
            <button
              type="button"
              className="button button-outline"
              onClick={() => goToStep(3)}
            >
              <ArrowLeft size={16} /> Adjust preferences
            </button>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/results/" className="button">
                View comparison in Results <ArrowRight size={16} />
              </Link>
              <Link href="/programs/" className="text-link">
                Search all 4,650 programs in catalog →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
