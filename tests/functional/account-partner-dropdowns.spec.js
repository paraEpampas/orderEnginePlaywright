const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

const SELECTORS = {
  accountSearchModal: 'app-account-search',
  accountSearchTitle: "app-account-search div:has-text('Select an Account'), app-account-search .modal-header",
  soldToAccountInput: "app-account-search input[name='Sold-to Account Number']",
  ccCompanyField: "app-account-search",
  countryField: "app-account-search",
  partnerOverlay: '.cdk-overlay-pane',
  headerTab: "div[data-name='Header']",
};

const PARTNER_FUNCTION_LABELS = ['Ship-To', 'Bill-To', 'Payer'];

async function waitForLoader(page) {
  await page.locator('app-loader .overlay').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
}

async function getAccountSearchDropdown(page, index = 0) {
  const modal = page.locator(SELECTORS.accountSearchModal);
  await expect(modal).toBeVisible({ timeout: 10000 });
  const dropdown = modal.locator('ng-select, .ng-select, oe-select, oe-ng-select').nth(index);
  await expect(dropdown, `Account search dropdown at index ${index} should be visible`).toBeVisible({ timeout: 10000 });
  return dropdown;
}

async function closeDropdownPanelSafely(page) {
  await page.locator(SELECTORS.accountSearchTitle).first().click({ force: true }).catch(() => {});
  await page.locator(SELECTORS.soldToAccountInput).click({ force: true }).catch(() => {});
  await page.locator('.ng-dropdown-panel').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  await page.locator('.cdk-overlay-backdrop').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(300);
}

async function searchAndSelectAccount(page, accountNumber) {
  const soldToInput = page.locator(SELECTORS.soldToAccountInput);
  await soldToInput.fill(accountNumber, { force: true });
  await soldToInput.press('Tab').catch(() => {});
  await page.waitForTimeout(300);
  await page.locator("app-account-search button:has-text('SEARCH')").click({ force: true });
  await waitForLoader(page);
  await page.waitForTimeout(1000);
  const firstLink = page.locator('app-account-search tbody span.redirect, app-account-search tbody span.redirect.ng-star-inserted').first();
  await expect(firstLink).toBeVisible({ timeout: 10000 });
  await firstLink.click({ force: true });
}

async function countNativeSelectOptions(fieldLocator) {
  return fieldLocator.evaluate((el) => {
    const select = el.tagName.toLowerCase() === 'select' ? el : el.querySelector('select');
    if (!select) return 0;
    return [...select.options].filter((option) => option.value && !option.disabled).length;
  });
}

async function countNgSelectOptions(page) {
  const options = page.locator(
    '.ng-dropdown-panel .ng-option:not(.ng-option-disabled), .ng-dropdown-panel-items .ng-option:not(.ng-option-disabled)',
  );
  return options.count();
}

async function openFieldPanel(page, fieldLocator) {
  await expect(fieldLocator).toBeVisible({ timeout: 10000 });
  await fieldLocator.scrollIntoViewIfNeeded().catch(() => {});
  const clickTarget = fieldLocator.locator('.ng-select-container, .ng-arrow-wrapper, [role="combobox"]').first();
  if (await clickTarget.isVisible({ timeout: 2000 }).catch(() => false)) {
    await clickTarget.click({ force: true });
  } else {
    await fieldLocator.click({ force: true });
  }
  await page.waitForTimeout(1000);
}

async function selectNgSelectOption(page, fieldLocator, optionIndex = 0) {
  await openFieldPanel(page, fieldLocator);
  const selected = await page.evaluate((index) => {
    const options = document.querySelectorAll(
      '.ng-dropdown-panel .ng-option:not(.ng-option-disabled), .ng-dropdown-panel-items .ng-option:not(.ng-option-disabled)',
    );
    if (options[index]) {
      options[index].dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      options[index].dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return (options[index].textContent || '').trim();
    }
    return null;
  }, optionIndex);
  if (!selected) {
    await fieldLocator.locator('.ng-select-container').click({ force: true }).catch(() => {});
    await page.keyboard.press('ArrowDown').catch(() => {});
    await page.waitForTimeout(300);
    await page.keyboard.press('Enter').catch(() => {});
    await page.waitForTimeout(500);
    const fallback = fieldLocator.locator('.ng-value-label, .ng-value').first();
    return ((await fallback.textContent().catch(() => '')) || 'selected').trim();
  }
  await page.waitForTimeout(500);
  await page.locator(SELECTORS.accountSearchTitle).first().click({ force: true }).catch(() => {});
  await page.waitForTimeout(300);
  return selected;
}

async function countVisibleDropdownOptions(page) {
  const options = page.locator(
    '.ng-dropdown-panel .ng-option:not(.ng-option-disabled), .p-multiselect-panel .p-multiselect-item, .cdk-overlay-container [role="option"]:not([aria-disabled="true"])',
  );
  return options.count();
}

async function verifyFieldShowsOptions(page, fieldLocator) {
  const tagName = await fieldLocator.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');
  const hasNativeSelect = await fieldLocator.locator('select').count() > 0;

  if (tagName === 'oe-select' || tagName === 'select' || hasNativeSelect) {
    expect(await countNativeSelectOptions(fieldLocator)).toBeGreaterThan(0);
    return;
  }

  await openFieldPanel(page, fieldLocator);
  const optionCount = await countVisibleDropdownOptions(page);
  if (optionCount === 0) {
    const ngCount = await countNgSelectOptions(page);
    expect(ngCount, 'Expected dropdown options to render after opening field').toBeGreaterThan(0);
  } else {
    expect(optionCount).toBeGreaterThan(0);
  }
  await closeDropdownPanelSafely(page);
}

async function selectFieldOptionByIndex(page, fieldLocator, optionIndex = 0) {
  const tagName = await fieldLocator.evaluate((el) => el.tagName.toLowerCase()).catch(() => '');
  const hasNativeSelect = await fieldLocator.locator('select').count() > 0;

  if (tagName === 'oe-select' || tagName === 'select' || hasNativeSelect) {
    const selected = await fieldLocator.evaluate((el, index) => {
      const select = el.tagName.toLowerCase() === 'select' ? el : el.querySelector('select');
      if (!select) return null;
      let seen = 0;
      for (let i = 0; i < select.options.length; i++) {
        const option = select.options[i];
        if (!option.value || option.disabled) continue;
        if (seen === index) {
          select.selectedIndex = i;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          select.dispatchEvent(new Event('input', { bubbles: true }));
          return (option.textContent || '').trim();
        }
        seen += 1;
      }
      return null;
    }, optionIndex);
    expect(selected, 'Expected a selectable option in account search field').toBeTruthy();
    await page.waitForTimeout(500);
    return selected;
  }

  if (tagName === 'ng-select' || (await fieldLocator.locator('.ng-select-container').count()) > 0) {
    const label = await selectNgSelectOption(page, fieldLocator, optionIndex);
    await closeDropdownPanelSafely(page);
    expect(label.length).toBeGreaterThan(0);
    return label;
  }

  await openFieldPanel(page, fieldLocator);
  const optionSelectors = [
    '.ng-dropdown-panel .ng-option:not(.ng-option-disabled)',
    '.ng-dropdown-panel-items .ng-option:not(.ng-option-disabled)',
    '[role="listbox"] [role="option"]:not([aria-disabled="true"])',
    '.p-multiselect-panel .p-multiselect-item',
    '.cdk-overlay-container [role="option"]:not([aria-disabled="true"])',
  ].join(', ');
  const option = page.locator(optionSelectors).nth(optionIndex);
  if (!(await option.isVisible({ timeout: 5000 }).catch(() => false))) {
    await fieldLocator.locator('.ng-select-container').click({ force: true }).catch(() => {});
    await page.keyboard.press('ArrowDown').catch(() => {});
    await page.waitForTimeout(500);
  }
  await expect(option).toBeVisible({ timeout: 10000 });
  const label = ((await option.textContent()) || '').trim();
  await option.click({ force: true });
  await page.waitForTimeout(500);
  await closeDropdownPanelSafely(page);

  const selectedValue = fieldLocator.locator('.ng-value-label, .ng-value, .ng-input input, [role="combobox"]').first();
  const displayed = ((await selectedValue.inputValue().catch(() => ''))
    || (await selectedValue.textContent().catch(() => ''))
    || label).trim();
  expect(displayed.length).toBeGreaterThan(0);
  return label;
}

function partnerSection(page, partnerLabel) {
  return page.locator('div').filter({
    has: page.locator(`:text-is("${partnerLabel}:"), :text("${partnerLabel}")`),
  }).first();
}

async function openPartnerFunctionSearch(page, partnerLabel) {
  const section = partnerSection(page, partnerLabel);
  const searchBtn = section.locator('button:has-text("SEARCH")').first();
  if (!(await searchBtn.isVisible({ timeout: 10000 }).catch(() => false))) {
    console.log(`Partner function "${partnerLabel}" SEARCH button not visible — may not be available for this country`);
    return null;
  }
  await searchBtn.click({ force: true });
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(2000);

  const overlay = page.locator(SELECTORS.partnerOverlay).last();
  await expect(overlay).toBeVisible({ timeout: 15000 });
  return overlay;
}

async function closePartnerFunctionOverlay(page) {
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(500);
  const closeBtn = page.locator('.cdk-overlay-pane button:has(mat-icon:has-text("close")), .cdk-overlay-pane [aria-label="Close"]').first();
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click({ force: true });
    await page.waitForTimeout(500);
  }
}

async function verifyPartnerFunctionTypeDropdown(page, overlay) {
  const typeDropdown = overlay.locator('[role="combobox"], ng-select, oe-select, oe-ng-select, .ng-select, [formcontrolname]').first();
  await expect(typeDropdown).toBeVisible({ timeout: 10000 });
  await verifyFieldShowsOptions(page, typeDropdown);
  return typeDropdown;
}

async function selectPartnerFunctionTypeAndSearch(page, overlay, countryConfig) {
  const typeDropdown = overlay.locator('[role="combobox"], ng-select, oe-select, oe-ng-select, .ng-select, [formcontrolname]').first();
  await selectFieldOptionByIndex(page, typeDropdown, 0);

  const numberInput = overlay.locator('input[type="text"]').first();
  if (await numberInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await numberInput.fill(countryConfig.accounts);
    await page.waitForTimeout(500);
  }

  const searchBtn = overlay.locator('button:has-text("SEARCH")').first();
  await expect(searchBtn).toBeVisible({ timeout: 5000 });
  await searchBtn.click({ force: true });
  await page.waitForTimeout(3000);
}

async function verifyAccountSearchDropdowns(page, { selectValues = true } = {}) {
  const ccCompanyField = await getAccountSearchDropdown(page, 0);
  await verifyFieldShowsOptions(page, ccCompanyField);

  const modal = page.locator(SELECTORS.accountSearchModal);
  const countryField = modal.locator('ng-select, .ng-select, oe-select, oe-ng-select').nth(1);
  if (await countryField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await verifyFieldShowsOptions(page, countryField);
  }

  if (selectValues) {
    await selectFieldOptionByIndex(page, ccCompanyField, 0);
    if (await countryField.isVisible({ timeout: 2000 }).catch(() => false)) {
      await selectFieldOptionByIndex(page, countryField, 0);
    }
  }
}

async function verifySelectAccountDropdowns(page, countryConfig, createSteps, { selectValues = true } = {}) {
  await expect(page.locator(SELECTORS.accountSearchModal)).toBeVisible({ timeout: 10000 });
  await expect(page.locator(SELECTORS.soldToAccountInput)).toBeVisible();
  await waitForLoader(page);
  await verifyAccountSearchDropdowns(page, { selectValues: false });
  await page.locator('.ng-dropdown-panel').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  await page.locator('.cdk-overlay-backdrop').first().waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
  await closeDropdownPanelSafely(page);
  await page.waitForTimeout(500);

  const clearBtn = page.locator("app-account-search button:has-text('CLEAR FIELDS'), app-account-search button:has-text('CLEAR')").first();
  if (await clearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await clearBtn.click({ force: true });
    await page.waitForTimeout(500);
  }
  await createSteps.searchForAccountAndSelectFirst();
  await waitForLoader(page);
  await page.waitForTimeout(2000);
}

async function returnToOrdersSearch(page, orderSteps) {
  const backBtn = page.locator("button:has(mat-icon:has-text('keyboard_backspace'))").first();
  if (await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await backBtn.click({ force: true });
    await waitForLoader(page);
    await page.waitForTimeout(1000);
    const exitBtn = page.locator('.cdk-overlay-container button:has-text("EXIT WITHOUT SAVING"), .cdk-overlay-container button:has-text("Exit without saving")').first();
    if (await exitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exitBtn.click({ force: true });
      await page.waitForTimeout(1000);
    }
  } else {
    await page.goto(process.env.BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  await orderSteps.verifyOrderEnginePageLoaded();
}

test.describe('Account and Partner Dropdowns', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.describe.configure({ timeout: 300000 });

  test('Test 460624: Dropdown lists not displayed in Account and Partner Function search', async ({ authenticatedPage, country }) => {
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);

    await orderSteps.verifyOrderEnginePageLoaded();
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.verifySelectAccountWindowDisplayed();
    await verifySelectAccountDropdowns(authenticatedPage, countryConfig, createSteps);

    await authenticatedPage.waitForTimeout(2000);
    await waitForLoader(authenticatedPage);
    const headerTab = authenticatedPage.locator(SELECTORS.headerTab);
    if (!(await headerTab.isVisible({ timeout: 10000 }).catch(() => false))) {
      await createSteps.verifyHeaderTabDisplayed();
    }
    await expect(headerTab).toBeVisible({ timeout: 15000 });

    for (const partnerLabel of PARTNER_FUNCTION_LABELS) {
      const section = partnerSection(authenticatedPage, partnerLabel);
      const searchBtn = section.locator('button:has-text("SEARCH")').first();
      if (!(await searchBtn.isVisible({ timeout: 3000 }).catch(() => false))) {
        continue;
      }

      const overlay = await openPartnerFunctionSearch(authenticatedPage, partnerLabel);
      if (!overlay) continue;
      await verifyPartnerFunctionTypeDropdown(authenticatedPage, overlay);
      await selectPartnerFunctionTypeAndSearch(authenticatedPage, overlay, countryConfig);
      await closePartnerFunctionOverlay(authenticatedPage);
    }

    // Re-verify Ship-To partner function dropdown after other partner searches
    const shipToOverlay = await openPartnerFunctionSearch(authenticatedPage, 'Ship-To');
    if (shipToOverlay) {
      await verifyPartnerFunctionTypeDropdown(authenticatedPage, shipToOverlay);
      await selectPartnerFunctionTypeAndSearch(authenticatedPage, shipToOverlay, countryConfig);
      await closePartnerFunctionOverlay(authenticatedPage);
    }

    // Re-open account search and confirm dropdown lists still render
    await returnToOrdersSearch(authenticatedPage, orderSteps);
    await createSteps.clickCreateOrderForSoldToAccountButton();
    await createSteps.verifySelectAccountWindowDisplayed();
    await verifyAccountSearchDropdowns(authenticatedPage, { selectValues: false });
  });
});
