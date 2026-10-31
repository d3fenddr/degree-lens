import { chromium } from '@playwright/test';
import { jsPDF } from 'jspdf';

const BASE_URL = 'http://localhost:3000';

async function runWizardAudit() {
  console.log(`=== STARTING DEGREE-LENS WIZARD COMPREHENSIVE QA AUDIT ===`);
  console.log(`Target URL: ${BASE_URL}/analyze/`);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const auditResults = {
    timestamp: new Date().toISOString(),
    totalChecks: 0,
    passedChecks: 0,
    failedChecks: 0,
    failures: [],
    details: {}
  };

  function assertCheck(id, description, passed, errorDetail = null) {
    auditResults.totalChecks++;
    if (passed) {
      auditResults.passedChecks++;
      console.log(`  [PASS] ${id}: ${description}`);
    } else {
      auditResults.failedChecks++;
      console.error(`  [FAIL] ${id}: ${description} - ${errorDetail || 'Condition not met'}`);
      auditResults.failures.push({ id, description, error: errorDetail });
    }
  }

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  // =========================================================================
  // TEST SUITE 1: All four steps and step-by-step progression (1 -> 2 -> 3 -> 4)
  // =========================================================================
  console.log(`\n--- Test Suite 1: Step-by-Step Progression (1 -> 2 -> 3 -> 4) ---`);
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });

  // Step 1 check
  const h1Step1 = await page.getByRole('heading', { name: 'Build your coursework profile.' }).isVisible();
  assertCheck('TS1-01', 'Step 1 heading visible on initial load', h1Step1);
  const step1TabActive = await page.locator('.wizard-step-tab').nth(0).evaluate(el => el.classList.contains('active'));
  assertCheck('TS1-02', 'Step 1 tab active initially', step1TabActive);

  // Transition to Step 2 via demo profile
  await page.getByRole('button', { name: 'Mixed Data Science' }).click();
  await page.waitForTimeout(300);
  const h1Step2 = await page.getByRole('heading', { name: /Course editor/i }).isVisible();
  assertCheck('TS1-03', 'Step 2 heading visible after demo profile selection', h1Step2);
  const step2TabActive = await page.locator('.wizard-step-tab').nth(1).evaluate(el => el.classList.contains('active'));
  assertCheck('TS1-04', 'Step 2 tab active', step2TabActive);

  // Transition to Step 3 via button
  await page.getByRole('button', { name: 'Study preferences', exact: true }).click();
  await page.waitForTimeout(300);
  const h1Step3 = await page.getByRole('heading', { name: 'Where & what do you want to study?' }).isVisible();
  assertCheck('TS1-05', 'Step 3 heading visible after clicking Study preferences', h1Step3);
  const step3TabActive = await page.locator('.wizard-step-tab').nth(2).evaluate(el => el.classList.contains('active'));
  assertCheck('TS1-06', 'Step 3 tab active', step3TabActive);

  // Transition to Step 4 via button
  await page.getByRole('button', { name: /Find matching programs/i }).click();
  await page.waitForTimeout(400);
  const h1Step4 = await page.getByRole('heading', { name: 'Programs matching your academic profile' }).isVisible();
  assertCheck('TS1-07', 'Step 4 heading visible after clicking Find matching programs', h1Step4);
  const step4TabActive = await page.locator('.wizard-step-tab').nth(3).evaluate(el => el.classList.contains('active'));
  assertCheck('TS1-08', 'Step 4 tab active', step4TabActive);

  // =========================================================================
  // TEST SUITE 2: Back and Continue navigation buttons across all steps
  // =========================================================================
  console.log(`\n--- Test Suite 2: Back and Continue Navigation across All Steps ---`);
  // From Step 4, click "Adjust preferences" (Back)
  await page.getByRole('button', { name: /Adjust preferences/i }).first().click();
  await page.waitForTimeout(300);
  const backToStep3 = await page.getByRole('heading', { name: 'Where & what do you want to study?' }).isVisible();
  assertCheck('TS2-01', 'Step 4 back button navigates to Step 3', backToStep3);

  // From Step 3, click "Coursework review" (Back)
  await page.getByRole('button', { name: 'Coursework review', exact: true }).click();
  await page.waitForTimeout(300);
  const backToStep2 = await page.getByRole('heading', { name: /Course editor/i }).isVisible();
  assertCheck('TS2-02', 'Step 3 back button navigates to Step 2', backToStep2);

  // From Step 2, click "Academic background" (Back)
  await page.getByRole('button', { name: /Academic background/i }).click();
  await page.waitForTimeout(300);
  const backToStep1 = await page.getByRole('heading', { name: 'Build your coursework profile.' }).isVisible();
  assertCheck('TS2-03', 'Step 2 back button navigates to Step 1', backToStep1);

  // From Step 1, click "Review courses" (Continue)
  await page.getByRole('button', { name: /Review courses/i }).click();
  await page.waitForTimeout(300);
  const fwdToStep2 = await page.getByRole('heading', { name: /Course editor/i }).isVisible();
  assertCheck('TS2-04', 'Step 1 continue button navigates forward to Step 2', fwdToStep2);

  // From Step 2, jump directly to Step 4 via "Find matching programs"
  await page.getByRole('button', { name: /Find matching programs/i }).click();
  await page.waitForTimeout(400);
  const step2DirectTo4 = await page.getByRole('heading', { name: 'Programs matching your academic profile' }).isVisible();
  assertCheck('TS2-05', 'Step 2 Find matching programs shortcut button navigates directly to Step 4', step2DirectTo4);

  // Top action bar button: "Edit coursework" in Step 4 navigates back to Step 2
  await page.getByRole('button', { name: /Edit coursework/i }).click();
  await page.waitForTimeout(300);
  const step4TopTo2 = await page.getByRole('heading', { name: /Course editor/i }).isVisible();
  assertCheck('TS2-06', 'Step 4 top action bar button navigates directly to Step 2', step4TopTo2);

  // =========================================================================
  // TEST SUITE 3: Stepper Tab Navigation (Tabs 1, 2, 3, 4)
  // =========================================================================
  console.log(`\n--- Test Suite 3: Stepper Tab Navigation ---`);
  // Click Tab 3
  await page.locator('.wizard-step-tab').nth(2).click();
  await page.waitForTimeout(300);
  const tab3Nav = await page.getByRole('heading', { name: 'Where & what do you want to study?' }).isVisible();
  assertCheck('TS3-01', 'Clicking Tab 3 directly navigates to Step 3', tab3Nav);

  // Click Tab 1
  await page.locator('.wizard-step-tab').nth(0).click();
  await page.waitForTimeout(300);
  const tab1Nav = await page.getByRole('heading', { name: 'Build your coursework profile.' }).isVisible();
  assertCheck('TS3-02', 'Clicking Tab 1 directly navigates to Step 1', tab1Nav);

  // Click Tab 4
  await page.locator('.wizard-step-tab').nth(3).click();
  await page.waitForTimeout(300);
  const tab4Nav = await page.getByRole('heading', { name: 'Programs matching your academic profile' }).isVisible();
  assertCheck('TS3-03', 'Clicking Tab 4 directly navigates to Step 4', tab4Nav);

  // Fresh load with 0 courses: Tabs 2, 3, 4 must be disabled
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  const tab2Disabled = await page.locator('.wizard-step-tab').nth(1).isDisabled();
  const tab3Disabled = await page.locator('.wizard-step-tab').nth(2).isDisabled();
  const tab4Disabled = await page.locator('.wizard-step-tab').nth(3).isDisabled();
  assertCheck('TS3-04', 'Tabs 2, 3, 4 are disabled when 0 courses are present', tab2Disabled && tab3Disabled && tab4Disabled);

  // =========================================================================
  // TEST SUITE 4: Empty and Invalid Inputs Validation
  // =========================================================================
  console.log(`\n--- Test Suite 4: Empty and Invalid Inputs Validation ---`);
  // On Step 1: click Review courses with 0 courses -> inline validation alert
  await page.getByRole('button', { name: /Review courses/i }).click();
  await page.waitForTimeout(200);
  const step1Alert = page.locator('.wizard-validation-alert');
  const alertStep1Vis = await step1Alert.isVisible();
  const alertStep1Text = await step1Alert.innerText();
  assertCheck('TS4-01', 'Step 1 validation alert appears when reviewing 0 courses', alertStep1Vis && alertStep1Text.includes('upload a transcript PDF'));

  // On Step 2: add course with empty title -> click Study preferences -> validation alert
  await page.getByRole('button', { name: /Add course manually/i }).click();
  await page.waitForTimeout(300);
  // Now on Step 2 with 1 empty course
  await page.getByRole('button', { name: 'Study preferences', exact: true }).click();
  await page.waitForTimeout(200);
  const step2Alert = page.locator('.wizard-validation-alert');
  const alertStep2Vis = await step2Alert.isVisible();
  const alertStep2Text = await step2Alert.innerText();
  assertCheck('TS4-02', 'Step 2 blocks progression when course title is empty', alertStep2Vis && alertStep2Text.includes('ensure all course entries have a title'));

  // Step 2: fill title, set credits to 0 -> validation alert
  const titleInput = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
  await titleInput.fill('Calculus I');
  const creditInput = page.locator('.course-card').first().getByLabel('Credits', { exact: true });
  await creditInput.fill('0');
  await page.getByRole('button', { name: 'Study preferences', exact: true }).click();
  await page.waitForTimeout(200);
  const alertCredit0Text = await step2Alert.innerText();
  assertCheck('TS4-03', 'Step 2 blocks progression when course credits are 0 or negative', alertCredit0Text.includes('positive credits'));

  // Fix course credits to 6
  await creditInput.fill('6');
  await page.getByRole('button', { name: 'Study preferences', exact: true }).click();
  await page.waitForTimeout(300);
  const onStep3 = await page.getByRole('heading', { name: 'Where & what do you want to study?' }).isVisible();
  assertCheck('TS4-04', 'Step 2 advances to Step 3 once course entries are valid', onStep3);

  // Step 3: strict country mode with 0 countries -> blocks progression
  const countryModeSelect = page.getByLabel('Country filter mode');
  await countryModeSelect.selectOption('strict');
  await page.getByRole('button', { name: /Find matching programs/i }).click();
  await page.waitForTimeout(200);
  const step3AlertText = await page.locator('.wizard-validation-alert').innerText().catch(() => '');
  assertCheck('TS4-05', 'Step 3 blocks progression on strict country mode with 0 countries', step3AlertText.includes("Strict only' country mode"));

  // Reset country mode to all, set discipline mode to mandatory with 0 disciplines
  await countryModeSelect.selectOption('all');
  const disciplineModeSelect = page.getByLabel('Discipline filter mode');
  await disciplineModeSelect.selectOption('mandatory');
  await page.getByRole('button', { name: /Find matching programs/i }).click();
  await page.waitForTimeout(200);
  const step3DiscAlert = await page.locator('.wizard-validation-alert').innerText().catch(() => '');
  assertCheck('TS4-06', 'Step 3 blocks progression on mandatory discipline mode with 0 disciplines', step3DiscAlert.includes("Mandatory' discipline mode"));

  // Reset discipline mode to any
  await disciplineModeSelect.selectOption('any');

  // =========================================================================
  // TEST SUITE 5: PDF Uploads (local extraction & auto-advance)
  // =========================================================================
  console.log(`\n--- Test Suite 5: PDF Uploads and Local Extraction ---`);
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });
  const doc = new jsPDF();
  doc.text('Linear Algebra 6 ECTS', 10, 10);
  doc.text('Database Systems 6 ECTS', 10, 20);
  doc.text('Operating Systems 6 ECTS', 10, 30);
  const pdfBytes = Buffer.from(doc.output('arraybuffer'));

  await page.getByLabel('Upload transcript PDF').setInputFiles({
    name: 'qa-test-transcript.pdf',
    mimeType: 'application/pdf',
    buffer: pdfBytes
  });
  await page.waitForTimeout(600);

  // Verify auto-transition to Step 2
  const pdfStep2Active = await page.getByRole('heading', { name: /Course editor/i }).isVisible();
  assertCheck('TS5-01', 'PDF upload automatically transitions to Step 2: Course editor', pdfStep2Active);
  const extractedCardsCount = await page.locator('.course-card').count();
  assertCheck('TS5-02', 'PDF text extraction extracted exactly 3 courses', extractedCardsCount === 3, `Found ${extractedCardsCount}`);
  const hasPageMeta = await page.locator('.course-card').first().innerText();
  assertCheck('TS5-03', 'Extracted course displays PDF page metadata', hasPageMeta.includes('PDF page 1'));

  // =========================================================================
  // TEST SUITE 6: Demo Profiles Loading
  // =========================================================================
  console.log(`\n--- Test Suite 6: Demo Profiles Loading and Synchronization ---`);
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Mathematics heavy' }).click();
  await page.waitForTimeout(400);

  const mathCoursesCount = await page.locator('.course-card').count();
  assertCheck('TS6-01', 'Mathematics heavy demo loads exactly 11 courses', mathCoursesCount === 11, `Found ${mathCoursesCount}`);

  // Check background info on Step 1
  await page.locator('.wizard-step-tab').nth(0).click();
  await page.waitForTimeout(300);
  const priorField = await page.locator('input[placeholder*="Computer Science, Mathematics"]').inputValue();
  assertCheck('TS6-02', 'Mathematics heavy synchronizes prior study field to "Mathematics"', priorField === 'Mathematics', `Got "${priorField}"`);

  // =========================================================================
  // TEST SUITE 7: Course Editing, Credit Conversion, Mapping, Bulk Confirm
  // =========================================================================
  console.log(`\n--- Test Suite 7: Course Editing, Credit Conversion & Bulk Confirmation ---`);
  await page.locator('.wizard-step-tab').nth(1).click();
  await page.waitForTimeout(300);

  // Edit course title
  const firstCourseTitle = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
  await firstCourseTitle.fill('Advanced Linear Algebra & Matrix Theory');
  assertCheck('TS7-01', 'Course title successfully edited', (await firstCourseTitle.inputValue()) === 'Advanced Linear Algebra & Matrix Theory');

  // Change credit system to UK CATS -> verify credit conversion
  const creditSysSelect = page.locator('.course-card').first().getByLabel('Credit system');
  await creditSysSelect.selectOption('UK CATS');
  await page.waitForTimeout(200);
  const convInput = page.locator('.course-card').first().getByLabel('Verified ECTS equivalent');
  const convVisible = await convInput.isVisible();
  await convInput.fill('4.5');
  const convValue = await convInput.inputValue();
  assertCheck('TS7-02', 'UK CATS conversion field displayed and editable', convVisible && convValue === '4.5');

  // Change credit system back to ECTS
  await creditSysSelect.selectOption('ECTS');

  // Change subject mapping dropdown
  const mappingSelect = page.locator('.course-card').first().getByLabel('Subject mapping');
  await mappingSelect.selectOption('theory');
  assertCheck('TS7-03', 'Subject mapping dropdown successfully updated to Theoretical CS', (await mappingSelect.inputValue()) === 'theory');

  // Unconfirm courses and test bulk confirmation
  const firstConfirm = page.locator('.course-card').first().getByLabel('Confirm credits');
  await firstConfirm.uncheck();
  assertCheck('TS7-04', 'Course credits successfully unconfirmed', !(await firstConfirm.isChecked()));

  const bulkBtn = page.getByRole('button', { name: /Confirm.*reviewed course/i });
  const bulkBtnVis = await bulkBtn.isVisible();
  assertCheck('TS7-05', 'Bulk confirmation button visible when unconfirmed valid courses exist', bulkBtnVis);
  if (bulkBtnVis) {
    await bulkBtn.click();
    await page.waitForTimeout(300);
    assertCheck('TS7-06', 'Bulk confirmation confirms unconfirmed course', await firstConfirm.isChecked());
  }

  // =========================================================================
  // TEST SUITE 8: Country, University, and Discipline Filters in Step 3
  // =========================================================================
  console.log(`\n--- Test Suite 8: Country, University, and Discipline Filters in Step 3 ---`);
  await page.getByRole('button', { name: 'Study preferences', exact: true }).click();
  await page.waitForTimeout(300);

  // Filter country search
  const countrySearch = page.getByLabel('Search countries');
  await countrySearch.fill('Neth');
  await page.waitForTimeout(200);
  const nlChip = page.locator('.filter-chip', { hasText: 'Netherlands' });
  assertCheck('TS8-01', 'Country search filters chip container to matching countries', await nlChip.isVisible());
  await nlChip.click();
  assertCheck('TS8-02', 'Selecting Netherlands adds active state', await nlChip.evaluate(el => el.classList.contains('active')));
  await countrySearch.fill('');

  // University search
  const uniSearch = page.getByLabel('Search universities');
  await uniSearch.fill('Amsterdam');
  await page.waitForTimeout(200);
  const uniChip = page.locator('.filter-chip', { hasText: 'Universiteit van Amsterdam' });
  const uniChipVis = await uniChip.isVisible();
  assertCheck('TS8-03', 'University search filters university chips (Universiteit van Amsterdam)', uniChipVis);
  if (uniChipVis) {
    await uniChip.click();
    assertCheck('TS8-04', 'University chip becomes active upon click', await uniChip.evaluate(el => el.classList.contains('active')));
  }
  await uniSearch.fill('');

  // Active filter badges verification
  const nlBadge = page.locator('.active-filter-badge', { hasText: 'Netherlands' });
  assertCheck('TS8-05', 'Active filter badge displayed for Netherlands', await nlBadge.isVisible());

  // Click badge to dismiss
  await nlBadge.click();
  await page.waitForTimeout(200);
  assertCheck('TS8-06', 'Clicking active filter badge removes country preference', !(await nlBadge.isVisible()));

  // Re-select Germany for recommendations
  const deChip = page.locator('.filter-chip', { hasText: 'Germany' });
  await deChip.click();

  // =========================================================================
  // TEST SUITE 9: Recommendations, Verified vs Potential, Explanations in Step 4
  // =========================================================================
  console.log(`\n--- Test Suite 9: Recommendation Generation and Explanations in Step 4 ---`);
  await page.getByRole('button', { name: /Find matching programs/i }).click();
  await page.waitForTimeout(500);

  // Check matching cards count
  const matchCards = page.locator('.match-card');
  const cardsCount = await matchCards.count();
  assertCheck('TS9-01', 'Recommendation engine returns ranked program cards', cardsCount > 0, `Count: ${cardsCount}`);

  // Check verified vs potential cards
  const verifiedPill = page.locator('.verified-pill').first();
  const verifiedPillVis = await verifiedPill.isVisible();
  assertCheck('TS9-02', 'Verified coursework matches display "Verified Coursework Match" pill', verifiedPillVis);

  // Check score badge
  const scoreBadge = page.locator('.match-score-badge').first();
  const scoreText = await scoreBadge.innerText();
  assertCheck('TS9-03', 'Relevance score badge formatted correctly', scoreText.includes('Relevance:'));

  // Check explanation reasons
  const whyList = page.locator('.match-why-list').first();
  const reasonsCount = await whyList.locator('li').count();
  assertCheck('TS9-04', 'Program card includes documented explanation bullets', reasonsCount > 0, `Reasons count: ${reasonsCount}`);

  // Shortlist toggle
  const shortlistBtn = page.locator('.match-card').first().getByRole('button', { name: /Toggle shortlist/i });
  await shortlistBtn.click();
  await page.waitForTimeout(200);
  const isShortlisted = (await shortlistBtn.innerText()).includes('Shortlisted');
  assertCheck('TS9-05', 'Shortlist button toggles program into saved shortlist', isShortlisted);

  // Sort dropdown
  const sortSelect = page.getByLabel('Sort recommendations');
  await sortSelect.selectOption('relevance');
  await page.waitForTimeout(300);
  assertCheck('TS9-06', 'Sort recommendations dropdown selectable', (await sortSelect.inputValue()) === 'relevance');

  // =========================================================================
  // TEST SUITE 10: Data Preservation across Step Navigation
  // =========================================================================
  console.log(`\n--- Test Suite 10: Data Preservation across Step Navigation ---`);
  // Navigate backwards 4 -> 3 -> 2 -> 1
  await page.locator('.wizard-step-tab').nth(0).click();
  await page.waitForTimeout(300);
  const s1CoursesLoaded = (await page.getByRole('button', { name: /Review courses/i }).innerText()).includes('(11)');
  assertCheck('TS10-01', 'Step 1 preserves total loaded course count (11 courses)', s1CoursesLoaded);

  // Go to Step 2 and verify edited title & mapping preserved
  await page.locator('.wizard-step-tab').nth(1).click();
  await page.waitForTimeout(300);
  const preservedCourse1Title = await page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]').inputValue();
  assertCheck('TS10-02', 'Step 2 preserves custom edited course title', preservedCourse1Title === 'Advanced Linear Algebra & Matrix Theory', `Got "${preservedCourse1Title}"`);
  const preservedCourse1Mapping = await page.locator('.course-card').first().getByLabel('Subject mapping').inputValue();
  assertCheck('TS10-03', 'Step 2 preserves custom subject mapping ("theory")', preservedCourse1Mapping === 'theory', `Got "${preservedCourse1Mapping}"`);

  // Go to Step 3 and verify Germany preserved
  await page.locator('.wizard-step-tab').nth(2).click();
  await page.waitForTimeout(300);
  const deBadgeVis = await page.locator('.active-filter-badge', { hasText: 'Germany' }).isVisible();
  assertCheck('TS10-04', 'Step 3 preserves active country preference badge (Germany)', deBadgeVis);

  // Go to Step 4 and verify Shortlist state & recommendations preserved
  await page.locator('.wizard-step-tab').nth(3).click();
  await page.waitForTimeout(300);
  const shortlistSummaryVis = await page.getByText(/saved in your browser shortlist/i).isVisible();
  assertCheck('TS10-05', 'Step 4 preserves shortlisted programs and recommendations', shortlistSummaryVis);

  // =========================================================================
  // TEST SUITE 11: Browser Back/Forward History & ?step= URL Synchronization
  // =========================================================================
  console.log(`\n--- Test Suite 11: History and URL Query Parameter Synchronization ---`);
  // Direct URL navigation to ?step=1, ?step=2, ?step=3, ?step=4
  for (const step of [1, 2, 3, 4]) {
    await page.goto(`${BASE_URL}/analyze/?step=${step}`, { waitUntil: 'networkidle' });
    const tabActive = await page.locator('.wizard-step-tab').nth(step - 1).evaluate(el => el.classList.contains('active'));
    assertCheck(`TS11-0${step}`, `Direct navigation to ?step=${step} activates Step ${step}`, tabActive);
  }

  // Browser back navigation
  await page.goBack();
  await page.waitForTimeout(300);
  const backStep3Active = await page.locator('.wizard-step-tab').nth(2).evaluate(el => el.classList.contains('active'));
  assertCheck('TS11-05', 'Browser back button (popstate) navigates to previous step (?step=3)', backStep3Active);

  // Browser forward navigation
  await page.goForward();
  await page.waitForTimeout(300);
  const fwdStep4Active = await page.locator('.wizard-step-tab').nth(3).evaluate(el => el.classList.contains('active'));
  assertCheck('TS11-06', 'Browser forward button (popstate) navigates back to ?step=4', fwdStep4Active);

  // =========================================================================
  // TEST SUITE 12: Responsive Layouts across 3 Viewports with 0 Horizontal Overflow
  // =========================================================================
  console.log(`\n--- Test Suite 12: Responsive Viewport Overflow Checks ---`);
  const viewports = [
    { width: 375, height: 812, name: 'Mobile (375px)' },
    { width: 768, height: 1024, name: 'Tablet (768px)' },
    { width: 1440, height: 900, name: 'Desktop (1440px)' }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    for (const step of [1, 2, 3, 4]) {
      await page.goto(`${BASE_URL}/analyze/?step=${step}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(200);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assertCheck(`TS12-${vp.width}-S${step}`, `${vp.name} Step ${step} zero horizontal overflow (scrollWidth=${scrollWidth} <= ${vp.width})`, scrollWidth <= vp.width, `scrollWidth: ${scrollWidth}`);
    }
  }

  // Restore desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  // =========================================================================
  // TEST SUITE 13: Accessibility (WCAG 2.1 AA)
  // =========================================================================
  console.log(`\n--- Test Suite 13: Accessibility Audit ---`);
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });

  // Tablist semantics on progress bar
  const hasTablistRole = await page.locator('.wizard-progress-bar').getAttribute('role');
  assertCheck('TS13-01', 'Progress bar container has role="tablist"', hasTablistRole === 'tablist', `role=${hasTablistRole}`);

  const stepTabsRole = await page.locator('.wizard-step-tab').first().getAttribute('role');
  assertCheck('TS13-02', 'Step tabs have role="tab"', stepTabsRole === 'tab', `role=${stepTabsRole}`);

  const stepTabAriaSelected = await page.locator('.wizard-step-tab').first().getAttribute('aria-selected');
  assertCheck('TS13-03', 'Active step tab has aria-selected="true"', stepTabAriaSelected === 'true', `aria-selected=${stepTabAriaSelected}`);

  // Heading focus on step change
  await page.getByRole('button', { name: 'Mathematics heavy' }).click();
  await page.waitForTimeout(400);
  const focusedHeadingId = await page.evaluate(() => document.activeElement?.id);
  assertCheck('TS13-04', 'Step 2 heading receives document focus on navigation', focusedHeadingId === 'step-2-heading', `Active element ID: ${focusedHeadingId}`);

  // ARIA live region exists and announces
  const liveRegion = page.locator('div[aria-live="polite"]');
  const liveRegionVis = await liveRegion.count() > 0;
  const liveRegionText = await liveRegion.innerText();
  assertCheck('TS13-05', 'ARIA live region exists and announces step progression', liveRegionVis && liveRegionText.length > 0, `Text: "${liveRegionText}"`);

  // Form labels check
  const unlabelledInputs = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input, select, textarea'));
    return inputs.filter(el => {
      if (el.getAttribute('type') === 'hidden') return false;
      const hasAriaLabel = Boolean(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby'));
      const hasWrappingLabel = Boolean(el.closest('label'));
      const hasIdLabel = Boolean(el.id && document.querySelector(`label[for="${el.id}"]`));
      return !hasAriaLabel && !hasWrappingLabel && !hasIdLabel;
    }).map(el => el.outerHTML.slice(0, 80));
  });
  assertCheck('TS13-06', 'All form controls on Step 2 have accessible labels (0 unlabelled)', unlabelledInputs.length === 0, `Unlabelled count: ${unlabelledInputs.length}`);

  // =========================================================================
  // TEST SUITE 14: Integration with Other Pages
  // =========================================================================
  console.log(`\n--- Test Suite 14: Full Site Integration ---`);
  // Start analysis from homepage link
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Start analysis →' }).click();
  await page.waitForTimeout(300);
  assertCheck('TS14-01', 'Homepage "Start analysis →" navigates to /analyze/', page.url().includes('/analyze/'));

  // Load sample analysis from homepage to populate workspace and navigate to /results/
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open this sample analysis' }).click();
  await page.waitForTimeout(500);
  assertCheck('TS14-02', 'Homepage "Open this sample analysis" populates workspace and lands on /results/', page.url().includes('/results/'));

  // Edit courses from results page (/results/?step=2)
  const editCoursesLink = page.getByRole('link', { name: /Edit courses/i });
  const editCoursesHref = await editCoursesLink.getAttribute('href');
  assertCheck('TS14-03', 'Results page "Edit courses" link targets /analyze/?step=2', editCoursesHref === '/analyze/?step=2', `Href: ${editCoursesHref}`);
  await editCoursesLink.click();
  await page.waitForTimeout(400);
  const onEditCoursesStep2 = await page.getByRole('heading', { name: /Course editor/i }).isVisible();
  assertCheck('TS14-04', 'Clicking "Edit courses" opens Step 2 directly with loaded coursework', onEditCoursesStep2);

  // Link to /programs/ from Step 2
  const chooseProgramsLink = page.getByRole('link', { name: /Choose programs/i }).first();
  await chooseProgramsLink.click();
  await page.waitForTimeout(400);
  assertCheck('TS14-05', '"Choose programs" link navigates to /programs/', page.url().includes('/programs/'));

  // Navigate back to results and test PDF report generation
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Open this sample analysis' }).click();
  await page.waitForTimeout(500);

  const downloadPromise = page.waitForEvent('download', { timeout: 15000 }).catch(() => null);
  const pdfBtn = page.getByRole('button', { name: /Download PDF report/i });
  await pdfBtn.click();
  const download = await downloadPromise;
  assertCheck('TS14-06', 'PDF report download event triggered', download !== null);
  if (download) {
    assertCheck('TS14-07', 'PDF report filename is "DegreeLens-coursework-report.pdf"', download.suggestedFilename() === 'DegreeLens-coursework-report.pdf');
  }

  // Check overall errors
  assertCheck('TS-ERRORS', 'Zero unhandled page exceptions during full audit run', pageErrors.length === 0, pageErrors.join('; '));

  console.log(`\n=== AUDIT SUMMARY ===`);
  console.log(`Total Checks Executed: ${auditResults.totalChecks}`);
  console.log(`Passed Checks: ${auditResults.passedChecks}`);
  console.log(`Failed Checks: ${auditResults.failedChecks}`);
  console.log(`Pass Rate: ${((auditResults.passedChecks / auditResults.totalChecks) * 100).toFixed(1)}%`);

  await browser.close();
  return auditResults;
}

runWizardAudit().then(res => {
  if (res.failedChecks > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(2);
});
