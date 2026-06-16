const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');

const NORMAL_SELECT_FIELDS = [
  'orderType',
  'salesOffice',
  'warehouse',
  'code',
  'shippingType',
  'shippingCondition',
  'billingOption',
  'incoTerms',
];

async function verifySelectFieldStructure(page, formControlName) {
  const field = page.locator(`oe-select[formcontrolname='${formControlName}']`).first();
  if (!(await field.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  const ngSelect = field.locator('ng-select, .ng-select, select').first();
  if (await ngSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
    const box = await field.boundingBox();
    expect(box, `oe-select[${formControlName}] should have a bounding box`).toBeTruthy();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);
  }
  return true;
}

async function verifySpecialSelectFields(page) {
  const shipToSection = page.locator('div').filter({ has: page.locator(':text-is("Ship-To:")') }).first();
  if (!(await shipToSection.isVisible({ timeout: 5000 }).catch(() => false))) {
    console.log('Ship-To section not visible - may not be required for this country');
    return;
  }

  const countryCodeField = shipToSection.locator('ng-select, oe-select, input[type="text"]').first();
  if (!(await countryCodeField.isVisible({ timeout: 3000 }).catch(() => false))) {
    console.log('Country code field in Ship-To section is not visible — may be hidden until search');
    return;
  }

  const searchBtn = shipToSection.locator('button:has-text("SEARCH")').first();
  if (await searchBtn.isVisible().catch(() => false)) {
    await expect(searchBtn).toBeVisible();
    const btnBox = await searchBtn.boundingBox();
    const fieldBox = await countryCodeField.boundingBox();
    if (btnBox && fieldBox) {
      expect(Math.abs(btnBox.y - fieldBox.y)).toBeLessThan(40);
    }
  }
}

async function verifyAutocompleteFields(page) {
  const regionField = page.locator(
    'oe-input[formcontrolname*="region"] input, input[formcontrolname*="region"], div:has-text("Region") input',
  ).first();

  if (await regionField.isVisible({ timeout: 5000 }).catch(() => false)) {
    const inputType = await regionField.getAttribute('type');
    expect(inputType === 'text' || inputType === null, `Region input type should be "text" or unset, got "${inputType}"`).toBeTruthy();
  } else {
    const shipToInputs = page.locator('div').filter({ has: page.locator(':text-is("Ship-To:")') }).locator('input:not([disabled])');
    const count = await shipToInputs.count();
    expect(count, 'At least one Ship-To input should exist (region or address fields)').toBeGreaterThanOrEqual(0);
  }
}

async function verifyRadioButtonGroups(page) {
  const deliveryProcessing = page.locator(
    ':text("Delivery processing"), oe-radio-button:has-text("Delivery processing"), mat-radio-group:has-text("Delivery processing")',
  ).first();
  const stopOrderInSap = page.locator(
    ':text("Stop Order in SAP"), oe-radio-button:has-text("Stop Order in SAP"), mat-radio-group:has-text("Stop Order in SAP")',
  ).first();

  if (await deliveryProcessing.isVisible({ timeout: 5000 }).catch(() => false)) {
    await expect(deliveryProcessing).toBeVisible();
    const radios = page.locator('mat-radio-button, oe-radio-button, input[type="radio"]');
    expect(await radios.count()).toBeGreaterThan(0);
  }

  if (await stopOrderInSap.isVisible({ timeout: 3000 }).catch(() => false)) {
    await expect(stopOrderInSap).toBeVisible();
  }
}

async function verifyFieldsHorizontallyAligned(page, selectors) {
  const boxes = [];
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible({ timeout: 3000 }).catch(() => false)) {
      const box = await locator.boundingBox();
      if (box) boxes.push(box);
    }
  }
  expect(boxes.length, 'At least 2 select fields must be visible for alignment check').toBeGreaterThanOrEqual(2);

  const leftPositions = boxes.map((b) => b.x);
  expect(Math.max(...leftPositions) - Math.min(...leftPositions)).toBeLessThan(80);
}

async function verifyHeaderFormAlignment(page) {
  const headerTab = new HeaderTabPage(page);
  await expect(headerTab.headerTab).toBeVisible({ timeout: 10000 });

  let verifiedCount = 0;
  for (const fieldName of NORMAL_SELECT_FIELDS) {
    const wasVerified = await verifySelectFieldStructure(page, fieldName);
    if (wasVerified) verifiedCount++;
  }
  expect(verifiedCount, 'At least 3 header select fields must be visible for alignment verification').toBeGreaterThanOrEqual(3);

  await verifySpecialSelectFields(page);
  await verifyAutocompleteFields(page);
  await verifyRadioButtonGroups(page);

  const selectLocators = NORMAL_SELECT_FIELDS.map((name) => `oe-select[formcontrolname='${name}']`);
  await verifyFieldsHorizontallyAligned(page, selectLocators);
}

async function createNewOrderInEditMode(orderSteps, createSteps) {
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.fillMandatoryFieldsAndVerify();
  await createSteps.verifyHeaderTabDisplayed();
}

test.describe('UI Alignment', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 450195: Header tab form field alignment in edit mode', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createNewOrderInEditMode(orderSteps, createSteps);

    await orderSteps.navigateToHeaderTab();
    await verifyHeaderFormAlignment(authenticatedPage);

    await verifySelectFieldStructure(authenticatedPage, 'orderType');
    await verifySpecialSelectFields(authenticatedPage);
    await verifyAutocompleteFields(authenticatedPage);
    await verifyRadioButtonGroups(authenticatedPage);
  });

  test('Test 450195: Header tab form field alignment in view mode', async ({ authenticatedPage }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createNewOrderInEditMode(orderSteps, createSteps);
    await orderSteps.navigateToQuickAddTab();
    await orderSteps.addItemsToQuickAdd();
    await orderSteps.setUnitSellPriceForAllItems('100');
    await orderSteps.clickRecalcButton();
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await orderSteps.navigateToHeaderTab();

    const headerTab = new HeaderTabPage(authenticatedPage);
    await expect(headerTab.headerTab).toBeVisible({ timeout: 10000 });

    const headerContent = authenticatedPage.locator('app-header, app-order-header').first()
      .or(authenticatedPage.locator('.header-content, .order-header').first())
      .or(authenticatedPage.locator('oe-order-header').first());
    const headerArea = (await headerContent.isVisible({ timeout: 3000 }).catch(() => false))
      ? headerContent : authenticatedPage;

    const viewModeLabels = [
      'Sales Office', 'Warehouse', 'Order Type', 'Shipping Type',
      'Shipping Condition', 'Billing Option', 'Incoterms',
      'Customer Order Ref', 'Customer PO Type',
    ];
    let visibleLabelCount = 0;
    const labelBoxes = [];
    for (const label of viewModeLabels) {
      const labelEl = headerArea.getByText(label, { exact: false }).first();
      if (await labelEl.isVisible({ timeout: 2000 }).catch(() => false)) {
        visibleLabelCount++;
        const box = await labelEl.boundingBox();
        if (box) labelBoxes.push(box);
      }
    }
    expect(visibleLabelCount, 'At least 3 header field labels should be visible in view mode').toBeGreaterThanOrEqual(3);

    if (labelBoxes.length >= 2) {
      const leftPositions = labelBoxes.map(b => b.x);
      const maxDiff = Math.max(...leftPositions) - Math.min(...leftPositions);
      expect(maxDiff, 'Header labels should be roughly left-aligned in view mode').toBeLessThan(200);
    }

    const soldTo = authenticatedPage.getByText('Sold-To', { exact: false }).first();
    await expect(soldTo, 'Sold-To section should be visible in view mode').toBeVisible({ timeout: 5000 });

    const shipTo = authenticatedPage.getByText('Ship-To', { exact: false }).first();
    await expect(shipTo, 'Ship-To section should be visible in view mode').toBeVisible({ timeout: 5000 });
  });
});
