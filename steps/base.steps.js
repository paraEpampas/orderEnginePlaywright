const { expect } = require('@playwright/test');
const { BasePage } = require('../pages/base.page');

class BaseSteps extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
  }

  async verifyElementsVisible(...locators) {
    for (const locator of locators) {
      await expect(locator).toBeVisible({ timeout: 15000 });
    }
  }

  async verifyInputText(locator, expected) {
    let actual = '';
    for (let i = 0; i < 5; i++) {
      actual = (await locator.textContent()) || '';
      if (actual.trim() === expected.trim()) break;
      await this.page.waitForTimeout(1000);
    }
    expect(actual.trim()).toBe(expected.trim());
  }

  async verifyInputTextContains(locator, expected) {
    let actual = '';
    for (let i = 0; i < 5; i++) {
      actual = (await locator.textContent()) || '';
      if (actual.includes(expected)) break;
      await this.page.waitForTimeout(1000);
    }
    expect(actual).toContain(expected);
  }

  async verifyInputValue(locator, expected) {
    let actual = '';
    for (let i = 0; i < 8; i++) {
      actual = (await locator.inputValue()) || '';
      if (actual === expected) break;
      await this.page.waitForTimeout(300);
    }
    expect(actual).toBe(expected);
  }

  async selectFromDropdown(trigger, optionText) {
    await trigger.click();
    const option = this.page.locator(`.ant-select-item-option, .ng-option, [role="option"]`).filter({ hasText: optionText });
    await option.first().click();
  }

  async selectRandomFromDropdown(trigger, optionsLocator) {
    await trigger.click();
    const options = this.page.locator(optionsLocator);
    const count = await options.count();
    if (count === 0) throw new Error('No dropdown options found');
    const randomIndex = Math.floor(Math.random() * count);
    await options.nth(randomIndex).click();
  }

  async clearAndFill(locator, value) {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click({ timeout: 15000 });
    await locator.fill('');
    await locator.fill(value);
  }

  async clearInputField(locator) {
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click();
    await locator.press('Control+a');
    await locator.press('Delete');
    await locator.press('Tab');
  }

  async verifyErrorMessage(locator, expected) {
    await expect(locator).toBeVisible();
    await expect(locator).toHaveText(expected);
  }

  async verifyButtonState(locator, enabled) {
    if (enabled) {
      await expect(locator).toBeEnabled();
    } else {
      await expect(locator).toBeDisabled();
    }
  }

  async setValue(locator, value, shouldEnter = false) {
    const input = locator.locator('input').first();
    await input.waitFor({ state: 'visible' });
    await input.press('Control+a');
    await input.press('Delete');
    await input.fill(value);
    if (shouldEnter) await input.press('Enter');
  }

  async setValueInInput(locator, value, shouldEnter = false) {
    await locator.waitFor({ state: 'visible' });
    await locator.press('Control+a');
    await locator.press('Delete');
    await locator.fill(value);
    if (shouldEnter) await locator.press('Enter');
  }

  async clickElement(locator) {
    const loader = this.page.locator('app-loader .overlay');
    await loader.waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await locator.click();
  }

  async insertValue(locator, value) {
    await locator.waitFor({ state: 'visible' });
    await locator.click();
    await locator.fill(value);
    await locator.locator('..').click();
  }
}

module.exports = { BaseSteps };
