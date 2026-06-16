# Auto-Healing Protocol — The Fail-Fix Loop
> This document defines the exact process the AI agent must follow when a test fails.
> Include this in the AI's context alongside the System Prompt.

---

## Overview

Auto-healing is a **forensic process**, not guesswork. The AI must diagnose the root cause
using available evidence (traces, screenshots, videos, error messages) before making any changes.

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│  1. DETECT   │────▶│  2. DIAGNOSE  │────▶│  3. FIX        │────▶│  4. VERIFY    │
│  (Failure    │     │  (Root Cause  │     │  (Update Code  │     │  (Run Test    │
│   Report)    │     │   Analysis)   │     │   Surgically)  │     │   Again)      │
└─────────────┘     └──────────────┘     └───────────────┘     └──────────────┘
```

---

## Phase 1: DETECT — Gather Evidence

When a test failure is reported, collect ALL available data:

### Required Inputs:
| Input | Location | Purpose |
|-------|----------|---------|
| Error message | CI/CD logs or terminal output | Identify error type |
| Stack trace | Test runner output | Pinpoint failing line |
| Screenshot | `test-results/{test-name}/` | Visual state at failure |
| Video | `test-results/{test-name}/video.webm` | Full test execution replay |
| Trace | `test-results/{test-name}/trace.zip` | DOM snapshot + network calls |
| Page Object | `pages/{module}/{feature}.page.js` | Current locator definitions |
| Step File | `steps/{module}/{feature}.steps.js` | Current business logic |
| Spec File | `tests/{module}/{feature}.spec.js` | Test orchestration |

---

## Phase 2: DIAGNOSE — Root Cause Analysis

Classify the failure into ONE of these categories:

### Category A: Selector Error
**Symptoms**: `TimeoutError: waiting for selector`, `strict mode violation`, `Element not found`

**Diagnostic Steps**:
1. Open the Playwright trace file and inspect the DOM at the point of failure.
2. Compare the failing selector in the Page Object with the actual DOM.
3. Check the Dev Repository for recent changes to the component.
4. Determine if the change was: renamed `data-testid`, restructured DOM, added wrapper, or removed element.

**Common Selector Failures**:
| Error Pattern | Likely Cause | Fix Location |
|---------------|--------------|--------------|
| `Timeout waiting for [data-testid='old-id']` | `data-testid` renamed | Page Object |
| `strict mode violation: X elements match` | Selector too broad | Page Object (add nth/scope) |
| `Element not found: .btn-submit` | Class name changed | Page Object |
| `Target closed` | Page navigated away | Step file (add wait) |

### Category B: Flow/Logic Error
**Symptoms**: `Expected 'Approved' but received 'Pending'`, `Element visible but wrong content`

**Diagnostic Steps**:
1. Watch the video to see if the UI flow has changed.
2. Check if a new confirmation dialog or intermediate step was added.
3. Verify if the API response format changed.
4. Determine if the approval workflow was modified.

**Common Flow Failures**:
| Error Pattern | Likely Cause | Fix Location |
|---------------|--------------|--------------|
| New modal appeared unexpectedly | UI added confirmation step | Step file |
| Form submission didn't navigate | Submit behavior changed | Step file |
| Approval status unchanged | Approval task type changed | Approver config |
| Dropdown options changed | Options added/renamed | Constants file |

### Category C: Timing/Race Condition
**Symptoms**: Intermittent failures, elements flickering

**Diagnostic Steps**:
1. Check if the failure is intermittent (ran fine before, fails randomly).
2. Look for missing wait calls after actions.
3. Check for animations or loading spinners not accounted for.
4. Verify network calls complete before assertions.

**Common Timing Failures**:
| Error Pattern | Likely Cause | Fix Location |
|---------------|--------------|--------------|
| Flaky pass/fail | Missing wait after action | Step file |
| Click intercepted | Overlay/spinner not waited for | Step file |
| Stale element | Page re-rendered during action | Step file |

### Category D: Environment/Data Error
**Symptoms**: `404 Not Found`, `Unauthorized`, `No data in table`

**Diagnostic Steps**:
1. Check if env vars are configured correctly.
2. Verify the base URL is accessible.
3. Check if test data was cleaned up from a previous run.
4. Verify user credentials are still valid.

---

## Phase 3: FIX — Surgical Updates

### Rules for Fixing:

1. **Fix the SPECIFIC problem** — do not rewrite the entire file.
2. **Fix in the CORRECT layer**:
   - Selector changed → update `pages/*.page.js`
   - Flow changed → update `steps/*.steps.js`
   - New constants → add to `data/constants/*.js`
   - Test orchestration changed → update `tests/*.spec.js`
3. **Never change the variable name** when fixing a selector — downstream code depends on it.
4. **Add, don't remove** — if a new step is needed, add a method; don't delete existing ones.

### Fix Templates:

#### Selector Fix (Page Object):
```javascript
// BEFORE (broken)
this.submitBtn = page.locator('.btn-submit');

// AFTER (fixed) — only the selector string changed
this.submitBtn = page.locator('button[data-testid="form-submit-btn"]');
```

#### Flow Fix (Step File):
```javascript
// BEFORE (missing new confirmation step)
async submit() {
  await this.modal.submitButton.click();
  await this.waitForPageReady();
}

// AFTER (added confirmation handling)
async submit() {
  await this.modal.submitButton.click();
  const confirmDialog = this.page.locator('[role="dialog"][aria-label="Confirm"]');
  if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
    await this.page.getByRole('button', { name: 'Confirm' }).click();
  }
  await this.waitForPageReady();
}
```

---

## Phase 4: VERIFY — Confirm the Fix

1. **Run the specific failing test** in isolation:
   ```bash
   npx playwright test tests/{module}/{feature}.spec.js --headed
   ```

2. **Check for cascading effects**:
   - If a Page Object was changed, run ALL tests that import that page.
   - If a Step file was changed, run ALL specs that use those steps.
   - If a constant was changed, verify all tests using that constant.

3. **Review the video/trace** of the fixed test to confirm correct behavior.

4. **Report the fix**:
   ```
   ## Auto-Heal Report
   - **Test**: {test path}
   - **Error**: {error message}
   - **Root Cause**: Category {A/B/C/D} — {description}
   - **Fix**: Updated {file path} line {N}:
     - OLD: {old selector/code}
     - NEW: {new selector/code}
   - **Verification**: Test passes in headed mode, video confirms correct flow.
   ```

---

## Priority Matrix for Auto-Healing

| Severity | Description | Action |
|----------|-------------|--------|
| **P0 - Critical** | All tests in a module fail | Check environment, base URL, auth |
| **P1 - High** | Multiple tests fail with same selector | Component refactor — fix shared Page Object |
| **P2 - Medium** | Single test fails consistently | Fix specific selector or flow |
| **P3 - Low** | Intermittent/flaky failure | Add better waits, investigate timing |

---

## Bug vs Fix Decision Gate

### It's HEALABLE (fix the test) when:
- The feature works in the browser — the test just can't find/interact with it
- A selector was renamed, DOM restructured, or text changed
- A timing issue causes intermittent failures

### It's a BUG (report it, don't fix the test) when:
- The UI itself is broken — no test code change would make the workflow succeed
- API returns errors for valid operations
- Data is not saved after form submission
- Features documented in dev repo are missing from the UI

### When it's a bug:
1. Do NOT change test assertions to match broken behavior
2. Document the bug with evidence
3. Skip or annotate the test with the bug reference

---

## Anti-Patterns to Avoid During Healing

1. **Do NOT** wrap the failing line in a try-catch to suppress the error.
2. **Do NOT** add `{ force: true }` to bypass visibility checks.
3. **Do NOT** add `page.waitForTimeout(5000)` as a timing band-aid.
4. **Do NOT** rewrite the entire test when only a selector changed.
5. **Do NOT** skip the test with `test.skip()` instead of fixing it.
6. **Do NOT** change test expectations to match bugs.
7. **Do NOT** guess a fix without reading error context or inspecting the live page.
