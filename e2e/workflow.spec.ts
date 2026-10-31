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
