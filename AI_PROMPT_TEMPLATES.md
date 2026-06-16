# AI Prompt Templates — Ready-to-Use Commands
> Copy-paste these prompts when interacting with the AI agent via Claude API or Cursor.
> Replace {PLACEHOLDERS} with your project-specific values.

---

## Phase 1: Knowledge Mapping

### 1.1 — Initial Framework Analysis
```
Analyze my Playwright automation framework. Read:
1. playwright.config.js
2. fixtures/base.fixture.js
3. steps/base.steps.js
4. data/generators.js
5. All files in data/constants/

Create a complete map of:
- All existing helper methods in BaseSteps
- All available data generators and constants
- All fixture parameters available in tests
- All existing Page Objects, Steps, and Specs grouped by module

Output as a structured table so you can reference it for all future tasks.
```

### 1.2 — Existing Coverage Audit
```
Scan ALL files in tests/ directory. For each module:
1. List every spec file and what it covers.
2. Identify which features have Full Loop tests (Create → Verify → Approve → Cleanup).
3. Identify which features only have smoke/display tests.
4. Flag any features that exist in pages/ but have no corresponding spec.
5. Recommend the top 10 missing tests to write, ranked by priority.
```

---

## Phase 2: New Test Creation

### 2.1 — Full Module Implementation
```
I need complete E2E regression coverage for the {MODULE_NAME} module.

Steps:
1. Check the Dev Repository for the feature's component code and selectors.
2. Open the application UI and navigate to the module to inspect the DOM.
3. Create all required files following the framework pattern:
   - Page Object(s) in pages/{module}/
   - Modal Page(s) in pages/{module}/modals/ (if applicable)
   - Step file(s) in steps/{module}/
   - Spec file(s) in tests/{module}/
4. Add any new constants to data/constants/
5. Implement the Full Loop: Create → Verify → Approve → Cleanup

Tests must use dynamic data from generators.js, authenticate via { authenticatedPage },
and tag with ['@{module}', '@regression'].
```

### 2.2 — Single Feature Test
```
Create a Full Loop E2E test for the {FEATURE_NAME} feature in {MODULE}.

The feature allows users to {DESCRIPTION}.
Entry point: {HOW_TO_NAVIGATE}

Implement:
1. Page Object with all form fields and list/table locators.
2. Steps for: create, fill form, submit, verify in list, delete/cleanup.
3. Spec with: positive test (full CRUD), negative test (validation errors).
4. Use the approver fixture if this feature requires manager approval.

Check the Dev Repo for correct selectors before starting.
```

### 2.3 — Expand Existing Module
```
The {MODULE} module already has coverage for {EXISTING_FEATURES}.
I need to add tests for {NEW_FEATURE}.

Steps:
1. Read the existing pages/{module}/ and steps/{module}/ to understand current patterns.
2. Do NOT duplicate any existing methods — reuse them.
3. Create new Page/Step/Spec files only for the new feature.
4. If existing Step classes need new methods, ADD them — don't create new classes.
5. Follow the exact same patterns used in the existing tests.
```

---

## Phase 3: Auto-Healing Prompts

### 3.1 — Single Test Failure
```
The test {TEST_PATH} failed with:
"{ERROR_MESSAGE}"

Stack trace:
{STACK_TRACE}

Follow the Auto-Healing Protocol:
1. Read the failing spec, its step file, and its page object.
2. Classify: Selector Error / Flow Error / Timing Error / Data Error.
3. Check the Dev Repo for DOM changes (if selector error).
4. Fix ONLY the broken part — do not rewrite the entire file.
5. Explain what changed and why.
6. Suggest how to verify the fix.
```

### 3.2 — Bulk Failure Triage
```
Multiple tests failed in the {MODULE} project:

Failed tests:
1. {test1.spec.js} — "{error1}"
2. {test2.spec.js} — "{error2}"
3. {test3.spec.js} — "{error3}"

Analyze if these share a common root cause (e.g., same Page Object changed).
If yes, fix the shared root cause first and explain the cascade.
If no, fix each individually following the Auto-Healing Protocol.
Provide a summary report with all changes made.
```

### 3.3 — Visual Analysis (Video/Screenshot)
```
The test {TEST_PATH} failed. I've attached:
- Screenshot: {screenshot path}
- Video: {video path}

Watch/analyze the visual evidence and tell me:
1. Did the expected element ever appear on screen?
2. Was there a loading spinner or overlay blocking the action?
3. Did the page navigate to an unexpected location?
4. Is there a new modal/dialog that wasn't there before?

Then fix the issue following the Auto-Healing Protocol.
```

---

## Phase 4: Dev-to-Test Synchronization

### 4.1 — New Feature from Dev Repo
```
A new {FEATURE_NAME} feature was added to the Dev Repository.

Dev Repo files to analyze:
- {PATH_TO_COMPONENT}
- {PATH_TO_API_ROUTES}
- {PATH_TO_TYPES/INTERFACES}

Based on the component code:
1. Extract all data-testid attributes for the Page Object.
2. Understand the form fields and their validation rules.
3. Identify the API payload structure for the data generators.
4. Map the navigation route for the test setup.
5. Create the complete test triad: Page → Steps → Spec.
```

### 4.2 — Component Refactor Detection
```
The Dev team refactored the {COMPONENT} component in PR #{NUMBER}.

Changes:
- {DESCRIPTION OF WHAT CHANGED}

Check ALL Page Objects that reference this component.
Update any broken selectors.
Run the affected tests to verify.
Provide a diff of all changes made.
```

---

## Phase 5: Regression Suite Management

### 5.1 — Full Regression Run Analysis
```
I ran the full regression suite: npx playwright test

Results:
- Passed: {X}
- Failed: {Y}
- Skipped: {Z}

Here are the failures:
{FAILURE_SUMMARY}

For each failure:
1. Classify (Selector / Flow / Timing / Data).
2. Prioritize (P0-P3).
3. Fix the P0 and P1 issues immediately.
4. For P2-P3, create a fix plan but don't implement yet.
```

### 5.2 — Coverage Gap Analysis
```
Compare the application's feature list against existing test coverage:

Application Modules:
{LIST_ALL_MODULES_AND_THEIR_FEATURES}

For each uncovered feature, generate a priority-ranked implementation plan
with estimated file count (pages + steps + specs).
```

---

## Multi-User Test Scenarios

### Manager Approval Flow Template
```
Create a test that implements the full approval workflow:

1. Standard user (authenticatedPage) creates {ITEM_TYPE} with dynamic data.
2. Verify item appears with status "Pending".
3. Approver (approver fixture) navigates to the approval queue.
4. Approver finds and approves the pending item.
5. Standard user verifies status changed to "Approved".
6. Standard user deletes the item (if deletion is supported).

Make sure to:
- Use the approver fixture for the manager context.
- Use authenticatedPage.reload() after approval to refresh state.
- Handle both success and rejection scenarios.
```

### Role-Based Access Test Template
```
Create tests that verify different users see appropriate content:

1. Standard user role: Can create but not approve own items.
2. Manager role: Can see team items and approve/reject.
3. Admin role: Can see all data and modify settings.

Use the user-pool fixture to switch between roles.
Each role test should verify both permitted and forbidden actions.
```
