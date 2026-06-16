const { expect } = require('@playwright/test');
const { BaseSteps } = require('../base.steps');
const { HeaderTabPage } = require('../../pages/orders/tabs/header-tab.page');
const { getCountryConfig } = require('../../data/constants/country-config');

class FindAddressSteps extends BaseSteps {
  constructor(page) {
    super(page);
    this.headerTab = new HeaderTabPage(page);
  }

  async verifyFindAddressButtonNotPresent() {
    await expect(this.headerTab.findAddressButton).not.toBeVisible();
  }

  async verifyFindAddressButtonPresent() {
    await expect(this.headerTab.findAddressButton).toBeVisible({ timeout: 10000 });
  }

  getCurrentCountry() {
    return (process.env.COUNTRY || 'UK').toUpperCase();
  }

  async verifyFindAddressButtonVisibilityForCountry(countryOverride) {
    const country = (countryOverride || this.getCurrentCountry()).toUpperCase();
    if (country === 'FR') {
      await this.verifyFindAddressButtonPresent();
    } else {
      await this.verifyFindAddressButtonNotPresent();
    }
  }
}

module.exports = { FindAddressSteps };
