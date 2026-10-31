import { chromium, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const BASE_URL = 'https://degree-lens.pages.dev';
const results = {
  homepage: false,
  footer: false,
  universities: false,
  programs: false,
  analysisWorkflow: false,
  pdfExport: false,
  responsive375: false,
  responsive768: false,
  responsive1440: false,
  consoleErrors: [],
  failedRequests: [],
};

async function run() {
  console.log(`Starting live verification against ${BASE_URL}...`);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('pageerror', err => {
    console.error('Page error:', err.message);
    results.consoleErrors.push(err.message);
  });

  page.on('requestfailed', req => {
    const errorText = req.failure()?.errorText;
    if (errorText === 'net::ERR_ABORTED') {
      return;
    }
    console.error('Request failed:', req.url(), errorText);
    results.failedRequests.push(`${req.url()} (${errorText})`);
  });

  // 1. Homepage & Swiss Academic Design
  console.log('Testing Homepage & Design...');
  const res = await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  if (res.status() !== 200) throw new Error(`Homepage returned ${res.status()}`);

  const title = await page.title();
  console.log(`Page title: ${title}`);

  // Check Swiss Academic design elements & typography
  const fontFamily = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
  console.log(`Body font family: ${fontFamily}`);

  // 2. Footer Verification
  console.log('Testing Footer...');
  const footerText = await page.locator('footer.footer').innerText();
  console.log(`Footer text: "${footerText.replace(/\n/g, ' ')}"`);
  const ghLink = page.locator('footer.footer a[href="https://github.com/d3fenddr"]');
  const ghVisible = await ghLink.isVisible();
  const ghText = await ghLink.innerText();
  console.log(`GitHub link visible: ${ghVisible}, text: "${ghText}"`);

  if (footerText.includes('Karim Baliyev') && ghVisible && ghText.includes('d3fenddr')) {
    results.footer = true;
  }

  // 3. Universities Directory Verification
  console.log('Testing Universities Directory...');
  await page.goto(`${BASE_URL}/universities/`, { waitUntil: 'networkidle' });
  const uniHeader = await page.locator('h1').innerText();
  console.log(`Universities header: ${uniHeader}`);

  const rowCount = await page.locator('.directory-row').count();
  console.log(`Universities rows on page 1: ${rowCount}`);

  // Test search
  const searchInput = page.getByLabel('Search', { exact: true });
  await searchInput.fill('Bonn');
  await page.waitForTimeout(500);
  const bonnRowCount = await page.locator('.directory-row').count();
  console.log(`Search 'Bonn' results count: ${bonnRowCount}`);

  // Test state filter
  await searchInput.fill('');
  const stateSelect = page.getByLabel('Federal state');
  await stateSelect.selectOption('Bavaria');
  await page.waitForTimeout(500);
  const bavariaRowCount = await page.locator('.directory-row').count();
  console.log(`Filter 'Bavaria' results count: ${bavariaRowCount}`);

  // Reset filter and open detail page
  await stateSelect.selectOption('');
  await searchInput.fill('Regensburg');
  await page.waitForTimeout(500);
  const firstDetailLink = page.locator('.directory-row a').first();
  await firstDetailLink.click();
  await page.waitForLoadState('networkidle');

  const detailKicker = await page.locator('.kicker').first().innerText();
  console.log(`Detail kicker: ${detailKicker}`);
  const hasProvenance = detailKicker.includes('WIKIDATA') || (await page.getByText(/Wikidata/i).count()) > 0;
  const hasWebsiteLink = await page.getByRole('link', { name: /Institution website/i }).isVisible();
  console.log(`Has provenance notice: ${hasProvenance}, Has official website link: ${hasWebsiteLink}`);

  if (rowCount > 0 && bonnRowCount > 0 && bavariaRowCount > 0 && hasProvenance) {
    results.universities = true;
  }

  // 4. Programs Verification
  console.log('Testing Programs Directory...');
  await page.goto(`${BASE_URL}/programs/`, { waitUntil: 'networkidle' });
  const programCards = await page.locator('.program-card').count();
  console.log(`Verified program cards count: ${programCards}`);
  if (programCards === 5) {
    results.programs = true;
  }

  // 5. Analysis Workflow & Course Edit
  console.log('Testing Analysis Workflow...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Open this sample analysis' }).click();

  // Wait for /results page content
  await expect(page.getByText('Fictional demo profile:')).toBeVisible();
  console.log('Demo banner visible on results page.');

  // Add second program for comparison
  await page.getByRole('link', { name: '+ Compare programs' }).click();
  await expect(page.getByRole('button', { name: 'Select program' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Select program' }).first().click();
  console.log('Added second program for comparison.');

  // View comparison
  await page.getByRole('link', { name: 'View comparison' }).click();
  await expect(page.getByRole('tab')).toHaveCount(2);
  const tabsCount = await page.getByRole('tab').count();
  console.log(`Comparison tabs count verified: ${tabsCount}`);

  // Go to edit courses
  await page.getByRole('link', { name: 'Edit courses' }).click();
  await expect(page.locator('.course-card').first()).toBeVisible();

  // Edit credits
  const creditInput = page.locator('.course-card').first().getByLabel('Credits', { exact: true });
  await creditInput.fill('3');
  const confirmBox = page.locator('.course-card').first().getByLabel('Confirm credits');
  await confirmBox.check();
  console.log('Edited course credits to 3 and confirmed.');

  // Return to comparison
  await page.getByRole('link', { name: 'Choose programs' }).click();
  await expect(page.getByRole('link', { name: 'View comparison' })).toBeVisible();
  await page.getByRole('link', { name: 'View comparison' }).click();

  // Verify recalculated result
  await expect(page.getByText('15 / 18 ECTS').first()).toBeVisible();
  console.log("Recalculated '15 / 18 ECTS' verified visible.");
  results.analysisWorkflow = true;

  // 6. PDF Export
  console.log('Testing PDF Export...');
  const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
  await page.getByRole('button', { name: 'Download PDF report' }).click();
  const download = await downloadPromise;
  const suggestedFilename = download.suggestedFilename();
  console.log(`Downloaded file suggested name: ${suggestedFilename}`);

  const savePath = join(process.cwd(), 'DegreeLens-live-report.pdf');
  await download.saveAs(savePath);
  const pdfBuffer = await readFile(savePath);
  const pdfHeader = pdfBuffer.subarray(0, 5).toString('utf-8');
  console.log(`PDF Header: ${pdfHeader}, size: ${pdfBuffer.length} bytes`);

  if (suggestedFilename === 'DegreeLens-coursework-report.pdf' && pdfHeader === '%PDF-' && pdfBuffer.length > 2000) {
    results.pdfExport = true;
  }

  // 7. Responsive Viewports & Screenshots
  console.log('Testing Responsive Viewports & Capturing Screenshots...');
  const viewports = [
    { width: 375, height: 812, name: '375', key: 'responsive375' },
    { width: 768, height: 1024, name: '768', key: 'responsive768' },
    { width: 1440, height: 900, name: '1440', key: 'responsive1440' }
  ];

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Viewport ${vp.width}px: scrollWidth = ${scrollWidth}`);
    if (scrollWidth <= vp.width) {
      results[vp.key] = true;
    }

    if (vp.width === 1440) {
      await page.screenshot({ path: join(process.cwd(), '../portfolio-home.png'), fullPage: false });
      console.log('Saved portfolio-home.png (1440px)');
    }
    if (vp.width === 375) {
      await page.screenshot({ path: join(process.cwd(), '../portfolio-home-mobile.png'), fullPage: false });
      console.log('Saved portfolio-home-mobile.png (375px)');
    }
  }

  results.homepage = true;
  await browser.close();

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(JSON.stringify(results, null, 2));

  if (results.consoleErrors.length > 0) {
    console.warn(`WARNING: ${results.consoleErrors.length} console errors encountered.`);
  }
  if (results.failedRequests.length > 0) {
    console.warn(`WARNING: ${results.failedRequests.length} failed network requests encountered.`);
  }
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
