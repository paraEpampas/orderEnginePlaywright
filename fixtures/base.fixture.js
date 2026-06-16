const { test: base, expect, chromium } = require('@playwright/test');
const path = require('path');
const { findChromeForTesting, setupBrowserProfile, CHROME_ARGS } = require('../utils/browser-setup');

const test = base.extend({
  country: async ({}, use, testInfo) => {
    const projectCountry = testInfo.project?.use?.country;
    const resolvedCountry = projectCountry || process.env.COUNTRY || 'UK';
    const finalCountry = resolvedCountry.toUpperCase() === 'ALL' ? 'UK' : resolvedCountry;
    process.env.COUNTRY = finalCountry;
    await use(finalCountry);
  },

  authenticatedPage: async ({ country }, use, testInfo) => {
    const workerIdx = testInfo.workerIndex;
    const projectName = testInfo.project?.name || 'default';
    const profileDir = path.resolve(`.browser-profiles/${projectName}-worker-${workerIdx}`);
    setupBrowserProfile(profileDir);

    const chromePath = findChromeForTesting();
    const context = await chromium.launchPersistentContext(profileDir, {
      executablePath: chromePath || undefined,
      headless: process.env.HEADLESS !== 'false',
      ignoreHTTPSErrors: true,
      viewport: { width: 1920, height: 1080 },
      args: CHROME_ARGS,
    });

    let tracingStarted = false;
    try {
      await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
      tracingStarted = true;
    } catch { /* tracing may already be started by Playwright config */ }

    const page = context.pages()[0] || await context.newPage();
    const url = process.env.BASE_URL;

    let loaded = false;
    for (let attempt = 0; attempt < 3 && !loaded; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90_000 });
        loaded = true;
      } catch (e) {
        if (attempt === 2) throw e;
        console.log(`Navigation attempt ${attempt + 1} timed out, retrying...`);
        await page.waitForTimeout(2000);
      }
    }
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});

    await use(page);

    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
      if (screenshot) {
        await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
      }

      if (tracingStarted) {
        const tracePath = testInfo.outputPath('trace.zip');
        await context.tracing.stop({ path: tracePath }).catch(() => {});
        try {
          const fs = require('fs');
          if (fs.existsSync(tracePath)) {
            testInfo.attachments.push({
              name: 'trace',
              path: tracePath,
              contentType: 'application/zip',
            });
          }
        } catch { /* trace file may not exist */ }
      }
    } else if (tracingStarted) {
      await context.tracing.stop().catch(() => {});
    }

    await context.close();
  },
});

module.exports = { test, expect };
