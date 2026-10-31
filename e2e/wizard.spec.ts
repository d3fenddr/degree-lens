import { expect, test } from '@playwright/test';

test.describe('DegreeLens Step-by-Step Analysis Wizard', () => {
  test('Step 1 blocks progression without coursework and shows inline validation', async ({ page }) => {
    await page.goto('/analyze/', { waitUntil: 'networkidle' });

    // Step 1 should be visible initially
    await expect(page.getByRole('heading', { name: 'Build your coursework profile.' })).toBeVisible();

    // Steps 2, 3, 4 tabs should not be active
    const stepTabs = page.locator('.wizard-step-tab');
    await expect(stepTabs.nth(0)).toHaveClass(/active/);
    await expect(stepTabs.nth(1)).not.toHaveClass(/active/);

    // Try to click 'Review courses' with 0 courses
    const reviewBtn = page.getByRole('button', { name: /Review courses/i });
    await reviewBtn.click();

    // Inline validation alert must appear
    const alert = page.locator('.wizard-validation-alert');
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Please upload a transcript PDF, select a sample profile, or add your coursework');

    // Should remain on Step 1
    await expect(page.getByRole('heading', { name: 'Build your coursework profile.' })).toBeVisible();
  });

  test('Full 4-step wizard workflow with data preservation and back/forward navigation', async ({ page }) => {
    await page.goto('/analyze/', { waitUntil: 'networkidle' });

    // --- STEP 1: Load a demo profile ---
    await page.getByRole('button', { name: 'Mathematics heavy' }).click();

    // Selecting a profile automatically transitions to Step 2
    await expect(page.getByRole('heading', { name: /Course editor/i })).toBeVisible();
    await expect(page.locator('.wizard-step-tab').nth(1)).toHaveClass(/active/);
    await expect(page.locator('.wizard-step-tab').nth(0)).toHaveClass(/completed/);

    // --- STEP 2: Course Review & Editing ---
    // Course cards should be visible
    const courseCards = page.locator('.course-card');
    await expect(courseCards.first()).toBeVisible();
    const initialCount = await courseCards.count();
    expect(initialCount).toBeGreaterThanOrEqual(5);

    // Edit a course title to test preservation
    const firstTitle = courseCards.first().locator('input[placeholder*="Linear Algebra"]');
    await firstTitle.fill('Advanced Topology & Geometry');

    // Confirm first course
    await courseCards.first().getByLabel('Confirm credits').check();

    // Navigate to Step 3 using 'Study preferences' button
    const toPrefsBtn = page.getByRole('button', { name: 'Study preferences', exact: true });
    await expect(toPrefsBtn).toBeVisible();
    await toPrefsBtn.click();

    // --- STEP 3: Study Preferences ---
    await expect(page.getByRole('heading', { name: 'Where & what do you want to study?' })).toBeVisible();
    await expect(page.locator('.wizard-step-tab').nth(2)).toHaveClass(/active/);

    // Select Netherlands
    const nlChip = page.locator('.filter-chip', { hasText: 'Netherlands' });
    await nlChip.click();
    await expect(nlChip).toHaveClass(/active/);

    // Select Physics discipline
    const physicsChip = page.locator('.filter-chip', { hasText: 'Physics' });
    await physicsChip.click();
    await expect(physicsChip).toHaveClass(/active/);

    // Test Backward Navigation to Step 2
    const backToCourses = page.getByRole('button', { name: 'Coursework review', exact: true });
    await backToCourses.click();

    // Verify Step 2 is active and edited course title is preserved
    await expect(page.getByRole('heading', { name: /Course editor/i })).toBeVisible();
    const preservedTitle = page.locator('.course-card').first().locator('input[placeholder*="Linear Algebra"]');
    await expect(preservedTitle).toHaveValue('Advanced Topology & Geometry');

    // Return to Step 3 via Continue button
    await page.getByRole('button', { name: 'Study preferences', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Where & what do you want to study?' })).toBeVisible();

    // Verify preferences were preserved
    await expect(page.locator('.active-filter-badge', { hasText: 'Netherlands' })).toBeVisible();
    await expect(page.locator('.active-filter-badge', { hasText: 'Physics' })).toBeVisible();

    // --- STEP 4: Matching Recommendations ---
    const findProgramsBtn = page.getByRole('button', { name: /Find matching programs/i });
    await expect(findProgramsBtn).toBeVisible();
    await findProgramsBtn.click();

    // Step 4 heading should be visible and focused
    await expect(page.getByRole('heading', { name: 'Programs matching your academic profile' })).toBeVisible();
    await expect(page.locator('.wizard-step-tab').nth(3)).toHaveClass(/active/);

    // Match cards should be visible
    const matchCards = page.locator('.match-card');
    await expect(matchCards.first()).toBeVisible();

    // Shortlist button functions
    const shortlistBtn = matchCards.first().getByRole('button', { name: /Toggle shortlist/i });
    await shortlistBtn.click();
    await expect(shortlistBtn).toContainText('Shortlisted');

    // Test jumping back to Step 2 from Step 4 via top action bar
    await page.getByRole('button', { name: /Edit coursework/i }).click();
    await expect(page.getByRole('heading', { name: /Course editor/i })).toBeVisible();

    // Test jumping back to Step 4 via Stepper Tab 4
    await page.locator('.wizard-step-tab').nth(3).click();
    await expect(page.getByRole('heading', { name: 'Programs matching your academic profile' })).toBeVisible();
  });

  test('Stepper URL parameter synchronization and browser navigation', async ({ page }) => {
    // Direct navigation to ?step=2
    await page.goto('/analyze/?step=2', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: /Course editor/i })).toBeVisible();
    await expect(page.locator('.wizard-step-tab').nth(1)).toHaveClass(/active/);

    // Direct navigation to ?step=3
    await page.goto('/analyze/?step=3', { waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Where & what do you want to study?' })).toBeVisible();
    await expect(page.locator('.wizard-step-tab').nth(2)).toHaveClass(/active/);
  });

  test('Responsive wizard on mobile (375px) has zero horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    for (const step of [1, 2, 3, 4]) {
      await page.goto(`/analyze/?step=${step}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(300);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth, `Step ${step} at 375px width`).toBeLessThanOrEqual(375);
    }
  });

  test('Browser tab title changes dynamically across pages and wizard steps without em dashes', async ({ page }) => {
    // 1. Homepage
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('DegreeLens | Explore European Higher Education');
    expect(await page.title()).not.toContain('\u2014');

    // 2. Wizard Step 1
    await page.goto('/analyze/?step=1', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Step 1: Academic Background | DegreeLens');
    expect(await page.title()).not.toContain('\u2014');

    // 3. Wizard Step 2
    await page.goto('/analyze/?step=2', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Step 2: Coursework Review | DegreeLens');
    expect(await page.title()).not.toContain('\u2014');

    // 4. Wizard Step 3
    await page.goto('/analyze/?step=3', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Step 3: Study Preferences | DegreeLens');
    expect(await page.title()).not.toContain('\u2014');

    // 5. Wizard Step 4
    await page.goto('/analyze/?step=4', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Step 4: Matching Programs | DegreeLens');
    expect(await page.title()).not.toContain('\u2014');

    // 6. Programs directory
    await page.goto('/programs/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('Degree Programs Directory | DegreeLens');
    expect(await page.title()).not.toContain('\u2014');

    // 7. Universities directory
    await page.goto('/universities/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle('European Universities Directory | DegreeLens');
    expect(await page.title()).not.toContain('\u2014');

    // 8. Results page
    await page.goto('/results/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/DegreeLens/);
    expect(await page.title()).not.toContain('\u2014');
  });
});
