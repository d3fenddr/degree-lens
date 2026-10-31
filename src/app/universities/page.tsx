'use client';

import { useState } from 'react';
import Link from 'next/link';
import catalog from '../../data/universities.json';

const pageSize = 20;
const states = ['Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'];

export default function Universities() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const data = catalog.records;
  const cities = [...new Set(data.map(record => record.city).filter(Boolean))].sort();
  const types = [...new Set(data.map(record => record.type).filter(Boolean))].sort();
  const found = data.filter(record => `${record.name} ${record.city}`.toLowerCase().includes(query.toLowerCase()) && (!city || record.city === city) && (!state || record.state === state) && (!type || record.type === type));

  return <div className="shell page-wrap">
    <div className="page-intro"><span className="kicker">GERMANY · INSTITUTIONS</span><h1>Universities</h1><p>{data.length} distinct discovery records from Wikidata (CC0). Confirm current information on each institution’s official site.</p></div>
    <div className="directory-filters">
      <label>Search<input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Name or city" /></label>
      <label>City<select value={city} onChange={event => { setCity(event.target.value); setPage(1); }}><option value="">All cities</option>{cities.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Federal state<select value={state} onChange={event => { setState(event.target.value); setPage(1); }}><option value="">All states</option>{states.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Type<select value={type} onChange={event => { setType(event.target.value); setPage(1); }}><option value="">All types</option>{types.map(value => <option key={value}>{value}</option>)}</select></label>
    </div>
    <p className="catalog-meta">{found.length} results · {data.filter(record => record.state).length} with state data · imported {catalog.verified} · <a href="https://www.wikidata.org/wiki/Wikidata:Licensing">Wikidata CC0</a></p>
    <div className="directory"><div className="directory-head"><span>Institution</span><span>City</span><span>State</span><span>Type</span><span>Source</span></div>
      {found.slice((page - 1) * pageSize, page * pageSize).map(record => <div className="directory-row" key={record.id}><Link href={`/universities/${record.id}/`}><strong>{record.name}</strong></Link><span>{record.city || 'Not supplied'}</span><span>{record.state || 'Not supplied'}</span><span>{record.type || 'Not supplied'}</span><a href={record.source} target="_blank" rel="noreferrer">Wikidata ↗</a></div>)}
    </div>
    {!found.length && <p>No matching institutions.</p>}
    <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {Math.max(1, Math.ceil(found.length / pageSize))}</span><button disabled={page * pageSize >= found.length} onClick={() => setPage(page + 1)}>Next</button></div>
    <p className="catalog-note">This is a source based discovery index, not an accreditation list. For nationwide degree-program discovery use <a href="https://www.hochschulkompass.de/">HRK Hochschulkompass</a>; its records are not reproduced here.</p>
  </div>;
}
