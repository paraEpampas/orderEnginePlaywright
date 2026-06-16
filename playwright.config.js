const { defineConfig } = require('@playwright/test');
const path = require('path');

const suiteBefore = process.env.SUITE;
const countryBefore = process.env.COUNTRY;

const envFile = `.env.${process.env.ENV || 'local'}`;
require('dotenv').config({ path: path.resolve(__dirname, envFile) });

if (suiteBefore) process.env.SUITE = suiteBefore;
if (countryBefore) process.env.COUNTRY = countryBefore;

const COUNTRIES = ['UK', 'US', 'DE', 'BE', 'NL', 'FR'];
const suite = process.env.SUITE;
const country = process.env.COUNTRY;

function buildProjects() {
  if (suite === 'health-check') {
    const countries = (!country || country === 'ALL') ? COUNTRIES : [country];
    return countries.map(c => ({
      name: `health-check-${c}`,
      testDir: './tests',
      testIgnore: ['**/archived/**'],
      grep: /@health-check/,
      grepInvert: c === 'FR' ? undefined : /@fr-only/,
      use: { country: c },
    }));
  }

  if (suite === 'regression') {
    const countries = (!country || country === 'ALL') ? COUNTRIES : [country];
    const projects = [];

    for (const c of countries) {
      let grepInvert;
      if (c === 'UK') {
        grepInvert = /@fr-only/;
      } else if (c === 'FR') {
        grepInvert = /@uk-only/;
      } else {
        grepInvert = [/@uk-only/, /@fr-only/];
      }

      projects.push({
        name: `regression-${c}`,
        testDir: './tests',
        testIgnore: ['**/archived/**'],
        grep: /@regression/,
        grepInvert,
        use: { country: c },
      });
    }
    return projects;
  }

  if (suite === 'regression-2') {
    const countries = (!country || country === 'ALL') ? COUNTRIES : [country];
    const projects = [];

    for (const c of countries) {
      // Each country excludes tests tagged for OTHER countries only
      const otherCountryTags = [];
      if (c !== 'FR') otherCountryTags.push(/@fr-only/);
      if (c !== 'UK') otherCountryTags.push(/@uk-only/);
      if (c !== 'US') otherCountryTags.push(/@us-only/);
      if (c !== 'DE') otherCountryTags.push(/@de-only/);
      if (c !== 'BE') otherCountryTags.push(/@be-only/);
      if (c !== 'NL') otherCountryTags.push(/@nl-only/);

      projects.push({
        name: `regression-2-${c}`,
        testDir: './tests/functional',
        testIgnore: ['**/archived/**'],
        grep: /@regression-2/,
        grepInvert: otherCountryTags.length === 1 ? otherCountryTags[0] : otherCountryTags,
        use: { country: c },
      });
    }

    return projects;
  }

  return undefined;
}

const projects = buildProjects();

module.exports = defineConfig({
  testDir: './tests',
  testIgnore: ['**/archived/**'],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 1,
  workers: process.env.THREADS ? parseInt(process.env.THREADS) : 3,
  globalSetup: './global-setup.js',
  globalTeardown: './global-teardown.js',

  ...(projects ? { projects } : {}),

  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['allure-playwright'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    viewport: { width: 1920, height: 1080 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 90_000,
    ignoreHTTPSErrors: true,
  },

  expect: {
    timeout: 15_000,
  },

  timeout: 120_000,
});
