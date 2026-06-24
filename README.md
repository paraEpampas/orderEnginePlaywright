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

## Setup

### Prerequisites

- Node.js 18+
- Access to Computacenter VPN (required for OE environments)
- Valid OE user credentials configured in `.env.local` or `.env.uat`

### Installation

```bash
npm install
npx playwright install chromium
```

### Environment Configuration

Create a `.env.local` file (not committed to git):

```env
BASE_URL=https://orderengine-sit.computacenter.com/oe/orders
HEADLESS=true
COUNTRY=UK

API_BASE_URL=http://ccecmsrvs001.computacenter.com:7096
API_USERNAME=<your-api-user>
API_PASSWORD=<your-api-password>
API_CREATE_ENDPOINT=/api/v1/create
API_GET_ENDPOINT=/api/v1/orders
```

## Running Tests

### Full Regression Suite (all countries)

```bash
SUITE=regression-2 COUNTRY=ALL npx playwright test
```

### Single Country

```bash
SUITE=regression-2 COUNTRY=UK npx playwright test
```

### Health Check

```bash
SUITE=health-check COUNTRY=ALL npx playwright test
```

### Specific Test File

```bash
SUITE=regression-2 COUNTRY=FR npx playwright test tests/functional/france-postcode-checker.spec.js
```

### Configuration Options

| Env Variable | Default | Description |
|---|---|---|
| `SUITE` | _(none)_ | Test suite to run: `health-check`, `regression`, `regression-2` |
| `COUNTRY` | from `.env` | Country: `UK`, `FR`, `US`, `DE`, `BE`, `NL`, or `ALL` |
| `ENV` | `local` | Environment: `local` (SIT) or `uat` |
| `HEADLESS` | `true` | Run headless (`true`/`false`) |
| `THREADS` | `3` | Number of parallel workers |

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
