const { expect } = require('@playwright/test');

class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  async waitForPageReady() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle').catch(() => {});
  }

  async waitForNetworkIdle(timeout = 30000) {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  }

  async waitForLoader(timeout = 15000) {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  async smartWait({ timeout = 15000, additionalSelectors = [], waitForNetwork = true } = {}) {
    await this.waitForLoader(timeout);

    const spinnerSelectors = [
      '.ant-spin-spinning',
      '.ant-spin-dot',
      '.p-datatable-loading-overlay',
      '.loading-spinner',
      '.cdk-overlay-container .mat-progress-spinner',
      '[class*="skeleton"]',
      ...additionalSelectors,
    ];

    for (const sel of spinnerSelectors) {
      try {
        const spinner = this.page.locator(sel);
        if (await spinner.isVisible({ timeout: 1000 }).catch(() => false)) {
          await spinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
        }
      } catch {
        // spinner not found
      }
    }

    if (waitForNetwork) {
      await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {});
    }
  }

  async waitForStable(locator, stabilityMs = 500, timeout = 10000) {
    let prevText = '';
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const text = await locator.textContent().catch(() => '');
      if (text === prevText && text !== '') return;
      prevText = text;
      await this.page.waitForTimeout(stabilityMs);
    }
  }

  async safeGoto(url) {
    await this.page.evaluate((u) => { window.location.href = u; }, url);
    await this.page.waitForLoadState('domcontentloaded');
  }
}

module.exports = { BasePage };
