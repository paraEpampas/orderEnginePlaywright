# Cursor AI Healing & Auto-Write Workflow
> Workflow for AI-assisted test maintenance in the Order Engine Playwright framework.

## Overview

Three AI workflows integrated into the framework:

1. **Auto-Heal** — Fix broken tests after failures
2. **Auto-Write** — Generate new tests from dev repo changes
3. **Dev Repo Watcher** — Detect what changed in the development codebase

---

## Workflow 1: Auto-Heal (Fix Broken Tests)

### When to Use
After tests fail — either locally or in the CI/CD pipeline.

### Step-by-Step

**Option A: Manual (Cursor IDE)**

1. Run the failing tests:
   ```bash
   npx playwright test --project={module}
   ```
2. Generate the failure report:
   ```bash
   node scripts/analyze-failures.js
   ```
3. Generate healing prompts:
   ```bash
   node scripts/auto-heal.js
   ```
4. Open the generated prompt file in Cursor:
   - Navigate to `ai-heal-prompts/` folder
   - Open the `.md` file for the failed test
5. In Cursor chat, reference the file:
   ```
   @ai-heal-prompts/test-name.md Fix this test failure following the Auto-Healing Protocol.
   ```
6. Review and apply the suggested fix.

**Option B: Automated (Claude API)**

1. Run tests + analyze + heal in one go:
   ```bash
   npx playwright test || node scripts/analyze-failures.js && node scripts/auto-heal.js --api
   ```
2. The AI-generated fix is saved in `ai-heal-prompts/{test-name}-fix.md`.
3. Review the fix before applying.

**Option C: Pipeline (CI/CD)**

- **Nightly**: Runs all modules → auto-analyzes failures → generates heal prompts as artifacts.
- **On-demand**: Runs specific module → auto-heals on failure.
- Download failure reports and heal prompts from pipeline artifacts.

### Healing Priority
| Classification | Action | Fix Location |
|---------------|--------|--------------|
| SELECTOR_ERROR | Update locator string | `pages/*.page.js` |
| FLOW_ERROR | Update step sequence | `steps/*.steps.js` |
| TIMING_ERROR | Add waits | `steps/*.steps.js` |
| AUTH_ERROR | Check credentials/login flow | `fixtures/auth.fixture.js` |
| ENVIRONMENT_ERROR | Check server/network | No code change needed |

---

## Workflow 2: Auto-Write (Generate New Tests)

### When to Use
When new features are added to the development repository and need test coverage.

### Step-by-Step

**Option A: Manual (Cursor IDE)**

1. Scan the dev repo for changes:
   ```bash
   node scripts/dev-repo-watcher.js --since 24h
   ```
   This generates `dev-repo-changes.json` with a structured analysis.
2. Generate test-writing prompts:
   ```bash
   node scripts/auto-write.js
   ```
3. Open the prompt file in Cursor and follow it to create tests.

**Option B: Automated (Claude API)**

```bash
node scripts/dev-repo-watcher.js && node scripts/auto-write.js --api
```

### Smart Diff Engine

The dev repo watcher includes intelligent change detection:

- **Persistent state tracking**: Saves HEAD commit after each run. Next run compares only from that point.
- **Feature mapping**: Maps dev repo paths to test modules via configurable feature map.
- **Relevance scoring**: Each change gets a 0-100 score:
  - Positive signals: JSX rendering (+50), forms (+25), data-testid (+20), click handlers (+15)
  - Negative signals: type-only file (-30), pure style file (-40), no interactivity (-25)
  - Hard-skip: dev test files, documentation, build artifacts
- **Module recommendations**: CREATE_NEW_TESTS, UPDATE_AND_EXTEND, REVIEW_AND_UPDATE, NO_ACTION_NEEDED

### Watcher Configuration

```env
DEV_REPO_PATH=/path/to/your/dev-repo
DEV_REPO_WATCH_PATHS=src/modules,src/components,src/pages
```

Time window options:
```bash
node scripts/dev-repo-watcher.js --since 24h     # Last 24 hours
node scripts/dev-repo-watcher.js --since 7d       # Last 7 days
node scripts/dev-repo-watcher.js --since abc123    # Since specific commit
node scripts/dev-repo-watcher.js --branch develop  # Diff against branch
```

---

## Workflow 3: Scheduling & Triggers

### Configuration

All scheduling is controlled via environment variables:

```env
# How often the AI pipeline runs
AI_SCHEDULE_MODE=nightly    # nightly | hourly | manual | on-push

# Auto-heal after test failures
AI_HEAL_ON_FAILURE=true

# Auto-detect dev repo changes
AI_WRITE_ON_CHANGE=false

# Auto-apply Claude's suggestions (requires API key)
AI_WRITE_AUTO_APPLY=false
```

### Recommended Pipeline Schedule

| Pipeline | Schedule | What it Does |
|----------|----------|-------------|
| Nightly regression | Once per night | All modules → full regression → auto-heal prompts |
| Hourly smoke | Every hour | Smoke tests only → quick heal on failure |
| On-demand | Manual trigger | Single module → analyze → heal |
| Dev repo watch | Daily or on merge | Scan dev repo → generate test prompts |

---

## Quick Reference: npm Scripts

```bash
# Run tests
npx playwright test                       # All modules
npx playwright test --project={module}    # Single module
npx playwright test --grep @smoke         # Smoke tests only

# Failure analysis
node scripts/analyze-failures.js          # Parse test-results/ into report

# Auto-heal
node scripts/auto-heal.js                # Generate heal prompts (local review)
node scripts/auto-heal.js --api          # Send to Claude API for fix suggestions

# Auto-write
node scripts/dev-repo-watcher.js         # Scan dev repo for changes
node scripts/auto-write.js               # Generate test-writing prompts
node scripts/auto-write.js --api         # Send to Claude API for test generation

# Reports
npx playwright show-report               # Open Playwright HTML report
```

---

## Troubleshooting

| Issue | Solution |
|-------|---------|
| `No failure report found` | Run analyze-failures before auto-heal |
| `DEV_REPO_PATH not set` | Add path to your `.env.local` |
| `API key not set` | Add your Claude API key to `.env.local` |
| Heal suggests wrong file | Check the file matcher in the failure report |
| Watcher shows 0 changes | Try a wider `--since` window |
