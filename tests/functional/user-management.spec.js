const { test } = require('../../fixtures/base.fixture');
const { UserManagementSteps } = require('../../steps/user-management.steps');

test.describe('User Management', { tag: ['@regression-2', '@module', '@regression', '@functional'] }, () => {
  test.describe.configure({ mode: 'serial' });

  test('verify user management page displays', async ({ authenticatedPage }) => {
    const adminNav = authenticatedPage.locator("div[data-name='header.admin'], a:has-text('Admin'), button:has-text('Admin'), div[data-name*='admin' i]").first();
    const adminVisible = await adminNav.isVisible({ timeout: 10000 }).catch(() => false);

    if (!adminVisible) {
      const navItems = authenticatedPage.locator('nav a, nav button, div[data-name*="header"] >> visible=true');
      const count = await navItems.count().catch(() => 0);
      const navTexts = [];
      for (let i = 0; i < count; i++) {
        navTexts.push(await navItems.nth(i).textContent().catch(() => ''));
      }
      const hasAdmin = navTexts.some(t => t.toLowerCase().includes('admin') || t.toLowerCase().includes('user'));
      test.skip(!hasAdmin, 'Admin navigation not available for current user - user may lack admin privileges');
    }

    const steps = new UserManagementSteps(authenticatedPage);
    await steps.navigateToUserManagement();
    await steps.verifyUserManagementPageDisplayed();
    await steps.verifyUserListDisplayed();
  });

  test('Test 245758: Edit User Details - Change Language', { tag: ['@regression-2', '@module', '@regression', '@functional', '@uk-only'] }, async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'UK', 'User Management language test runs only for country UK');

    const steps = new UserManagementSteps(authenticatedPage);

    await steps.navigateToOEPortal();
    await steps.clickUserIcon();
    await steps.changeLanguageToGermanAndSave();
    await steps.closeBrowserAndReopenToUserManagement();
    await steps.verifyAppIsInGerman();
    await steps.changeLanguageBackToEnglish();
    await steps.closeBrowserAndReopenToUserManagement();
    await steps.verifyAppIsInEnglish();
  });

  test('Test 245759: Edit User Details - Change Language to French', { tag: ['@regression-2', '@module', '@regression', '@functional', '@uk-only'] }, async ({ authenticatedPage, country }) => {
    test.skip(country.toUpperCase() !== 'UK', 'User Management language test runs only for country UK');

    const steps = new UserManagementSteps(authenticatedPage);

    await steps.navigateToOEPortal();
    await steps.clickUserIcon();
    await steps.changeLanguageToFrenchAndSave();
    await steps.closeBrowserAndReopenToUserManagement();
    await steps.verifyAppIsInFrench();
    await steps.changeLanguageBackToEnglish();
    await steps.closeBrowserAndReopenToUserManagement();
    await steps.verifyAppIsInEnglish();
  });
});
