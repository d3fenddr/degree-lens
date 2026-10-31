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

Playwright tests use locally installed Chrome. The production build is a static export in `out/`.

## Architecture

- `src/lib/programs.ts`: curated program rules and official sources, verified 2026-10-31.
- `src/lib/extract.ts`: client-side PDF.js extraction and conservative course-row parsing.
- `src/lib/engine.ts`: local topic suggestions, verified-credit checks, disjoint allocation, nested requirements.
- `src/lib/demo.ts`: deterministic fictional profiles.
- `src/lib/report.ts`: local jsPDF report generation.
- `src/components/workspace.tsx`: in-memory state for the active browser session.

## Limits

Text-based PDFs with simple course/credit rows work best. Scans need manual entry. Credit equivalence and subject mapping require user confirmation. The engine does not evaluate university recognition, thesis quality, grade conversion, language proof, or final selection. Official rules may change; use the source links before applying.
