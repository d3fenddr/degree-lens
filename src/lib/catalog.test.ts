import { expect, it } from 'vitest';
import catalog from '../data/universities.json';

it('imports distinct, attributed German institution discovery records across all federal states', () => {
  expect(catalog.license).toContain('CC0-1.0');
  const german = catalog.records.filter(x => x.countryCode === 'DE');
  expect(german.length).toBe(571);
  expect(new Set(german.map(x => x.id)).size).toBe(german.length);
  expect(new Set(german.map(x => x.state).filter(Boolean)).size).toBe(16);
  for (const record of german) {
    expect(record.id).toMatch(/^Q\d+$/);
    expect(record.name).toBeTruthy();
    expect(record.source).toBe(`https://www.wikidata.org/wiki/${record.id}`);
    expect(record.website).toMatch(/^https?:\/\//);
  }
  expect(catalog.records.length).toBeGreaterThanOrEqual(1000);
  expect(catalog.countriesCovered).toBeGreaterThanOrEqual(25);
});
