import { chromium } from '@playwright/test';

const urls = [
  { path: '/', expected: 'DegreeLens | Explore European Higher Education' },
  { path: '/programs/', expected: 'Degree Programs Directory | DegreeLens' },
  { path: '/universities/', expected: 'European Universities Directory | DegreeLens' },
  { path: '/analyze/', expected: 'Step 1: Academic Background | DegreeLens' },
  { path: '/analyze/?step=2', expected: 'Step 2: Coursework Review | DegreeLens' },
  { path: '/analyze/?step=3', expected: 'Step 3: Study Preferences | DegreeLens' },
  { path: '/analyze/?step=4', expected: 'Step 4: Matching Programs | DegreeLens' },
  { path: '/about/', expected: 'About | DegreeLens' },
  { path: '/methodology/', expected: 'Methodology & ECTS Criteria | DegreeLens' },
  { path: '/privacy/', expected: 'Privacy Policy | DegreeLens' },
];

const BASE_URL = 'https://degree-lens.pages.dev';

async function verify() {
  console.log(`Starting live verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage();

  let hasError = false;
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  for (const { path, expected } of urls) {
    const fullUrl = `${BASE_URL}${path}`;
    await page.goto(fullUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    const title = await page.title();
    const hasEmDash = title.includes('\u2014');

    const status = title === expected && !hasEmDash ? '✓ PASS' : '✗ FAIL';
    console.log(`${status} [${path}]`);
    console.log(`       Received: "${title}"`);
    console.log(`       Expected: "${expected}"`);
    console.log(`       Em dash present: ${hasEmDash}`);

    if (title !== expected || hasEmDash) {
      hasError = true;
    }
  }

  // Also verify interactive dynamic step transition on the live site
  console.log('\nVerifying live in-page interactive step transition...');
  await page.goto(`${BASE_URL}/analyze/`, { waitUntil: 'networkidle' });
  const initialTitle = await page.title();
  console.log(`Initial Step 1 Title: "${initialTitle}"`);

  // Click on "Mathematics heavy" demo profile
  const demoBtn = page.getByRole('button', { name: 'Mathematics heavy' });
  await demoBtn.click();
  await page.waitForTimeout(300);
  const step2Title = await page.title();
  console.log(`After demo profile click, Step 2 Title: "${step2Title}"`);

  if (step2Title !== 'Step 2: Coursework Review | DegreeLens') {
    console.error('Interactive transition title mismatch!');
    hasError = true;
  }

  console.log(`\nConsole error count: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
    hasError = true;
  }

  await browser.close();

  if (hasError) {
    console.error('\nVerification FAILED');
    process.exit(1);
  } else {
    console.log('\nAll live checks PASSED successfully!');
  }
}

verify().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
