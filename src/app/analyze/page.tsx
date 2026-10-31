'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, FileUp, Plus, ShieldCheck, Trash2, UploadCloud } from 'lucide-react';
import { useWorkspace } from '../../components/workspace';
import { demoNames } from '../../lib/demo';
import { extractPdf } from '../../lib/extract';
import { suggestTopics } from '../../lib/engine';
import type { Course, CreditSystem, Topic } from '../../lib/types';

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

export default function AnalyzePage() {
  const { courses, setCourses, loadDemo, profile } = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rawPages, setRawPages] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  function update(id: string, patch: Partial<Course>) {
    setCourses(courses.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function add() {
    setCourses([
      ...courses,
      {
        id: crypto.randomUUID(),
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
      }
    ]);
  }

  function confirmAllValid() {
    setCourses(
      courses.map(c => {
        const canConfirm = Boolean(
          c.title.trim() &&
          c.credits > 0 &&
          c.credits <= 60 &&
          (c.creditSystem === 'ECTS' ? true : (c.verifiedEcts !== null && c.verifiedEcts > 0))
        );
        return canConfirm ? { ...c, confirmed: true } : c;
      })
    );
  }

  async function load(file?: File) {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const result = await extractPdf(file);
      setRawPages(result.pages);
      setCourses(result.courses);
      if (!result.courses.length) {
        setError('No reliable course rows were detected. The PDF may be scanned, image-only, or use an unsupported layout. You can add courses manually below and verify them.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read this PDF. Try another file or enter courses manually.');
    } finally {
      setBusy(false);
    }
  }

  const confirmedCount = useMemo(() => courses.filter(c => c.confirmed).length, [courses]);
  const totalVerifiedEcts = useMemo(() => {
    return courses
      .filter(c => c.confirmed)
      .reduce((sum, c) => sum + (c.creditSystem === 'ECTS' ? c.credits : (c.verifiedEcts || 0)), 0);
  }, [courses]);
  const needsAttentionCount = useMemo(() => {
    return courses.filter(c => !c.confirmed || c.reviewStatus === 'potential-grade' || c.reviewStatus === 'suspicious-credit' || c.reviewStatus === 'duplicate-title').length;
  }, [courses]);

  return (
    <div className="shell page-wrap">
      {/* STAGE 1: INTRO & UPLOAD */}
      <div className="page-intro">
        <span className="kicker">01 / INPUT YOUR ACADEMIC EVIDENCE</span>
        <h1>Build your coursework profile.</h1>
        <p>
          Upload a text-based transcript PDF or start with a pre-configured sample profile. All PDF extraction occurs locally in your browser. Review and confirm every course before program evaluation.
        </p>
      </div>

      <div className="input-grid">
        <div
          className={`upload-card ${drag ? 'dragging' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => {
            e.preventDefault();
            setDrag(false);
            void load(e.dataTransfer.files[0]);
          }}
        >
          <div className="upload-icon">
            <UploadCloud />
          </div>
          <h2>Drop your transcript here</h2>
          <p>
            Text-based PDF, up to 10 MB and 30 pages. Processing stays entirely in this browser session.
          </p>
          <input
            ref={input}
            type="file"
            accept="application/pdf,.pdf"
            className="visually-hidden"
            aria-label="Upload transcript PDF"
            onChange={e => void load(e.target.files?.[0])}
          />
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="button button-small"
              onClick={() => input.current?.click()}
              disabled={busy}
            >
              <FileUp size={16} />
              {busy ? 'Reading PDF…' : 'Choose a PDF'}
            </button>
            <button
              type="button"
              className="button button-outline button-small"
              onClick={add}
            >
              <Plus size={16} /> Add course manually
            </button>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', color: '#666' }}>
            <ShieldCheck size={14} style={{ color: '#425c58' }} />
            <span>Zero server upload · 100% private browser processing</span>
          </div>
        </div>

        <div className="demo-card">
          <span className="kicker">NO TRANSCRIPT? NO PROBLEM.</span>
          <h2>Explore with a sample profile.</h2>
          <p>
            These synthetic courses are pre-configured to illustrate subject allocation and entry threshold checks.
          </p>
          <div className="demo-options">
            {demoNames.map(name => (
              <button
                key={name}
                className={profile === name ? 'demo-option chosen' : 'demo-option'}
                onClick={() => { loadDemo(name); setError(''); setRawPages([]); }}
              >
                <span>{name}</span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <small>Samples are synthetic and do not represent actual university student records.</small>
        </div>
      </div>

      {error && (
        <div className="alert" role="alert" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      {/* STAGE 2: COURSE REVIEW & VERIFICATION */}
      <section className="editor-section">
        <div className="section-head-row">
          <div>
            <span className="kicker">02 / REVIEW & VERIFICATION</span>
            <h2>Course editor <span className="count-badge">{courses.length}</span></h2>
            <p>
              Confirm credits and assign subject mapping. Unconfirmed credits are excluded from ECTS allocation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {courses.length > 0 && (
              <button
                type="button"
                className="button button-outline button-small"
                onClick={confirmAllValid}
                title="Confirm all courses with valid titles and positive credits"
              >
                <CheckCircle2 size={16} /> Confirm all valid
              </button>
            )}
            <button className="button button-outline button-small" onClick={add}>
              <Plus size={16} /> Add course
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <FileTextIcon />
            <h3>No courses yet</h3>
            <p>Upload a transcript PDF, load a sample profile, or add a course manually.</p>
            <button className="button button-small" onClick={add} style={{ marginTop: '14px' }}>
              <Plus size={16} /> Add first course
            </button>
          </div>
        ) : (
          <div className="course-list">
            {courses.map((course, index) => {
              const hasWarning = course.reviewStatus && course.reviewStatus !== 'valid';
              const canConfirm = Boolean(
                course.title.trim() &&
                course.credits > 0 &&
                course.credits <= 60 &&
                (course.creditSystem === 'ECTS' ? true : (course.verifiedEcts !== null && course.verifiedEcts > 0))
              );

              return (
                <article
                  className="course-card"
                  key={course.id}
                  style={hasWarning ? { borderLeft: '3px solid #d97706' } : undefined}
                >
                  <div className="course-number">{String(index + 1).padStart(2, '0')}</div>
                  <div className="course-fields">
                    <div className="course-top">
                      <label>
                        Course title
                        <input
                          value={course.title}
                          maxLength={120}
                          onChange={e => update(course.id, { title: e.target.value, confirmed: false })}
                          placeholder="e.g. Linear Algebra"
                        />
                      </label>
                      <button
                        className="icon-button"
                        aria-label={`Delete ${course.title || 'course'}`}
                        onClick={() => setCourses(courses.filter(c => c.id !== course.id))}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* REVIEW WARNING BADGE */}
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
                          {course.reviewWarning || (
                            course.reviewStatus === 'potential-grade'
                              ? `Review value: ${course.credits} resembles a grade score rather than module credits.`
                              : course.reviewStatus === 'suspicious-credit'
                              ? `Suspicious credit count (${course.credits}). Please verify against official transcript.`
                              : course.reviewStatus === 'duplicate-title'
                              ? `Duplicate title "${course.title}". Verify whether this is a repeated course or distinct module.`
                              : 'Non-ECTS credit system requires verified equivalent.'
                          )}
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
                          onChange={e => update(course.id, { credits: Number(e.target.value), confirmed: false })}
                        />
                      </label>

                      <label>
                        Credit system
                        <select
                          value={course.creditSystem}
                          onChange={e => update(course.id, {
                            creditSystem: e.target.value as CreditSystem,
                            verifiedEcts: e.target.value === 'ECTS' ? course.credits : null,
                            confirmed: false
                          })}
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
                          onChange={e => update(course.id, { type: e.target.value as Course['type'] })}
                        >
                          {['lecture', 'seminar', 'lab', 'internship', 'thesis', 'project'].map(x => (
                            <option key={x} value={x}>{x}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Semester
                        <input
                          value={course.semester}
                          maxLength={20}
                          onChange={e => update(course.id, { semester: e.target.value })}
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
                          onChange={e => update(course.id, {
                            verifiedEcts: e.target.value ? Number(e.target.value) : null,
                            confirmed: false
                          })}
                          placeholder="Enter verified ECTS equivalent"
                        />
                        <small>
                          {course.creditSystem === 'UK CATS' && 'Typical UK conversion: 2 CATS = 1 ECTS (e.g. 20 CATS = 10 ECTS). '}
                          {course.creditSystem === 'US Semester Hours' && 'Typical US conversion: 1 US credit = ~2 ECTS (e.g. 3 US credits = 6 ECTS). '}
                          Confirm with your institution’s documented diploma supplement. No unverified assumptions.
                        </small>
                      </label>
                    )}

                    <div className="field-grid field-grid-bottom">
                      <label>
                        Subject mapping
                        <select
                          value={course.selectedTopic}
                          onChange={e => update(course.id, { selectedTopic: e.target.value as Topic | '' })}
                        >
                          <option value="">Choose a topic</option>
                          {topics.map(([id, label]) => (
                            <option key={id} value={id}>{label}</option>
                          ))}
                        </select>
                      </label>

                      <label>
                        Description / evidence
                        <input
                          value={course.description}
                          maxLength={300}
                          onChange={e => update(course.id, { description: e.target.value })}
                          placeholder="Optional module details or syllabus topics"
                        />
                      </label>
                    </div>

                    <div className="course-bottom">
                      <span>
                        {course.page ? `PDF page ${course.page} · ` : ''}
                        {course.selectedTopic
                          ? 'Mapping selected'
                          : `Suggested: ${suggestTopics(course).map(x => topics.find(t => t[0] === x)?.[1]).filter(Boolean).join(', ') || 'Needs review'}`}
                      </span>

                      <label className="confirm-check">
                        <input
                          type="checkbox"
                          checked={course.confirmed}
                          disabled={!canConfirm}
                          onChange={e => update(course.id, { confirmed: e.target.checked })}
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
          <details className="raw-text">
            <summary>Review extracted PDF text ({rawPages.length} pages)</summary>
            {rawPages.map((text, i) => (
              <div key={i}>
                <h3>Page {i + 1}</h3>
                <pre>{text}</pre>
              </div>
            ))}
          </details>
        )}

        {/* STAGE 3: SUMMARY & NAVIGATION */}
        <div className="editor-next" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                {confirmedCount} of {courses.length} courses confirmed
              </span>
              <span style={{ fontSize: '13px', color: '#666' }}>
                {totalVerifiedEcts} verified ECTS ready
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#666' }}>
              {needsAttentionCount > 0
                ? `${needsAttentionCount} courses require review or credit confirmation.`
                : 'All courses confirmed. Ready for program requirement evaluation.'}
            </p>
          </div>

          <Link href="/programs" className="button">
            Choose programs <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function FileTextIcon() {
  return <FileUp size={26} />;
}
