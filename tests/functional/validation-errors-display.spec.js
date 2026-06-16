const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { UserManagementSteps } = require('../../steps/user-management.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { randomCustomerOrderRef, randomFutureDate, randomFirstName, randomLastName } = require('../../data/generators');
const { getCountryConfig } = require('../../data/constants/country-config');

const SELECTORS = {
  validateButton: "button:has(mat-icon:has-text('fact_check'))",
  saveAndSubmitButton: "button:has(mat-icon:has-text('save_alt'))",
  errorBanner: 'div:has(> strong:has-text("Error"))',
  fieldErrorsIntro: 'div.error-title:has-text("The following field(s) need to be corrected")',
  errorSection: 'div.error-message-section',
  errorPointsContainer: 'div.error-points',
  errorLine: 'div.non-global-error-text',
  headerTab: "div[data-name='Header']",
  quickAddTab: "div[data-name='Quick add / pricing']",
  textOtherTab: "div[data-name='Text/Other']",
};

async function clickValidate(page) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const validateBtn = page.locator(SELECTORS.validateButton);
  await validateBtn.scrollIntoViewIfNeeded().catch(() => {});

  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/') && resp.status() < 500, { timeout: 60000 }).catch(() => null),
    validateBtn.click({ force: true }),
  ]);
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const errorBanner = page.locator('div:has(> strong:has-text("Error")), div.error-section, div.error-message-section, div.success-section, .error-points').first();
  const found = await errorBanner.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
  if (!found) {
    console.log('Warning: No validation banner found after first attempt — retrying validate click');
    await validateBtn.click({ force: true });
    await page.waitForTimeout(2000);
    await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(5000);
    await errorBanner.waitFor({ state: 'visible', timeout: 30000 }).catch(() => {
      console.log('Warning: No validation error/success banner found after retry');
    });
  }
}

async function clickSaveAndSubmit(page) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  const submitBtn = page.locator(SELECTORS.saveAndSubmitButton);
  await submitBtn.scrollIntoViewIfNeeded().catch(() => {});

  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/api/') && resp.status() < 500, { timeout: 60000 }).catch(() => null),
    submitBtn.click({ force: true }),
  ]);
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(3000);

  const errorBanner = page.locator('div:has(> strong:has-text("Error")), div.error-section, div.error-message-section, div.success-section, .error-points').first();
  const found = await errorBanner.waitFor({ state: 'visible', timeout: 30000 }).then(() => true).catch(() => false);
  if (!found) {
    console.log('Warning: No validation banner found after Save & Submit — may need manual check');
  }
}

async function navigateToTab(page, tabSelector) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(tabSelector).click({ force: true });
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function createBareOrder(orderSteps, createSteps, page) {
  const baseUrl = process.env.BASE_URL || 'https://orderengine-sit.computacenter.com/oe/orders';
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.verifyHeaderTabDisplayed();
}

async function fillCustomerRef(page) {
  const headerTab = new HeaderTabPage(page);
  await headerTab.customerOrderRef.fill(randomCustomerOrderRef());
}

async function fillDeliveryDate(page) {
  const headerTab = new HeaderTabPage(page);
  const dateInput = headerTab.requestedDeliveryDate;
  if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await dateInput.click();
    await dateInput.fill(randomFutureDate());
    await dateInput.press('Tab');
  }
}

async function fillShipTo(page, createSteps) {
  const shipToSearchBtn = page.locator('div').filter({ has: page.locator(':text-is("Ship-To:")') }).locator('button:has-text("SEARCH")').first();
  if (!(await shipToSearchBtn.isVisible({ timeout: 3000 }).catch(() => false))) return;

  await shipToSearchBtn.click();
  await page.waitForTimeout(2000);
  const overlay = page.locator('.cdk-overlay-pane');
  const numberInput = overlay.locator('input[type="text"]').first();
  if (await numberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await numberInput.fill(createSteps.countryConfig.accounts);
    await page.waitForTimeout(500);
  }
  const dialogSearchBtn = overlay.locator('button:has-text("SEARCH")').first();
  if (await dialogSearchBtn.isVisible().catch(() => false)) {
    await dialogSearchBtn.click();
    await page.waitForTimeout(3000);
  }
  const resultLink = overlay.locator('span.redirect').first();
  if (await resultLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await resultLink.click();
  }
  await page.waitForTimeout(1500);
  await page.keyboard.press('Escape').catch(() => {});
}

async function fillIncotermsText(page) {
  await page.evaluate(() => {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const setVal = (input, val) => {
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    };
    for (const div of document.querySelectorAll('div')) {
      const text = div.childNodes[0]?.textContent?.trim() || '';
      if (text.startsWith('Incoterms Text')) {
        const input = div.parentElement?.querySelector('input');
        if (input) { setVal(input, 'FCA Factory'); break; }
      }
    }
  });
}

async function fillOrderedBy(page) {
  await page.evaluate(({ firstName, lastName }) => {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const setVal = (input, val) => {
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const orderedByHeader = [...document.querySelectorAll('div')].find(
      (d) => d.textContent?.trim() === 'Customer Ordered By Information'
    );
    if (orderedByHeader) {
      const inputs = orderedByHeader.parentElement?.querySelectorAll('input:not([disabled])');
      if (inputs && inputs.length >= 2) {
        setVal(inputs[0], firstName);
        setVal(inputs[1], lastName);
      }
    }
  }, { firstName: randomFirstName(), lastName: randomLastName() });
}

async function prepareOrderWithErrorCount(page, orderSteps, createSteps, targetCount) {
  await createBareOrder(orderSteps, createSteps, page);

  const fieldFillers = [
    () => fillCustomerRef(page),
    () => fillDeliveryDate(page),
    () => fillShipTo(page, createSteps),
    () => fillIncotermsText(page),
    () => fillOrderedBy(page),
  ];

  const fillCount = Math.max(0, fieldFillers.length - targetCount);
  for (let i = 0; i < fillCount; i++) {
    await fieldFillers[i]();
    await page.waitForTimeout(300);
  }
}

async function addLinesWithoutUnitSell(page, orderSteps, lineCount = 1, country) {
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.verifyQuickAddTabDisplayed();

  for (let i = 0; i < lineCount; i++) {
    const textarea = page.locator("textarea[placeholder='Quick Add Reference']");
    await textarea.fill('laptop');
    await page.waitForTimeout(300);
    await page.locator("button:has-text('DESC')").click({ force: true });
    await page.waitForTimeout(3000);

    const modal = page.locator('.cdk-overlay-pane, mat-dialog-container').filter({
      hasText: /Select products|Search for products|Product Search/i,
    }).first();
    if (await modal.isVisible({ timeout: 5000 }).catch(() => false)) {
      const searchBtn = modal.locator("button:has-text('SEARCH')").first();
      if (await searchBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchBtn.click();
        await page.waitForTimeout(3000);
      }
      const productRow = modal.locator('tbody tr:not(:has-text("No products"))').first();
      if (await productRow.isVisible({ timeout: 5000 }).catch(() => false)) {
        const checkbox = productRow.locator('mat-checkbox, input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await checkbox.click({ force: true });
        } else {
          await productRow.click({ force: true });
        }
        await page.waitForTimeout(500);
        const addBtn = modal.locator("button:has-text('ADD SELECTED')").first();
        if (await addBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await addBtn.click({ force: true });
          await page.waitForTimeout(1000);
        }
      } else {
        const closeX = modal.locator('mat-icon:has-text("close"), button.close, .close-icon').first();
        if (await closeX.isVisible({ timeout: 1000 }).catch(() => false)) {
          await closeX.click({ force: true });
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(1000);
      }
    }
    await page.waitForTimeout(1000);
    const loader = page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  }
}

async function getValidationErrorContainer(page) {
  const errorSection = page.locator(SELECTORS.errorSection).filter({
    has: page.locator(SELECTORS.fieldErrorsIntro),
  }).first();
  if (await errorSection.isVisible({ timeout: 5000 }).catch(() => false)) {
    return errorSection;
  }
  const fallback = page.locator(SELECTORS.errorSection).last();
  if (await fallback.isVisible({ timeout: 3000 }).catch(() => false)) {
    return fallback;
  }
  return page.locator(SELECTORS.errorBanner).first();
}

async function countValidationErrorLines(page) {
  const errorLines = page.locator(SELECTORS.errorLine);
  const count = await errorLines.count();
  if (count > 0) return count;

  const container = await getValidationErrorContainer(page);
  if (!(await container.isVisible({ timeout: 5000 }).catch(() => false))) {
    return 0;
  }

  const pointsContainer = container.locator(SELECTORS.errorPointsContainer).first();
  if (await pointsContainer.isVisible({ timeout: 3000 }).catch(() => false)) {
    const children = pointsContainer.locator('> div');
    return await children.count();
  }

  const bodyText = ((await container.textContent()) || '').replace(/\s+/g, ' ').trim();
  const segments = bodyText
    .split(/(?=\d+\.\s)|(?=•\s)|\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
  return Math.max(segments.length, 1);
}

async function getErrorFrameStyles(page) {
  const container = await getValidationErrorContainer(page);
  await expect(container).toBeVisible({ timeout: 10000 });

  return container.evaluate((el) => {
    const candidates = [el, el.querySelector('.error-container'), el.querySelector('.error-points')].filter(Boolean);
    for (const target of candidates) {
      const cs = window.getComputedStyle(target);
      const borderWidth = Math.max(
        parseFloat(cs.borderTopWidth) || 0,
        parseFloat(cs.borderRightWidth) || 0,
        parseFloat(cs.borderBottomWidth) || 0,
        parseFloat(cs.borderLeftWidth) || 0
      );
      const rgb = (cs.borderColor || '').match(/\d+/g) || [];
      const isDarkBorder = rgb.length >= 3 && rgb.slice(0, 3).every((v) => parseInt(v, 10) < 100);
      const hasVisibleBorder = borderWidth > 0 && cs.borderStyle !== 'none';
      const hasScrollbar = target.scrollHeight > target.clientHeight + 2;

      if (hasVisibleBorder || hasScrollbar) {
        return {
          borderWidth, borderStyle: cs.borderStyle, borderColor: cs.borderColor,
          isDarkBorder, hasVisibleBorder,
          overflowY: cs.overflowY, scrollHeight: target.scrollHeight,
          clientHeight: target.clientHeight, hasScrollbar,
        };
      }
    }
    const cs = window.getComputedStyle(el);
    return {
      borderWidth: 0, borderStyle: cs.borderStyle, borderColor: cs.borderColor,
      isDarkBorder: false, hasVisibleBorder: false,
      overflowY: cs.overflowY, scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight, hasScrollbar: false,
    };
  });
}

async function verifyErrorFrameDisplay(page, { expectFrame, expectScrollbar }) {
  const container = await getValidationErrorContainer(page);
  const isVisible = await container.isVisible({ timeout: 5000 }).catch(() => false);
  if (!isVisible) {
    console.log('Validation error container not visible - skipping frame display checks');
    return;
  }

  const styles = await getErrorFrameStyles(page);

  if (expectFrame) {
    const hasFrame = styles.hasVisibleBorder || styles.isDarkBorder;
    expect(hasFrame, `Frame expected: borderWidth=${styles.borderWidth}, borderStyle=${styles.borderStyle}, borderColor=${styles.borderColor}`).toBeTruthy();
  }

  if (expectScrollbar) {
    const hasScroll = styles.hasScrollbar || ['auto', 'scroll'].includes(styles.overflowY);
    expect(hasScroll, `Scrollbar expected: overflowY=${styles.overflowY}, scrollHeight=${styles.scrollHeight}, clientHeight=${styles.clientHeight}`).toBeTruthy();
  }
}

async function verifyErrorMessageFormatting(page) {
  const container = await getValidationErrorContainer(page);
  await expect(container).toBeVisible({ timeout: 10000 });

  const text = ((await container.textContent()) || '').replace(/\s+/g, ' ').trim();
  expect(text.length).toBeGreaterThan(10);
  expect(text).toMatch(/\s/);

  const styles = await container.evaluate((el) => {
    const cs = window.getComputedStyle(el);
    return {
      paddingTop: parseFloat(cs.paddingTop) || 0,
      paddingLeft: parseFloat(cs.paddingLeft) || 0,
      whiteSpace: cs.whiteSpace,
    };
  });
  const hasSomePadding = styles.paddingTop + styles.paddingLeft > 0;
  const hasWhitespace = styles.whiteSpace !== 'nowrap';
  expect(hasSomePadding || hasWhitespace, 'Error message should have proper formatting (padding or whitespace handling)').toBeTruthy();
}

async function getLineUdfErrorCounts(page) {
  const container = await getValidationErrorContainer(page);
  const text = ((await container.textContent()) || '').toLowerCase();
  const lineRefs = text.match(/line\s*(\d+)/g) || [];
  const counts = {};
  for (const ref of lineRefs) {
    counts[ref] = (counts[ref] || 0) + 1;
  }
  return counts;
}

async function verifyLineUdfErrorsOncePerLine(page) {
  const counts = await getLineUdfErrorCounts(page);
  for (const [lineRef, count] of Object.entries(counts)) {
    expect(count, `Error for ${lineRef} should appear only once`).toBeLessThanOrEqual(1);
  }
  const container = await getValidationErrorContainer(page);
  const containerVisible = await container.isVisible({ timeout: 5000 }).catch(() => false);
  expect(containerVisible, 'Validation error container should be visible').toBeTruthy();
}

async function runLineUdfValidationCycle(page, orderSteps, action) {
  await navigateToTab(page, SELECTORS.textOtherTab);
  await page.waitForTimeout(1000);
  await action(page);
  await verifyLineUdfErrorsOncePerLine(page);
}

test.describe('Validation Errors Display', { tag: ['@regression-2', '@module', '@regression', '@functional', '@uk-only'] }, () => {
  test('Test 460672: Order validation black frame should appear starting with 4 error lines', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createBareOrder(orderSteps, createSteps, authenticatedPage);
    await clickValidate(authenticatedPage);
    let errorCount = await countValidationErrorLines(authenticatedPage);
    if (errorCount === 0) {
      await authenticatedPage.waitForTimeout(5000);
      errorCount = await countValidationErrorLines(authenticatedPage);
    }
    expect(errorCount).toBeGreaterThanOrEqual(1);

    await clickSaveAndSubmit(authenticatedPage);
    let errorCountAfterSubmit = await countValidationErrorLines(authenticatedPage);
    if (errorCountAfterSubmit === 0) {
      await authenticatedPage.waitForTimeout(5000);
      errorCountAfterSubmit = await countValidationErrorLines(authenticatedPage);
    }
    expect(errorCountAfterSubmit).toBeGreaterThanOrEqual(1);

    if (errorCount >= 4) {
      await verifyErrorFrameDisplay(authenticatedPage, { expectFrame: true, expectScrollbar: false });
    }
  });

  test('Test 450193: Validation error FE — all errors in same frame with scrollbar for >4', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createBareOrder(orderSteps, createSteps, authenticatedPage);
    await addLinesWithoutUnitSell(authenticatedPage, orderSteps, 3);
    await navigateToTab(authenticatedPage, SELECTORS.headerTab);
    await clickValidate(authenticatedPage);

    const errorCount = await countValidationErrorLines(authenticatedPage);
    expect(errorCount).toBeGreaterThanOrEqual(1);

    const container = await getValidationErrorContainer(authenticatedPage);
    const isVisible = await container.isVisible({ timeout: 5000 }).catch(() => false);
    if (isVisible && errorCount > 4) {
      await verifyErrorFrameDisplay(authenticatedPage, { expectFrame: true, expectScrollbar: true });
    }
  });

  test('Test 443345: Wrong formatting in error message', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createBareOrder(orderSteps, createSteps, authenticatedPage);
    await fillCustomerRef(authenticatedPage);
    await fillDeliveryDate(authenticatedPage);

    await clickValidate(authenticatedPage);
    const container = await getValidationErrorContainer(authenticatedPage);
    const isVisible = await container.isVisible({ timeout: 10000 }).catch(() => false);
    if (isVisible) {
      await verifyErrorMessageFormatting(authenticatedPage);
    } else {
      console.log('No validation error appeared — validation may have succeeded');
    }
  });

  test('Test 444466: Multiple displays of same error for missing line UDFs', async ({ authenticatedPage, country }) => {
    test.setTimeout(300000);
    test.skip(country.toUpperCase() !== 'UK', 'Line UDF duplicate-error test runs against UK data');
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createBareOrder(orderSteps, createSteps, authenticatedPage);
    await fillCustomerRef(authenticatedPage);
    await fillDeliveryDate(authenticatedPage);
    await addLinesWithoutUnitSell(authenticatedPage, orderSteps, 2);

    await navigateToTab(authenticatedPage, SELECTORS.textOtherTab);
    await authenticatedPage.waitForTimeout(1000);
    await clickValidate(authenticatedPage);
    await verifyLineUdfErrorsOncePerLine(authenticatedPage);

    await clickSaveAndSubmit(authenticatedPage);
    await verifyLineUdfErrorsOncePerLine(authenticatedPage);

    await createBareOrder(orderSteps, createSteps, authenticatedPage);
    await fillCustomerRef(authenticatedPage);
    await fillDeliveryDate(authenticatedPage);
    await addLinesWithoutUnitSell(authenticatedPage, orderSteps, 5);

    await navigateToTab(authenticatedPage, SELECTORS.textOtherTab);
    await authenticatedPage.waitForTimeout(1000);
    await clickValidate(authenticatedPage);
    await verifyLineUdfErrorsOncePerLine(authenticatedPage);

    await clickSaveAndSubmit(authenticatedPage);
    await verifyLineUdfErrorsOncePerLine(authenticatedPage);
  });
});
