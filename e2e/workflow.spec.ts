import { expect, test } from '@playwright/test';
import { jsPDF } from 'jspdf';
import { readFile } from 'node:fs/promises';

test('demo, comparison, course edit and PDF report', async ({ page }, testInfo) => {
  await page.goto('/', { waitUntil:'networkidle' });
  await page.waitForTimeout(1000);
  await expect(page.getByRole('heading', { name:/Understand your academic eligibility/ })).toBeVisible();
  await page.getByRole('button', { name:'Explore interactive demo' }).click();
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
  await page.getByRole('link', { name:'Results', exact:true }).click();
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
  await page.getByRole('link', { name:'Results', exact:true }).click();
  await expect(page.getByText('0', { exact:true }).first()).toBeVisible();
});

test('mobile layout has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({width:375,height:812});
  await page.goto('/', { waitUntil:'networkidle' });
  await page.waitForTimeout(1000);
  await expect(page.getByRole('button', { name:'Explore interactive demo' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.getByRole('button', { name:'Explore interactive demo' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
