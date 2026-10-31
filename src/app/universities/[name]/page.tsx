import Link from 'next/link';
import catalog from '../../../data/universities.json';
import { programs } from '../../../lib/programs';

export function generateStaticParams() {
  return catalog.records.map(u => ({ name: u.id }));
}

export default async function UniversityPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const u = catalog.records.find(x => x.id === name);
  if (!u) return <div className="shell page-wrap">Institution not found.</div>;

  const uniNameLower = u.name.toLowerCase();
  const uniNativeLower = (u as { nativeName?: string }).nativeName?.toLowerCase();
  const uniPrograms = programs.filter(p => {
    const pUni = p.university.toLowerCase();
    return pUni === uniNameLower || (uniNativeLower && pUni === uniNativeLower) || pUni.includes(uniNameLower) || uniNameLower.includes(pUni);
  });

  const isWikidata = u.id.startsWith('Q');
  const sourceName = isWikidata ? `Wikidata ${u.id}` : `ROR (${u.id})`;
  const sourceLicense = isWikidata ? 'CC0' : 'CC0 Public Domain';

  return (
    <div className="shell page-wrap">
      <Link href="/universities" className="text-link">← Universities</Link>
      <div className="page-intro">
        <span className="kicker">
          {isWikidata ? 'WIKIDATA DISCOVERY RECORD' : 'EUROPEAN INSTITUTION DISCOVERY RECORD'}
        </span>
        <h1>{u.name}</h1>
        {(u as { nativeName?: string }).nativeName && (u as { nativeName?: string }).nativeName !== u.name && (
          <p style={{ fontSize: '15px', color: '#666', marginTop: '-8px' }}>
            {(u as { nativeName?: string }).nativeName}
          </p>
        )}
        <p>
          {u.city || 'City not supplied'}
          {u.state ? ` · ${u.state}` : ''}
          {u.country ? ` · ${u.country}` : ''}
          {u.type ? ` · ${u.type}` : ''}
        </p>
      </div>

      <div className="editorial-callout">
        <p>
          <a href={u.website || u.source} target="_blank" rel="noreferrer">
            Institution website ↗
          </a>
        </p>
        <p>
          Source: <a href={u.source} target="_blank" rel="noreferrer">{sourceName}</a> · {sourceLicense} · imported {catalog.verified}. Degree programs and admission rules are not inferred from this record.
        </p>
      </div>

      {uniPrograms.length > 0 && (
        <section style={{ marginTop: '36px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>
            Indexed Degree Programs ({uniPrograms.length})
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {uniPrograms.slice(0, 10).map(p => (
              <div
                key={p.id}
                style={{
                  border: '1px solid var(--line)',
                  background: '#fff',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '15px' }}>{p.name}</strong>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {p.degreeAward || p.degreeLevel || 'Degree Program'} · {p.totalCredits ? `${p.totalCredits} ${p.creditSystem || 'ECTS'} · ` : ''}{p.fieldOfStudy || ''}
                  </span>
                </div>
                <a
                  href={p.sourceUrl || p.officialProgramUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                  style={{ fontSize: '13px' }}
                >
                  Program details ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
