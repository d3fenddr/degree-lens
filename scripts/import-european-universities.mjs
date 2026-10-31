import { readFileSync, writeFileSync } from 'node:fs';

const TARGET_COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'FR', name: 'France' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'ES', name: 'Spain' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IT', name: 'Italy' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czechia' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'HU', name: 'Hungary' },
  { code: 'DK', name: 'Denmark' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'FI', name: 'Finland' },
  { code: 'IS', name: 'Iceland' },
  { code: 'EE', name: 'Estonia' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'RO', name: 'Romania' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'GR', name: 'Greece' },
  { code: 'CY', name: 'Cyprus' },
  { code: 'MT', name: 'Malta' },
];

async function fetchRorForCountry(countryCode, countryName) {
  try {
    const url = `https://api.ror.org/v2/organizations?filter=types:Education,country.country_code:${countryCode}&page=1`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.warn(`ROR query failed for ${countryCode}: ${res.status}`);
      return [];
    }
    const data = await res.json();
    const items = data.items || [];
    const results = [];

    for (const item of items) {
      const name = item.names?.find(n => n.types?.includes('ror_display'))?.value || item.names?.[0]?.value;
      const nativeName = item.names?.find(n => !n.types?.includes('ror_display'))?.value || '';
      const website = item.links?.find(l => l.type === 'website')?.value || '';
      const city = item.locations?.[0]?.geonames_details?.name || '';
      const state = item.locations?.[0]?.geonames_details?.admin1?.name || '';
      const rorId = item.id ? item.id.replace('https://ror.org/', '') : '';

      if (!name || !website || !rorId) continue;

      // Filter out primary/secondary schools or non-higher ed
      if (/elementary|primary|secondary|gymnasium|high school|infant/i.test(name)) continue;

      let type = 'university';
      if (/applied sciences|hogeschool|fachhochschule|ammattikorkeakoulu|politechnika|polytechnic|university of technology/i.test(name)) {
        type = 'applied-sciences';
      } else if (/art|music|conservator|fine arts|design|film/i.test(name)) {
        type = 'art-academy';
      } else if (/business school|management|commerce/i.test(name)) {
        type = 'business-school';
      }

      results.push({
        id: `ror-${rorId}`,
        name,
        nativeName: nativeName !== name ? nativeName : '',
        country: countryName,
        countryCode,
        city,
        state,
        type,
        website,
        source: item.id,
      });
    }
    return results;
  } catch (err) {
    console.error(`Error fetching ROR for ${countryCode}:`, err.message);
    return [];
  }
}

async function main() {
  console.log('Reading existing German universities dataset...');
  const existingRaw = JSON.parse(readFileSync('src/data/universities.json', 'utf-8'));
  const germanRecords = existingRaw.records.map(rec => ({
    ...rec,
    country: 'Germany',
    countryCode: 'DE',
  }));
  console.log(`Loaded ${germanRecords.length} existing German institutions.`);

  const allRecords = [...germanRecords];
  const seenIds = new Set(germanRecords.map(r => r.id));
  const seenNames = new Set(germanRecords.map(r => r.name.toLowerCase()));

  console.log(`Fetching European higher education institutions across ${TARGET_COUNTRIES.length} countries...`);
  for (const c of TARGET_COUNTRIES) {
    process.stdout.write(`Fetching ${c.name} (${c.code})... `);
    const recs = await fetchRorForCountry(c.code, c.name);
    let added = 0;
    for (const r of recs) {
      if (!seenIds.has(r.id) && !seenNames.has(r.name.toLowerCase())) {
        seenIds.add(r.id);
        seenNames.add(r.name.toLowerCase());
        allRecords.push(r);
        added++;
      }
    }
    console.log(`${added} institutions added.`);
  }

  // Sort by country then name
  allRecords.sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name));

  const countryStats = {};
  for (const r of allRecords) {
    countryStats[r.country] = (countryStats[r.country] || 0) + 1;
  }

  const output = {
    source: 'Wikidata Query Service (Germany CC0-1.0) & Research Organization Registry (European Higher Education Institutions CC0-1.0)',
    license: 'CC0-1.0',
    verified: new Date().toISOString().slice(0, 10),
    totalInstitutions: allRecords.length,
    countriesCovered: Object.keys(countryStats).length,
    countryBreakdown: countryStats,
    records: allRecords,
  };

  writeFileSync('src/data/universities.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log(`\nSuccessfully saved ${allRecords.length} European higher education institutions across ${Object.keys(countryStats).length} countries to src/data/universities.json.`);
}

main().catch(console.error);
