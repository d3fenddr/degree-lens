'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import catalog from '../../data/universities.json';

const pageSize = 20;
const states = [
  'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg',
  'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia',
  'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
];

export default function Universities() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const data = catalog.records;

  const countries = useMemo(() => {
    return Array.from(new Set(data.map(r => r.country).filter((c): c is string => Boolean(c)))).sort();
  }, [data]);

  const cities = useMemo(() => {
    return Array.from(new Set(data.map(record => record.city).filter((c): c is string => Boolean(c)))).sort();
  }, [data]);

  const types = useMemo(() => {
    return Array.from(new Set(data.map(record => record.type).filter((t): t is string => Boolean(t)))).sort();
  }, [data]);

  const found = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.filter(record => {
      if (q && !`${record.name} ${record.city || ''} ${(record as { nativeName?: string }).nativeName || ''}`.toLowerCase().includes(q)) {
        return false;
      }
      if (country && record.country !== country) return false;
      if (city && record.city !== city) return false;
      if (state && record.state !== state) return false;
      if (type && record.type !== type) return false;
      return true;
    });
  }, [data, query, country, city, state, type]);

  const totalPages = Math.max(1, Math.ceil(found.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="shell page-wrap">
      <div className="page-intro">
        <span className="kicker">EUROPE · INSTITUTIONS</span>
        <h1>Universities</h1>
        <p>
          {data.length.toLocaleString('en-US')} higher education institutions across 31 European countries. Source-backed discovery records from Wikidata and ROR (CC0). Confirm current information on each institution’s official site.
        </p>
      </div>

      <div className="directory-filters">
        <label>
          Search
          <input
            value={query}
            onChange={event => { setQuery(event.target.value); setPage(1); }}
            placeholder="Name or city"
          />
        </label>
        <label>
          Country
          <select value={country} onChange={event => { setCountry(event.target.value); setPage(1); }}>
            <option value="">All countries</option>
            {countries.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Federal state
          <select value={state} onChange={event => { setState(event.target.value); setPage(1); }}>
            <option value="">All states</option>
            {states.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          City
          <select value={city} onChange={event => { setCity(event.target.value); setPage(1); }}>
            <option value="">All cities</option>
            {cities.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Type
          <select value={type} onChange={event => { setType(event.target.value); setPage(1); }}>
            <option value="">All types</option>
            {types.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>

      <p className="catalog-meta">
        {found.length.toLocaleString('en-US')} results · {data.filter(record => record.state).length} with state data · imported {catalog.verified} · <a href="https://www.wikidata.org/wiki/Wikidata:Licensing" target="_blank" rel="noreferrer">Wikidata CC0</a> & <a href="https://ror.org/" target="_blank" rel="noreferrer">ROR CC0</a>
      </p>

      <div className="directory">
        <div className="directory-head">
          <span>Institution</span>
          <span>City</span>
          <span>Location</span>
          <span>Type</span>
          <span>Source</span>
        </div>
        {found.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(record => (
          <div className="directory-row" key={record.id}>
            <Link href={`/universities/${record.id}/`}>
              <strong>{record.name}</strong>
            </Link>
            <span>{record.city || 'Not supplied'}</span>
            <span>
              {record.country
                ? (record.state ? `${record.country} (${record.state})` : record.country)
                : (record.state || 'Not supplied')}
            </span>
            <span>{record.type || 'Not supplied'}</span>
            <a href={record.source} target="_blank" rel="noreferrer">
              {record.id.startsWith('Q') ? 'Wikidata ↗' : 'ROR ↗'}
            </a>
          </div>
        ))}
      </div>

      {!found.length && <p style={{ marginTop: '20px', color: '#666' }}>No matching institutions.</p>}

      <div className="pagination">
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

      <p className="catalog-note">
        This is a source-based discovery index, not an accreditation register. For nationwide degree-program catalogs, use official portals such as <a href="https://www.hochschulkompass.de/" target="_blank" rel="noreferrer">HRK Hochschulkompass</a>, <a href="https://duo.nl/" target="_blank" rel="noreferrer">DUO</a>, and <a href="https://radon.nauka.gov.pl/" target="_blank" rel="noreferrer">POL-on</a>.
      </p>
    </div>
  );
}
