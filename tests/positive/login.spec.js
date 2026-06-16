const { test } = require('../../fixtures/base.fixture');
const { LoginSteps } = require('../../steps/login.steps');

test.describe('Login', { tag: ['@positive', '@login', '@module', '@regression'] }, () => {
  test('verify successful login functionality', async ({ authenticatedPage }) => {
    const steps = new LoginSteps(authenticatedPage);
    await steps.verifyLoginPageDisplayed();
    await steps.verifySuccessfulLogin();
  });
});
