# DegreeLens

**European Higher Education Discovery & Academic Coursework Recommendation Platform**

DegreeLens is a privacy-first, browser-based academic platform designed for international students exploring undergraduate and postgraduate degree programs across Europe. It combines a 1,128-institution directory, a 4,650-degree-program discovery index across 13 countries, client-side transcript parsing, and an intelligent recommendation engine that matches verified coursework against academic entry requirements.

- **Production URL:** [https://degree-lens.pages.dev/](https://degree-lens.pages.dev/)
- **GitHub Repository:** [https://github.com/d3fenddr/degree-lens](https://github.com/d3fenddr/degree-lens)
- **Author:** Karim Baliyev ([@d3fenddr](https://github.com/d3fenddr))
- **Design System:** Swiss Academic (Inter typography, high data density, monochromatic visual hierarchy, zero glassmorphism or AI glow)

---

## Key Capabilities

### 1. Intelligent Program Matching Engine
- **Automated Recommendations:** Evaluates students' verified coursework, extracted academic vectors, and explicit study preferences (country, degree level, institution, field).
- **Two-Tier Matching System:**
  - **Verified Coursework Match:** Programs with verified, auditable ECTS admission rules (e.g. University of Regensburg, University of Bonn, University of Hamburg). ECTS credits are allocated strictly to matching subject buckets with double-counting prevention.
  - **Potential Academic Match:** European programs indexed from open university catalogs. Relevance is deterministically computed (0–100%) using an academic field taxonomy mapped to UNESCO ISCED-F 2013 codes, prior degree background, and user filters.
- **Explainable Results:** Every recommendation provides clear, bulleted reasons explaining why the program was suggested (e.g. verified ECTS fulfillment, academic field affinity, country match, degree level alignment).
- **Browser Shortlist:** Save, compare, and organize candidate programs locally in the browser with `localStorage` persistence.

### 2. European University & Program Discovery
- **1,128 Higher Education Institutions:** Spanning 31 European countries, enriched with ROR (Research Organization Registry) identifiers and Wikidata provenance.
- **4,650 Degree Programs:** Spanning 13 European nations across 36 classified academic disciplines.
- **Fast, Filterable Exploration:** Filter by country, academic discipline, degree level (Bachelor, Master, PhD), and verified ECTS status.

### 3. Client-Side Academic Coursework Analysis
- **Private Transcript Extraction:** Uses PDF.js locally in the browser to extract course titles, credits, and grades. No transcript data, personal information, or academic records are ever uploaded to any server.
- **3-Stage Review Process:**
  1. *Raw Extraction Review:* Preview parsed text rows with heuristic confidence indicators.
  2. *Interactive Coursework Editing:* Edit course titles, credits, and categories. Insertion at top with auto-focus and ARIA announcements.
  3. *Selective Bulk Confirmation:* Confirm reviewed courses with dynamic counting (`Confirm N reviewed courses`), keeping unvalidated or flagged rows highlighted.
- **ECTS Credit Mapping:** Disjoint allocation algorithm ensures no course credit is double-counted across multiple requirement buckets.
- **Deterministic Fictional Demo Profiles:** Test the system instantly with pre-configured synthetic profiles (Computer Science, Mathematics, Interdisciplinary Data Science).
- **PDF Report Export:** Generate and download structured, print-ready academic analysis reports generated client-side via jsPDF.

---

## Technical Architecture

```
src/
├── app/                      # Next.js App Router (Static Export)
│   ├── page.tsx              # Swiss Academic Homepage & Hero
│   ├── analyze/              # 3-Stage Coursework Review & Intelligent Matching
│   ├── results/              # Detailed ECTS Comparison & PDF Export
│   ├── programs/             # 4,650 European Degree-Program Directory
│   ├── universities/         # 1,128 European Institution Catalog
│   │   └── [name]/           # Dynamic SSG University Detail Profiles
│   ├── methodology/          # ECTS Allocation & Matching Engine Specification
│   ├── privacy/              # Client-Side Data Privacy Notice
│   └── globals.css           # Swiss Academic Design System & WCAG Tokens
├── components/
│   ├── header.tsx            # Minimalist Navigation Header
│   ├── footer.tsx            # Strict Minimal Footer (© 2026 Karim Baliyev)
│   └── workspace.tsx         # Client-Side Coursework Session State
├── data/
│   ├── programs.json         # 4,650 European Degree Programs
│   └── universities.json     # 1,128 European Higher Education Institutions
└── lib/
    ├── demo.ts               # Synthetic Academic Demo Profiles
    ├── engine.ts             # ECTS Disjoint Allocation & Double-Count Prevention
    ├── extract.ts            # Client-Side PDF.js Text & Course Extractor
    ├── programs.ts           # Curated & Verified ECTS Requirement Rules
    ├── report.ts             # Local jsPDF Academic Report Generator
    └── matching/             # Intelligent Program Recommendation Engine
        ├── index.ts          # Public Recommendation API
        ├── matching.types.ts # Type Definitions for Profiles, Scores & Filters
        ├── taxonomy.ts       # 36 Academic Disciplines & ISCED-F Mappings
        ├── profile.ts        # Academic Coursework & Field Vector Extraction
        ├── preferences.ts    # User Filter Constraints & Soft Boosts
        ├── ranking.ts        # Deterministic 0–100 Scoring & Two-Tier Sorting
        ├── explanations.ts   # Human-Readable Recommendation Explanations
        └── shortlist.ts      # LocalStorage-backed Candidate Shortlist
```

---

## Development & Verification

### Local Setup

```bash
# Install dependencies
npm ci

# Start development server
npm run dev
```

Visit `http://localhost:3000`. No database, external API keys, or backend services are required.

### Quality Assurance & Automated Testing

The project enforces strict code quality and testing standards:

```bash
# Type check TypeScript without emitting files
npm run typecheck

# Lint codebase with ESLint
npm run lint

# Run unit & integration test suite (Vitest)
npm test

# Build static production export
npm run build

# Run end-to-end browser tests (Playwright)
npm run test:e2e
```

- **Unit Tests:** 50 tests across 5 test suites (`vitest`) verifying parsing, matching algorithms, ECTS allocations, and ISCED-F taxonomy.
- **E2E Tests:** 10 end-to-end tests (`@playwright/test`) covering responsive viewports (375px, 768px, 1440px), PDF uploads, bulk confirmation, and intelligent recommendation journeys.
- **Independent QA Audit:** Full audit report documented in [`qa/QA_AUDIT.md`](qa/QA_AUDIT.md) with **Unconditional Production Release Sign-Off**.

---

## Deployment to Cloudflare Pages

DegreeLens is built as a pure static Next.js export (`output: 'export'`, `trailingSlash: true`) and deployed directly to Cloudflare Pages.

```bash
# Build production bundle (generates 1,139 static pages into out/)
npm run build

# Deploy out/ directory to Cloudflare Pages
npx wrangler pages deploy out --project-name=degree-lens --branch=main
```

---

## Academic Limitations & Disclaimer

DegreeLens is an independent exploratory tool created for preliminary academic evaluation.
- The 4,650 indexed programs and 1,128 institutions provide discovery guidance and do not constitute an official admissions guarantee.
- Course credit conversion, institutional accreditation, language proficiencies, and subjective admissions criteria remain the exclusive prerogative of the respective admitting universities.
- Always consult official university portal links provided on program cards before submitting formal applications.

---

## Author & License

- **Author:** Karim Baliyev
- **GitHub:** [https://github.com/d3fenddr](https://github.com/d3fenddr)
- **License:** MIT License
