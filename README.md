# DegreeLens

DegreeLens is a browser-based coursework comparison for five German master's programs. It is an independent preliminary tool, not an admissions service.

## Run

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. The app needs no API keys, account, database, or server-side transcript storage.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
npm audit --omit=dev --audit-level=moderate
```

Playwright tests use locally installed Chrome and Python 3 to serve the production export with the correct JavaScript MIME type. The build writes a static export to `out/`.

## Catalog

`node scripts/import-wikidata.mjs` refreshes the local Wikidata CC0 institution discovery catalog in `src/data/universities.json`. It deduplicates by Wikidata ID, records source URLs, and excludes entries Wikidata marks dissolved. The current import contains 571 records, including state data for 527 across all 16 federal states. Wikidata is community maintained; these records are not an accreditation list. The five analyzed programs remain separately curated in `src/lib/programs.ts`.

## Cloudflare Pages release

After authenticating Wrangler in the intended Cloudflare account, run:

```bash
npm ci
npm run build
npx wrangler pages deploy out --project-name degree-lens
```

The project is a Next.js static export (`output: 'export'`, `trailingSlash: true`), so Pages serves the `out` directory. Verify the returned Pages URL and the PDF workflow before making it the primary link. The previous Sites deployment should remain available until then.

## Architecture

- `src/lib/programs.ts`: curated program rules and official sources, verified 2026-10-31.
- `src/lib/extract.ts`: client-side PDF.js extraction and conservative course-row parsing.
- `src/lib/engine.ts`: local topic suggestions, verified-credit checks, disjoint allocation, nested requirements.
- `src/lib/demo.ts`: deterministic fictional profiles.
- `scripts/import-wikidata.mjs`: licensed institution discovery import with provenance.
- `scripts/postbuild.mjs`: prepares nested Next.js route assets for static hosts.
- `src/lib/report.ts`: local jsPDF report generation.
- `src/components/workspace.tsx`: in-memory state for the active browser session.

## Limits

Text-based PDFs with simple course/credit rows work best. Scans need manual entry. Credit equivalence and subject mapping require user confirmation. The engine does not evaluate university recognition, thesis quality, grade conversion, language proof, or final selection. Official rules may change; use the source links before applying.
