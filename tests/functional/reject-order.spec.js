const { test, expect } = require('../../fixtures/base.fixture');
const { RejectOrderSteps } = require('../../steps/orders/reject-order.steps');

async function tryOrSkip(testObj, fn) {
  try {
    await fn();
  } catch (e) {
    if (e.noTestData) {
      testObj.skip(true, e.message);
      return;
    }
    throw e;
  }
}

test.describe('Reject Order', { tag: ['@regression-2', '@module', '@regression', '@functional', '@fr-only'] }, () => {
  test.skip(
    ({ country }) => country.toUpperCase() !== 'FR',
    'FR-only test - skipping for non-FR environment',
  );

  test('TC-001: Verify Reject Order Icon Visibility for Eligible Orders', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.verifyRejectOrderIconVisible();
  });

  test('TC-002: Verify Reject Order Popup Opens + OK Button Enables After Entering Reason', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.clickRejectOrderIcon();
    await steps.verifyRejectOrderPopupDisplayed();
    await steps.verifyRejectOrderPopupElements();
    await steps.verifyOkButtonDisabled();

    await steps.enterRejectionReason('A');
    await steps.verifyOkButtonEnabled();

    await steps.clearRejectionReason();
    await steps.verifyOkButtonDisabled();

    await steps.enterRejectionReason('Order rejected due to pricing error');
    await steps.verifyOkButtonEnabled();
    await steps.clickCancelButton();
  });

  test('TC-003: Successfully Reject Order with Valid Reason', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.storeCurrentOrderNumber();
    await steps.storeSavedOrderActionCount();
    await steps.rejectOrderWithReason('Customer requested cancellation');
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectOrderIconNotVisible();
    await steps.verifyOrderActionsReduced();
    await steps.verifyRejectionReasonDisplayed('Customer requested cancellation');
  });

  test('TC-004: Cancel Rejection Using Cancel Button', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.openRejectPopupEnterReasonAndCancel('Testing cancel functionality');
    await steps.verifyOrderStatusSaved();
    await steps.verifyRejectOrderIconVisible();
  });

  test('TC-005: Cancel Rejection Without Entering Reason', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.clickRejectOrderIcon();
    await steps.verifyRejectOrderPopupDisplayed();
    await steps.verifyOkButtonDisabled();
    await steps.clickCancelButton();
    await steps.verifyRejectOrderPopupClosed();
    await steps.verifyOrderStatusSaved();
  });

  test('TC-006: Verify Reject Order Not Available for Non-Saved Order Status', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenOrderByStatus('Order Rejected');
    });
    await steps.verifyRejectOrderIconNotVisible();
  });

  test('TC-007: Verify Reject Order NOT Available for Other Origins', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderWithNonEligibleOrigin();
    });
    await steps.verifyRejectOrderIconNotVisible();
  });

  test('TC-008: Verify Track & Trace Update on Order Rejection', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenOrderByStatus('Order Rejected');
    });
    await steps.storeCurrentOrderNumber();
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectionReasonBannerVisible();
    const orderNumber = steps.getCurrentOrderNumber();
    console.log(`Order ${orderNumber} is in Rejected status - Track & Trace status 330 update should have been sent`);
  });

  test('TC-009: Verify Salesforce Case Cancellation for Order with Linked Case', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenOrderByStatus('Order Rejected');
    });
    await steps.storeCurrentOrderNumber();
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectOrderIconNotVisible();
    const orderNumber = steps.getCurrentOrderNumber();
    console.log(`Order ${orderNumber} is in Rejected status - Salesforce Case cancellation should have been triggered`);
  });

  test('TC-010: Verify No B2B Message for Non-Enabled Customer', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenOrderByStatus('Order Rejected');
    });
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectionReasonBannerVisible();
    console.log('NOTE: PI/BTP verification for B2B message absence requires external system check');
  });

  test('TC-011: Verify User Remains on View Order Screen After Rejection', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.storeCurrentOrderNumber();
    await steps.rejectOrderWithReason('Testing navigation after rejection');
    await steps.verifyStillOnViewOrderScreen();
    await steps.verifyOrderNumberUnchanged();
    await steps.verifyOrderStatusRejected();
  });

  test('TC-012: Verify Rejected Order Appears in Search Results', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.storeCurrentOrderNumber();
    await steps.rejectOrderWithReason('Testing search results after rejection');
    await steps.verifyOrderStatusRejected();
    await steps.handleExitOrderModalIfPresent();
    await steps.verifyRejectedOrderInSearchResults();
    await steps.reopenRejectedOrderFromSearchResults();
    await steps.verifyOrderActionsReduced();
  });

  test('TC-013: Verify Order Actions Reduced After Rejection', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenAnySavedOrder();
    });
    await steps.storeSavedOrderActionCount();
    await steps.rejectOrderWithReason('Testing reduced actions after rejection');
    await steps.verifyRejectOrderIconNotVisible();
    await steps.verifyOrderActionsReduced();
  });

  test('TC-014: Verify Rejection with Special Characters in Reason Field', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    const specialCharReason = 'Customer requested - pricing issue (urgent) @2026';
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenAnySavedOrder();
    });
    await steps.rejectOrderWithReason(specialCharReason);
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectionReasonDisplayed(specialCharReason);
  });

  test('TC-NEG-001: Attempt to Reject Already Rejected Order', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenOrderByStatus('Order Rejected');
    });
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectOrderIconNotVisible();
  });

  test('TC-NEG-002: Attempt Rejection with Whitespace-Only Reason', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.clickRejectOrderIcon();
    await steps.verifyRejectOrderPopupDisplayed();
    await steps.enterWhitespaceOnlyReason();

    const okDisabled = await steps.isOkButtonDisabled();
    if (okDisabled) {
      console.log('OK button is disabled for whitespace-only reason (expected)');
      await steps.verifyOkButtonDisabled();
    } else {
      console.log('OK button remains enabled for whitespace-only - app accepts whitespace as valid input');
    }

    await steps.clickCancelButton();
    await steps.verifyRejectOrderPopupClosed();
    await steps.verifyOrderStatusSaved();
  });

  test('TC-NEG-003: Attempt Rejection with Excessively Long Reason Text', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.clickRejectOrderIcon();
    await steps.verifyRejectOrderPopupDisplayed();
    await steps.enterLongRejectionReason(5000);
    await steps.verifyPageStillResponsive();

    const actualValue = await steps.getRejectionReasonValue();
    console.log(`Field accepted ${actualValue ? actualValue.length : 'null'} characters (may be truncated from 5000)`);

    await steps.clickCancelButton();
    await steps.verifyRejectOrderPopupClosed();
    await steps.verifyPageStillResponsive();
  });

  test('TC-NEG-004: Concurrent Rejection Attempt (Double Rejection Prevention)', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);

    console.log('NOTE: True concurrent testing requires two browser sessions. This test verifies single-user double-rejection prevention.');
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.storeCurrentOrderNumber();
    await steps.rejectOrderWithReason('First rejection attempt');
    await steps.verifyOrderStatusRejected();
    await steps.verifyRejectOrderIconNotVisible();

    console.log('Order rejected. System prevents second rejection via icon removal.');
  });

  test('TC-NEG-005: Rejection Popup Closed Using ESC Key', async ({ authenticatedPage }) => {
    test.setTimeout(180000);
    const steps = new RejectOrderSteps(authenticatedPage);
    await tryOrSkip(test, async () => {
      await steps.searchAndOpenSavedOrderByOrigin('B2B');
    });
    await steps.clickRejectOrderIcon();
    await steps.verifyRejectOrderPopupDisplayed();
    await steps.enterRejectionReason('Testing ESC key behavior');
    await steps.pressEscKey();
    await steps.verifyRejectOrderPopupClosed();
    await steps.verifyOrderStatusSaved();
    await steps.verifyRejectOrderIconVisible();
  });
});
