import { chromium } from '@playwright/test';
import { jsPDF } from 'jspdf';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log(`=== Starting Comprehensive QA Audit against ${BASE_URL} ===\n`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditReport = {
    timestamp: new Date().toISOString(),
    routesChecked: [],
    defects: [],
    observations: [],
    journeys: {},
    responsiveAudit: {},
    accessibilityAudit: {},
    footerAudit: {},
  };

  const pageErrors = [];
  const consoleWarnings = [];
  page.on('pageerror', err => pageErrors.push({ url: page.url(), error: err.message, stack: err.stack }));
  page.on('console', msg => {
    if (msg.type() === 'error') {
      pageErrors.push({ url: page.url(), error: msg.text() });
    } else if (msg.type() === 'warning') {
      consoleWarnings.push({ url: page.url(), warning: msg.text() });
    }
  });

  // =========================================================================
  // ROUTE AUDIT: Static & Dynamic Pages
  // =========================================================================
  const testRoutes = [
    { path: '/', name: 'Homepage' },
    { path: '/universities/', name: 'Universities Catalog' },
    { path: '/universities/ror-00mepd532/', name: 'University Profile (ROR - RWTH Aachen)' },
    { path: '/programs/', name: 'Programs Catalog' },
    { path: '/analyze/', name: 'Analyze & Editor' },
    { path: '/results/', name: 'Results & Comparison' },
    { path: '/methodology/', name: 'Methodology' },
    { path: '/privacy/', name: 'Privacy Policy' },
    { path: '/about/', name: 'About' },
  ];

  console.log('--- Phase 1: Checking all routes for 200 OK, title, and headings ---');
  for (const r of testRoutes) {
    try {
      const resp = await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle' });
      const status = resp ? resp.status() : 'no-response';
      const title = await page.title();
      const h1 = await page.locator('h1').innerText().catch(() => 'NO_H1_FOUND');
      console.log(`[ROUTE] ${r.path} -> Status: ${status} | Title: "${title}" | H1: "${h1}"`);
      auditReport.routesChecked.push({ path: r.path, name: r.name, status, title, h1 });
    } catch (err) {
      console.error(`[ERROR] Route ${r.path} failed:`, err.message);
      auditReport.defects.push({
        id: `DEF-ROUTE-${r.path.replace(/\//g, '')}`,
        severity: 'P1 Critical',
        category: 'Functionality',
        location: r.path,
        description: `Failed to load route: ${err.message}`,
        expected: 'Route loads cleanly with status 200',
        actual: `Exception thrown: ${err.message}`,
        fix: 'Fix route handler or export generation'
      });
    }
  }

  // =========================================================================
  // FOOTER AUDIT across all routes
  // =========================================================================
  console.log('\n--- Phase 2: Verifying footer on all routes ---');
  let footerDefects = 0;
  for (const r of testRoutes) {
    await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'networkidle' });
    const footer = page.locator('footer.footer');
    const footerExists = await footer.count() > 0;
    if (!footerExists) {
      auditReport.defects.push({
        id: `DEF-FOOTER-MISSING-${r.path}`,
        severity: 'P2 Major',
        category: 'Layout/Visual',
        location: r.path,
        description: `Footer not found on ${r.path}`,
        expected: 'Footer exists on all routes',
        actual: 'No footer found',
        fix: 'Ensure Footer is rendered in layout'
      });
      footerDefects++;
      continue;
    }

    const footerText = await footer.innerText();
    const copyright = footerText.includes('© 2026 Karim Baliyev');
    const ghLink = footer.locator('a[href="https://github.com/d3fenddr"]');
    const ghVisible = await ghLink.count() > 0 && await ghLink.isVisible();
    const ghHref = await ghLink.getAttribute('href');

    // Strict footer content check: should strictly only be Karim Baliyev + GitHub link
    const cleanText = footerText.replace(/\s+/g, ' ').trim();
    console.log(`[FOOTER] ${r.path} -> Text: "${cleanText}" | GH: ${ghHref}`);
    if (!copyright || !ghVisible || ghHref !== 'https://github.com/d3fenddr') {
      auditReport.defects.push({
        id: `DEF-FOOTER-CONTENT-${r.path}`,
        severity: 'P2 Major',
        category: 'Design Integrity',
        location: r.path,
        description: `Footer content mismatch on ${r.path}`,
        expected: "Strictly '© 2026 Karim Baliyev' and clickable GitHub: 'https://github.com/d3fenddr'",
        actual: `Found text: "${cleanText}"`,
        fix: 'Ensure Footer component matches exact branding'
      });
      footerDefects++;
    }
  }
  auditReport.footerAudit.clean = (footerDefects === 0);

  // =========================================================================
  // JOURNEY A: First-time visitor transcript upload and manual editing
  // =========================================================================
  console.log('\n--- Phase 3: Journey A - Transcript Upload & Manual Editing ---');
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });
  
  // Check empty state
  const emptyStateH3 = await page.locator('.empty-state h3').innerText().catch(() => '');
  console.log(`[JOURNEY A] Initial state: "${emptyStateH3}"`);

  // Test "Add course manually" button
  await page.getByRole('button', { name: 'Add course manually' }).click();
  await page.waitForTimeout(400);

  // Verify insertion at top, focus, scroll, and ARIA announcement
  const coursesCount1 = await page.locator('.course-card').count();
  const firstInput = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
  const isFocused = await firstInput.evaluate(el => el === document.activeElement);
  const liveText = await page.locator('[aria-live="polite"]').innerText();
  console.log(`[JOURNEY A] Added 1st course: Count=${coursesCount1}, Focused=${isFocused}, LiveAnnouncement="${liveText}"`);

  if (coursesCount1 !== 1 || !isFocused || !liveText.includes('New course row added at the top')) {
    auditReport.defects.push({
      id: 'DEF-ADD-COURSE-UX',
      severity: 'P1 Critical',
      category: 'UX/Usability',
      location: '/analyze/',
      description: 'Add course manually does not properly focus title or announce via ARIA live',
      expected: 'New course added at top, title input focused, announced to screen reader',
      actual: `Count=${coursesCount1}, Focused=${isFocused}, ARIA="${liveText}"`,
      fix: 'Ensure autofocus, scrollIntoView, and live announcement trigger on addCourse'
    });
  }

  // Fill course details
  await firstInput.fill('Calculus II');
  const firstCredits = page.locator('.course-card').first().getByLabel('Credits', { exact: true });
  await firstCredits.fill('5');

  // Add 2nd course to verify top insertion order
  await page.getByRole('button', { name: 'Add course', exact: true }).click();
  await page.waitForTimeout(400);
  const coursesCount2 = await page.locator('.course-card').count();
  const newFirstInput = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
  await newFirstInput.fill('Introduction to Programming');

  const card1Title = await page.locator('.course-card').nth(0).locator('input[placeholder*="Linear Algebra"]').inputValue();
  const card2Title = await page.locator('.course-card').nth(1).locator('input[placeholder*="Linear Algebra"]').inputValue();
  console.log(`[JOURNEY A] Top insertion check: Card 0 = "${card1Title}", Card 1 = "${card2Title}"`);
  if (card1Title !== 'Introduction to Programming' || card2Title !== 'Calculus II') {
    auditReport.defects.push({
      id: 'DEF-TOP-INSERTION',
      severity: 'P1 Critical',
      category: 'Functionality',
      location: '/analyze/',
      description: 'Courses not inserted at the top of the course list',
      expected: 'New course inserted as index 0',
      actual: `Index 0: "${card1Title}", Index 1: "${card2Title}"`,
      fix: 'Use [newCourse, ...courses] in addCourse'
    });
  }

  // Test Credit System Conversion (UK CATS & US Semester)
  const creditSystemSelect = page.locator('.course-card').first().getByLabel('Credit system');
  await creditSystemSelect.selectOption('UK CATS');
  await page.waitForTimeout(300);
  const conversionFieldVisible = await page.locator('.course-card').first().locator('.conversion-field').isVisible();
  console.log(`[JOURNEY A] UK CATS conversion field visible: ${conversionFieldVisible}`);
  if (!conversionFieldVisible) {
    auditReport.defects.push({
      id: 'DEF-CREDIT-CONVERSION-FIELD',
      severity: 'P2 Major',
      category: 'Functionality',
      location: '/analyze/',
      description: 'Verified ECTS field does not appear when UK CATS is selected',
      expected: 'Conversion field appears with guidance note',
      actual: 'Field not displayed',
      fix: 'Render conversion-field when creditSystem !== ECTS'
    });
  }

  // Delete a course
  const trashBtn = page.locator('.course-card').first().locator('button.icon-button');
  await trashBtn.click();
  await page.waitForTimeout(300);
  const countAfterDelete = await page.locator('.course-card').count();
  const deleteLiveText = await page.locator('[aria-live="polite"]').innerText();
  console.log(`[JOURNEY A] Delete course: Count=${countAfterDelete}, LiveAnnouncement="${deleteLiveText}"`);

  // =========================================================================
  // JOURNEY B: Pre-configured sample profiles and review
  // =========================================================================
  console.log('\n--- Phase 4: Journey B - Demo Profiles & Workspace Synchronization ---');
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });
  
  // Test Mixed Data Science
  await page.getByRole('button', { name: 'Mixed Data Science' }).click();
  await page.waitForTimeout(400);
  const mixedCount = await page.locator('.course-card').count();
  console.log(`[JOURNEY B] Mixed Data Science loaded: ${mixedCount} courses`);
  
  // Check prior degree info populated
  const degreeLevelVal = await page.getByLabel('Completed / Prior Degree Level').inputValue();
  const degreeFieldVal = await page.getByLabel('Main Prior Study Field').inputValue();
  console.log(`[JOURNEY B] Academic background: Level="${degreeLevelVal}", Field="${degreeFieldVal}"`);

  // Test Mathematics heavy
  await page.getByRole('button', { name: 'Mathematics heavy' }).click();
  await page.waitForTimeout(400);
  const mathCount = await page.locator('.course-card').count();
  const mathField = await page.getByLabel('Main Prior Study Field').inputValue();
  console.log(`[JOURNEY B] Mathematics heavy loaded: ${mathCount} courses, Field="${mathField}"`);
  if (mathField !== 'Mathematics') {
    auditReport.defects.push({
      id: 'DEF-001',
      severity: 'P2 Major',
      category: 'Functionality',
      location: 'src/components/workspace.tsx:66',
      description: "Demo profile state mismatch: In workspace.tsx, loadDemo checks for 'Math Intensive' and 'Applied Informatics', but demo.ts exports 'Mathematics heavy' and 'Computer Science heavy'. Consequently, selecting 'Mathematics heavy' or 'Computer Science heavy' loads courses but fails to populate the user's Academic Background and Study Preferences.",
      expected: "Selecting 'Mathematics heavy' should populate prior study field with 'Mathematics' and preferences with relevant disciplines.",
      actual: `Field remains "${mathField}" instead of "Mathematics".`,
      fix: "Update workspace.tsx:66 and :77 to check for 'Mathematics heavy' and 'Computer Science heavy' matching demo.ts keys."
    });
  }

  // Test Computer Science heavy
  await page.getByRole('button', { name: 'Computer Science heavy' }).click();
  await page.waitForTimeout(400);
  const csCount = await page.locator('.course-card').count();
  const csField = await page.getByLabel('Main Prior Study Field').inputValue();
  console.log(`[JOURNEY B] Computer Science heavy loaded: ${csCount} courses, Field="${csField}"`);

  // =========================================================================
  // JOURNEY C: Bulk Confirmation & Verification Logic
  // =========================================================================
  console.log('\n--- Phase 5: Journey C - Contextual Bulk Confirm Button ---');
  // With Computer Science heavy loaded, uncheck 2 courses
  await page.locator('.course-card').nth(0).getByLabel('Confirm credits').uncheck();
  await page.locator('.course-card').nth(1).getByLabel('Confirm credits').uncheck();
  
  // Add an invalid course row (empty title and 0 credits)
  await page.getByRole('button', { name: 'Add course', exact: true }).click();
  await page.locator('.course-card').first().getByLabel('Credits', { exact: true }).fill('0');
  
  // Check bulk confirm button text
  const bulkBtn = page.getByRole('button', { name: /Confirm \d+ reviewed course/i });
  const bulkBtnVisible = await bulkBtn.isVisible();
  const bulkBtnText = bulkBtnVisible ? await bulkBtn.innerText() : 'NOT_VISIBLE';
  console.log(`[JOURNEY C] Bulk confirm button: Visible=${bulkBtnVisible}, Text="${bulkBtnText}"`);

  if (!bulkBtnVisible || !bulkBtnText.includes('Confirm 2 reviewed courses')) {
    auditReport.defects.push({
      id: 'DEF-BULK-CONFIRM-COUNT',
      severity: 'P1 Critical',
      category: 'UX/Usability',
      location: '/analyze/',
      description: 'Bulk confirm button does not accurately display eligible unconfirmed course count',
      expected: 'Button displays "Confirm 2 reviewed courses" excluding incomplete/invalid row',
      actual: `Button text: "${bulkBtnText}"`,
      fix: 'Filter eligible courses with title.trim() and credits > 0'
    });
  } else {
    // Click bulk confirm
    await bulkBtn.click();
    await page.waitForTimeout(300);

    // Verify feedback banner
    const banner = page.locator('span').filter({ hasText: /Confirmed 2 courses/i });
    const bannerVisible = await banner.isVisible();
    const unconfirmedInvalidRowChecked = await page.locator('.course-card').first().getByLabel('Confirm credits').isChecked();
    console.log(`[JOURNEY C] Feedback banner visible: ${bannerVisible}, Invalid row confirmed: ${unconfirmedInvalidRowChecked}`);

    if (!bannerVisible || unconfirmedInvalidRowChecked) {
      auditReport.defects.push({
        id: 'DEF-BULK-CONFIRM-BEHAVIOR',
        severity: 'P1 Critical',
        category: 'Functionality',
        location: '/analyze/',
        description: 'Bulk confirmation confirmed invalid rows or failed to display feedback banner',
        expected: 'Invalid row remains unconfirmed and feedback banner is shown',
        actual: `Banner=${bannerVisible}, InvalidRowChecked=${unconfirmedInvalidRowChecked}`,
        fix: 'Ensure only eligible IDs are updated'
      });
    }
  }

  // =========================================================================
  // JOURNEY D: European Program Matching, Filters, and Shortlisting
  // =========================================================================
  console.log('\n--- Phase 6: Journey D - Program Matching & Recommendations ---');
  // Load Mixed Data Science
  await page.getByRole('button', { name: 'Mixed Data Science' }).click();
  await page.waitForTimeout(400);

  // Preference filters test: Country chip
  const nlChip = page.locator('.preference-card').filter({ hasText: 'Preferred Countries' }).locator('button.filter-chip', { hasText: 'Netherlands' });
  await nlChip.click();
  await page.waitForTimeout(200);
  const activeChips = await page.locator('.filter-chip.active').allInnerTexts();
  console.log(`[JOURNEY D] Active filter chips after selecting Netherlands:`, activeChips);

  // Remove country filter
  await nlChip.click();
  await page.waitForTimeout(200);

  // Click Find matching programs
  const findBtn = page.getByRole('button', { name: /Find matching programs/i });
  await findBtn.click();
  await page.waitForTimeout(600);

  // Check results section
  const resultsSectionVisible = await page.locator('#matching-results-section').isVisible();
  console.log(`[JOURNEY D] Matching results section visible: ${resultsSectionVisible}`);

  const matchCardsCount = await page.locator('.match-card').count();
  console.log(`[JOURNEY D] Match cards rendered: ${matchCardsCount}`);

  if (!resultsSectionVisible || matchCardsCount === 0) {
    auditReport.defects.push({
      id: 'DEF-MATCHING-RESULTS',
      severity: 'P0 Blocker',
      category: 'Functionality',
      location: '/analyze/',
      description: 'Matching recommendations failed to render results',
      expected: 'Recommendations section rendered with ranked program cards',
      actual: `Visible=${resultsSectionVisible}, Count=${matchCardsCount}`,
      fix: 'Verify rankPrograms calculation and state trigger'
    });
  } else {
    // Check first match card is Verified match
    const firstCard = page.locator('.match-card').first();
    const firstPill = await firstCard.locator('.verified-pill').innerText().catch(() => 'NONE');
    const scoreBadge = await firstCard.locator('.match-score-badge').innerText().catch(() => 'NONE');
    const whyList = await firstCard.locator('.match-why-list').isVisible();
    console.log(`[JOURNEY D] First match card: Pill="${firstPill}", Score="${scoreBadge}", WhyList=${whyList}`);

    // Test Shortlisting
    const shortlistBtn = firstCard.getByRole('button', { name: /Toggle shortlist/i });
    await shortlistBtn.click();
    await page.waitForTimeout(200);
    const isShortlistedText = await shortlistBtn.innerText();
    const shortlistBannerVisible = await page.getByText(/program saved in your browser shortlist/i).isVisible();
    console.log(`[JOURNEY D] Shortlist toggle: ButtonText="${isShortlistedText}", BannerVisible=${shortlistBannerVisible}`);

    if (!isShortlistedText.includes('Shortlisted') || !shortlistBannerVisible) {
      auditReport.defects.push({
        id: 'DEF-SHORTLIST-TOGGLE',
        severity: 'P1 Critical',
        category: 'Functionality',
        location: '/analyze/',
        description: 'Shortlist toggle failed to update button state or show shortlist summary bar',
        expected: 'Button shows Shortlisted and banner appears',
        actual: `ButtonText="${isShortlistedText}", Banner=${shortlistBannerVisible}`,
        fix: 'Ensure toggleShortlist updates workspace state correctly'
      });
    }

    // Test details toggle
    const detailsBtn = firstCard.getByRole('button', { name: /More details/i });
    if (await detailsBtn.isVisible()) {
      await detailsBtn.click();
      await page.waitForTimeout(200);
      const detailsExpanded = await firstCard.getByText('Source Provider:').isVisible();
      console.log(`[JOURNEY D] More details accordion expanded: ${detailsExpanded}`);
    }
  }

  // =========================================================================
  // JOURNEY E: Comparison & PDF Generation on /results/
  // =========================================================================
  console.log('\n--- Phase 7: Journey E - Comparison & PDF Generation on /results/ ---');
  // Navigate via client link to retain React in-memory state
  const viewComparisonLink = page.getByRole('link', { name: /View comparison/i }).first();
  await viewComparisonLink.click();
  await page.waitForTimeout(600);

  // Verify tablist and metrics
  const tabsCount = await page.getByRole('tab').count();
  const metricCards = await page.locator('.metric-card').count();
  const coverageRows = await page.locator('.coverage-row').count();
  console.log(`[JOURNEY E] Results page: Tabs=${tabsCount}, Metrics=${metricCards}, CoverageRows=${coverageRows}`);

  // Test PDF download
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(e => null);
  const pdfBtn = page.getByRole('button', { name: /Download PDF report/i });
  await pdfBtn.click();
  const download = await downloadPromise;

  if (!download) {
    auditReport.defects.push({
      id: 'DEF-PDF-DOWNLOAD',
      severity: 'P1 Critical',
      category: 'Functionality',
      location: '/results/',
      description: 'Download PDF report button failed to trigger download event within 15s',
      expected: 'Download event fired with DegreeLens-coursework-report.pdf',
      actual: 'Download timed out',
      fix: 'Verify downloadReport function and jsPDF generation'
    });
  } else {
    const filename = download.suggestedFilename();
    const downloadPath = await download.path();
    const pdfBytes = await readFile(downloadPath);
    const magic = pdfBytes.subarray(0, 5).toString();
    console.log(`[JOURNEY E] PDF downloaded: "${filename}", Size=${pdfBytes.length} bytes, Header="${magic}"`);
    if (filename !== 'DegreeLens-coursework-report.pdf' || magic !== '%PDF-' || pdfBytes.length < 2000) {
      auditReport.defects.push({
        id: 'DEF-PDF-INTEGRITY',
        severity: 'P1 Critical',
        category: 'Functionality',
        location: '/results/',
        description: 'Generated PDF fails integrity check (wrong name, header, or empty content)',
        expected: 'DegreeLens-coursework-report.pdf, %PDF- header, >2KB size',
        actual: `Filename="${filename}", Header="${magic}", Size=${pdfBytes.length}`,
        fix: 'Ensure report.ts generates valid PDF document'
      });
    }
  }

  // =========================================================================
  // JOURNEY F: Institution & Program Discovery
  // =========================================================================
  console.log('\n--- Phase 8: Journey F - Universities & Programs Catalog Discovery ---');
  // Universities search & filter
  await page.goto(`${BASE_URL}/universities/`, { waitUntil: 'networkidle' });
  const searchInput = page.getByLabel('Search', { exact: true });
  await searchInput.fill('Munich');
  await page.waitForTimeout(400);
  const munichCount = await page.locator('.directory-row').count();
  console.log(`[JOURNEY F] Universities search 'Munich' count: ${munichCount}`);

  // University Detail Page
  const firstUniLink = page.locator('.directory-row a').first();
  await firstUniLink.click();
  await page.waitForLoadState('networkidle');
  const uniDetailH1 = await page.locator('h1').innerText();
  const uniProvenance = await page.locator('.kicker').first().innerText();
  const indexedProgramsCount = await page.locator('section').filter({ hasText: 'Indexed Degree Programs' }).locator('div > strong').count();
  console.log(`[JOURNEY F] University Detail: H1="${uniDetailH1}", Provenance="${uniProvenance}", IndexedPrograms=${indexedProgramsCount}`);

  // Programs catalog search & filter
  await page.goto(`${BASE_URL}/programs/`, { waitUntil: 'networkidle' });
  const programSearch = page.getByLabel('Search programs');
  await programSearch.fill('Artificial Intelligence');
  await page.waitForTimeout(400);
  const aiProgramCount = await page.locator('.program-card').count();
  console.log(`[JOURNEY F] Programs catalog search 'Artificial Intelligence' count: ${aiProgramCount}`);

  // =========================================================================
  // JOURNEY G: Error Handling (Corrupted / non-PDF, extreme inputs)
  // =========================================================================
  console.log('\n--- Phase 9: Journey G - Error Handling & Edge Cases ---');
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });

  // Upload non-PDF text file as PDF
  const fakePdfBuffer = Buffer.from('This is not a real PDF file header.');
  await page.getByLabel('Upload transcript PDF').setInputFiles({
    name: 'malformed.pdf',
    mimeType: 'application/pdf',
    buffer: fakePdfBuffer
  });
  await page.waitForTimeout(800);
  const alertEl = page.locator('.alert[role="alert"]');
  const alertVisible = await alertEl.isVisible();
  const alertMsg = alertVisible ? await alertEl.innerText() : 'NONE';
  console.log(`[JOURNEY G] Malformed PDF handling: AlertVisible=${alertVisible}, Msg="${alertMsg}"`);
  if (!alertVisible) {
    auditReport.defects.push({
      id: 'DEF-MALFORMED-PDF-ALERT',
      severity: 'P2 Major',
      category: 'Functionality',
      location: '/analyze/',
      description: 'Malformed PDF upload does not render an alert message for the user',
      expected: 'User-facing error alert is displayed explaining the file could not be read',
      actual: 'No alert rendered',
      fix: 'Catch PDF extraction error and set error state in UI'
    });
  }

  // Potential grade detection
  const gradeDoc = new jsPDF();
  gradeDoc.text('Database Systems 2.3 ECTS', 10, 10);
  await page.getByLabel('Upload transcript PDF').setInputFiles({
    name: 'grade-transcript.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(gradeDoc.output('arraybuffer'))
  });
  await page.waitForTimeout(800);
  const gradeWarningVisible = await page.getByText(/Review value: 2.3 resembles a grade/).isVisible();
  console.log(`[JOURNEY G] Grade warning banner visible: ${gradeWarningVisible}`);
  if (!gradeWarningVisible) {
    auditReport.defects.push({
      id: 'DEF-GRADE-WARNING',
      severity: 'P2 Major',
      category: 'UX/Usability',
      location: '/analyze/',
      description: 'Credit value 2.3 resembling a German grade did not trigger a review warning',
      expected: 'Grade warning banner shown on course card',
      actual: 'Warning not displayed',
      fix: 'Verify reviewStatus: potential-grade check in extractPdf'
    });
  }

  // =========================================================================
  // JOURNEY H: Responsive Layout Audit (375px, 768px, 1440px)
  // =========================================================================
  console.log('\n--- Phase 10: Journey H - Responsive Viewports & Horizontal Overflow Check ---');
  const viewports = [
    { width: 375, height: 812, name: 'Mobile (375px)' },
    { width: 768, height: 1024, name: 'Tablet (768px)' },
    { width: 1440, height: 900, name: 'Desktop (1440px)' },
  ];

  const responsiveRoutes = [
    '/',
    '/universities/',
    '/universities/ror-00mepd532/',
    '/programs/',
    '/analyze/',
    '/results/',
    '/methodology/',
    '/privacy/',
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const route of responsiveRoutes) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const isOverflowing = scrollWidth > vp.width;
      console.log(`[RESPONSIVE] ${vp.name} on ${route} -> scrollWidth: ${scrollWidth}px (Target <= ${vp.width}px) ${isOverflowing ? 'OVERFLOW!' : 'OK'}`);

      if (isOverflowing) {
        // Find which elements cause the overflow
        const overflowingElements = await page.evaluate((maxW) => {
          const els = Array.from(document.querySelectorAll('*'));
          return els
            .filter(el => el.getBoundingClientRect().right > maxW + 1)
            .map(el => `${el.tagName}.${el.className} (right: ${el.getBoundingClientRect().right}px)`)
            .slice(0, 5);
        }, vp.width);

        auditReport.defects.push({
          id: `DEF-OVERFLOW-${vp.width}-${route.replace(/\//g, '')}`,
          severity: 'P2 Major',
          category: 'Layout/Visual',
          location: route,
          description: `Horizontal overflow detected at ${vp.width}px: scrollWidth=${scrollWidth}px`,
          expected: `scrollWidth <= ${vp.width}px`,
          actual: `scrollWidth = ${scrollWidth}px. Overflow elements: ${overflowingElements.join('; ')}`,
          fix: 'Set max-width: 100%, overflow-x: hidden or adjust flex/grid layouts on mobile'
        });
      }
    }
  }

  // =========================================================================
  // JOURNEY I: Accessibility Audit
  // =========================================================================
  console.log('\n--- Phase 11: Journey I - Accessibility & Contrast Audit ---');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });

  // Form label associations
  const unlabelledInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select, textarea'));
    return inputs.filter(input => {
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
      const hasAssociatedLabel = input.id && document.querySelector(`label[for="${input.id}"]`);
      const isInsideLabel = Boolean(input.closest('label'));
      return !hasAriaLabel && !hasAssociatedLabel && !isInsideLabel;
    }).map(el => `${el.tagName}#${el.id || 'no-id'}.${el.className}`);
  });

  console.log(`[A11Y] Unlabelled form inputs on /analyze/: ${unlabelledInputs.length}`);
  if (unlabelledInputs.length > 0) {
    auditReport.defects.push({
      id: 'DEF-A11Y-UNLABELLED-INPUTS',
      severity: 'P2 Major',
      category: 'Accessibility',
      location: '/analyze/',
      description: `Found ${unlabelledInputs.length} form inputs without explicit label or aria-label: ${unlabelledInputs.slice(0, 5).join(', ')}`,
      expected: 'All interactive form elements have accessible labels',
      actual: `${unlabelledInputs.length} inputs missing labels`,
      fix: 'Add aria-label or wrap in label elements'
    });
  }

  // Focus visible styles
  const focusOutline = await page.evaluate(() => {
    const btn = document.querySelector('button.button');
    if (!btn) return 'no-button';
    btn.focus();
    return window.getComputedStyle(btn).outlineStyle;
  });
  console.log(`[A11Y] Focus outline style: ${focusOutline}`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n======================================================');
  console.log('AUDIT SUMMARY:');
  console.log(`Total Routes Verified: ${auditReport.routesChecked.length}`);
  console.log(`Page/Console Errors: ${pageErrors.length}`);
  console.log(`Console Warnings: ${consoleWarnings.length}`);
  console.log(`Total Defects Found: ${auditReport.defects.length}`);
  console.log('======================================================\n');

  if (pageErrors.length > 0) {
    console.log('Errors caught during audit:', pageErrors);
  }

  await writeFile('scripts/audit-report.json', JSON.stringify({ auditReport, pageErrors, consoleWarnings }, null, 2));
  console.log('Saved detailed audit report to scripts/audit-report.json');

  await browser.close();
  return { auditReport, pageErrors, consoleWarnings };
}

main().catch(err => {
  console.error('Fatal audit runner exception:', err);
  process.exit(1);
});
