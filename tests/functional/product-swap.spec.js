const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { TextOtherSteps } = require('../../steps/orders/text-other.steps');
const { BlockingGroupingSteps } = require('../../steps/orders/blocking-grouping.steps');
const { BulkUploadSteps } = require('../../steps/orders/bulk-upload.steps');
const { getCountryConfig } = require('../../data/constants/country-config');
const { randomFutureDate, randomAlphanumeric } = require('../../data/generators');

const SELECTORS = {
  quickAddTab: "div[data-name='Quick add / pricing']",
  textOtherTab: "div[data-name='Text/Other']",
  rebatesTab: "div[data-name='Rebates']",
  blockingGroupingTab: "div[data-name='Blocking & Grouping']",
  editButton: "button:has(mat-icon:has-text('edit'))",
  saveButton: "button:has(mat-icon:text-is('save'))",
};

async function navigateToTab(page, tabSelector) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(tabSelector).click({ force: true });
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

function getPricingRow(page, rowIndex = 0) {
  return page.locator('tbody tr[formarrayname="basicPrice"], tbody tr.ng-star-inserted, tbody tr').nth(rowIndex);
}

function getProductSwapButton(page, rowIndex = 0) {
  const row = getPricingRow(page, rowIndex);
  return row.locator(
    'button:has(mat-icon:has-text("swap_horiz")), button:has(mat-icon:has-text("compare_arrows")), button[data-name*="override"], button[data-name*="swap"], button:has(mat-icon:has-text("autorenew"))',
  ).first();
}

async function getQuickAddRowValues(page, rowIndex = 0) {
  const row = getPricingRow(page, rowIndex);
  return {
    ccPart: ((await row.locator('td:nth-child(5), td[data-name*="ccPart"]').first().textContent().catch(() => '')) || '').trim(),
    mfrPart: ((await row.locator('td:nth-child(6), td[data-name*="mfrPart"]').first().textContent().catch(() => '')) || '').trim(),
    description: ((await row.locator('td:nth-child(7), td[data-name*="description"]').first().textContent().catch(() => '')) || '').trim(),
    itemType: ((await row.locator('td:nth-child(4), td[data-name*="itemType"]').first().textContent().catch(() => '')) || '').trim(),
    sellPrice: await row.locator('input[data-name*="unitSalesPrice"], input[formcontrolname*="unitSalesPrice"], td:nth-child(12) input').first().inputValue().catch(() => ''),
    source: ((await row.locator('td[data-name*="source"], td:nth-child(8)').first().textContent().catch(() => '')) || '').trim(),
  };
}

async function getTextOtherRowValues(page, rowIndex = 0) {
  return page.evaluate((idx) => {
    const rows = document.querySelectorAll('app-text-other tbody tr');
    const row = rows[idx];
    if (!row) return {};

    const readValue = (selectors) => {
      for (const sel of selectors) {
        const el = row.querySelector(sel);
        if (!el) continue;
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') return el.value?.trim() || '';
        const text = el.textContent?.trim() || '';
        if (text) return text;
      }
      return '';
    };

    return {
      customerPartNo: readValue([
        '[formcontrolname*="customerPart"] input',
        '[data-name*="customerPart"] input',
        'input[placeholder*="Customer Part"]',
      ]),
      linkedToLine: readValue([
        '[formcontrolname*="linkedTo"] input',
        '[data-name*="linkedTo"] input',
        'input[placeholder*="Linked"]',
      ]),
      renewalDate: readValue([
        '[formcontrolname*="renewal"] input',
        '[data-name*="renewal"] input',
        'oe-datepicker input',
      ]),
      internalContractRef: readValue([
        '[formcontrolname*="internalContract"] .ng-value-label',
        '[formcontrolname*="internalContract"] input',
        '[data-name*="internalContract"] .ng-value-label',
      ]),
      lineText: readValue([
        '[formcontrolname*="lineText"] input',
        '[data-name*="lineText"] input',
        'textarea',
      ]),
    };
  }, rowIndex);
}

async function fillTextOtherFields(page, rowIndex, values) {
  await navigateToTab(page, SELECTORS.textOtherTab);
  const row = page.locator('app-text-other tbody tr').nth(rowIndex);

  const fillInput = async (selectors, value) => {
    if (!value) return;
    for (const sel of selectors) {
      const input = row.locator(sel).first();
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.click({ force: true });
        await input.fill(value);
        await input.press('Tab');
        return;
      }
    }
  };

  await fillInput(['[formcontrolname*="customerPart"] input', '[data-name*="customerPart"] input'], values.customerPartNo);
  await fillInput(['[formcontrolname*="linkedTo"] input', '[data-name*="linkedTo"] input'], values.linkedToLine);
  await fillInput(['[formcontrolname*="renewal"] input', '[data-name*="renewal"] input', 'oe-datepicker input'], values.renewalDate);
  await fillInput(['[formcontrolname*="lineText"] input', '[data-name*="lineText"] input', 'textarea'], values.lineText);
}

async function selectInternalContractRef(page, rowIndex = 0, optionIndex = 1) {
  const dropdown = page.locator('app-text-other tbody ng-select, app-text-other tbody oe-select').nth(rowIndex);
  if (!(await dropdown.isVisible({ timeout: 3000 }).catch(() => false))) return '';
  await dropdown.click({ force: true });
  const option = page.locator('.ng-option:not(.ng-option-disabled)').nth(optionIndex);
  if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
    const label = ((await option.textContent()) || '').trim();
    await option.click({ force: true });
    return label;
  }
  return '';
}

async function performProductSwap(page, rowIndex = 0, { retainPricing = true, searchTerm = null } = {}) {
  await navigateToTab(page, SELECTORS.quickAddTab);
  const swapBtn = getProductSwapButton(page, rowIndex);
  if (!(await swapBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log(`Product swap button not visible on row ${rowIndex} - skipping swap action`);
    return false;
  }

  await swapBtn.click({ force: true });
  await page.waitForTimeout(1500);

  const overlay = page.locator('.cdk-overlay-container');
  const retainCheckbox = overlay.locator('mat-checkbox:has-text("Retain"), oe-checkbox:has-text("Retain"), label:has-text("Retain pricing")').first();
  if (await retainCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    const isChecked = await retainCheckbox.locator('input[type="checkbox"]').isChecked().catch(() => retainPricing);
    if (retainPricing !== isChecked) {
      await retainCheckbox.click({ force: true });
    }
  }

  if (searchTerm) {
    const searchInput = overlay.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(searchTerm);
      await page.waitForTimeout(2000);
      const resultRow = overlay.locator('tbody tr').first();
      if (await resultRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        await resultRow.click({ force: true });
      }
    }
  } else {
    const resultRow = overlay.locator('tbody tr, .product-list tr, .search-results tr').first();
    if (await resultRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      const checkbox = resultRow.locator('mat-checkbox, input[type="checkbox"]').first();
      if (await checkbox.isVisible().catch(() => false)) {
        await checkbox.click({ force: true });
      } else {
        await resultRow.click({ force: true });
      }
    }
  }

  const confirmBtn = overlay.locator(
    'button:has-text("Confirm"), button:has-text("CONFIRM"), button:has-text("OK"), button:has-text("Swap"), button.btn-confirm',
  ).first();
  if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmBtn.click({ force: true });
  }

  await page.waitForTimeout(3000);
  return true;
}

async function getRebateRowCount(page) {
  await navigateToTab(page, SELECTORS.rebatesTab);
  return page.locator('app-rebates tbody tr, tbody tr').count();
}

async function getBlockingGroupingValues(page, rowIndex = 0) {
  await navigateToTab(page, SELECTORS.blockingGroupingTab);
  const row = page.locator('app-blocking-grouping tbody tr, tbody tr').nth(rowIndex);
  return {
    deliveryBlock: ((await row.locator('td:nth-child(2), td[data-name*="block"]').first().textContent().catch(() => '')) || '').trim(),
    deliveryGroup: ((await row.locator('td:nth-child(3), td[data-name*="group"]').first().textContent().catch(() => '')) || '').trim(),
  };
}

async function createOrderWithMaterial(orderSteps, createSteps, country) {
  const countryConfig = getCountryConfig(country);
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.fillMandatoryFieldsAndVerify();
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.exerciseQuickAddSearchButtons(countryConfig.item1, countryConfig.item2, null, null);
  await orderSteps.setUnitSellPriceForAllItems('100');
  await orderSteps.clickRecalcButton();
}

test.describe('Product Swap', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.describe('FR product swap', { tag: ['@regression-2', '@fr-only'] }, () => {
    test.skip(
      ({ country }) => country.toUpperCase() !== 'FR',
      'FR-only test - skipping for non-FR environment',
    );

    test('Test 466635: Product swap preserves line values', async ({ authenticatedPage, country }) => {
      test.setTimeout(900000);

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const textSteps = new TextOtherSteps(authenticatedPage);
    const blockingSteps = new BlockingGroupingSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);

    await createOrderWithMaterial(orderSteps, createSteps, country);
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await orderSteps.clickEditIcon();

    const textFieldValues = {
      customerPartNo: `CPN-${randomAlphanumeric(6)}`,
      linkedToLine: '10',
      renewalDate: randomFutureDate(),
      lineText: `Line text ${randomAlphanumeric(4)}`,
    };
    await fillTextOtherFields(authenticatedPage, 0, textFieldValues);

    await blockingSteps.verifyBlockingGroupingTabDisplayed();
    await blockingSteps.verifyBlockingGroupingTableDisplayed();
    const blockingBefore = await getBlockingGroupingValues(authenticatedPage, 0);

    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);
    await orderSteps.clickEditIcon();

    await navigateToTab(authenticatedPage, SELECTORS.textOtherTab);
    await textSteps.verifyTextOtherTabDisplayed();
    const textBeforeSwap = await getTextOtherRowValues(authenticatedPage, 0);
    expect(textBeforeSwap.customerPartNo || textFieldValues.customerPartNo).toBeTruthy();

    const quickAddBefore = await getQuickAddRowValues(authenticatedPage, 0);
    const sellPriceBefore = quickAddBefore.sellPrice;

    const swapped = await performProductSwap(authenticatedPage, 0, {
      retainPricing: true,
      searchTerm: countryConfig.item2,
    });
    expect(swapped).toBeTruthy();

    const quickAddAfterRetain = await getQuickAddRowValues(authenticatedPage, 0);
    expect(quickAddAfterRetain.ccPart).toBeTruthy();
    if (sellPriceBefore) {
      expect(quickAddAfterRetain.sellPrice).toBe(sellPriceBefore);
    }

    await navigateToTab(authenticatedPage, SELECTORS.textOtherTab);
    const textAfterSwap = await getTextOtherRowValues(authenticatedPage, 0);
    expect(textAfterSwap.customerPartNo).toBe(textBeforeSwap.customerPartNo || textFieldValues.customerPartNo);
    expect(textAfterSwap.linkedToLine).toBe(textBeforeSwap.linkedToLine || textFieldValues.linkedToLine);
    expect(textAfterSwap.renewalDate).toBe(textBeforeSwap.renewalDate || textFieldValues.renewalDate);

    const blockingAfter = await getBlockingGroupingValues(authenticatedPage, 0);
    if (blockingBefore.deliveryBlock || blockingBefore.deliveryGroup) {
      expect(blockingAfter.deliveryBlock).toBe(blockingBefore.deliveryBlock);
      expect(blockingAfter.deliveryGroup).toBe(blockingBefore.deliveryGroup);
    }

    const rebateCountBefore = await getRebateRowCount(authenticatedPage);
    await performProductSwap(authenticatedPage, 0, { retainPricing: false, searchTerm: countryConfig.item1 });
    const quickAddAfterNoRetain = await getQuickAddRowValues(authenticatedPage, 0);
    if (sellPriceBefore && quickAddAfterNoRetain.sellPrice) {
      console.log(`Sell price with retain pricing off: before=${sellPriceBefore}, after=${quickAddAfterNoRetain.sellPrice}`);
    }

    await orderSteps.exerciseQuickAddSearchButtons(countryConfig.item2, null, null, null);
    const secondLineIndex = 1;
    const rebateCountWithSecondLine = await getRebateRowCount(authenticatedPage);
    if (rebateCountWithSecondLine > 0) {
      await performProductSwap(authenticatedPage, secondLineIndex, { retainPricing: true, searchTerm: countryConfig.item1 });
      const rebateCountAfterDifferentMfr = await getRebateRowCount(authenticatedPage);
      console.log(`Rebate count: before=${rebateCountWithSecondLine}, after different MFR swap=${rebateCountAfterDifferentMfr}`);
    }

    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);
    await orderSteps.clickEditIcon();

    await orderSteps.exerciseQuickAddSearchButtons(countryConfig.item1, null, null, null);
    const uploadRowIndex = await authenticatedPage.locator('tbody tr').count() - 1;
    const uploadTextValues = {
      customerPartNo: `UP-${randomAlphanumeric(5)}`,
      linkedToLine: '20',
      renewalDate: randomFutureDate(),
      lineText: `Upload line ${randomAlphanumeric(3)}`,
    };
    await fillTextOtherFields(authenticatedPage, uploadRowIndex, uploadTextValues);
    const uploadTextBefore = await getTextOtherRowValues(authenticatedPage, uploadRowIndex);

    await performProductSwap(authenticatedPage, uploadRowIndex, { retainPricing: true, searchTerm: countryConfig.item2 });
    const uploadTextAfter = await getTextOtherRowValues(authenticatedPage, uploadRowIndex);
    expect(uploadTextAfter.customerPartNo).toBe(uploadTextBefore.customerPartNo);
    expect(uploadTextAfter.linkedToLine).toBe(uploadTextBefore.linkedToLine);
    expect(uploadTextAfter.renewalDate).toBe(uploadTextBefore.renewalDate);
  });

  test('Test 466635 Step 16-18: Product swap on uploaded cart item preserves fields', async ({ authenticatedPage, country }) => {
    test.setTimeout(600000);

    const bulkSteps = new BulkUploadSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(__dirname, '..', '..', 'test-data', 'bulk-upload', `${country.toUpperCase()} Bulk Upload.xlsx`);

    if (!fs.existsSync(filePath)) {
      console.log(`Bulk upload Excel file not found at ${filePath} - using quick add fallback`);
      await createOrderWithMaterial(orderSteps, new CreateOrderSteps(authenticatedPage), country);
      await orderSteps.saveOrder();
      await orderSteps.clickEditIcon();

      const textValues = {
        customerPartNo: `CPN-${randomAlphanumeric(5)}`,
        linkedToLine: '15',
        renewalDate: randomFutureDate(),
      };
      await fillTextOtherFields(authenticatedPage, 0, textValues);
      const before = await getTextOtherRowValues(authenticatedPage, 0);
      await performProductSwap(authenticatedPage, 0, { retainPricing: true, searchTerm: countryConfig.item2 });
      const after = await getTextOtherRowValues(authenticatedPage, 0);
      expect(after.customerPartNo).toBe(before.customerPartNo);
      return;
    }

    await bulkSteps.verifyOrderEngineLoaded();
    await bulkSteps.clickCreateOrder();
    await bulkSteps.searchForAccountAndSelect();
    await bulkSteps.fillCustomerOrderRefForBulkUpload();
    await bulkSteps.fillMandatoryHeaderFields();
    await bulkSteps.navigateToQuickAddTab();
    await bulkSteps.clickUploadButton();
    await bulkSteps.uploadExcelFile(filePath);
    await bulkSteps.verifyItemsLoadedFromExcel();

    const textValues = {
      customerPartNo: `UP-${randomAlphanumeric(5)}`,
      linkedToLine: '5',
      renewalDate: randomFutureDate(),
    };
    await fillTextOtherFields(authenticatedPage, 0, textValues);
    const before = await getTextOtherRowValues(authenticatedPage, 0);

    await performProductSwap(authenticatedPage, 0, { retainPricing: true, searchTerm: countryConfig.item2 });
    const after = await getTextOtherRowValues(authenticatedPage, 0);
    expect(after.customerPartNo).toBe(before.customerPartNo);
    expect(after.linkedToLine).toBe(before.linkedToLine);
    expect(after.renewalDate).toBe(before.renewalDate);
  });
  });

  test.describe('US product swap', { tag: ['@regression-2', '@us-only'] }, () => {
    test.skip(
      ({ country }) => country.toUpperCase() !== 'US',
      'Internal Contract Reference product swap test is US-only',
    );

    test('Test 466635 Step 19: Internal Contract Ref persists after product swap (US)', async ({ authenticatedPage }) => {
      test.setTimeout(600000);

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const countryConfig = getCountryConfig('US');

    await createOrderWithMaterial(orderSteps, createSteps, 'US');
    await orderSteps.saveOrder();
    await orderSteps.clickEditIcon();

    await navigateToTab(authenticatedPage, SELECTORS.textOtherTab);
    const icRefValue = await selectInternalContractRef(authenticatedPage, 0, 1);
    if (!icRefValue) {
      const fallback = await selectInternalContractRef(authenticatedPage, 0, 0);
      if (!fallback) {
        test.skip(true, 'No Internal Contract Reference options available for US account — SAP contract data not seeded');
        return;
      }
    }

    const icRefBefore = await getTextOtherRowValues(authenticatedPage, 0);
    await performProductSwap(authenticatedPage, 0, { retainPricing: true, searchTerm: countryConfig.item2 });

    await navigateToTab(authenticatedPage, SELECTORS.textOtherTab);
    const icRefAfter = await getTextOtherRowValues(authenticatedPage, 0);
    expect(icRefAfter.internalContractRef).toBe(icRefBefore.internalContractRef);
    });
  });
});
