# COVERAGE GAPS — Execution Plan Template
> Use this template to track test coverage gaps and their resolution.

**Do NOT delete items — mark them ✅ when done.**

---

## How to Use This Template

1. Run the Feature Discovery Protocol for each module
2. Document every gap found in the appropriate section below
3. Track execution order and mark items complete
4. Use the Coverage Matrix (Section E) as the source of truth

---

## SECTION A: {Module 1} Gaps

### A1. {Sub-feature with missing coverage}
**Discovery Evidence:** {How you found this gap — browser snapshot, dev repo, etc.}
- {Description of what exists on the page}
- **TODO:**
  - [ ] Create `pages/{module}/{feature}.page.js` — {locators needed}
  - [ ] Create `steps/{module}/{feature}.steps.js` — {methods needed}
  - [ ] Write `tests/{module}/{feature}.smoke.spec.js` — {what to verify}
  - [ ] Write `tests/{module}/{feature}.e2e.spec.js` — {interactions to test}

### A2. {Another sub-feature}
**Discovery Evidence:** {source}
- **TODO:**
  - [ ] {specific tasks}

---

## SECTION B: {Module 2} Gaps

### B1. {Sub-feature}
- **TODO:**
  - [ ] {tasks}

---

## SECTION C: Zero-Coverage Modules

List modules that have NO test coverage at all:

### C1. {Module Name} ({navigation path or URL})
- **TODO:**
  - [ ] Browser exploration — discover all features
  - [ ] Create page objects + steps + smoke specs
  - [ ] Create E2E specs for interactive features
  - [ ] Create CRUD specs if module supports data creation

### C2. {Another Module}
- **TODO:**
  - [ ] {tasks}

---

## SECTION D: Existing Module Minor Gaps

### D1. {Module} — {specific gap}
- **TODO:**
  - [ ] {task}

---

## EXECUTION ORDER (Priority)

### Phase 1: {Highest Priority Module} — Target: {X specs, Y tests}
1. [ ] {Task 1}
2. [ ] {Task 2}
3. [ ] {Task 3}
**Result: {expected output}**

### Phase 2: {Second Priority} — Target: {X specs, Y tests}
1. [ ] {Task 1}
2. [ ] {Task 2}
**Result: {expected output}**

### Phase 3: {Remaining Modules}
1. [ ] {Tasks}
**Result: {expected output}**

---

## SECTION E: Coverage Matrix

### Current Coverage
| Module | Spec Files | Status |
|--------|-----------|--------|
| {Module 1} | {count} | ✅ / ⚠️ / ❌ |
| {Module 2} | {count} | ✅ / ⚠️ / ❌ |

### Gap Tracking
| Module/Feature | Smoke | E2E | CRUD | Est. Files | Priority | Status |
|---------------|-------|-----|------|------------|----------|--------|
| {Feature 1} | ✅/❌ | ✅/❌ | ✅/❌/N/A | {count} | HIGH/MED/LOW | ✅ DONE / TODO |
| {Feature 2} | ❌ | ❌ | N/A | {count} | HIGH | TODO |

### Summary
- **Phase 1: {X} DONE** — {files built}
- **Phase 2: {X} DONE** — {files built}
- **Total remaining: {description}**
- **Grand Total spec count: {current} (was {starting})**

---

## Test Depth Audit

Track the depth of your tests, not just the count:

| Classification | Definition | Target % |
|---------------|------------|----------|
| **SHALLOW** (1-3 actions) | Navigate → verify visible | < 25% |
| **MEDIUM** (4-6 actions) | Navigate → interact → verify result | 35-40% |
| **DEEP** (7+ actions) | Multi-step workflow, form fills, cross-page, data lifecycle | > 30% |

| Module | Total Tests | Shallow | Medium | Deep | Assessment |
|--------|------------|---------|--------|------|------------|
| {Module 1} | {count} | {count} | {count} | {count} | {Good/Needs work} |
| {Module 2} | {count} | {count} | {count} | {count} | {Good/Needs work} |

**Goal:** No module should have more than 30% shallow tests. Every CRUD-capable
module should have at least 2 DEEP tests (full lifecycle with cleanup).
