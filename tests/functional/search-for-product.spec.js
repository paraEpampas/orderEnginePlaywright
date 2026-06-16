const { test } = require('../../fixtures/base.fixture');
const { ProductsSearchSteps } = require('../../steps/products/products-search.steps');
const { getCountryConfig } = require('../../data/constants/country-config');

test.describe('Search for Product', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test('Test 245759: Search for a Product', async ({ authenticatedPage, country }) => {
    const steps = new ProductsSearchSteps(authenticatedPage);
    const countryConfig = getCountryConfig(country);
    await steps.verifyOrderEnginePageLoaded();
    await steps.navigateToProductsTab();
    await steps.verifyProductsSearchPageDisplayed();
    await steps.verifyAllSearchFieldsDisplayed();
    await steps.clickSearchWithoutMandatoryFields();
    await steps.verifyErrorMessageDisplayed();
    await steps.fillCcCompany(countryConfig.code);
    await steps.fillItemDescription(countryConfig.quickAddSearchKeyword);
    await steps.clickSearchButtonWithLongWait();
    await steps.verifySearchResultsDisplayedWithLongWait();
    await steps.clickFirstProduct();
    await steps.verifyProductDetailsDisplayed();
  });
});
