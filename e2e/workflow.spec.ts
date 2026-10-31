import { expect, test } from '@playwright/test';
import { jsPDF } from 'jspdf';
import { readFile } from 'node:fs/promises';

test('demo, comparison, course edit and PDF report', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil:'networkidle' });
  await page.waitForTimeout(1000);
  await expect(page.getByRole('heading', { name:'Make sense of your qualifications.' })).toBeVisible();
  await page.getByRole('button', { name:'Open this sample analysis' }).click();
  await expect(page.getByText('Fictional demo profile:')).toBeVisible();
  await expect(page.getByText('54', { exact:true }).first()).toBeVisible();
  await page.getByRole('link', { name:'+ Compare programs' }).click();
  await page.getByRole('button', { name:'Select program' }).first().click();
  await page.getByRole('link', { name:'View comparison' }).click();
  await expect(page.getByRole('tab')).toHaveCount(2);
  await page.getByRole('link', { name:'Edit courses' }).click();
  const credit = page.locator('.course-card').first().getByLabel('Credits', { exact:true });
  await credit.fill('3');
  await page.locator('.course-card').first().getByLabel('Confirm credits').check();
  await page.getByRole('link', { name:'Choose programs' }).click();
  await page.getByRole('link', { name:'View comparison' }).click();
  await expect(page.getByText('15 / 18 ECTS').first()).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name:'Download PDF report' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe('DegreeLens-coursework-report.pdf');
  const path = testInfo.outputPath('DegreeLens-coursework-report.pdf');
  await file.saveAs(path);
  const bytes = await readFile(path);
  expect(bytes.subarray(0,5).toString()).toBe('%PDF-');
  expect(bytes.length).toBeGreaterThan(2000);
});

test('PDF upload is local and requires confirmation', async ({ page }) => {
  const doc = new jsPDF();
  doc.text('Linear Algebra 6 ECTS', 10, 10);
  doc.text('Probability Theory 6 ECTS', 10, 20);
  await page.goto('/analyze', { waitUntil:'networkidle' });
  await page.waitForTimeout(1000);
  await page.getByLabel('Upload transcript PDF').setInputFiles({ name:'transcript.pdf', mimeType:'application/pdf', buffer:Buffer.from(doc.output('arraybuffer')) });
  await expect(page.locator('.course-card')).toHaveCount(2);
  await expect(page.getByText('PDF page 1').first()).toBeVisible();
  await page.getByRole('link', { name:'Choose programs' }).click();
  await page.getByRole('link', { name:'View comparison' }).click();
  await expect(page.getByText('0', { exact:true }).first()).toBeVisible();
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({width:375,height:812});
  await page.goto('/', { waitUntil:'networkidle' });
  await page.waitForTimeout(1000);
  await expect(page.getByRole('button', { name:'Open this sample analysis' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name:'Open this sample analysis' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
test('institution directory filters and attribution work', async ({page})=>{await page.goto('/universities/',{waitUntil:'networkidle'});await expect(page.getByRole('heading',{name:'Universities'})).toBeVisible();await page.getByLabel('Search',{exact:true}).fill('Berlin');await expect(page.locator('.directory-row').first()).toBeVisible();await page.getByLabel('Federal state').selectOption('Berlin');await expect(page.locator('.directory-row').first()).toBeVisible();await page.getByLabel('Federal state').selectOption('Saarland');await expect(page.locator('.directory-row')).toHaveCount(0);await page.getByLabel('Search',{exact:true}).fill('');await expect(page.locator('.directory-row').first()).toBeVisible();await page.getByLabel('Search',{exact:true}).fill('Berlin');await page.getByLabel('Federal state').selectOption('Berlin');await page.locator('.directory-row a').first().click();await expect(page.getByText('WIKIDATA DISCOVERY RECORD')).toBeVisible();await expect(page.getByRole('link',{name:/Institution website/})).toBeVisible();await expect(page.getByRole('link',{name:'GitHub: https://github.com/d3fenddr'})).toHaveAttribute('href','https://github.com/d3fenddr');});

test('static routes render at desktop, tablet and mobile widths', async ({page}, testInfo) => {
  const errors:string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({width, height:900});
    for (const route of ['/', '/universities/', '/programs/', '/analyze/', '/methodology/', '/privacy/']) {
      await page.goto(route, {waitUntil:'networkidle'});
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${route} at ${width}px`).toBeLessThanOrEqual(width);
    }
    await page.goto('/', {waitUntil:'networkidle'});
    await page.screenshot({path:testInfo.outputPath(`homepage-${width}.png`), fullPage:true});
  }
  expect(errors).toEqual([]);
});

test('European programs discovery filters by country, discipline and level', async ({ page }) => {
  await page.goto('/programs/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Compare documented requirements.' })).toBeVisible();
  
  // Filter by country
  await page.getByLabel('Filter by country').selectOption('Netherlands');
  await expect(page.locator('.program-card').first()).toBeVisible();
  await expect(page.locator('.program-card').first()).toContainText('Netherlands');

  // Filter by discipline
  await page.getByLabel('Filter by discipline').selectOption('Computer Science');
  await expect(page.locator('.program-card').first()).toBeVisible();

  // Reset filters
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.getByText('4,650 results', { exact: false })).toBeVisible();
});

test('3-stage transcript review flags potential grade warning', async ({ page }) => {
  const doc = new jsPDF();
  doc.text('Advanced Database Systems 2.3 ECTS', 10, 10);
  await page.goto('/analyze', { waitUntil: 'networkidle' });
  await page.getByLabel('Upload transcript PDF').setInputFiles({
    name: 'audit-test.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(doc.output('arraybuffer'))
  });
  await expect(page.locator('.course-card')).toHaveCount(1);
  await expect(page.getByText(/Review value: 2.3 resembles a grade/)).toBeVisible();
});


test('add course inserts at top, focuses title input, and announces via ARIA live', async ({ page }) => {
  await page.goto('/analyze/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Click Add course manually
  await page.getByRole('button', { name: 'Add course manually' }).click();

  // First course card input should have focus
  const firstTitleInput = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
  await expect(firstTitleInput).toBeVisible();
  await expect(firstTitleInput).toBeFocused();

  // ARIA live region announces the action
  const liveRegion = page.locator('[aria-live="polite"]');
  await expect(liveRegion).toContainText('New course row added at the top');

  // Fill in course details
  await firstTitleInput.fill('Modern Cryptography');
  const firstCreditsInput = page.locator('.course-card').first().getByLabel('Credits', { exact: true });
  await firstCreditsInput.fill('6');

  // Add a second course to verify top insertion
  await page.getByRole('button', { name: 'Add course', exact: true }).click();
  await expect(page.locator('.course-card')).toHaveCount(2);
  const newFirstTitleInput = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
  await expect(newFirstTitleInput).toBeFocused();
  await newFirstTitleInput.fill('Quantum Computing');

  // Verify Quantum Computing is in the first card input and Modern Cryptography in second
  await expect(page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]')).toHaveValue('Quantum Computing');
  await expect(page.locator('.course-card').nth(1).locator('input[placeholder*="Linear Algebra"]')).toHaveValue('Modern Cryptography');
});

test('bulk confirm dynamically reflects count, confirms valid rows, and updates verified ECTS', async ({ page }) => {
  await page.goto('/analyze/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Load a demo profile
  await page.getByRole('button', { name: 'Computer Science heavy' }).click();
  await expect(page.locator('.course-card')).toHaveCount(12);

  // Uncheck confirmation on the first 2 courses
  await page.locator('.course-card').nth(0).getByLabel('Confirm credits').uncheck();
  await page.locator('.course-card').nth(1).getByLabel('Confirm credits').uncheck();

  // Add an empty course row (invalid/incomplete)
  await page.getByRole('button', { name: 'Add course', exact: true }).click();
  await page.locator('.course-card').first().getByLabel('Credits', { exact: true }).fill('0');

  // The bulk confirm button should show exactly 2 eligible courses to confirm
  const confirmBtn = page.getByRole('button', { name: /Confirm 2 reviewed courses/i });
  await expect(confirmBtn).toBeVisible();
  await confirmBtn.click();

  // Post-action feedback announcement banner
  await expect(page.locator('span').filter({ hasText: /Confirmed 2 courses/i })).toBeVisible();

  // Verify the empty course row remains unconfirmed
  const emptyRowCheckbox = page.locator('.course-card').first().getByLabel('Confirm credits');
  await expect(emptyRowCheckbox).not.toBeChecked();
});

test('intelligent program recommendations rank verified matches, show explanations, and handle shortlisting', async ({ page }) => {
  await page.goto('/analyze/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Load sample CS profile
  await page.getByRole('button', { name: 'Computer Science heavy' }).click();

  // Click Find matching programs
  const findBtn = page.getByRole('button', { name: /Find matching programs/i });
  await expect(findBtn).toBeVisible();
  await findBtn.click();

  // Scroll to results section
  await expect(page.locator('#matching-results-section')).toBeVisible();

  // Verify match cards appear
  const matchCards = page.locator('.match-card');
  await expect(matchCards.first()).toBeVisible();

  // Verify Verified Coursework Match appears first for CS profile
  const firstMatch = matchCards.first();
  await expect(firstMatch.getByText('VERIFIED COURSEWORK MATCH')).toBeVisible();
  await expect(firstMatch.locator('.match-score-badge')).toBeVisible();
  await expect(firstMatch.locator('.match-why-list')).toBeVisible();

  // Save to Shortlist
  const shortlistBtn = firstMatch.getByRole('button', { name: /Toggle shortlist/i });
  await shortlistBtn.click();
  await expect(shortlistBtn).toContainText('Shortlisted');

  // Verify shortlist banner appears
  await expect(page.getByText(/1 program saved in your browser shortlist/i)).toBeVisible();
});
