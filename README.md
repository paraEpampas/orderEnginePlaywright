# Order Engine — Playwright Test Automation

## Setup

```bash
npm install
npx playwright install chromium
```

## Run

```bash
npx playwright test
```

## Structure

```
fixtures/       → Custom Playwright fixtures
pages/          → Page objects
steps/          → Step classes
tests/          → Test specs
data/constants/ → Test data
utils/          → Helpers
```

## Environments

| Env   | File       | URL                                                  |
|-------|------------|------------------------------------------------------|
| local | .env.local | https://orderengine-sit.computacenter.com/oe/orders  |
| uat   | .env.uat   | https://orderengine-uat.computacenter.com/oe/orders  |

Switch with `ENV=uat npx playwright test`.
