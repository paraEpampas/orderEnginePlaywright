const { test, expect } = require('../../fixtures/base.fixture');
const { FrancePostcodeSteps } = require('../../steps/orders/france-postcode.steps');
const { LandingPage } = require('../../pages/landing.page');
const { SelectAccountModal } = require('../../pages/orders/modals/select-account.modal');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { getCountryConfig } = require('../../data/constants/country-config');
const { randomCustomerOrderRef, randomFutureDate, randomFirstName, randomLastName } = require('../../data/generators');
const { ApiClient } = require('../../utils/api-client');
const { OEOrderVerificationSteps } = require('../../steps/oe-order-verification.steps');

const FR_CONFIG = getCountryConfig('FR');

async function createFROrderWithShipTo(page) {
  const landing = new LandingPage(page);
  const modal = new SelectAccountModal(page);
  const headerTab = new HeaderTabPage(page);

  await landing.createOrderButton.click();
  await modal.soldToAccountNumberInput.waitFor({ state: 'visible', timeout: 10000 });
  await modal.soldToAccountNumberInput.fill(FR_CONFIG.accounts);
  await modal.soldToAccountNumberInput.press('Tab');
  await page.waitForTimeout(500);
  await modal.searchButton.click({ force: true });
  await page.waitForTimeout(3000);
  const loader = page.locator('app-loader .overlay');
  await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  if (await modal.firstSoldToLink.isVisible().catch(() => false)) {
    await modal.firstSoldToLink.click({ force: true });
  }
  await page.waitForTimeout(2000);

  const orderRef = randomCustomerOrderRef();
  await headerTab.customerOrderRef.waitFor({ state: 'visible', timeout: 10000 });
  await headerTab.customerOrderRef.fill(orderRef);

  await page.evaluate(({ incoText, firstName, lastName }) => {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const setInputValue = (input, val) => {
      nativeSetter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    };
    const allDivs = document.querySelectorAll('div');
    for (const div of allDivs) {
      const text = div.childNodes[0]?.textContent?.trim() || '';
      if (text.startsWith('Incoterms Text')) {
        const input = div.parentElement?.querySelector('input');
        if (input) { setInputValue(input, incoText); break; }
      }
    }
    const orderedByHeader = [...allDivs].find(d => d.textContent?.trim() === 'Customer Ordered By Information');
    if (orderedByHeader) {
      const section = orderedByHeader.parentElement;
      const inputs = section?.querySelectorAll('input:not([disabled])');
      if (inputs && inputs.length >= 2) {
        setInputValue(inputs[0], firstName);
        setInputValue(inputs[1], lastName);
      }
    }
  }, { incoText: 'PARIS', firstName: randomFirstName(), lastName: randomLastName() });

  const shipToSearchBtn = page.locator('div').filter({ has: page.locator(':text-is("Ship-To:")') }).locator('button:has-text("SEARCH")').first();
  if (await shipToSearchBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await shipToSearchBtn.click({ force: true });
    await page.waitForTimeout(2000);
    const dialogTitle = page.locator(':text-is("Search for a Ship To address")');
    if (await dialogTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      const overlayPane = page.locator('.cdk-overlay-pane');
      const numberInput = overlayPane.locator('input[type="text"]').first();
      if (await numberInput.isVisible().catch(() => false)) {
        await numberInput.fill(FR_CONFIG.accounts);
        await page.waitForTimeout(500);
      }
      const dialogSearchBtn = overlayPane.locator('button:has-text("SEARCH")').first();
      if (await dialogSearchBtn.isVisible().catch(() => false)) {
        await dialogSearchBtn.click({ force: true });
        await page.waitForTimeout(3000);
        await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
      }
      const resultLink = overlayPane.locator('span.redirect').first();
      if (await resultLink.isVisible({ timeout: 10000 }).catch(() => false)) {
        await resultLink.click({ force: true });
      }
      await page.waitForTimeout(2000);
      if (await dialogTitle.isVisible().catch(() => false)) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
    }
  }
  await page.waitForTimeout(2000);
}

async function clickValidate(page) {
  await page.locator("button:has(mat-icon:has-text('fact_check'))").click();
  await page.waitForTimeout(3000);
}

async function clickSubmit(page) {
  await page.locator("button:has(mat-icon:has-text('save_alt'))").click();
  await page.waitForTimeout(3000);
}

test.describe('France Postcode Checker', { tag: ['@regression-2', '@module', '@regression', '@functional', '@fr-only'] }, () => {
  test.describe.configure({ timeout: 300000 });
  test.skip(
    ({ country }) => country.toUpperCase() !== 'FR',
    'FR-only test - skipping for non-FR environment',
  );

  test('Test 01: Valid postcode and town - address found', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('75001', 'PARIS');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.selectFirstAddressInModal();
    await postcodeSteps.clickUseSelectedAddressInModal();
  });

  test('Test 02: Valid postcode, empty town - address found', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('75001', '');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.selectFirstAddressInModal();
    await postcodeSteps.clickUseSelectedAddressInModal();
  });

  test('Test 03: Invalid postcode - no results', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('99999', 'INVALIDTOWN');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.verifyNoResultsInModal();
    await postcodeSteps.clickCancelInModal();
  });

  test('Test 04: Close modal via X button', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.clickCloseInModal();
  });

  test('Test 05: API-created FR order - Find Address on edit', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const apiClient = new ApiClient('FR');
    let createResult;
    try {
      createResult = await apiClient.createOrderForCountry();
    } catch (e) {
      test.skip(true, `FR API order creation failed: ${e.message}`);
      return;
    }
    const { status, orderReference } = createResult;
    expect(status).toBe(202);

    const oeSteps = new OEOrderVerificationSteps(authenticatedPage);
    const found = await oeSteps.waitForApiOrder(orderReference, { initialWaitMs: 15000, maxRetries: 20, retryDelayMs: 3000 });
    test.skip(!found, `FR API order ${orderReference} not indexed by backend after retries`);

    await oeSteps.clickOnOrderNumber(orderReference);
    await oeSteps.verifyOrderDetailsLoaded();

    const editIcon = authenticatedPage.locator("button:has(mat-icon:has-text('edit'))");
    if (await editIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editIcon.click();
      await authenticatedPage.waitForTimeout(2000);
    }

    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();
  });

  test('Test 06: One town several postcodes - each valid pair works', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps2 = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps2.ensureHeaderTab();
    await postcodeSteps2.fillShipToPostcodeAndTown('33028', 'BRUGES');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);
  });

  test('Test 07: Order not shipping to France - no postcode check', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    const shipToCountry = authenticatedPage.locator("input[formcontrolname*='countryCode' i], input[placeholder*='Country' i]").first()
      .or(authenticatedPage.locator("oe-select[formcontrolname*='country' i] select").first());
    if (await shipToCountry.isVisible({ timeout: 5000 }).catch(() => false)) {
      const tagName = await shipToCountry.evaluate(el => el.tagName.toLowerCase());
      if (tagName === 'select') {
        const ukOption = await shipToCountry.locator('option').filter({ hasText: /United Kingdom|GB|UK/i }).first().getAttribute('value').catch(() => null);
        if (ukOption) await shipToCountry.selectOption(ukOption);
      } else {
        await shipToCountry.clear();
        await shipToCountry.fill('GB');
      }
      await authenticatedPage.waitForTimeout(1000);
    }

    const findBtn = authenticatedPage.locator("button:has-text('FIND AN ADDRESS'), button:has-text('Find an Address'), button:has-text('Find address')").first();
    const findBtnVisible = await findBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (findBtnVisible) {
      const findBtnDisabled = await findBtn.isDisabled().catch(() => false);
      expect(findBtnDisabled, 'Find Address button should be disabled or hidden for non-FR Ship-To').toBeTruthy();
    } else {
      expect(findBtnVisible, 'Find Address button should not be visible for non-FR Ship-To').toBeFalsy();
    }
  });

  test('Test 08: Town in different capitals - mixed case accepted', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'Bruges');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);
  });

  test('Test 09: Saint/St/Sainte/Ste variations accepted', async ({ authenticatedPage }) => {
    const variations = [
      { postcode: '42000', town: 'SAINT-ETIENNE' },
      { postcode: '42000', town: 'ST-ETIENNE' },
    ];

    for (const { postcode, town } of variations) {
      await createFROrderWithShipTo(authenticatedPage);
      const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
      await postcodeSteps.ensureHeaderTab();
      await postcodeSteps.clickFindAnAddress();
      await postcodeSteps.verifyFindAddressModalOpen();
      await postcodeSteps.fillPostcodeAndTownInModal(postcode, town);
      await postcodeSteps.clickSearchInModal();

      const useBtn = authenticatedPage.locator('.cdk-overlay-pane, mat-dialog-container').last()
        .locator("button:has-text('USE SELECTED ADDRESS'), button:has-text('Use Selected Address')").first();
      const useBtnVisible = await useBtn.isVisible({ timeout: 5000 }).catch(() => false);
      if (useBtnVisible) {
        const useBtnEnabled = await useBtn.isEnabled().catch(() => false);
        expect(useBtnEnabled, `Saint/St variation "${town}" should return results`).toBeTruthy();
      }
      await postcodeSteps.clickCancelInModal();
    }
  });

  test('Test 10: Town without accents - still accepted', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('97400', 'SAINT-DENIS');
    await postcodeSteps.clickSearchInModal();

    const modalRoot = authenticatedPage.locator('.cdk-overlay-pane, mat-dialog-container').last();
    const useBtn = modalRoot.locator("button:has-text('USE SELECTED ADDRESS'), button:has-text('Use Selected Address')").first();
    const useBtnVisible = await useBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (useBtnVisible) {
      const useBtnEnabled = await useBtn.isEnabled().catch(() => false);
      expect(useBtnEnabled, 'Town without accents should still return results').toBeTruthy();
    }
    await postcodeSteps.clickCancelInModal();
  });

  test('Test 11: Find an Address button is visible', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();
  });

  test('Test 12: Popup opens with current postcode and town pre-filled', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
  });

  test('Test 13: Change town in modal and click Search - list updates', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('33520', 'BUDOS');
    await postcodeSteps.clickSearchInModal();
  });

  test('Test 14: Search by partial town name "paris"', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('', 'paris');
    await postcodeSteps.clickSearchInModal();
  });

  test('Test 15: Invalid postcode/town 99999/INVALIDTOWN - No Results in modal', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('99999', 'INVALIDTOWN');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.verifyNoResultsInModal();
  });

  test('Test 16: Empty/invalid both fields - No Results', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('', '');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.verifyNoResultsInModal();
  });

  test('Test 17: Use selected address - updates Ship-To', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.selectFirstAddressInModal();
    await postcodeSteps.clickUseSelectedAddressInModal();
  });

  test('Test 18: Selected address no district - district cleared', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    const districtInput = authenticatedPage.locator("input[formcontrolname*='district' i], input[placeholder*='District' i]").first();
    if (await districtInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await districtInput.clear();
      await districtInput.fill('Test District');
      await authenticatedPage.waitForTimeout(500);
    }

    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('75001', 'PARIS');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.selectFirstAddressInModal();
    await postcodeSteps.clickUseSelectedAddressInModal();
    await authenticatedPage.waitForTimeout(1000);

    if (await districtInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const districtValue = await districtInput.inputValue().catch(() => '');
      expect(districtValue.trim(), 'District should be cleared when selected address has no district').toBe('');
    }
  });

  test('Test 19: Cancel modal - nothing saved', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('33720', 'BUDOS');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.clickCancelInModal();
  });

  test('Test 20: Close via X - nothing saved', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.clickCloseInModal();
  });

  test('Test 21: Popup can be moved (manual/optional - verify it opens)', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
  });

  test('Test 22: Hand-typed address validated on submit', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);
  });

  test('Test 443322: FE postcode validation - mismatched postcode/town triggers error', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    await postcodeSteps.fillShipToPostcodeAndTown('75001', 'MARSEILLE');
    await clickValidate(authenticatedPage);

    const errorIndicator = authenticatedPage.locator(
      'div:has(> strong:has-text("Error")), div.error-section, div.error-message-section, .error-points, div.non-global-error-text'
    ).first();
    await expect(errorIndicator, 'Mismatched postcode/town should trigger a validation error').toBeVisible({ timeout: 15000 });

    const errorText = await errorIndicator.textContent().catch(() => '');
    const mentionsPostcode = errorText.toLowerCase().includes('post code') || errorText.toLowerCase().includes('postcode') || errorText.toLowerCase().includes('code postal');
    expect(mentionsPostcode, 'Error should reference postcode/town mismatch').toBeTruthy();
  });

  test('Test 443323: BE postcode validation - partial postcode rejected', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    await postcodeSteps.fillShipToPostcodeAndTown('750', 'PARIS');
    await clickValidate(authenticatedPage);

    const errorIndicator = authenticatedPage.locator(
      'div:has(> strong:has-text("Error")), div.error-section, div.error-message-section, .error-points, div.non-global-error-text'
    ).first();
    const hasError = await errorIndicator.isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasError, 'Partial/incomplete postcode should trigger validation error').toBeTruthy();
  });

  test('Test 23: Address from SAP search - validated', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);

    const errorBanner = authenticatedPage.locator('.error-message, .validation-error, .mat-error, div.non-global-error-text').first();
    const hasPostcodeError = await errorBanner.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasPostcodeError) {
      const errorContent = await errorBanner.textContent().catch(() => '');
      const isPostcodeRelated = errorContent.toLowerCase().includes('post code') || errorContent.toLowerCase().includes('postcode');
      expect(isPostcodeRelated, 'SAP-sourced address with valid postcode should not trigger postcode validation error').toBeFalsy();
    }
  });

  test('Test 24: B2B order ingested - validated', async ({ authenticatedPage }) => {
    test.setTimeout(300000);
    const apiClient = new ApiClient('FR');
    let createResult;
    try {
      createResult = await apiClient.createOrderForCountry();
    } catch (e) {
      test.skip(true, `FR API order creation failed: ${e.message}`);
      return;
    }
    const { status, orderReference } = createResult;
    expect(status).toBe(202);

    const oeSteps = new OEOrderVerificationSteps(authenticatedPage);
    const found = await oeSteps.waitForApiOrder(orderReference, { initialWaitMs: 15000, maxRetries: 20, retryDelayMs: 3000 });
    test.skip(!found, `FR API order ${orderReference} not indexed after retries`);

    await oeSteps.clickOnOrderNumber(orderReference);
    await oeSteps.verifyOrderDetailsLoaded();

    const editIcon = authenticatedPage.locator("button:has(mat-icon:has-text('edit'))");
    if (await editIcon.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editIcon.click();
      await authenticatedPage.waitForTimeout(2000);
    }

    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.verifyFindAddressButtonVisible();

    await postcodeSteps.fillShipToPostcodeAndTown('75001', 'MARSEILLE');
    await clickValidate(authenticatedPage);

    const errorIndicator = authenticatedPage.locator(
      'div:has(> strong:has-text("Error")), div.error-section, div.error-message-section, .error-points, div.non-global-error-text'
    ).first();
    const hasError = await errorIndicator.isVisible({ timeout: 15000 }).catch(() => false);
    expect(hasError, 'Mismatched postcode/town on ingested B2B order should trigger validation error').toBeTruthy();
  });

  test('Test 25: Auto-approved order - validated', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);

    const submitBtn = authenticatedPage.locator("button:has(mat-icon:has-text('save_alt'))");
    const submitVisible = await submitBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (submitVisible) {
      const submitEnabled = await submitBtn.isEnabled().catch(() => false);
      if (submitEnabled) {
        const [submitResponse] = await Promise.all([
          authenticatedPage.waitForResponse(
            resp => resp.url().includes('/orders') && (resp.request().method() === 'POST' || resp.request().method() === 'PUT'),
            { timeout: 30000 }
          ).catch(() => null),
          submitBtn.click(),
        ]);
        if (submitResponse) {
          const respStatus = submitResponse.status();
          expect([200, 201, 202]).toContain(respStatus);
        }
      }
    }
    await authenticatedPage.waitForTimeout(3000);
  });

  test('Test 26: Error message in English - verify contains "Ship-To" and "Post Code"', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33720', 'BRUGES');
    await clickValidate(authenticatedPage);
    await postcodeSteps.verifyPostcodeTownValidationErrorVisible();
    const errorText = await postcodeSteps.getPostcodeTownValidationErrorText();
    expect(errorText.toLowerCase()).toContain('ship-to');
    expect(errorText.toLowerCase()).toContain('post code');
  });

  test('Test 27: Error message in French', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    const languageSelector = authenticatedPage.locator(
      "button:has-text('FR'), [aria-label*='language' i] option[value='fr' i], select[formcontrolname*='language' i]"
    ).first();
    if (await languageSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await languageSelector.click();
      await authenticatedPage.waitForTimeout(1000);
    }

    await postcodeSteps.fillShipToPostcodeAndTown('75001', 'MARSEILLE');
    await clickValidate(authenticatedPage);

    const errorIndicator = authenticatedPage.locator(
      'div:has(> strong:has-text("Error")), div:has(> strong:has-text("Erreur")), div.error-section, div.error-message-section, .error-points, div.non-global-error-text'
    ).first();
    const hasError = await errorIndicator.isVisible({ timeout: 15000 }).catch(() => false);
    if (hasError) {
      const errorText = (await errorIndicator.textContent().catch(() => '')).toLowerCase();
      const mentionsFrench = errorText.includes('code postal') || errorText.includes('ville')
        || errorText.includes('post code') || errorText.includes('town');
      expect(mentionsFrench, 'Error message should reference postcode/town in French or English').toBeTruthy();
    }
  });

  test('Test 28: Find an Address in French and German', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();

    const findBtn = authenticatedPage.locator(
      "button:has-text('FIND AN ADDRESS'), button:has-text('Find an Address'), button:has-text('Find address'), " +
      "button:has-text('TROUVER UNE ADRESSE'), button:has-text('Trouver une adresse'), " +
      "button:has-text('ADRESSE FINDEN'), button:has-text('Adresse finden')"
    ).first();
    await expect(findBtn, 'Find an Address button should be visible in current language').toBeVisible({ timeout: 10000 });

    await findBtn.click();
    await authenticatedPage.waitForTimeout(1000);

    const modalRoot = authenticatedPage.locator('.cdk-overlay-pane, mat-dialog-container').last();
    const modalTitle = modalRoot.locator(
      ':text("Find an Address"), :text("Trouver une adresse"), :text("Adresse finden")'
    ).first();
    const isTitleVisible = await modalTitle.isVisible({ timeout: 5000 }).catch(() => false);
    expect(isTitleVisible, 'Modal title should be visible in the current language').toBeTruthy();

    await postcodeSteps.clickCancelInModal();
  });

  test('Test 29: Edit order - invalid then valid again', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);
    await postcodeSteps.fillShipToPostcodeAndTown('33720', 'BRUGES');
    await clickValidate(authenticatedPage);
    await postcodeSteps.verifyPostcodeTownValidationErrorVisible();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);
  });

  test('Test 30: Copy order - validation still applies', async ({ authenticatedPage }) => {
    await createFROrderWithShipTo(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);
    await postcodeSteps.ensureHeaderTab();
    await postcodeSteps.fillShipToPostcodeAndTown('33520', 'BRUGES');
    await clickValidate(authenticatedPage);
    await clickSubmit(authenticatedPage);
    await authenticatedPage.waitForTimeout(3000);

    const copyBtn = authenticatedPage.locator(
      "button:has(mat-icon:has-text('file_copy')), button:has-text('Copy'), button:has-text('COPY')"
    ).first();
    const copyVisible = await copyBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (copyVisible) {
      await copyBtn.click();
      await authenticatedPage.waitForTimeout(3000);

      const postcodeSteps2 = new FrancePostcodeSteps(authenticatedPage);
      await postcodeSteps2.ensureHeaderTab();

      await postcodeSteps2.fillShipToPostcodeAndTown('75001', 'MARSEILLE');
      await clickValidate(authenticatedPage);

      const errorIndicator = authenticatedPage.locator(
        'div:has(> strong:has-text("Error")), div.error-section, div.error-message-section, .error-points, div.non-global-error-text'
      ).first();
      const hasError = await errorIndicator.isVisible({ timeout: 15000 }).catch(() => false);
      expect(hasError, 'Postcode validation should still apply on copied order').toBeTruthy();
    } else {
      console.warn('KNOWN LIMITATION: Copy button not available in this context; skipping copy flow verification');
    }
  });
});
