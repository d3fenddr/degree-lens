'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, RotateCcw, Search } from 'lucide-react';
import { useWorkspace } from '../../components/workspace';
import { programs } from '../../lib/programs';

const PAGE_SIZE = 24;

export default function ProgramsPage() {
  const { selected, setSelected } = useWorkspace();
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('All countries');
  const [discipline, setDiscipline] = useState('All disciplines');
  const [level, setLevel] = useState('All levels');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [page, setPage] = useState(1);

  // Derive filter lists from catalog
  const countries = useMemo(() => {
    const list = Array.from(new Set(programs.map(p => p.country).filter((c): c is string => Boolean(c)))).sort();
    return ['All countries', ...list];
  }, []);

  const disciplines = useMemo(() => {
    const list = Array.from(new Set(programs.map(p => p.fieldOfStudy).filter((d): d is string => Boolean(d)))).sort();
    return ['All disciplines', ...list];
  }, []);

  const levels = useMemo(() => {
    return ['All levels', 'Master', 'Bachelor', 'State Examination'];
  }, []);

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter(x => x !== id));
    } else if (selected.length < 3) {
      setSelected([...selected, id]);
    }
  }

  function resetFilters() {
    setQuery('');
    setCountry('All countries');
    setDiscipline('All disciplines');
    setLevel('All levels');
    setVerifiedOnly(false);
    setPage(1);
  }

  const hasActiveFilters = query.trim() !== '' || country !== 'All countries' || discipline !== 'All disciplines' || level !== 'All levels' || verifiedOnly;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return programs.filter(p => {
      if (verifiedOnly && !p.academicAnalysisAvailability) return false;
      if (country !== 'All countries' && p.country !== country) return false;
      if (discipline !== 'All disciplines' && p.fieldOfStudy !== discipline) return false;
      if (level !== 'All levels' && p.degreeLevel !== level) return false;
      if (q) {
        const haystack = `${p.university} ${p.name} ${p.city} ${p.country || ''} ${p.fieldOfStudy || ''} ${p.broadCategory || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [query, country, discipline, level, verifiedOnly]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedPrograms = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="shell page-wrap">
      <div className="page-intro">
        <span className="kicker">EUROPE · DEGREE PROGRAM DISCOVERY</span>
        <h1>Compare documented requirements.</h1>
        <p>
          Explore {programs.length.toLocaleString('en-US')} degree programs across 13 European countries. Filter by country, academic discipline, and verified ECTS analysis availability. Select up to three for side-by-side evaluation.
        </p>
      </div>

      <div className="catalog-controls" style={{ flexWrap: 'wrap', gap: '10px', alignItems: 'stretch' }}>
        <label className="search-box" style={{ flex: '2 1 280px', minWidth: '240px' }}>
          <Search size={18} />
          <span className="visually-hidden">Search programs</span>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search university, program, or subject"
            aria-label="Search programs"
          />
        </label>

        <label className="filter-box" style={{ flex: '1 1 150px' }}>
          <span className="visually-hidden">Filter by country</span>
          <select value={country} onChange={e => { setCountry(e.target.value); setPage(1); }} aria-label="Filter by country">
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="filter-box" style={{ flex: '1 1 180px' }}>
          <span className="visually-hidden">Filter by discipline</span>
          <select value={discipline} onChange={e => { setDiscipline(e.target.value); setPage(1); }} aria-label="Filter by discipline">
            {disciplines.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>

        <label className="filter-box" style={{ flex: '1 1 130px' }}>
          <span className="visually-hidden">Filter by level</span>
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} aria-label="Filter by level">
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>

        <button
          type="button"
          className={verifiedOnly ? 'button button-small' : 'button button-outline button-small'}
          onClick={() => { setVerifiedOnly(!verifiedOnly); setPage(1); }}
          style={{ height: '39px' }}
        >
          {verifiedOnly ? <Check size={14} /> : null}
          Verified ECTS analysis ({programs.filter(p => p.academicAnalysisAvailability).length})
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            className="button button-outline button-small"
            onClick={resetFilters}
            title="Reset filters"
            style={{ height: '39px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <RotateCcw size={14} /> Reset
          </button>
        )}

        <span className="selection-count" style={{ alignSelf: 'center', marginLeft: 'auto' }}>
          {filtered.length.toLocaleString('en-US')} results · {selected.length} of 3 selected
        </span>
      </div>

      <div className="program-grid">
        {pagedPrograms.map(p => {
          const isSelected = selected.includes(p.id);
          const isVerified = Boolean(p.academicAnalysisAvailability);
          return (
            <article className="program-card" key={p.id}>
              <div className="program-card-top" style={{ flexWrap: 'wrap', gap: '6px' }}>
                <span className="city-pill">
                  {p.city}{p.country ? `, ${p.country}` : ''}
                </span>
                {p.degreeLevel && (
                  <span className="city-pill" style={{ background: '#f5f5f3', color: '#333' }}>
                    {p.degreeAward || p.degreeLevel}
                  </span>
                )}
                {p.totalCredits && (
                  <span className="city-pill" style={{ background: '#f5f5f3', color: '#666' }}>
                    {p.totalCredits} {p.creditSystem || 'ECTS'}
                  </span>
                )}
                {isVerified ? (
                  <span className="verified-pill">Verified ECTS {p.verified || ''}</span>
                ) : (
                  <span className="city-pill" style={{ background: '#fafafa', color: '#666', border: '1px solid #e2e2de' }}>
                    Discovery Index
                  </span>
                )}
              </div>

              <div className="uni-name">{p.university}</div>
              <h2>{p.name}</h2>
              <p>
                {p.fieldOfStudy ? <strong>{p.fieldOfStudy} · </strong> : null}
                {p.pathway || p.note || 'Documented program entry requirements and official admission conditions.'}
              </p>

              {isVerified && p.rules && p.rules.length > 0 ? (
                <div className="program-rule-list">
                  {p.rules.map(r => (
                    <div key={r.id}>
                      <span>{r.label}</span>
                      <strong>{r.minimum} ECTS{r.parentId ? ' ⊂' : ''}</strong>
                    </div>
                  ))}
                </div>
              ) : p.conditions && p.conditions.length > 0 ? (
                <div className="program-rule-list">
                  {p.conditions.slice(0, 3).map((c, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#555', borderBottom: '1px solid var(--line)', padding: '7px 0' }}>
                      <span>• {c}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ margin: '9px 0 20px', minHeight: '30px', fontSize: '12px', color: '#777' }}>
                  Official program index record with accredited curriculum link.
                </div>
              )}

              <div className="program-card-footer">
                <button
                  className={isSelected ? 'button button-small' : 'button button-outline button-small'}
                  onClick={() => toggle(p.id)}
                  aria-pressed={isSelected}
                  disabled={!isSelected && selected.length >= 3}
                >
                  {isSelected ? 'Selected' : 'Select program'}
                </button>
                <a
                  href={p.sourceUrl || p.officialProgramUrl || p.webpage || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Official source <ArrowUpRight size={15} />
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <h3>No programs match your search</h3>
          <p>Try clearing filters or searching with a different term.</p>
          <button className="button button-small" onClick={resetFilters} style={{ marginTop: '12px' }}>
            Clear all filters
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination" style={{ margin: '28px 0' }}>
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <p className="catalog-note">
        For broader European and national registries, consult official sources such as{' '}
        <a href="https://www.hochschulkompass.de/" target="_blank" rel="noopener noreferrer">HRK Hochschulkompass</a> (Germany),{' '}
        <a href="https://duo.nl/" target="_blank" rel="noopener noreferrer">DUO/RIO</a> (Netherlands),{' '}
        <a href="https://radon.nauka.gov.pl/" target="_blank" rel="noopener noreferrer">POL-on/RAD-on</a> (Poland), and{' '}
        <a href="https://opintopolku.fi/" target="_blank" rel="noopener noreferrer">Opintopolku</a> (Finland).
      </p>

      <div className="catalog-next">
        <p>Coursework comparison is informational. Other conditions remain for review.</p>
        <Link href="/results/" className="button">
          View comparison <ArrowRight size={18} />
        </Link>
      </div>
    </div>
  );
}
