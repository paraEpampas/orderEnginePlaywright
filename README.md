# Order Engine — Playwright Test Automation Framework

## Overview

End-to-end test automation framework for the Computacenter Order Engine (OE2), built with [Playwright](https://playwright.dev). The framework covers functional regression testing across **6 countries** (UK, FR, US, DE, BE, NL) with dynamic test scheduling that ensures each test only runs on the countries it applies to.

## Test Coverage

| Metric | Count |
|--------|-------|
| Unique test cases | 183 |
| Spec files (regression-2) | 46 |
| Countries supported | 6 (UK, FR, US, DE, BE, NL) |
| Shared tests (run on all countries) | 40 |
| Country-specific tests | 143 |
| Total scheduled runs (all countries) | 417 |

### Per-Country Breakdown

| Country | Scheduled Tests |
|---------|----------------|
| UK | 65 |
| FR | 146 |
| US | 55 |
| DE | 59 |
| BE | 52 |
| NL | 40 |

### Test Suites

| Suite | Tag | Scope |
|-------|-----|-------|
| `health-check` | `@health-check` | Quick login/navigation smoke tests |
| `regression` | `@regression` | Full regression across all test directories |
| `regression-2` | `@regression-2` | Functional regression — primary suite |

### SIT Health Check Automation

The **health-check** suite provides a quick sanity pass to verify the SIT environment is operational. It validates core user workflows end-to-end.

| # | Test Case | Spec File |
|---|-----------|-----------|
| 1 | Complete order creation workflow with Quick Add | `order-creation.spec.js` |
| 2 | Change sold-to immediately after save | `change-sold-to-account.spec.js` |
| 3 | Change sold-to without preserving pricing | `change-sold-to-account.spec.js` |
| 4 | Verify copy order button and modal workflow | `copy-order.spec.js` |
| 5 | Verify bulk upload workflow with Excel file | `bulk-upload.spec.js` |
| 6 | MAP Link — verify MAP link opens and SAP number extraction | `map-link.spec.js` |

**Summary:**

- **6 health-check test cases** automated
- Executed across **6 countries** (UK, FR, US, DE, BE, NL) = **36 total executions** per run
- **Playwright only** — these tests are automated exclusively in the Playwright framework. There is no Selenium implementation; the entire automation suite (health checks and regression) is built solely on Playwright.

**Run the health checks:**

```bash
# All countries
SUITE=health-check COUNTRY=ALL npx playwright test

# Single country
SUITE=health-check COUNTRY=UK npx playwright test
```

## Architecture

```
orderEnginePlaywright/
├── fixtures/              → Playwright fixtures (authenticated browser sessions)
├── pages/                 → Page Object Model (POM) classes
│   ├── orders/
│   │   ├── modals/        → Modal dialogs (Find Address, Change Sold-To, etc.)
│   │   └── tabs/          → Order detail tabs (Header, Costs & Sourcing, etc.)
│   └── products/          → Product search pages
├── steps/                 → Step/action classes (reusable business logic)
│   ├── orders/            → Order workflow steps
│   └── products/          → Product workflow steps
├── tests/
│   ├── functional/        → Main regression-2 test specs (46 files)
│   │   └── archived/      → Tests removed from active runs
│   ├── positive/          → Basic positive flow tests
│   └── smoke/             → Smoke/health-check tests
├── data/
│   └── constants/         → Country config, API order templates
├── test-data/
│   └── bulk-upload/       → Excel files for bulk upload testing (per country)
├── utils/                 → Utilities (API client, network capture, browser setup)
├── scripts/               → Helper scripts
├── playwright.config.js   → Dynamic project configuration
├── global-setup.js        → Pre-run setup
└── global-teardown.js     → Post-run cleanup
```

## Key Design Decisions

### Dynamic Country Scheduling

Tests are tagged with `@xx-only` (e.g. `@fr-only`, `@uk-only`) to indicate country specificity. The Playwright config uses `grepInvert` to exclude tests tagged for other countries, so each country only runs its relevant tests — no artificial skips in reports.

### Persistent Browser Profiles

The framework uses persistent browser contexts with stored authentication state. Each country/worker gets its own browser profile directory to avoid conflicts. This avoids re-logging in for every test.

### Page Object Model + Steps

- **Pages** encapsulate selectors and low-level interactions
- **Steps** compose page actions into reusable business workflows
- **Tests** orchestrate steps to validate end-to-end scenarios

### API-Driven Test Data

An API client (`utils/api-client.js`) creates orders programmatically via the OE API, enabling tests to start with pre-existing orders rather than creating them through the UI every time.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18.x or higher | Runtime for Playwright and test execution |
| **npm** | 9.x or higher (ships with Node.js) | Package management |
| **Chromium** | Installed via Playwright | Browser for test execution |
| **VPN** | Computacenter VPN connected | Access to SIT/UAT OE environments |
| **OE User Account** | Valid credentials per country | Authentication for test sessions |
| **Network Access** | Ports 443 (HTTPS), 7096 (API) | Reach OE web app and order API |

### Optional (for reporting)

| Tool | Purpose |
|------|---------|
| **Allure CLI** | Generate and view Allure reports (`npm install -g allure-commandline`) |
| **Java 8+** | Required by Allure CLI |

## Dependencies

All dependencies are managed in `package.json` and installed automatically via `npm install`:

| Package | Version | Purpose |
|---------|---------|---------|
| `@playwright/test` | ^1.50.0 | Test framework and browser automation |
| `allure-playwright` | ^3.0.0 | Allure reporting integration |
| `dotenv` | ^16.4.7 | Environment variable loading from `.env` files |
| `exceljs` | ^4.4.0 | Excel file generation for test inventory |
| `xlsx` | ^0.18.5 | Excel file parsing for bulk upload tests |

## Installation

### Step 1: Install Node.js

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/) or use a version manager:

```bash
# macOS (Homebrew)
brew install node@18

# Windows (Chocolatey)
choco install nodejs-lts

# Or use nvm (any OS)
nvm install 18
nvm use 18
```

Verify installation:

```bash
node --version   # Should show v18.x.x or higher
npm --version    # Should show 9.x.x or higher
```

### Step 2: Install project dependencies

```bash
cd orderEnginePlaywright
npm install
```

### Step 3: Install Playwright browsers

```bash
npx playwright install chromium
```

### Step 4: Configure environment

Create a `.env.local` file in the project root (this file is gitignored — never commit it):

```env
# Target environment URL
BASE_URL=https://orderengine-sit.computacenter.com/oe/orders

# Browser mode
HEADLESS=true

# Default country (overridden by COUNTRY env var at runtime)
COUNTRY=UK

# API Configuration (for programmatic order creation in tests)
API_BASE_URL=http://ccecmsrvs001.computacenter.com:7096
API_USERNAME=<your-api-user>
API_PASSWORD=<your-api-password>
API_CREATE_ENDPOINT=/api/v1/create
API_GET_ENDPOINT=/api/v1/orders
```

For UAT environment, create `.env.uat` with the UAT URL:

```env
BASE_URL=https://orderengine-uat.computacenter.com/oe/orders
HEADLESS=true
COUNTRY=UK

API_BASE_URL=http://ccecmsrvs001.computacenter.com:7096
API_USERNAME=<your-api-user>
API_PASSWORD=<your-api-password>
API_CREATE_ENDPOINT=/api/v1/create
API_GET_ENDPOINT=/api/v1/orders
```

### Step 5: First-run authentication

On the first run, the framework needs to establish browser authentication profiles. Run a single health-check in headed mode to log in manually:

```bash
SUITE=health-check COUNTRY=UK HEADLESS=false npx playwright test --workers=1
```

The browser will open — log in with your OE credentials. The session will be saved to a persistent profile for subsequent headless runs.

Repeat for each country you need to test:

```bash
SUITE=health-check COUNTRY=FR HEADLESS=false npx playwright test --workers=1
SUITE=health-check COUNTRY=US HEADLESS=false npx playwright test --workers=1
SUITE=health-check COUNTRY=DE HEADLESS=false npx playwright test --workers=1
SUITE=health-check COUNTRY=BE HEADLESS=false npx playwright test --workers=1
SUITE=health-check COUNTRY=NL HEADLESS=false npx playwright test --workers=1
```

## Running Tests

### Using npm scripts (recommended)

```bash
# Health check — all countries
npm run test:health-check

# Health check — single country
npm run test:health-check:uk
npm run test:health-check:fr

# Full regression — single country
npm run test:regression:uk

# Run on UAT instead of SIT
npm run test:uat

# Headed mode (visible browser)
npm run test:headed

# Open last HTML report
npm run report
```

### Using environment variables directly

#### Full Regression-2 Suite (all countries)

```bash
SUITE=regression-2 COUNTRY=ALL npx playwright test
```

#### Single Country

```bash
SUITE=regression-2 COUNTRY=UK npx playwright test
```

#### Health Check

```bash
SUITE=health-check COUNTRY=ALL npx playwright test
```

#### Specific Test File

```bash
SUITE=regression-2 COUNTRY=FR npx playwright test tests/functional/france-postcode-checker.spec.js
```

#### Headed mode with single worker (for debugging)

```bash
SUITE=regression-2 COUNTRY=UK HEADLESS=false npx playwright test --workers=1 tests/functional/zbun-pricing.spec.js
```

### Configuration Options

| Env Variable | Default | Description |
|---|---|---|
| `SUITE` | _(none)_ | Test suite to run: `health-check`, `regression`, `regression-2` |
| `COUNTRY` | from `.env` | Country: `UK`, `FR`, `US`, `DE`, `BE`, `NL`, or `ALL` |
| `ENV` | `local` | Environment: `local` (SIT) or `uat` |
| `HEADLESS` | `true` | Run headless (`true`/`false`) |
| `THREADS` | `3` | Number of parallel workers |

### All Available npm Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run default Playwright tests |
| `npm run test:headed` | Run with visible browser |
| `npm run test:health-check` | Health check all countries |
| `npm run test:health-check:uk` | Health check UK only |
| `npm run test:regression` | Full regression all countries |
| `npm run test:regression:uk` | Regression UK only |
| `npm run test:uk` | Run tests for UK |
| `npm run test:fr` | Run tests for FR |
| `npm run test:uat` | Run on UAT environment |
| `npm run test:smoke` | Run smoke-tagged tests |
| `npm run test:functional` | Run functional-tagged tests |
| `npm run report` | Open HTML report in browser |
| `npm run inventory` | Regenerate test inventory Excel |
| `npm run allure:generate` | Generate Allure report |
| `npm run allure:open` | Open Allure report |

## Reporting

The framework generates multiple report formats:

- **List** — console output during run
- **HTML** — `playwright-report/index.html` (interactive)
- **Allure** — `allure-results/` (for Allure dashboards)
- **JSON** — `test-results/results.json` (for CI integration)

Open the HTML report after a run:

```bash
npx playwright show-report
```

## Test Inventory & Traceability

The `Order_Engine_Test_Inventory.xlsx` workbook contains:

| Sheet | Contents |
|-------|----------|
| Test Inventory | All automated test cases with IDs, tags, countries, and spec file mapping |
| Summary | Counts by category — automated, skipped, unautomatable |
| Excel-Automation Correlation | Maps each original manual test case (from the defect/story tracker) to its automated Playwright test |

### Automation Rate

- **78** manual test cases identified for automation
- **59** (75.6%) successfully automated
- **19** not automated — backend/infrastructure tasks or Salesforce SSO dependencies with no UI
- **43** additional test cases created beyond the original scope (sub-steps, extended coverage)

## Unautomatable Tests

Documented in `tests/unautomatable-tests.json`. These are tests that cannot be automated due to:

- Salesforce SSO authentication (no headless support)
- Pure backend/infrastructure changes with no UI
- Asynchronous cross-system workflows (OE → SAP → Salesforce)

## Maintenance

### Adding a New Test

1. Create `tests/functional/your-feature.spec.js`
2. Tag with `@regression-2` and optionally `@xx-only` for country specificity
3. Use the `authenticatedPage` and `country` fixtures
4. Follow the Page Object Model pattern for selectors

### Adding a New Country

1. Add the country code to the `COUNTRIES` array in `playwright.config.js`
2. Add country config in `data/constants/country-config.js`
3. Add `@xx-only` handling in the `grepInvert` logic
4. Create a browser profile and environment credentials

### Test Data Dependencies

Some tests require specific materials/accounts to exist in the target environment:

- **ZBUN/ZMAT materials** — configured per country in `zbun-pricing.spec.js`
- **Sold-to accounts** — with contracts, for contract-sourcing tests
- **API order creation** — requires API credentials in `.env`

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| `net::ERR_NAME_NOT_RESOLVED` | VPN not connected or DNS issues | Connect to Computacenter VPN and retry |
| `Navigation timeout exceeded` | OE environment is down or slow | Check environment status; increase `navigationTimeout` in config if needed |
| `SingletonLock` error | Browser profile locked by another process | Kill stale Chromium processes: `pkill -f chromium` |
| Tests fail with "not logged in" | Browser profile session expired | Re-run health-check in headed mode to re-authenticate |
| `Cannot find module` errors | Dependencies not installed | Run `npm install` |
| Tests skip unexpectedly | Missing test data for that country | Check `test.skip` conditions in the spec file; provision the required data |
| All tests skipped for a country | Wrong `SUITE` or `COUNTRY` value | Verify env vars: `SUITE=regression-2 COUNTRY=UK` |
| Allure report empty | Results not generated | Run tests first, then `npm run allure:generate` |

## Quick Start (TL;DR)

```bash
# 1. Install
npm install && npx playwright install chromium

# 2. Create .env.local (copy from template above)

# 3. Connect VPN

# 4. First-time auth (headed, logs you in)
SUITE=health-check COUNTRY=UK HEADLESS=false npx playwright test --workers=1

# 5. Run the full regression suite
SUITE=regression-2 COUNTRY=ALL npx playwright test

# 6. View report
npm run report
```
