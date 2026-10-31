'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '../components/workspace';
import { analyze } from '../lib/engine';
import { demoCourses } from '../lib/demo';
import { programs, verifiedPrograms } from '../lib/programs';
import catalog from '../data/universities.json';

const preview = analyze(demoCourses('Mixed Data Science'), verifiedPrograms[0]);

export default function Home() {
  const router = useRouter();
  const { loadDemo } = useWorkspace();

  return (
    <>
      <section className="shell academic-hero">
        <div>
          <div className="kicker">Academic degree evaluation / Europe</div>
          <h1>Make sense of your qualifications.</h1>
          <p>
            Explore European universities, discover accredited degree programs, and compare your academic coursework with documented admission requirements. Review course allocations, inspect evidence, and prepare informed applications.
          </p>
          <div className="hero-buttons">
            <Link href="/analyze/" className="button">
              Start analysis →
            </Link>
            <Link href="/programs/" className="button button-outline">
              Explore programs
            </Link>
          </div>
        </div>

        <div className="academic-preview">
          <div className="preview-label">Sample coursework comparison</div>
          <h2>{preview.program.name}</h2>
          <p>{preview.program.university} · fictional profile</p>
          {preview.coverage.map(c => (
            <div className="academic-preview-row" key={c.rule.id}>
              <div>
                <span>{c.rule.label}</span>
                <strong>{c.ects} / {c.rule.minimum} ECTS</strong>
              </div>
              <div className="progress">
                <div style={{ width: `${Math.min(100, (c.ects / c.rule.minimum) * 100)}%` }} />
              </div>
            </div>
          ))}
          <button onClick={() => { loadDemo('Mixed Data Science'); router.push('/results'); }}>
            Open this sample analysis →
          </button>
        </div>
      </section>

      <section className="academic-band">
        <div className="shell academic-stats">
          <div>
            <strong>{catalog.records.length.toLocaleString('en-US')}</strong>
            <span>European institutions (31 countries)</span>
          </div>
          <div>
            <strong>{programs.length.toLocaleString('en-US')}</strong>
            <span>Indexed degree programs</span>
          </div>
          <div>
            <strong>{verifiedPrograms.length}</strong>
            <span>Verified ECTS program rules</span>
          </div>
        </div>
      </section>

      <section className="shell academic-section">
        <div className="kicker">Method</div>
        <h2>From transcript to evidence.</h2>
        <div className="academic-columns">
          <div>
            <span>01</span>
            <h3>Enter coursework</h3>
            <p>Extract text from a PDF locally on your device, or enter courses manually.</p>
          </div>
          <div>
            <span>02</span>
            <h3>Confirm what counts</h3>
            <p>Review ECTS equivalence, grade warnings, and subject mapping before allocation.</p>
          </div>
          <div>
            <span>03</span>
            <h3>Inspect the result</h3>
            <p>See documented thresholds, course contributions, unresolved conditions, and official sources.</p>
          </div>
        </div>
      </section>

      <section className="shell academic-section academic-last">
        <div>
          <div className="kicker">Explore</div>
          <h2>Institution discovery and verified analysis are separate.</h2>
          <p>
            Browse {catalog.records.length.toLocaleString('en-US')} European institution discovery records and {programs.length.toLocaleString('en-US')} degree programs. Detailed coursework ECTS analysis is provided for verified academic configurations with documented admission regulations.
          </p>
        </div>
        <div>
          <Link className="text-link" href="/universities">
            Browse institutions →
          </Link>
          <Link className="text-link" href="/programs/">
            Browse degree programs →
          </Link>
          <Link className="text-link" href="/methodology">
            Read the methodology →
          </Link>
        </div>
      </section>
    </>
  );
}
