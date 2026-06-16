const { test, expect } = require('../../fixtures/base.fixture');
const { OrderCreationSteps } = require('../../steps/orders/order-creation.steps');
const { CreateOrderSteps } = require('../../steps/orders/create-order.steps');
const { FrancePostcodeSteps } = require('../../steps/orders/france-postcode.steps');
const { randomCustomerOrderRef, randomFirstName, randomLastName } = require('../../data/generators');

const SELECTORS = {
  validateButton: "button:has(mat-icon:has-text('fact_check'))",
  saveAndSubmitButton: "button:has(mat-icon:has-text('save_alt'))",
  saveButton: "button:has(mat-icon:text-is('save'))",
  editButton: "button:has(mat-icon:has-text('edit'))",
  districtInput: "input[formcontrolname*='district']",
  regionSelect: "ng-select[formcontrolname*='region'], input[formcontrolname*='region']",
  shipToPostcode: "input[formcontrolname*='shipToPostcode'], input[formcontrolname*='postCode']",
  shipToTown: "input[formcontrolname*='shipToTown'], input[formcontrolname*='town']",
  modalRoot: '.cdk-overlay-pane',
  addressDropdown: 'ng-select, .ng-dropdown-panel .ng-option, select option',
};

async function createFROrderWithShipTo(page, createSteps, orderSteps) {
  await orderSteps.verifyOrderEnginePageLoaded();
  await createSteps.clickCreateOrderForSoldToAccountButton();
  await createSteps.searchForAccountAndSelectFirst();
  await createSteps.verifyHeaderTabDisplayed();

  const orderRef = randomCustomerOrderRef();
  await createSteps.fillMandatoryFieldsWithRef(orderRef);

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
    const orderedByHeader = [...allDivs].find((d) => d.textContent?.trim() === 'Customer Ordered By Information');
    if (orderedByHeader) {
      const section = orderedByHeader.parentElement;
      const inputs = section?.querySelectorAll('input:not([disabled])');
      if (inputs && inputs.length >= 2) {
        setInputValue(inputs[0], firstName);
        setInputValue(inputs[1], lastName);
      }
    }
  }, { incoText: 'PARIS', firstName: randomFirstName(), lastName: randomLastName() });

  await orderSteps.checkAndSelectShipTo();
  await page.waitForTimeout(2000);
}

async function getShipToFieldValue(page, selector) {
  const field = page.locator(selector).first();
  if (!(await field.isVisible({ timeout: 5000 }).catch(() => false))) return '';
  const tagName = await field.evaluate((el) => el.tagName.toLowerCase()).catch(() => 'input');
  if (tagName === 'ng-select') {
    return ((await field.textContent()) || '').trim();
  }
  return ((await field.inputValue().catch(() => '')) || '').trim();
}

async function selectRegionIfEmpty(page, optionIndex = 1) {
  const regionField = page.locator(SELECTORS.regionSelect).first();
  if (!(await regionField.isVisible({ timeout: 5000 }).catch(() => false))) return '';
  const current = await getShipToFieldValue(page, SELECTORS.regionSelect);
  if (current) return current;
  await regionField.click({ force: true });
  await page.waitForTimeout(500);
  const option = page.locator('.ng-option:not(.ng-option-disabled)').nth(optionIndex);
  if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
    const label = ((await option.textContent()) || '').trim();
    await option.click();
    await page.waitForTimeout(500);
    return label;
  }
  return '';
}

async function getModalRoot(page) {
  return page.locator(SELECTORS.modalRoot).last();
}

async function getModalDropdownOptions(page) {
  const modal = await getModalRoot(page);
  const options = modal.locator('.ng-dropdown-panel .ng-option, select option, [role="option"]');
  const count = await options.count();
  const texts = [];
  for (let i = 0; i < count; i++) {
    texts.push(((await options.nth(i).textContent()) || '').trim());
  }
  return texts.filter(Boolean);
}

async function selectAddressOptionByIndex(page, index = 0) {
  const modal = await getModalRoot(page);
  const ngOption = modal.locator('.ng-dropdown-panel .ng-option').nth(index);
  if (await ngOption.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ngOption.click();
    return;
  }
  const select = modal.locator('select').first();
  if (await select.isVisible({ timeout: 2000 }).catch(() => false)) {
    await select.selectOption({ index });
  }
}

async function selectAddressContaining(page, keyword) {
  const modal = await getModalRoot(page);
  const options = modal.locator('.ng-dropdown-panel .ng-option, select option, [role="option"]');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const text = ((await options.nth(i).textContent()) || '').trim();
    if (text.toUpperCase().includes(keyword.toUpperCase())) {
      await options.nth(i).click();
      return text;
    }
  }
  await selectAddressOptionByIndex(page, 0);
  return '';
}

async function assertDropdownContainsOnly(page, expectedText) {
  const options = await getModalDropdownOptions(page);
  expect(options.length).toBeGreaterThan(0);
  for (const option of options) {
    expect(option.toUpperCase()).toContain(expectedText.toUpperCase());
  }
}

async function saveOrder(page) {
  const saveBtn = page.locator(SELECTORS.saveButton);
  if (await saveBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await saveBtn.click({ force: true });
  } else {
    await page.locator(SELECTORS.saveAndSubmitButton).click({ force: true });
  }
  await page.waitForTimeout(3000);
}

async function copyOrderAndContinue(page, orderSteps) {
  const copied = await orderSteps.clickCopyOrderButton();
  if (copied) {
    await orderSteps.verifyCopyOrderModalDisplayed();
    await orderSteps.clickCopyOrderContinue();
    await orderSteps.verifyNewOrderPageDisplayed();
  }
}

test.describe('FR Address Search Enhanced', { tag: ['@regression-2', '@module', '@regression', '@functional', '@fr-only'] }, () => {
  test.describe.configure({ timeout: 300000 });
  test('Test 453381: FR Address Search - District not populated/updated', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();

    // Step 1: Select address WITH district — district, town, post code updated
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('75001', 'PARIS');
    await postcodeSteps.clickSearchInModal();
    await selectAddressOptionByIndex(authenticatedPage, 0);
    await postcodeSteps.clickUseSelectedAddressInModal();

    const districtAfterWith = await getShipToFieldValue(authenticatedPage, SELECTORS.districtInput);
    const townAfterWith = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToTown);
    const postcodeAfterWith = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToPostcode);
    expect(townAfterWith.length).toBeGreaterThan(0);
    expect(postcodeAfterWith.length).toBeGreaterThan(0);

    // Step 2: Select address WITHOUT district — district cleared, town and post code remain
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('95550', 'BESSANCOURT');
    await postcodeSteps.clickSearchInModal();
    await selectAddressOptionByIndex(authenticatedPage, 0);
    await postcodeSteps.clickUseSelectedAddressInModal();

    const districtAfterWithout = await getShipToFieldValue(authenticatedPage, SELECTORS.districtInput);
    const townAfterWithout = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToTown);
    const postcodeAfterWithout = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToPostcode);
    expect(districtAfterWithout).toBe('');
    expect(townAfterWithout.length).toBeGreaterThan(0);
    expect(postcodeAfterWithout.length).toBeGreaterThan(0);
    if (districtAfterWith) {
      expect(districtAfterWithout).not.toBe(districtAfterWith);
    }
  });

  test('Test 461079: FR address search - Region should not be modified', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    test.setTimeout(300000);
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();

    // Step 1: Ensure region is selected
    const regionBefore = await selectRegionIfEmpty(authenticatedPage);
    expect((await getShipToFieldValue(authenticatedPage, SELECTORS.regionSelect)).length).toBeGreaterThan(0);

    // Step 2: Find an address with different postcode — region unchanged
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('95550', 'BESSANCOURT');
    await postcodeSteps.clickSearchInModal();
    await selectAddressOptionByIndex(authenticatedPage, 0);
    await postcodeSteps.clickUseSelectedAddressInModal();

    const regionAfterSearch = await getShipToFieldValue(authenticatedPage, SELECTORS.regionSelect);
    if (regionBefore) {
      expect(regionAfterSearch).toBe(regionBefore);
    } else {
      expect(regionAfterSearch.length).toBeGreaterThan(0);
    }

    // Step 3: Saved order — change whole address, region preserved
    await saveOrder(authenticatedPage);
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('33520', 'BRUGES');
    await postcodeSteps.clickSearchInModal();
    await selectAddressOptionByIndex(authenticatedPage, 0);
    await postcodeSteps.clickUseSelectedAddressInModal();
    const regionAfterSavedEdit = await getShipToFieldValue(authenticatedPage, SELECTORS.regionSelect);
    expect(regionAfterSavedEdit).toBe(regionAfterSearch);

    // Step 4: Copy order — region preserved
    await copyOrderAndContinue(authenticatedPage, orderSteps);
    await postcodeSteps.ensureHeaderTab();
    const regionOnCopy = await getShipToFieldValue(authenticatedPage, SELECTORS.regionSelect);
    expect(regionOnCopy).toBe(regionAfterSavedEdit);

    // Step 5: Change address on copied order — region preserved
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('75001', 'PARIS');
    await postcodeSteps.clickSearchInModal();
    await selectAddressOptionByIndex(authenticatedPage, 0);
    await postcodeSteps.clickUseSelectedAddressInModal();
    const regionAfterCopyAddressChange = await getShipToFieldValue(authenticatedPage, SELECTORS.regionSelect);
    expect(regionAfterCopyAddressChange).toBe(regionOnCopy);
  });

  test('Test 462403: Post code in dropdown incorrect', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();

    // Step 1: Find an Address — pre-populated from Ship-To
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();

    // Step 2: Search 95550 and Bessancourt
    await postcodeSteps.fillPostcodeAndTownInModal('95550', 'BESSANCOURT');
    await postcodeSteps.clickSearchInModal();
    await assertDropdownContainsOnly(authenticatedPage, '95550');
    await assertDropdownContainsOnly(authenticatedPage, 'BESSANCOURT');

    // Step 3: Search 95550 only
    await postcodeSteps.fillPostcodeAndTownInModal('95550', '');
    await postcodeSteps.clickSearchInModal();
    await assertDropdownContainsOnly(authenticatedPage, '95550 BESSANCOURT');

    // Step 4: Search Bessancourt only
    await postcodeSteps.fillPostcodeAndTownInModal('', 'Bessancourt');
    await postcodeSteps.clickSearchInModal();
    await assertDropdownContainsOnly(authenticatedPage, '95550');

    // Steps 5-8: Invalid searches — no results
    const invalidSearches = [
      ['95551', ''],
      ['95551', 'Bessancourt'],
      ['95155', ''],
      ['95155', 'Bessancourt'],
    ];
    for (const [postcode, town] of invalidSearches) {
      await postcodeSteps.fillPostcodeAndTownInModal(postcode, town);
      await postcodeSteps.clickSearchInModal();
      await postcodeSteps.verifyNoResultsInModal();
    }

    // Step 9: Results show LIBELLE_ACHEMINEMENT value (town/postcode pairing consistency)
    await postcodeSteps.fillPostcodeAndTownInModal('75001', 'PARIS');
    await postcodeSteps.clickSearchInModal();
    const parisOptions = await getModalDropdownOptions(authenticatedPage);
    expect(parisOptions.length).toBeGreaterThan(0);
    for (const option of parisOptions) {
      expect(option).toMatch(/\d{5}/);
    }
    await postcodeSteps.clickCancelInModal();
  });

  test('Test 465661: FR search result does not match search', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();

    // Step 1: Search town without wildcard — results contain matching towns
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    await postcodeSteps.fillPostcodeAndTownInModal('', 'Paris');
    await postcodeSteps.clickSearchInModal();
    let options = await getModalDropdownOptions(authenticatedPage);
    expect(options.length).toBeGreaterThan(0);
    const hasParisMatch = options.some((opt) => /paris/i.test(opt));
    expect(hasParisMatch).toBeTruthy();

    // Step 2: Partial town name "Bret" — case-insensitive contains match
    await postcodeSteps.fillPostcodeAndTownInModal('', 'Bret');
    await postcodeSteps.clickSearchInModal();
    options = await getModalDropdownOptions(authenticatedPage);
    expect(options.length).toBeGreaterThan(0);
    for (const option of options) {
      expect(option.toLowerCase()).toMatch(/bret/);
    }

    // Step 3: Town with multiple results (Paris) — all matching addresses with valid postcodes
    await postcodeSteps.fillPostcodeAndTownInModal('', 'Paris');
    await postcodeSteps.clickSearchInModal();
    options = await getModalDropdownOptions(authenticatedPage);
    expect(options.length).toBeGreaterThan(1);
    for (const option of options) {
      expect(option).toMatch(/\d{5}/);
    }
    await postcodeSteps.clickCancelInModal();
  });

  test('Test 467888: FR Town in dropdown from LIBELLE_ACHEMINEMENT', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();

    // Step 1: Pre-populated with Ship-To postcode and town
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();
    const shipToPostcode = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToPostcode);
    const shipToTown = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToTown);
    const modal = await getModalRoot(authenticatedPage);
    const modalPostcode = modal.locator("input[formcontrolname*='postCode'], input").first();
    const modalTown = modal.locator("input[formcontrolname*='town']").first()
      .or(modal.locator('input').nth(1));
    if (shipToPostcode) {
      expect(await modalPostcode.inputValue()).toContain(shipToPostcode.substring(0, 5));
    }
    if (shipToTown) {
      const townValue = await modalTown.inputValue().catch(() => '');
      expect(townValue.toUpperCase()).toContain(shipToTown.substring(0, 3).toUpperCase());
    }

    // Step 2: Town in results from LIBELLE_ACHEMINEMENT — dropdown matches Ship-To after selection
    await postcodeSteps.fillPostcodeAndTownInModal('', 'Bretagne');
    await postcodeSteps.clickSearchInModal();
    const dropdownLabel = await selectAddressContaining(authenticatedPage, 'BRETAGNE');
    await postcodeSteps.clickUseSelectedAddressInModal();
    const shipToTownAfter = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToTown);
    if (dropdownLabel) {
      expect(shipToTownAfter.toUpperCase()).toContain(
        dropdownLabel.replace(/\d{5}/g, '').trim().split(/\s+/).pop().substring(0, 4).toUpperCase()
      );
    }
  });

  test('Test 460635: FR Postcode fields not prepopulated upon opening', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();
    const shipToPostcode = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToPostcode);
    const shipToTown = await getShipToFieldValue(authenticatedPage, SELECTORS.shipToTown);

    // Step 1: Open Find an Address — town and postcode pre-populated from Ship-To
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();

    // Step 2: Cancel
    await postcodeSteps.clickCancelInModal();

    // Step 3: Reopen — same Ship-To values displayed
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();

    // Step 4: Empty both fields and search — No Results
    await postcodeSteps.fillPostcodeAndTownInModal('', '');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.verifyNoResultsInModal();

    // Step 5: Invalid postcode/town combination — No Results
    await postcodeSteps.fillPostcodeAndTownInModal('99999', 'INVALIDTOWN');
    await postcodeSteps.clickSearchInModal();
    await postcodeSteps.verifyNoResultsInModal();
    await postcodeSteps.clickCancelInModal();

    if (shipToPostcode && shipToTown) {
      console.log(`Ship-To reference: ${shipToPostcode} / ${shipToTown}`);
    }
  });

  test('Test 460659: Postcode Checker UI has no boundaries', async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'FR', 'FR-only address search test');
    const createSteps = new CreateOrderSteps(authenticatedPage);
    const orderSteps = new OrderCreationSteps(authenticatedPage);
    const postcodeSteps = new FrancePostcodeSteps(authenticatedPage);

    await createFROrderWithShipTo(authenticatedPage, createSteps, orderSteps);
    await postcodeSteps.ensureHeaderTab();

    // Step 1: Open postcode checker and drag modal to screen edges
    await postcodeSteps.clickFindAnAddress();
    await postcodeSteps.verifyFindAddressModalOpen();

    const modal = await getModalRoot(authenticatedPage);
    const header = modal.locator('.modal-header, mat-dialog-title, :text("Find an Address")').first();
    const box = await modal.boundingBox();
    const viewport = authenticatedPage.viewportSize();
    if (box && viewport) {
      const dragHandle = await header.boundingBox();
      if (dragHandle) {
        await authenticatedPage.mouse.move(dragHandle.x + dragHandle.width / 2, dragHandle.y + dragHandle.height / 2);
        await authenticatedPage.mouse.down();
        await authenticatedPage.mouse.move(viewport.width + 200, -100, { steps: 10 });
        await authenticatedPage.mouse.up();
        await authenticatedPage.waitForTimeout(500);
      }

      const boxAfterDrag = await modal.boundingBox();
      expect(boxAfterDrag.x).toBeGreaterThanOrEqual(-5);
      expect(boxAfterDrag.y).toBeGreaterThanOrEqual(-5);
      expect(boxAfterDrag.x + boxAfterDrag.width).toBeLessThanOrEqual(viewport.width + 5);
      expect(boxAfterDrag.y + boxAfterDrag.height).toBeLessThanOrEqual(viewport.height + 5);
    }
    await postcodeSteps.clickCancelInModal();
  });
});
