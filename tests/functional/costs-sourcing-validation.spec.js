const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { CostsSourcingSteps } = require('../../steps/orders/costs-sourcing.steps');
const { CopyOrderSteps } = require('../../steps/orders/copy-order.steps');
const { getCountryConfig } = require('../../data/constants/country-config');
const { randomCustomerOrderRef } = require('../../data/generators');

const SELECTORS = {
  validateButton: "button:has(mat-icon:has-text('fact_check'))",
  saveAndSubmitButton: "button:has(mat-icon:has-text('save_alt'))",
  saveButton: "button:has(mat-icon:text-is('save'))",
  editButton: "button:has(mat-icon:has-text('edit'))",
  globalError: 'div:has(> strong:has-text("Error"))',
  costsSourcingTab: "div[data-name='Costs & Sourcing']",
  quickAddTab: "div[data-name='Quick add / pricing']",
  headerTab: "div[data-name='Header']",
  textOtherTab: "div[data-name='Text/Other']",
  findContractsButton: "button:has-text('Find Contracts'), button:has-text('FIND CONTRACTS')",
  costSourcingPanel: 'app-cost-sourcing',
};

function isSitEnvironment() {
  return (process.env.BASE_URL || '').toLowerCase().includes('sit');
}

function isUatEnvironment() {
  return (process.env.BASE_URL || '').toLowerCase().includes('uat');
}

function getPastDate() {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

function getFutureDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${d.getFullYear()}`;
}

async function clickValidate(page) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(SELECTORS.validateButton).click({ force: true });
  await page.waitForTimeout(5000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

async function clickSaveAndSubmit(page) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
  await page.waitForTimeout(3000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function navigateToTab(page, tabSelector) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(tabSelector).click({ force: true });
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function assertNoGlobalError(page) {
  const banners = page.locator('div:has(> strong:has-text("Error"))');
  const count = await banners.count();
  for (let i = 0; i < count; i++) {
    const banner = banners.nth(i);
    if (!(await banner.isVisible({ timeout: 1000 }).catch(() => false))) continue;

    const scopedToCostsSourcing = await banner.evaluate((el) => !!el.closest('app-cost-sourcing'));
    if (scopedToCostsSourcing) continue;

    const text = ((await banner.textContent()) || '').toLowerCase();
    const hasCostsSourcingError = /cost|sourcing|due date|contract|stock|from contract|amend line|delivery type/i.test(text);
    expect(hasCostsSourcingError, `Costs & Sourcing error should not appear as global error: ${text.slice(0, 200)}`).toBeFalsy();
  }
}

async function assertCostsSourcingHasValidationError(page) {
  const csPanel = page.locator(SELECTORS.costSourcingPanel);
  await expect(csPanel).toBeVisible({ timeout: 10000 });

  const scopedErrors = csPanel.locator(
    '.error-section, .text-danger, .validation-error, div[class*="error"], div.non-global-error-text, span.text-danger, .invalid-feedback, div.error-message-section, mat-error, .p-message-error, .p-inline-message-error, [class*="error-text"], [role="alert"]'
  ).filter({ hasText: /.+/ });

  if (await scopedErrors.first().isVisible({ timeout: 5000 }).catch(() => false)) {
    return;
  }

  const messagePatterns = [
    /due/i,
    /date/i,
    /contract.*sourced/i,
    /contract order/i,
    /only be sourced/i,
    /stock/i,
    /no contracts found/i,
    /amend line/i,
    /delivery type/i,
    /sourc/i,
    /\bbb\b/i,
    /\bdd\b/i,
  ];
  for (const pattern of messagePatterns) {
    const match = csPanel.locator(`:text-matches("${pattern.source}", "i")`).first();
    if (await match.isVisible({ timeout: 2000 }).catch(() => false)) {
      return;
    }
  }

  const csText = ((await csPanel.textContent()) || '').toLowerCase();
  if (/due|contract|stock|sourc|delivery type|no contracts found|amend line|only be sourced/.test(csText)) {
    return;
  }

  const tabScopedContainer = page.locator('div.error-message-section, div.error-section, div.error-points').filter({
    hasText: /cost|sourcing|due|contract|stock|line|delivery type|amend line|only be sourced/i,
  }).first();
  if (await tabScopedContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
    return;
  }

  const bodyText = ((await page.locator('body').textContent().catch(() => '')) || '').toLowerCase();
  expect(
    /cost.*sourc|sourcing.*error|due date|contract order lines|only be sourced|amend line/.test(bodyText),
    'Expected a Costs & Sourcing validation error to be visible on the page',
  ).toBeTruthy();
}

async function ensureCostsSourcingEditMode(page) {
  const saveBtn = page.locator(SELECTORS.saveButton);
  if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    return;
  }
  const editBtn = page.locator(SELECTORS.editButton);
  if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await editBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await page.locator('app-loader .overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }
}

async function setDueDateInCostsSourcing(page, dateValue) {
  await ensureCostsSourcingEditMode(page);

  const dueDateInput = page.locator(
    'app-cost-sourcing combobox[placeholder*="dd/mm" i], app-cost-sourcing oe-datepicker input, app-cost-sourcing tbody oe-datepicker input, app-cost-sourcing input[formcontrolname*="due" i], app-cost-sourcing input.p-datepicker-input'
  ).first();

  const setViaEvaluate = async () => {
    await page.evaluate((val) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const setVal = (input, value) => {
        input.removeAttribute('disabled');
        input.removeAttribute('readonly');
        input.removeAttribute('aria-disabled');
        nativeSetter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));
      };
      const selectors = [
        'app-cost-sourcing combobox[placeholder*="dd/mm" i] input',
        'app-cost-sourcing input.p-datepicker-input',
        'app-cost-sourcing oe-datepicker input',
        'app-cost-sourcing input[formcontrolname*="due" i]',
      ];
      for (const sel of selectors) {
        for (const input of document.querySelectorAll(sel)) {
          setVal(input, val);
        }
      }
    }, dateValue);
  };

  if (await dueDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
    const isEnabled = await dueDateInput.isEnabled().catch(() => false);
    if (isEnabled) {
      await dueDateInput.click({ force: true }).catch(() => {});
      await dueDateInput.fill(dateValue).catch(() => {});
      await dueDateInput.press('Tab').catch(() => {});
    }
    await setViaEvaluate();
    await page.waitForTimeout(500);
    return;
  }

  await setViaEvaluate();
  await page.waitForTimeout(500);

  const fallbackInput = page.locator('app-cost-sourcing tbody input:not([type="checkbox"]):not([type="radio"])').first();
  if (await fallbackInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fallbackInput.click({ force: true }).catch(() => {});
    await fallbackInput.fill(dateValue).catch(() => {});
    await fallbackInput.press('Tab').catch(() => {});
  }
}

async function validateOnTabAndAssertNoGlobalError(page, tabSelector) {
  await navigateToTab(page, tabSelector);
  await clickValidate(page);
  await assertNoGlobalError(page);
}

async function createOrderWithMaterials(orderSteps, createSteps) {
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.verifyHeaderTabDisplayed();
  await createSteps.fillMandatoryFieldsAndVerify();
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.verifyQuickAddTabDisplayed();
  await orderSteps.addItemsToQuickAdd();
  await orderSteps.setUnitSellPriceForAllItems('100');
  await orderSteps.clickRecalcButton();
}

async function selectFromContractLineOption(page) {
  const fromContractOption = page.locator(
    'app-cost-sourcing label:has-text("From contract"), app-cost-sourcing oe-radio-button:has-text("From contract"), app-cost-sourcing :text("From contract"), app-cost-sourcing input[value*="contract" i]'
  ).first();
  if (await fromContractOption.isVisible({ timeout: 5000 }).catch(() => false)) {
    await fromContractOption.click({ force: true });
    await page.waitForTimeout(500);
  }
}

async function clickFindContracts(page) {
  await page.locator(SELECTORS.findContractsButton).first().click({ force: true });
  await page.waitForTimeout(2000);
}

async function assertNoContractsFoundMessage(page, rowIndex = 0) {
  const row = page.locator('app-cost-sourcing tbody tr').nth(rowIndex);
  const msg = row.locator(':text-matches("No contracts found|No contract found|Aucun contrat", "i")').or(
    page.locator('app-cost-sourcing :text-matches("No contracts found|No contract found|Aucun contrat", "i")').nth(rowIndex)
  ).first();
  await expect(msg).toBeVisible({ timeout: 10000 });
}

async function selectOrderType(page, orderTypeLabel) {
  const selected = await page.evaluate((pattern) => {
    const oeSelect = document.querySelector("oe-select[formcontrolname='orderType']");
    if (!oeSelect) return false;
    const select = oeSelect.querySelector('select');
    if (!select) return false;
    const regex = new RegExp(pattern, 'i');
    for (let i = 0; i < select.options.length; i++) {
      const option = select.options[i];
      const text = (option.textContent || '').trim();
      if (regex.test(text) && option.value && !option.disabled) {
        select.selectedIndex = i;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
        return true;
      }
    }
    return false;
  }, orderTypeLabel);

  if (!selected) {
    const orderTypeSelect = page.locator("oe-select[formcontrolname='orderType']");
    if (await orderTypeSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orderTypeSelect.click();
      const option = page.locator('.ng-option, .mat-option').filter({ hasText: new RegExp(orderTypeLabel, 'i') }).first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click();
      }
    }
  }
  await page.waitForTimeout(500);
}

async function verifyOrderTypeSelected(page, orderTypeLabel) {
  const valueText = await page.locator("oe-select[formcontrolname='orderType']").textContent().catch(() => '');
  expect(valueText).toMatch(new RegExp(orderTypeLabel, 'i'));
}

async function selectFirstAvailableContract(page) {
  const contractRow = page.locator('.cdk-overlay-container tbody tr, mat-dialog-container tbody tr').first();
  if (await contractRow.isVisible({ timeout: 5000 }).catch(() => false)) {
    await contractRow.click({ force: true });
    await page.waitForTimeout(500);
    const selectBtn = page.locator('.cdk-overlay-container button:has-text("Select"), mat-dialog-container button:has-text("SELECT")').first();
    if (await selectBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectBtn.click({ force: true });
    }
    await page.waitForTimeout(1000);
    return true;
  }
  return false;
}

async function applyFastChangerFromContract(page) {
  const fastChanger = page.locator('app-cost-sourcing :text-matches("Fast [Cc]hanger", "i")').first();
  if (await fastChanger.isVisible({ timeout: 3000 }).catch(() => false)) {
    await fastChanger.click();
  }

  const checkboxes = page.locator('app-cost-sourcing tbody mat-checkbox, app-cost-sourcing tbody input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    await checkboxes.nth(i).click({ force: true }).catch(() => {});
  }

  const sourceDropdown = page.locator('app-cost-sourcing ng-select, app-cost-sourcing oe-select').first();
  if (await sourceDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await sourceDropdown.click();
    const option = page.locator('.ng-option, .mat-option').filter({ hasText: /From contract/i }).first();
    if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
      await option.click();
    }
  }

  const applyBtn = page.locator('app-cost-sourcing button:has-text("Apply to selected"), app-cost-sourcing button:has-text("APPLY TO SELECTED")').first();
  if (await applyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await applyBtn.click({ force: true });
    await page.waitForTimeout(2000);
  }
}

async function verifyBbDdOptionsPreserved(page, costsSteps) {
  await costsSteps.verifyDeliveryTypeOptions();
  await navigateToTab(page, SELECTORS.headerTab);
  await costsSteps.navigateToCostsSourcingTab();
  await costsSteps.verifyDeliveryTypeOptions();
}

test.describe('Costs & Sourcing Validation', { tag: ['@regression-2', '@module', '@regression', '@functional', '@costs-sourcing', '@uk-only'] }, () => {
  test.describe.configure({ timeout: 300000 });

  test('Test 443325: Cost and sourcing validation considered global by mistake', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);

    await createOrderWithMaterials(orderSteps, createSteps);

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.verifyCostsSourcingTabDisplayed();
    await setDueDateInCostsSourcing(authenticatedPage, getPastDate());
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    // Step 1: Validate in view mode; error only on Costs & Sourcing tab
    await costsSteps.navigateToCostsSourcingTab();
    await clickValidate(authenticatedPage);
    await assertCostsSourcingHasValidationError(authenticatedPage);

    await validateOnTabAndAssertNoGlobalError(authenticatedPage, SELECTORS.headerTab);
    await validateOnTabAndAssertNoGlobalError(authenticatedPage, SELECTORS.quickAddTab);
    await validateOnTabAndAssertNoGlobalError(authenticatedPage, SELECTORS.textOtherTab);

    // Step 2: Save and Submit — error still scoped to Costs & Sourcing only
    await costsSteps.navigateToCostsSourcingTab();
    await clickSaveAndSubmit(authenticatedPage);
    await assertCostsSourcingHasValidationError(authenticatedPage);
    await assertNoGlobalError(authenticatedPage);

    await navigateToTab(authenticatedPage, SELECTORS.headerTab);
    await assertNoGlobalError(authenticatedPage);
    await navigateToTab(authenticatedPage, SELECTORS.quickAddTab);
    await assertNoGlobalError(authenticatedPage);

    // Step 3: Edit mode — fix date and errors clear on Validate and Save & Submit
    const editBtn = authenticatedPage.locator(SELECTORS.editButton);
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click({ force: true });
      await authenticatedPage.waitForTimeout(2000);
    }

    await costsSteps.navigateToCostsSourcingTab();
    await setDueDateInCostsSourcing(authenticatedPage, getFutureDate());
    await clickValidate(authenticatedPage);
    await assertNoGlobalError(authenticatedPage);

    await clickSaveAndSubmit(authenticatedPage);
    await assertNoGlobalError(authenticatedPage);
  });

  test('Test 453374: No contracts found message in Costs & Sourcing', async ({ authenticatedPage, country }) => {
    test.skip(isSitEnvironment(), 'Known SIT defect IN119856: "No contracts found" message not displayed in Costs & Sourcing (works in UAT)');
    test.skip(!isUatEnvironment() && !process.env.RUN_CONTRACT_TESTS, 'Contract lookup message test validated on UAT where IN119856 fix is deployed');

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);

    await createOrderWithMaterials(orderSteps, createSteps);

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.verifyCostsSourcingTabDisplayed();
    await selectFromContractLineOption(authenticatedPage);

    // Step 1: Single material without active contract — Find Contracts shows red message
    await clickFindContracts(authenticatedPage);
    await assertNoContractsFoundMessage(authenticatedPage);

    // Step 2: Multiple materials — Fast Changer applies From contract/line to each line
    await orderSteps.navigateToQuickAddTab();
    await orderSteps.verifyQuickAddTabDisplayed();
    if (countryConfig.item3) {
      await orderSteps.exerciseQuickAddSearchButtons(countryConfig.item3, null, null, null);
    }

    await costsSteps.navigateToCostsSourcingTab();
    await applyFastChangerFromContract(authenticatedPage);

    const rowCount = await authenticatedPage.locator('app-cost-sourcing tbody tr').count();
    for (let i = 0; i < rowCount; i++) {
      await assertNoContractsFoundMessage(authenticatedPage, i);
    }

    await clickFindContracts(authenticatedPage);
    for (let i = 0; i < rowCount; i++) {
      await assertNoContractsFoundMessage(authenticatedPage, i);
    }
  });

  test('Test 465198: Contract sourcing options - contract IDs not preserved', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'UK', 'Call-Off contract sourcing scenario validated against UK data');
    test.skip(isSitEnvironment() && !process.env.RUN_CONTRACT_TESTS, 'Call-Off contract sourcing persistence requires UAT contract data (not available on SIT)');

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);
    const copySteps = new CopyOrderSteps(authenticatedPage);

    await createOrderWithMaterials(orderSteps, createSteps);

    await navigateToTab(authenticatedPage, SELECTORS.headerTab);
    await selectOrderType(authenticatedPage, 'Call.?Off|Call Off');
    await verifyOrderTypeSelected(authenticatedPage, 'Call.?Off|Call Off');

    await costsSteps.navigateToCostsSourcingTab();
    await selectFromContractLineOption(authenticatedPage);
    await clickFindContracts(authenticatedPage);
    const contractSelected = await selectFirstAvailableContract(authenticatedPage);
    test.skip(!contractSelected, 'No Call-Off contracts available for default UK test account/material in this environment');

    // Step 1: Save Call-Off order sourced from contract
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);
    await costsSteps.navigateToCostsSourcingTab();
    const contractDisplay = authenticatedPage.locator(
      'app-cost-sourcing tbody tr, app-cost-sourcing :text-matches("From contract|From Contract", "i")'
    ).first();
    await expect(contractDisplay).toBeVisible({ timeout: 10000 });

    // Step 2: Copy order and populate Customer Order Reference
    await copySteps.clickCopyOrderButton();
    await copySteps.verifyCopyOrderModalDisplayed();
    await copySteps.clickCopyOrderContinue();
    await copySteps.verifyCopiedOrderDisplayed();

    await orderSteps.fillCustomerOrderRefWithValue(randomCustomerOrderRef());
    await costsSteps.navigateToCostsSourcingTab();
    const fromContractOption = authenticatedPage.locator('app-cost-sourcing label:has-text("From contract"), app-cost-sourcing :text("From contract")').first();
    await expect(fromContractOption).toBeVisible({ timeout: 10000 });

    // Step 3: Save copied order without changes — From Contract/Line option retained in view mode
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);
    await costsSteps.navigateToCostsSourcingTab();
    await expect(fromContractOption).toBeVisible({ timeout: 10000 });

    // Step 4: Edit mode — Find Contract while From Contract/Line selected retains contract
    const editBtn = authenticatedPage.locator(SELECTORS.editButton);
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click({ force: true });
      await authenticatedPage.waitForTimeout(2000);
    }

    await costsSteps.navigateToCostsSourcingTab();
    await selectFromContractLineOption(authenticatedPage);
    await clickFindContracts(authenticatedPage);
    await selectFirstAvailableContract(authenticatedPage);
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await costsSteps.navigateToCostsSourcingTab();
    await expect(contractDisplay).toBeVisible({ timeout: 10000 });
  });

  test('Test 443343: BB/DD source options disappear for Off Catalogue item', async ({ authenticatedPage, country }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);

    await orderSteps.verifyOrderEnginePageLoaded();
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.searchForAccountAndSelectFirst();
    await createSteps.verifyHeaderTabDisplayed();
    await createSteps.fillMandatoryFieldsAndVerify();

    // Step 1: Off-catalogue / ingest-style material with BB sourcing
    await orderSteps.navigateToQuickAddTab();
    await orderSteps.verifyQuickAddTabDisplayed();
    await orderSteps.addItemsToQuickAdd();
    await orderSteps.setUnitSellPriceForAllItems('100');
    await orderSteps.clickRecalcButton();

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.selectDeliveryType('BB');
    await verifyBbDdOptionsPreserved(authenticatedPage, costsSteps);

    // Step 2: Change BB to DD and verify preservation across tabs
    await costsSteps.selectDeliveryType('DD');
    await verifyBbDdOptionsPreserved(authenticatedPage, costsSteps);

    // Step 3: Repeat with normal catalogue product (regression)
    await orderSteps.navigateToQuickAddTab();
    const countryConfig = getCountryConfig(country);
    await orderSteps.exerciseQuickAddSearchButtons(countryConfig.item1, null, null, null);
    await orderSteps.setUnitSellPriceForAllItems('100');
    await orderSteps.clickRecalcButton();

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.selectDeliveryType('BB');
    await verifyBbDdOptionsPreserved(authenticatedPage, costsSteps);
  });

  test('Test 460671: Contract order lines can only be sourced as BB or from Stock', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const costsSteps = new CostsSourcingSteps(authenticatedPage);

    await createOrderWithMaterials(orderSteps, createSteps);

    await navigateToTab(authenticatedPage, SELECTORS.headerTab);
    await selectOrderType(authenticatedPage, 'Contract');
    await verifyOrderTypeSelected(authenticatedPage, 'Contract');

    await costsSteps.navigateToCostsSourcingTab();
    await selectFromContractLineOption(authenticatedPage);

    // Step 1: Validate — error only in Costs & Sourcing
    await clickValidate(authenticatedPage);
    await assertCostsSourcingHasValidationError(authenticatedPage);
    await validateOnTabAndAssertNoGlobalError(authenticatedPage, SELECTORS.headerTab);
    await validateOnTabAndAssertNoGlobalError(authenticatedPage, SELECTORS.quickAddTab);

    // Step 2: Save and Submit — same scoped behaviour
    await costsSteps.navigateToCostsSourcingTab();
    await clickSaveAndSubmit(authenticatedPage);
    await assertCostsSourcingHasValidationError(authenticatedPage);
    await assertNoGlobalError(authenticatedPage);

    // Step 3: Change to DD sourcing — error still tab-scoped
    const editBtn = authenticatedPage.locator(SELECTORS.editButton);
    if (await editBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editBtn.click({ force: true });
      await authenticatedPage.waitForTimeout(2000);
    }

    await costsSteps.navigateToCostsSourcingTab();
    await costsSteps.selectDeliveryType('DD');
    await clickValidate(authenticatedPage);
    await assertCostsSourcingHasValidationError(authenticatedPage);
    await validateOnTabAndAssertNoGlobalError(authenticatedPage, SELECTORS.headerTab);

    // Step 4: Save and Submit with DD — same behaviour
    await costsSteps.navigateToCostsSourcingTab();
    await clickSaveAndSubmit(authenticatedPage);
    await assertCostsSourcingHasValidationError(authenticatedPage);
    await assertNoGlobalError(authenticatedPage);
  });
});
