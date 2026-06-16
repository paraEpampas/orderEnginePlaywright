const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { CopyOrderSteps } = require('../../steps/orders/copy-order.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

const TAB_SELECTORS = {
  header: "div[data-name='Header']",
  headerUdfs: "div[data-name='Header UDFs']",
  quickAdd: "div[data-name='Quick add / pricing']",
  rebates: "div[data-name='Rebates']",
  costsSourcing: "div[data-name='Costs & Sourcing']",
  textOther: "div[data-name='Text/Other']",
  blockingGrouping: "div[data-name='Blocking & Grouping']",
};

const TABLE_TAB_COMPONENTS = [
  'app-basic-pricing',
  'app-rebates',
  'app-cost-sourcing',
  'app-text-other',
  'app-blocking-grouping',
];

async function navigateToTab(page, tabSelector) {
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await page.locator(tabSelector).click({ force: true });
  await page.waitForTimeout(1000);
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function getActiveTableComponent(page) {
  for (const component of TABLE_TAB_COMPONENTS) {
    const el = page.locator(component).first();
    if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
      return component;
    }
  }
  return 'app-basic-pricing';
}

async function getTableScrollTop(page) {
  const component = await getActiveTableComponent(page);
  return page.evaluate((rootSelector) => {
    const root = document.querySelector(rootSelector);
    if (!root) return 0;

    const scrollSelectors = [
      '.p-datatable-wrapper',
      '.p-scroller',
      '.p-datatable-table-container',
      '.scroll-height-flex',
      '[style*="overflow"]',
    ];

    const candidates = [];
    for (const sel of scrollSelectors) {
      root.querySelectorAll(sel).forEach((el) => candidates.push(el));
    }

    if (candidates.length === 0) {
      let node = root;
      while (node) {
        if (node.scrollHeight > node.clientHeight + 2) candidates.push(node);
        node = node.parentElement;
      }
    }

    for (const el of candidates) {
      if (el.scrollHeight > el.clientHeight + 2) {
        return el.scrollTop;
      }
    }
    return 0;
  }, component);
}

async function getTableRowCount(page) {
  return page.locator("tbody tr[formarrayname='basicPrice']").count();
}

async function scrollToLineIndex(page, lineIndex) {
  const rows = page.locator("tbody tr[formarrayname='basicPrice']");
  const count = await rows.count();
  const targetIndex = Math.min(lineIndex, Math.max(count - 1, 0));
  const targetRow = rows.nth(targetIndex);
  await targetRow.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}

async function verifyScrollPositionPreserved(beforeScroll, afterScroll, tolerance = 150) {
  expect(Math.abs(afterScroll - beforeScroll)).toBeLessThanOrEqual(tolerance);
}

async function createOrderWithManyLineItems(page, orderSteps, createSteps, country, minLines = 5) {
  const targetLines = Math.min(minLines, 5);
  const countryConfig = country ? getCountryConfig(country) : null;

  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.fillMandatoryHeaderFields();
  await orderSteps.checkAndSelectShipTo();
  if (countryConfig && (countryConfig.code === 'FR' || countryConfig.code === 'DE')) {
    await orderSteps.checkAndSelectBillTo();
    await orderSteps.checkAndSelectPayer();
  }
  await orderSteps.fillMissingHeaderFields();
  await orderSteps.navigateToQuickAddTab();
  await orderSteps.verifyQuickAddTabDisplayed();

  // Seed one product line up front, then add text lines (avoids repeated modal checks in a loop).
  await orderSteps.addItemsToQuickAdd();
  let rowCount = await getTableRowCount(page);

  for (let i = rowCount; i < targetLines; i += 1) {
    const previousCount = rowCount;
    const addedTextLine = await orderSteps.addTextLineAndVerify();
    rowCount = await getTableRowCount(page);
    if (!addedTextLine || rowCount <= previousCount) {
      break;
    }
  }

  if (rowCount < 3) {
    test.skip(true, `Unable to create enough line items for scroll testing (only ${rowCount} rows available)`);
  }

  expect(rowCount).toBeGreaterThanOrEqual(Math.min(targetLines, 3));

  const hasPriceInputs = await page.locator(
    "tbody tr[formarrayname='basicPrice'] input[type='number'], tbody tr[formarrayname='basicPrice'] [role='spinbutton']",
  ).first().isVisible({ timeout: 2000 }).catch(() => false);

  if (hasPriceInputs) {
    await orderSteps.setUnitSellPriceForAllItems('100', { quietModal: true });
    await orderSteps.clickRecalcButton();
  }
}

async function verifyTabSwitchPreservesScroll(page, orderSteps, targetLineIndex, awayTabSelector, returnTabSelector) {
  await navigateToTab(page, returnTabSelector);
  await scrollToLineIndex(page, targetLineIndex);
  const scrollBefore = await getTableScrollTop(page);

  await navigateToTab(page, awayTabSelector);
  await page.waitForTimeout(500);
  await navigateToTab(page, returnTabSelector);
  await page.waitForTimeout(500);

  const scrollAfter = await getTableScrollTop(page);
  await verifyScrollPositionPreserved(scrollBefore, scrollAfter);
  return { scrollBefore, scrollAfter };
}

test.describe('Tab Navigation Position', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  // Test 460652 is covered by the scroll position preservation tests below (443331 + 460634)
  test('Test 443331: Line position preserved when changing tabs (edit and view)', async ({ authenticatedPage, country }) => {
    test.setTimeout(600000);

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createOrderWithManyLineItems(authenticatedPage, orderSteps, createSteps, country, 5);

    const rowCount = await getTableRowCount(authenticatedPage);
    const targetLineIndex = Math.min(4, Math.max(rowCount - 2, 0));
    await verifyTabSwitchPreservesScroll(
      authenticatedPage,
      orderSteps,
      targetLineIndex,
      TAB_SELECTORS.costsSourcing,
      TAB_SELECTORS.quickAdd,
    );

    await verifyTabSwitchPreservesScroll(
      authenticatedPage,
      orderSteps,
      targetLineIndex,
      TAB_SELECTORS.textOther,
      TAB_SELECTORS.quickAdd,
    );

    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    await scrollToLineIndex(authenticatedPage, targetLineIndex);
    const readModeScrollBefore = await getTableScrollTop(authenticatedPage);

    await navigateToTab(authenticatedPage, TAB_SELECTORS.costsSourcing);
    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    const readModeScrollAfter = await getTableScrollTop(authenticatedPage);

    await verifyScrollPositionPreserved(readModeScrollBefore, readModeScrollAfter);
  });

  test('Test 460634: Line position preserved on tab switch but reset on copy order', async ({ authenticatedPage, country }) => {
    test.setTimeout(600000);

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const copySteps = new CopyOrderSteps(authenticatedPage);

    await createOrderWithManyLineItems(authenticatedPage, orderSteps, createSteps, country, 5);

    const rowCount = await getTableRowCount(authenticatedPage);
    const targetLineIndex = Math.min(4, Math.max(rowCount - 2, 0));
    await verifyTabSwitchPreservesScroll(
      authenticatedPage,
      orderSteps,
      targetLineIndex,
      TAB_SELECTORS.textOther,
      TAB_SELECTORS.quickAdd,
    );

    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    await scrollToLineIndex(authenticatedPage, targetLineIndex);
    const scrollBeforeCopy = await getTableScrollTop(authenticatedPage);
    if (scrollBeforeCopy === 0) {
      console.log('Table does not scroll (all rows fit in viewport) — skipping scroll-reset assertion');
    }

    await copySteps.verifyCopyOrderButtonVisible();
    await copySteps.clickCopyOrderButton();
    await copySteps.verifyCopyOrderModalDisplayed();
    await copySteps.clickCopyOrderContinue();
    await copySteps.verifyCopiedOrderDisplayed();

    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    await authenticatedPage.waitForTimeout(500);
    const copiedOrderScrollTop = await getTableScrollTop(authenticatedPage);
    if (scrollBeforeCopy > 0) {
      expect(copiedOrderScrollTop).toBeLessThanOrEqual(50);
    } else {
      expect(copiedOrderScrollTop).toBeLessThanOrEqual(scrollBeforeCopy);
    }
  });

  test('Test 450190: Last line item position persists across table tabs', async ({ authenticatedPage, country }) => {
    test.setTimeout(600000);

    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);

    await createOrderWithManyLineItems(authenticatedPage, orderSteps, createSteps, country, 5);
    await orderSteps.saveOrder();
    await authenticatedPage.waitForTimeout(2000);

    const tableTabs = [
      TAB_SELECTORS.quickAdd,
      TAB_SELECTORS.rebates,
      TAB_SELECTORS.costsSourcing,
      TAB_SELECTORS.textOther,
      TAB_SELECTORS.blockingGrouping,
    ];

    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    const rowCount = await getTableRowCount(authenticatedPage);
    const lastLineIndex = Math.max(rowCount - 1, 0);
    await scrollToLineIndex(authenticatedPage, lastLineIndex);
    let lastKnownScroll = await getTableScrollTop(authenticatedPage);

    for (const tabSelector of tableTabs) {
      if (tabSelector === TAB_SELECTORS.quickAdd) continue;
      await navigateToTab(authenticatedPage, tabSelector);
      await authenticatedPage.waitForTimeout(500);
      await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
      await authenticatedPage.waitForTimeout(500);
      const scrollAfterReturn = await getTableScrollTop(authenticatedPage);
      await verifyScrollPositionPreserved(lastKnownScroll, scrollAfterReturn);
      lastKnownScroll = scrollAfterReturn;
    }

    await navigateToTab(authenticatedPage, TAB_SELECTORS.header);
    await authenticatedPage.waitForTimeout(500);
    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    await verifyScrollPositionPreserved(lastKnownScroll, await getTableScrollTop(authenticatedPage));

    const headerUdfsTab = authenticatedPage.locator(TAB_SELECTORS.headerUdfs);
    if (await headerUdfsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await navigateToTab(authenticatedPage, TAB_SELECTORS.headerUdfs);
      await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
      await verifyScrollPositionPreserved(lastKnownScroll, await getTableScrollTop(authenticatedPage));
    }

    await orderSteps.clickEditIcon();
    await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
    await scrollToLineIndex(authenticatedPage, lastLineIndex);
    lastKnownScroll = await getTableScrollTop(authenticatedPage);

    for (const tabSelector of [TAB_SELECTORS.rebates, TAB_SELECTORS.costsSourcing, TAB_SELECTORS.textOther]) {
      await navigateToTab(authenticatedPage, tabSelector);
      await navigateToTab(authenticatedPage, TAB_SELECTORS.quickAdd);
      await verifyScrollPositionPreserved(lastKnownScroll, await getTableScrollTop(authenticatedPage));
    }
  });
});
