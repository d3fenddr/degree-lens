import { writeFileSync, mkdirSync } from 'node:fs';
const query = `SELECT ?item ?itemLabel ?website ?cityLabel ?typeLabel ?stateLabel WHERE {
  ?item wdt:P17 wd:Q183; wdt:P31/wdt:P279* wd:Q38723; wdt:P856 ?website.
  FILTER NOT EXISTS { ?item wdt:P576 ?dissolved. }
  OPTIONAL { ?item wdt:P131 ?city. }
  OPTIONAL { ?item wdt:P31 ?type. }
  OPTIONAL { ?item wdt:P131* ?state. ?state wdt:P31 wd:Q1221156. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en,de". }
} LIMIT 10000`;
const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
const response = await fetch(url, { headers: { 'User-Agent': 'DegreeLens/1.0 (academic portfolio; public-data import)', Accept: 'application/sparql-results+json' } });
if (!response.ok) throw new Error(`Wikidata query failed: ${response.status}`);
const json = await response.json();
const rows = new Map();
const institutionType = /university|hochschule|higher education institution|business school|art academy|academy of fine arts|conservatory|film school|medical school|church college|catholic seminary|cooperative education|military academy|police academy|journalism school/i;
for (const item of json.results.bindings) {
  const id = item.item?.value?.match(/Q\d+$/)?.[0];
  const name = item.itemLabel?.value;
  const website = item.website?.value;
  const type = item.typeLabel?.value || '';
  if (!id || !name || !/^https?:\/\//.test(website) || name === id || !institutionType.test(type)) continue;
  const city = item.cityLabel?.value || '';
  const record = { id, name, city: /^Q\d+$/.test(city) ? '' : city, state: item.stateLabel?.value || '', type, website, source: `https://www.wikidata.org/wiki/${id}` };
  if (!rows.has(id) || [record.city, record.state].filter(Boolean).length > [rows.get(id).city, rows.get(id).state].filter(Boolean).length) rows.set(id, record);
}
const records = [...rows.values()].sort((a,b)=>a.name.localeCompare(b.name));
if (records.length < 20) throw new Error(`Only ${records.length} valid institutions; refusing to replace catalog`);
mkdirSync('src/data', { recursive:true });
writeFileSync('src/data/universities.json', JSON.stringify({ source:'Wikidata Query Service', license:'CC0-1.0', verified:new Date().toISOString().slice(0,10), query, records }, null, 2));
console.log(`Imported ${records.length} distinct Wikidata institution records`);
