const XLSX = require('xlsx');
const path = require('path');

const tests = [
  // ==================== SMOKE TESTS ====================
  {
    id: 'SMK-001',
    spec: 'tests/smoke/browser-navigation.spec.js',
    suite: 'Browser Navigation',
    test: 'Verify browser opens and navigates to OE page',
    category: 'Smoke',
    tags: '@smoke, @navigation, @regression',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'Browser opens successfully; Order Engine landing page loads and is accessible'
  },
  {
    id: 'SMK-002',
    spec: 'tests/smoke/browser-navigation.spec.js',
    suite: 'Browser Navigation',
    test: 'Verify browser configuration from properties',
    category: 'Smoke',
    tags: '@smoke, @navigation, @regression',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'Browser opens with correct configuration; Page loads correctly from environment properties'
  },

  // ==================== LOGIN ====================
  {
    id: 'LGN-001',
    spec: 'tests/positive/login.spec.js',
    suite: 'Login',
    test: 'Verify successful login functionality',
    category: 'Positive',
    tags: '@positive, @login, @regression',
    country: 'All',
    status: 'Active',
    precondition: 'Valid user credentials configured',
    checks: 'Login page displays correctly; User can log in successfully and reach the landing page'
  },

  // ==================== LANDING PAGE ====================
  {
    id: 'OEL-001',
    spec: 'tests/functional/oe-login-orders.spec.js',
    suite: 'Order Engine Login Orders',
    test: 'Test 245665: Order Engine / Login / Orders',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated and on OE landing page',
    checks: 'All search fields displayed (CC Company, Order Status, Last Modified, Order Type, Select Origin); Dropdown options are correct for each filter; Clear Fields and Search buttons are functional; All table columns displayed in orders list; User profile and Help buttons visible'
  },

  // ==================== ORDER CREATION ====================
  {
    id: 'CRE-001',
    spec: 'tests/functional/create-order.spec.js',
    suite: 'Create Order',
    test: 'Test 245666: Create a new Order - full workflow',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated and on OE landing page',
    checks: 'Create Order button works; Select Account window displays with all fields and columns; Account search returns results and selection works; Header tab displays with all fields; Mandatory fields can be filled and values are verified; Order submits successfully; Edit icon appears after submission; Order appears in orders list'
  },
  {
    id: 'CRE-002',
    spec: 'tests/functional/order-creation.spec.js',
    suite: 'Order Creation',
    test: 'Complete order creation workflow with Quick Add',
    category: 'Functional',
    tags: '@module, @health-check, @regression, @functional',
    country: 'All (country-specific logic for FR/DE)',
    status: 'Active',
    precondition: 'User is authenticated; Country config available',
    checks: 'OE page loads; Create Order button works; Account search and selection; Header page displays; Customer Order Ref field fillable; Ship-To selection works; Bill-To and Payer selection (FR/DE only); Header tab navigation and field filling; Mandatory UDF for DE; Quick Add tab displays; Items can be added; Items appear in cart; Unit sell price editable; Recalc button works; Error check passes; Order validates and submits; Order status correct after submission; Order in orders list'
  },

  // ==================== ORDER EDIT ====================
  {
    id: 'EDT-001',
    spec: 'tests/functional/order-edit.spec.js',
    suite: 'Order Edit',
    test: 'Test 245730: Edit an Order',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'An order is created first (in the test); User is authenticated',
    checks: 'Order is created with a known reference; Edit mode can be entered (directly or via orders list); Changes can be made and saved; Clearing a mandatory field and attempting save triggers a validation error'
  },

  // ==================== COPY ORDER ====================
  {
    id: 'CPY-001',
    spec: 'tests/functional/copy-order.spec.js',
    suite: 'Copy Order',
    test: 'Verify copy order button and modal workflow',
    category: 'Functional',
    tags: '@module, @health-check, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'An order is created and saved (in beforeEach)',
    checks: 'Copy Order button is visible; Click opens Copy Order modal; Continue button creates a copy; Copied order displays correctly with data carried over'
  },

  // ==================== REJECT ORDER (FR ONLY) ====================
  {
    id: 'REJ-001',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-001: Verify Reject Order Icon Visibility for Eligible Orders',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Reject order icon is visible for orders with B2B origin in Saved status'
  },
  {
    id: 'REJ-002',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-002: Verify Reject Order Popup Opens + OK Button Enables After Entering Reason',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Reject popup opens with all elements; OK button disabled by default; OK enables after entering reason text; OK disables again when reason cleared; Cancel button closes popup'
  },
  {
    id: 'REJ-003',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-003: Successfully Reject Order with Valid Reason',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Order can be rejected with a reason; Status changes to Rejected; Reject icon no longer visible; Available actions are reduced; Rejection reason is displayed on the order'
  },
  {
    id: 'REJ-004',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-004: Cancel Rejection Using Cancel Button',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Entering a reason and clicking Cancel does NOT reject the order; Order remains in Saved status; Reject icon still visible'
  },
  {
    id: 'REJ-005',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-005: Cancel Rejection Without Entering Reason',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Popup opens; OK disabled without reason; Cancel closes popup; Order remains Saved'
  },
  {
    id: 'REJ-006',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-006: Verify Reject Order Not Available for Non-Saved Order Status',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'An order in "Order Rejected" status exists',
    checks: 'Reject icon is NOT visible for already-rejected orders'
  },
  {
    id: 'REJ-007',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-007: Verify Reject Order NOT Available for Other Origins',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved order with non-B2B origin exists',
    checks: 'Reject icon is NOT visible for orders from non-eligible origins (e.g., non-B2B)'
  },
  {
    id: 'REJ-008',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-008: Verify Track & Trace Update on Order Rejection',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A rejected order exists',
    checks: 'Rejected order shows correct status; Rejection reason banner visible; Track & Trace status 330 update triggered (logged)'
  },
  {
    id: 'REJ-009',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-009: Verify Salesforce Case Cancellation for Order with Linked Case',
    category: 'Integration',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A rejected order exists',
    checks: 'Rejected order status verified; Reject icon removed; Salesforce Case cancellation triggered (logged)'
  },
  {
    id: 'REJ-010',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-010: Verify No B2B Message for Non-Enabled Customer',
    category: 'Integration',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A rejected order exists',
    checks: 'Rejected status verified; Rejection reason banner visible; No B2B message sent for non-enabled customer (logged)'
  },
  {
    id: 'REJ-011',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-011: Verify User Remains on View Order Screen After Rejection',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'After rejection, user stays on the View Order screen; Order number unchanged; Status shows Rejected'
  },
  {
    id: 'REJ-012',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-012: Verify Rejected Order Appears in Search Results',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'After rejection, order appears in search results; Can be reopened; Actions are reduced on the rejected order'
  },
  {
    id: 'REJ-013',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-013: Verify Order Actions Reduced After Rejection',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved order exists',
    checks: 'After rejection, reject icon disappears; Number of available actions is reduced compared to before rejection'
  },
  {
    id: 'REJ-014',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-014: Verify Rejection with Special Characters in Reason Field',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved order exists',
    checks: 'Order rejects successfully with special characters in the reason (e.g., parentheses, hyphens, @); Rejection reason displays correctly including special chars'
  },
  {
    id: 'REJ-NEG-001',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-NEG-001: Attempt to Reject Already Rejected Order',
    category: 'Negative',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'An already-rejected order exists',
    checks: 'Order shows Rejected status; Reject icon is NOT available (double rejection prevented)'
  },
  {
    id: 'REJ-NEG-002',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-NEG-002: Attempt Rejection with Whitespace-Only Reason',
    category: 'Negative',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Popup opens; Whitespace-only reason tested; OK button behavior logged (disabled or enabled); Cancel closes popup; Order remains Saved'
  },
  {
    id: 'REJ-NEG-003',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-NEG-003: Attempt Rejection with Excessively Long Reason Text',
    category: 'Negative',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: '5000-character reason entered; Page remains responsive; Character truncation behavior logged; Cancel closes popup; Page still responsive after'
  },
  {
    id: 'REJ-NEG-004',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-NEG-004: Concurrent Rejection Attempt (Double Rejection Prevention)',
    category: 'Negative',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'First rejection succeeds; Status changes to Rejected; Reject icon removed (second rejection prevented by UI)'
  },
  {
    id: 'REJ-NEG-005',
    spec: 'tests/functional/reject-order.spec.js',
    suite: 'Reject Order',
    test: 'TC-NEG-005: Rejection Popup Closed Using ESC Key',
    category: 'Negative',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'A saved B2B order exists',
    checks: 'Popup opens; Reason entered; ESC key closes popup without rejecting; Order remains Saved; Reject icon still visible'
  },

  // ==================== BULK UPLOAD ====================
  {
    id: 'BLK-001',
    spec: 'tests/functional/bulk-upload.spec.js',
    suite: 'Bulk Upload',
    test: 'Verify bulk upload workflow with Excel file',
    category: 'Functional',
    tags: '@module, @health-check, @regression, @functional',
    country: 'All (country-specific Excel file)',
    status: 'Active',
    precondition: 'Country-specific Excel file exists in test-data/bulk-upload/',
    checks: 'OE page loaded; Create Order works; Account search and selection; Customer Order Ref filled; Mandatory header fields filled; Quick Add tab navigation; Upload button works; Excel file uploaded; Items loaded from Excel; Order validates and submits'
  },

  // ==================== PRODUCT SEARCH ====================
  {
    id: 'PRD-001',
    spec: 'tests/functional/search-for-product.spec.js',
    suite: 'Search for Product',
    test: 'Test 245759: Search for a Product',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated; Country config available',
    checks: 'OE page loaded; Products tab navigation; Products search page displays; All search fields visible; Search without mandatory fields shows error; CC Company and Item Description filled; Search returns results; First product clickable; Product details page displays'
  },

  // ==================== SEARCH AND ADD MATERIALS ====================
  {
    id: 'MAT-001',
    spec: 'tests/functional/search-add-materials.spec.js',
    suite: 'Search and Add Materials',
    test: 'Test 245739: Search and add Materials to an Order',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All (Bill-To for FR/DE)',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'OE page loaded; Order created; Material search by description works; Material added to order; Line number editable; Recalc button works; Text line can be added and verified; Line item can be deleted'
  },

  // ==================== CHANGE CURRENCY ====================
  {
    id: 'CUR-001',
    spec: 'tests/functional/change-currency.spec.js',
    suite: 'Change Currency',
    test: 'Test 245974: Create order for sold to Account / change the currency',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'OE page loaded; Order created with account; Items added to Quick Add; Initial prices and currency captured; Currency changed to a different one (GBP→EUR, EUR→USD, etc.); Cost values remain in sold-to currency (cost currency unchanged)'
  },

  // ==================== CHANGE SOLD-TO ACCOUNT ====================
  {
    id: 'CST-001',
    spec: 'tests/functional/change-sold-to-account.spec.js',
    suite: 'Change Sold-To Account',
    test: 'Change sold-to immediately after save',
    category: 'Functional',
    tags: '@module, @health-check, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created, submitted, and in edit mode',
    checks: 'Change Sold-To button works; Select Account modal displays; Search for new account returns results; First account selectable; Preserve Pricing dialog appears — choosing YES; Account successfully changed'
  },
  {
    id: 'CST-002',
    spec: 'tests/functional/change-sold-to-account.spec.js',
    suite: 'Change Sold-To Account',
    test: 'Change sold-to without preserving pricing',
    category: 'Functional',
    tags: '@module, @health-check, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created, submitted, and in edit mode',
    checks: 'Change Sold-To button works; Select Account modal displays; New account searched and selected; Preserve Pricing dialog — choosing NO; Account successfully changed (pricing recalculated)'
  },

  // ==================== VALIDATE ORDER ====================
  {
    id: 'VAL-001',
    spec: 'tests/functional/validate-order-sold-to.spec.js',
    suite: 'Validate Order Sold To Account',
    test: 'Test 245847: Validate a new created Order for sold to account',
    category: 'Functional',
    tags: '@module, @regression, @functional, @uk-only',
    country: 'UK',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'Order created with mandatory fields; Items added to Quick Add; Save & Submit with missing prices shows field error message; Navigate away triggers Exit Order popup; Exit Order popup can be closed; Missing prices fixed; Save & Submit succeeds; Back button returns to landing without modal'
  },

  // ==================== SUBMIT ORDER ====================
  {
    id: 'SUB-001',
    spec: 'tests/functional/submit-order-sold-to.spec.js',
    suite: 'Submit Order Sold To Account',
    test: 'Test 245977: Submit a new created Order for Sold-to Account',
    category: 'Functional',
    tags: '@module, @regression, @functional, @uk-only',
    country: 'UK',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'Order created with mandatory fields; Line items added and validated; Save & Submit succeeds; Order becomes read-only after submission; Order reference registered for deferred SAP verification'
  },

  // ==================== MESSAGES TAB ====================
  {
    id: 'MSG-001',
    spec: 'tests/functional/messages.spec.js',
    suite: 'Messages',
    test: 'Verify messages tab content displays',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created and submitted (beforeEach)',
    checks: 'Edit icon functionality (if visible); Messages tab content displays correctly with expected data'
  },

  // ==================== QUICK ADD / PRICING ====================
  {
    id: 'QAP-001',
    spec: 'tests/functional/quick-add-pricing.spec.js',
    suite: 'Quick Add / Basic Pricing',
    test: 'Test 245731: Quick Add/Basic Pricing',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated; Country config available',
    checks: 'OE page loaded; Order created; Quick Add tab column headers correct; Order saved; Edit icon works; Quick Add search buttons exercised (CC part, item, keyword search); Text line added and verified; Line deletion works; Recalc button works'
  },

  // ==================== FIND ADDRESS ====================
  {
    id: 'ADR-001',
    spec: 'tests/functional/find-address.spec.js',
    suite: 'Find Address',
    test: 'Verify find address button NOT present for non-FR countries',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'Non-FR (skipped for FR)',
    status: 'Active',
    precondition: 'Order created with account selected (beforeEach)',
    checks: 'Find Address button is NOT present for non-French countries'
  },
  {
    id: 'ADR-002',
    spec: 'tests/functional/find-address.spec.js',
    suite: 'Find Address',
    test: 'Verify find address button visibility based on country config',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created with account selected (beforeEach)',
    checks: 'Find Address button visibility matches country configuration (visible for FR, hidden for others)'
  },

  // ==================== FRANCE POSTCODE CHECKER ====================
  {
    id: 'FPC-001',
    spec: 'tests/functional/france-postcode-checker.spec.js',
    suite: 'France Postcode Checker',
    test: 'Test 01: Valid postcode and town - address found',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Find Address button visible; Modal opens; Postcode "75001" and town "PARIS" entered; Search returns results; First address selectable; "Use Selected Address" applies the address'
  },
  {
    id: 'FPC-002',
    spec: 'tests/functional/france-postcode-checker.spec.js',
    suite: 'France Postcode Checker',
    test: 'Test 02: Valid postcode, empty town - address found',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Find Address modal opens; Postcode "75001" entered with empty town; Search returns results; Address can be selected and applied'
  },
  {
    id: 'FPC-003',
    spec: 'tests/functional/france-postcode-checker.spec.js',
    suite: 'France Postcode Checker',
    test: 'Test 03: Invalid postcode - no results',
    category: 'Negative',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Find Address modal opens; Invalid postcode "99999" and "INVALIDTOWN" entered; Search returns no results; Cancel closes modal'
  },
  {
    id: 'FPC-004',
    spec: 'tests/functional/france-postcode-checker.spec.js',
    suite: 'France Postcode Checker',
    test: 'Test 04: Close modal via X button',
    category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Find Address modal opens; X (close) button closes the modal'
  },
  {
    id: 'FPC-005',
    spec: 'tests/functional/france-postcode-checker.spec.js',
    suite: 'France Postcode Checker',
    test: 'Test 05: API-created FR order - Find Address on edit',
    category: 'Integration',
    tags: '@module, @regression, @functional, @fr-only',
    country: 'FR',
    status: 'Active',
    precondition: 'FR API order created via ApiClient; Order indexed in OE',
    checks: 'API order creation returns 202; Order appears in OE after polling; Order details load; Edit mode accessible; Find Address button visible on the API-created order'
  },
  {
    id: 'FPC-006', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 06: One town several postcodes - each valid pair works', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'First order with 33520/BRUGES validates and submits; Second order with 33028/BRUGES validates and submits'
  },
  {
    id: 'FPC-007', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 07: Order not shipping to France - no postcode check', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order with non-FR Ship-To',
    checks: 'Placeholder - Ship-To set to non-FR country skips postcode validation'
  },
  {
    id: 'FPC-008', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 08: Town in different capitals - mixed case accepted', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Mixed case town "Bruges" with postcode 33520 accepted (case-insensitive validation)'
  },
  {
    id: 'FPC-009', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 09: Saint/St/Sainte/Ste variations accepted', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order with Saint/Sainte town',
    checks: 'Placeholder - Saint/St/Sainte/Ste variations all accepted'
  },
  {
    id: 'FPC-010', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 10: Town without accents - still accepted', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order with accented town',
    checks: 'Placeholder - Town typed without accents still accepted'
  },
  {
    id: 'FPC-011', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 11: Find an Address button is visible', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order created with Ship-To selected',
    checks: 'Find an Address button is visible on Header tab Ship-To section'
  },
  {
    id: 'FPC-012', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 12: Popup opens with current postcode and town pre-filled', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Ship-To postcode/town filled',
    checks: 'Find an Address modal opens; Current postcode and town pre-filled in modal'
  },
  {
    id: 'FPC-013', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 13: Change town in modal and click Search - list updates', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open',
    checks: 'Change town to BUDOS in modal; Click Search; List updates with new results'
  },
  {
    id: 'FPC-014', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 14: Search by partial town name "paris"', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open',
    checks: 'Partial town "paris" entered; Search returns matching results'
  },
  {
    id: 'FPC-015', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 15: Invalid postcode/town - No Results in modal', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open',
    checks: '99999/INVALIDTOWN entered; Search returns No Results; Use Selected Address disabled'
  },
  {
    id: 'FPC-016', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 16: Empty/invalid both fields - No Results', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open',
    checks: 'Both fields empty; Search returns No Results'
  },
  {
    id: 'FPC-017', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 17: Use selected address - updates Ship-To', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open and results available',
    checks: 'Address selected from list; Use Selected Address clicked; Modal closes; Ship-To updated'
  },
  {
    id: 'FPC-018', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 18: Selected address no district - district cleared', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order with Ship-To having district',
    checks: 'Placeholder - Select address without district; District field cleared on Ship-To'
  },
  {
    id: 'FPC-019', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 19: Cancel modal - nothing saved', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open and data changed',
    checks: 'Cancel button clicked; Modal closes; Ship-To not changed'
  },
  {
    id: 'FPC-020', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 20: Close via X - nothing saved', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open',
    checks: 'X button clicked; Modal closes; Ship-To not changed'
  },
  {
    id: 'FPC-021', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 21: Popup can be moved (manual/optional)', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Find Address modal open',
    checks: 'Modal opens and is displayed (drag test is manual/optional)'
  },
  {
    id: 'FPC-022', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 22: Hand-typed address validated on submit', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Hand-typed 33520/BRUGES validated and submitted successfully'
  },
  {
    id: 'FPC-023', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 23: Address from SAP search - validated', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order with Ship-To from SAP search',
    checks: 'Placeholder - SAP search address validated on submit'
  },
  {
    id: 'FPC-024', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 24: B2B order ingested - validated', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'B2B ingested FR order',
    checks: 'Placeholder - B2B ingested order validation applies same rules'
  },
  {
    id: 'FPC-025', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 25: Auto-approved order - validated', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order eligible for auto-approval',
    checks: 'Placeholder - Invalid address prevents auto-approval; valid address allows it'
  },
  {
    id: 'FPC-026', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 26: Error message in English', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with invalid postcode/town, English language',
    checks: 'Validation error visible; Error text contains "Ship-To" and "Post Code"'
  },
  {
    id: 'FPC-027', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 27: Error message in French', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'FR order with French language setting',
    checks: 'Placeholder - Error text contains "code postal" / "ville" in French'
  },
  {
    id: 'FPC-028', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 28: Find an Address in French and German', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'Language set to French/German',
    checks: 'Placeholder - Modal labels in selected language'
  },
  {
    id: 'FPC-029', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 29: Edit order - invalid then valid again', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order created with Ship-To',
    checks: 'Valid 33520/BRUGES validated; Changed to 33720/BRUGES - error; Fixed back to 33520/BRUGES - submit succeeds'
  },
  {
    id: 'FPC-030', spec: 'tests/functional/france-postcode-checker.spec.js', suite: 'France Postcode Checker',
    test: 'Test 30: Copy order - validation still applies', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Placeholder',
    precondition: 'Copied FR order',
    checks: 'Placeholder - Copy FR order; Same postcode validation applies on copied order'
  },

  // ==================== HEADER UDF ====================
  {
    id: 'UDF-H-001',
    spec: 'tests/functional/header-udf.spec.js',
    suite: 'Header UDF Fields',
    test: 'Test 408731: Verify Header UDF fields (SoldTo/Salesforce/Both)',
    category: 'Functional',
    tags: '@udf, @regression, @functional',
    country: 'UK',
    status: 'Active',
    precondition: 'UK only; API order created with UDF header data',
    checks: 'API order created (202); Order appears in OE; Order details load; Header UDFs visible in view mode; UDFs editable and saveable; UDF values captured; Copy Order button works; Copy Order modal and continue; New order page displays; Header tab shows; Copied UDF values match original values'
  },

  // ==================== LINE UDF ====================
  {
    id: 'UDF-L-001',
    spec: 'tests/functional/line-udf.spec.js',
    suite: 'Line UDF Fields',
    test: 'Test 408842: Verify Line UDF fields (SoldTo/Salesforce/Both)',
    category: 'Functional',
    tags: '@udf, @regression, @functional',
    country: 'UK',
    status: 'Active',
    precondition: 'UK only; API order created',
    checks: 'API order created (202); Order appears in OE; Order details load; Line UDFs visible in view mode; Order saved; First line UDF value captured; Copy Order works; Copy modal and continue; New order shows; Header tab displays; Line UDFs visible on copy; Copied line UDF value matches original'
  },

  // ==================== TEXT/OTHER TAB ====================
  {
    id: 'TXT-001',
    spec: 'tests/functional/text-other-tab.spec.js',
    suite: 'Text/Other Tab',
    test: 'Verify text/other tab displays correctly',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created and submitted (beforeEach)',
    checks: 'Text/Other tab is displayed and accessible; Text/Other table displays correctly with expected structure'
  },

  // ==================== COSTS & SOURCING TAB ====================
  {
    id: 'CST-TAB-001',
    spec: 'tests/functional/costs-sourcing-tab.spec.js',
    suite: 'Costs & Sourcing Tab',
    test: 'Verify costs sourcing tab displays correctly',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created with line items and submitted (beforeEach)',
    checks: 'Costs & Sourcing tab displayed; Table displayed with data; All expected columns present; Delivery Type dropdown options correct; Copy Order button visible'
  },

  // ==================== DELIVERY TYPES ====================
  {
    id: 'DLV-001',
    spec: 'tests/functional/delivery-types-cost-sourcing.spec.js',
    suite: 'Delivery Types Cost Sourcing',
    test: 'Test 408904: Delivery types in Cost & Source Tab',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated',
    checks: 'OE page loaded; Order created with items in Quick Add; Costs & Sourcing tab navigated to and displayed; Delivery type "DD" selected and verified in view mode; Delivery type changed to "BB"; Order saved; Costs & Sourcing tab re-verified; Delivery type "BB" persisted after save'
  },

  // ==================== REBATES TAB ====================
  {
    id: 'RBT-001',
    spec: 'tests/functional/rebates-tab.spec.js',
    suite: 'Rebates Tab',
    test: 'Verify rebates tab displays correctly',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created and submitted (beforeEach)',
    checks: 'Rebates tab is displayed and accessible; Rebates table displays correctly'
  },

  // ==================== BLOCKING & GROUPING TAB ====================
  {
    id: 'BLG-001',
    spec: 'tests/functional/blocking-grouping-tab.spec.js',
    suite: 'Blocking & Grouping Tab',
    test: 'Verify blocking grouping tab displays correctly',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'Order created and submitted (beforeEach)',
    checks: 'Blocking & Grouping tab is displayed and accessible; Blocking & Grouping table displays correctly'
  },

  // ==================== MAP LINK ====================
  {
    id: 'MAP-001',
    spec: 'tests/functional/map-link.spec.js',
    suite: 'MAP Link',
    test: 'MAP Link Functionality - verify MAP link opens and SAP number extraction',
    category: 'Functional',
    tags: '@smoke, @health-check, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated; Country config available',
    checks: 'OE page loaded; Order created with header fields; Quick Add tab with items; Items in cart verified; CC Part Number clickable; MAP link opens in new tab; SAP/MAT number extracted from MAP page; MAP tab closed; Order saved; Extracted MAT number is valid (truthy)'
  },

  // ==================== USER MANAGEMENT ====================
  {
    id: 'USR-001',
    spec: 'tests/functional/user-management.spec.js',
    suite: 'User Management',
    test: 'Verify user management page displays',
    category: 'Functional',
    tags: '@module, @regression, @functional',
    country: 'All',
    status: 'Active',
    precondition: 'User is authenticated; User has admin privileges (skipped if not)',
    checks: 'Admin navigation item detected; User Management page navigated to; Page displays correctly; User list is displayed'
  },
  {
    id: 'USR-002',
    spec: 'tests/functional/user-management.spec.js',
    suite: 'User Management',
    test: 'Test 245758: Edit User Details - Change Language',
    category: 'Functional',
    tags: '@module, @regression, @functional, @uk-only',
    country: 'UK',
    status: 'Active',
    precondition: 'User is authenticated; UK country only',
    checks: 'Navigate to OE Portal; Click user icon; Change language to German and save; Reopen and verify app is in German; Change back to English; Reopen and verify app is in English'
  },
  {
    id: 'USR-003',
    spec: 'tests/functional/user-management.spec.js',
    suite: 'User Management',
    test: 'Test 245759: Edit User Details - Change Language to French',
    category: 'Functional',
    tags: '@module, @regression, @functional, @uk-only',
    country: 'UK',
    status: 'Active',
    precondition: 'User is authenticated; UK country only',
    checks: 'Navigate to OE Portal; Click user icon; Change language to French and save; Reopen and verify app is in French; Change back to English; Reopen and verify app is in English'
  },

  // ==================== COSTS & SOURCING VALIDATION ====================
  {
    id: 'CSV-001', spec: 'tests/functional/costs-sourcing-validation.spec.js', suite: 'Costs & Sourcing Validation',
    test: 'TC#443325: Cost and sourcing validation not global', category: 'Functional',
    tags: '@module, @regression, @functional, @costs-sourcing', country: 'All', status: 'Active',
    precondition: 'Order with past due date in Costs & Sourcing',
    checks: 'Validation error only in Costs & Sourcing tab; Not shown in other tabs; Error clears after date update'
  },
  {
    id: 'CSV-002', spec: 'tests/functional/costs-sourcing-validation.spec.js', suite: 'Costs & Sourcing Validation',
    test: 'TC#453374: No contracts found message', category: 'Functional',
    tags: '@module, @regression, @functional, @costs-sourcing', country: 'All', status: 'Active',
    precondition: 'Material without active contract',
    checks: 'No contracts found message in red; Message shown for each material via Fast Changer'
  },
  {
    id: 'CSV-003', spec: 'tests/functional/costs-sourcing-validation.spec.js', suite: 'Costs & Sourcing Validation',
    test: 'TC#465198: Contract sourcing persistence', category: 'Functional',
    tags: '@module, @regression, @functional, @costs-sourcing', country: 'All', status: 'Active',
    precondition: 'Call-Off order with valid contract',
    checks: 'Contract ID preserved on save; Sourcing option preserved on copy; Contract selection retained after Find Contract'
  },
  {
    id: 'CSV-004', spec: 'tests/functional/costs-sourcing-validation.spec.js', suite: 'Costs & Sourcing Validation',
    test: 'TC#443343: BB/DD source options preserved for off-catalogue', category: 'Functional',
    tags: '@module, @regression, @functional, @costs-sourcing', country: 'All', status: 'Active',
    precondition: 'Ingest order with off-catalogue material',
    checks: 'BB/DD sourcing preserved across tab navigation; Supplier preserved; Works for catalogue items too'
  },
  {
    id: 'CSV-005', spec: 'tests/functional/costs-sourcing-validation.spec.js', suite: 'Costs & Sourcing Validation',
    test: 'TC#460671: Contract order sourcing validation scope', category: 'Functional',
    tags: '@module, @regression, @functional, @costs-sourcing', country: 'All', status: 'Active',
    precondition: 'Contract order type',
    checks: 'Error for contract lines only in Costs & Sourcing tab; Not global error'
  },

  // ==================== ZBUN PRICING ====================
  {
    id: 'ZBN-001', spec: 'tests/functional/zbun-pricing.spec.js', suite: 'ZBUN Pricing',
    test: 'TC#477302: ZBUN Component Pricing v Apportioning', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Sold-to with price lists and ZBUN materials',
    checks: 'Price lookup order correct; Unit sell no negative; ZMAT Not Priced; ZBUN apportioning; ZBUI pricing; Recalc works'
  },
  {
    id: 'ZBN-002', spec: 'tests/functional/zbun-pricing.spec.js', suite: 'ZBUN Pricing',
    test: 'TC#481577: ZBUN ZBUI pricing - SPT price not used for header', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'ZBUN/ZBUI parent materials available',
    checks: 'Header NOT from SPT; Components use SPT; Manual override allowed'
  },
  {
    id: 'ZBN-003', spec: 'tests/functional/zbun-pricing.spec.js', suite: 'ZBUN Pricing',
    test: 'TC#481576: ZBUN ZBUI pricing persistence on save', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'ZBUN/ZBUI materials on order',
    checks: 'Pricing persists after save; Persists in edit mode; Persists after submit; Recalc with Qty>1'
  },
  {
    id: 'ZBN-004', spec: 'tests/functional/zbun-pricing.spec.js', suite: 'ZBUN Pricing',
    test: 'TC#482429: ZBUN/ZBUI order submission Standard vs Contract', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'ZBUN/ZBUI materials with HAWA/NORM and DIEN/FRDL components',
    checks: 'Standard order submits; Contract order submits; ItemCateg correct'
  },

  // ==================== INTERNAL CONTRACT REF ====================
  {
    id: 'ICR-001', spec: 'tests/functional/internal-contract-ref.spec.js', suite: 'Internal Contract Reference',
    test: 'TC#450205: Internal Contract Ref persistence', category: 'Functional',
    tags: '@module, @regression, @functional, @us-only, @text-other', country: 'US', status: 'Active',
    precondition: 'US Sold-To with Internal Contract Reference',
    checks: 'Ref inherited from contract; Ref in payload; Manual override; Persistence after contract change; Blank option works'
  },
  {
    id: 'ICR-002', spec: 'tests/functional/internal-contract-ref.spec.js', suite: 'Internal Contract Reference',
    test: 'TC#453380: Contract ID saving in OE', category: 'Functional',
    tags: '@module, @regression, @functional, @us-only, @text-other', country: 'US', status: 'Active',
    precondition: 'US Sold-To with internal contract reference config',
    checks: 'Dropdown available; Fast Changer works; Reference saved; Reference persists after submit; SAP payload correct'
  },

  // ==================== RETURN LABEL ====================
  {
    id: 'RTL-001', spec: 'tests/functional/return-label.spec.js', suite: 'Return Label',
    test: 'TC#477751: GTTE Customer Carrier Account No field', category: 'Functional',
    tags: '@module, @regression, @functional, @us-only', country: 'US', status: 'Active',
    precondition: 'US Sold-To; Alpharetta/Livermore/Buffalo Grove warehouse',
    checks: 'Return Label popup opens; New field visible; Free text entry; 20-char limit; Field blank on copy; Optional field'
  },

  // ==================== PRODUCT SWAP ====================
  {
    id: 'PSW-001', spec: 'tests/functional/product-swap.spec.js', suite: 'Product Swap',
    test: 'TC#466635: Product swap preserves line values', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'Order with Customer Part No, Linked to line, Renewal date, Internal Contract Ref',
    checks: 'Only SKU/type/description updated; Source updated if different; Print switchboard unchanged; UDF text unchanged; Sell price behavior; Rebate behavior; Delivery blocks unchanged'
  },

  // ==================== TEXT/OTHER TEXTBOX ====================
  {
    id: 'TXT-001', spec: 'tests/functional/text-other-textbox.spec.js', suite: 'Text/Other Textbox',
    test: 'TC#450194: Line Level Text Box overlapping', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with large line text',
    checks: 'Text box resizes without overlapping; Other UI elements not impacted'
  },
  {
    id: 'TXT-002', spec: 'tests/functional/text-other-textbox.spec.js', suite: 'Text/Other Textbox',
    test: 'TC#453376: Second line text via Fast Changer', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with material',
    checks: 'First line text renders; Persists on save; Second line text renders; Both display correctly'
  },
  {
    id: 'TXT-003', spec: 'tests/functional/text-other-textbox.spec.js', suite: 'Text/Other Textbox',
    test: 'TC#440436: Text/Other line text lifecycle', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with material',
    checks: 'Line text created; Persists on save; Second text added; Switching between texts shows correct values; Both persist in view mode'
  },

  // ==================== DATE PICKERS ====================
  {
    id: 'DTP-001', spec: 'tests/functional/date-pickers.spec.js', suite: 'Date Pickers',
    test: 'TC#475654: Date popup boxes on order search page', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'User authenticated',
    checks: 'Calendar opens on search page; Calendar opens on Header tab; Calendar on Costs & Sourcing; Calendar on Text/Other renewal date'
  },
  {
    id: 'DTP-002', spec: 'tests/functional/date-pickers.spec.js', suite: 'Date Pickers',
    test: 'TC#475653: Engineering Services Start/Bill Date calendar', category: 'Functional',
    tags: '@module, @regression, @functional, @uk-only', country: 'UK', status: 'Active',
    precondition: 'UK order with Engineering Services material',
    checks: 'Job Details popup opens; Calendar icons work; Dates selectable and saved; Order submits'
  },
  {
    id: 'DTP-003', spec: 'tests/functional/date-pickers.spec.js', suite: 'Date Pickers',
    test: 'TC#472009: Renewal date decreased at every save', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with material',
    checks: 'Renewal date matches after save; Date unchanged on re-save without modifications'
  },

  // ==================== TRANSLATION & LOCALE ====================
  {
    id: 'TRN-001', spec: 'tests/functional/translation-locale.spec.js', suite: 'Translation & Locale',
    test: 'TC#467892: FR UI translations - S08 hotfix', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'Language set to FR',
    checks: 'MAP button; Filter labels in FR; Table headers in FR; Header tab translations; Quick Add translations; Costs & Sourcing translations; Text/Other translations; Blocking & Grouping tab name'
  },
  {
    id: 'TRN-002', spec: 'tests/functional/translation-locale.spec.js', suite: 'Translation & Locale',
    test: 'TC#467891: BE FR translation - S08 hotfix', category: 'Functional',
    tags: '@module, @regression, @functional, @be-only', country: 'BE', status: 'Active',
    precondition: 'Language set to FR in BE',
    checks: 'Rejected auto fix option in dropdown; Contrat in Order Type dropdown'
  },
  {
    id: 'TRN-003', spec: 'tests/functional/translation-locale.spec.js', suite: 'Translation & Locale',
    test: 'TC#460661: FR Address Validation - English messages appear', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order, language set to FR',
    checks: 'Validation errors in French; Save & Submit errors in French; Switch to EN shows English; Switch back to FR shows French'
  },
  {
    id: 'TRN-004', spec: 'tests/functional/translation-locale.spec.js', suite: 'Translation & Locale',
    test: 'TC#450200: Material Line Type resets to English', category: 'Functional',
    tags: '@module, @regression, @functional, @de-only', country: 'DE', status: 'Active',
    precondition: 'Language set to German; DE Sold-To',
    checks: 'Type field in German; Type stays German after navigating Costs & Sourcing and back; Type correct after save'
  },
  {
    id: 'TRN-005', spec: 'tests/functional/translation-locale.spec.js', suite: 'Translation & Locale',
    test: 'TC#443333: Refactoring - Locale formats', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'User profile with specific locale',
    checks: 'Correct language per locale; Correct date format per locale; Correct currency format per locale'
  },

  // ==================== VALIDATION ERRORS DISPLAY ====================
  {
    id: 'VER-001', spec: 'tests/functional/validation-errors-display.spec.js', suite: 'Validation Errors Display',
    test: 'TC#460672: Black frame at 4+ error lines', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with variable number of validation errors',
    checks: 'No frame for 1-3 errors; Black frame for 4 errors (no scrollbar); Black frame + scrollbar for >4 errors'
  },
  {
    id: 'VER-002', spec: 'tests/functional/validation-errors-display.spec.js', suite: 'Validation Errors Display',
    test: 'TC#450193: Validation error formatting FE', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with many validation errors',
    checks: 'All errors in same frame; Scrollbar for >4 errors'
  },
  {
    id: 'VER-003', spec: 'tests/functional/validation-errors-display.spec.js', suite: 'Validation Errors Display',
    test: 'TC#443345: Wrong formatting in error message', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with validation failure',
    checks: 'Error displayed with proper spacing and formatting on validate and submit'
  },
  {
    id: 'VER-004', spec: 'tests/functional/validation-errors-display.spec.js', suite: 'Validation Errors Display',
    test: 'TC#444466: Multiple displays of same error for line UDFs', category: 'Functional',
    tags: '@module, @regression, @functional, @uk-only', country: 'UK', status: 'Active',
    precondition: 'Order with empty line UDFs',
    checks: 'Errors displayed once per line; Same on validate and submit; French translation; German translation'
  },

  // ==================== TAB NAVIGATION POSITION ====================
  {
    id: 'TNP-001', spec: 'tests/functional/tab-navigation-position.spec.js', suite: 'Tab Navigation Position',
    test: 'TC#443331: Line position preserved on tab switch', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with 30+ line items',
    checks: 'Scroll position preserved in edit mode; Preserved in view mode'
  },
  {
    id: 'TNP-002', spec: 'tests/functional/tab-navigation-position.spec.js', suite: 'Tab Navigation Position',
    test: 'TC#460634: Line position on copy order', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with 30+ items',
    checks: 'Position preserved on tab switch; Position NOT carried to copied order'
  },
  {
    id: 'TNP-003', spec: 'tests/functional/tab-navigation-position.spec.js', suite: 'Tab Navigation Position',
    test: 'TC#450190: UI last line item position', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with multiple line items',
    checks: 'Position persists across tabled tabs; Persists after non-tabled tab; Same for new orders'
  },

  // ==================== UI ALIGNMENT ====================
  {
    id: 'UIA-001', spec: 'tests/functional/ui-alignment.spec.js', suite: 'UI Alignment',
    test: 'TC#450195: Tables alignments in OE - edit and view mode', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order in edit and view mode',
    checks: 'Select fields aligned; Special select fields correct; Autocomplete fields correct; Radio buttons correct; Consistent in both modes'
  },

  // ==================== REBATES & PRICING ====================
  {
    id: 'RBP-001', spec: 'tests/functional/rebates-pricing.spec.js', suite: 'Rebates & Pricing',
    test: 'TC#465879: Manual Rebates cost price shows 0.00 R', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order in edit mode with materials',
    checks: 'Cost price correct after rebate; Consistent across tab navigation including Costs & Sourcing'
  },
  {
    id: 'RBP-002', spec: 'tests/functional/rebates-pricing.spec.js', suite: 'Rebates & Pricing',
    test: 'TC#460632: Rebate/Supplier match error', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with cloned supplier rebates',
    checks: 'Error on mismatch; No error on match; Consistent on validate and submit'
  },

  // ==================== ACCOUNT & PARTNER DROPDOWNS ====================
  {
    id: 'APD-001', spec: 'tests/functional/account-partner-dropdowns.spec.js', suite: 'Account & Partner Dropdowns',
    test: 'TC#460624: Dropdown lists in search pop-ups', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'User authenticated',
    checks: 'CC Company dropdown renders; Country dropdown renders; Values selectable; Partner Function dropdowns work; Consistent on reopen'
  },

  // ==================== HEADER UDF SOLD-TO ====================
  {
    id: 'HUS-001', spec: 'tests/functional/header-udf-soldto.spec.js', suite: 'Header UDF Sold-To',
    test: 'TC#460660: Header UDF visibility on Sold-To change', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Sold-To with UDFs and Sold-To without UDFs',
    checks: 'Header UDF tab visible for UDF account; Tab hidden after switching to non-UDF account'
  },

  // ==================== SUPPLEMENTARY ACCOUNT ====================
  {
    id: 'SUP-001', spec: 'tests/functional/supplementary-account-contracts.spec.js', suite: 'Supplementary Account Contracts',
    test: 'TC#461951: Contract lookup with supplementary account', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Sold-to with supplementary account; Materials with contracts on main/supplementary/both',
    checks: 'Main-only contract found; Both-account contracts found; Supplementary-only contract found; No false No contracts found; Persistence in edit mode'
  },
  {
    id: 'SUP-002', spec: 'tests/functional/supplementary-account-contracts.spec.js', suite: 'Supplementary Account Contracts',
    test: 'TC#465662: Supplementary account set as itself', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Sold-to with itself as supplementary',
    checks: 'Contract displayed once; No duplicate in dropdown'
  },

  // ==================== FR ADDRESS SEARCH ENHANCED ====================
  {
    id: 'FAS-001', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#453381: FR District populated/cleared', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order',
    checks: 'District populated when address has district; District cleared when address without district'
  },
  {
    id: 'FAS-002', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#461079: FR Region preserved on address change', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with region selected',
    checks: 'Region unchanged after address change; Region preserved on save; Region preserved on copy'
  },
  {
    id: 'FAS-003', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#462403: Post code dropdown accuracy', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order',
    checks: 'Correct results for 95550/Bessancourt; Correct for postcode only; Correct for town only; No results for invalid codes'
  },
  {
    id: 'FAS-004', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#465661: FR search result matches search', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order',
    checks: 'Town search without wildcard; Partial name search works; Multiple results for common names'
  },
  {
    id: 'FAS-005', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#467888: FR Town from LIBELLE_ACHEMINEMENT', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order',
    checks: 'Town displayed from correct column; Consistent across searches'
  },
  {
    id: 'FAS-006', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#460635: FR Postcode fields pre-population', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order with Ship-To',
    checks: 'Fields pre-populated from Ship-To; Preserved on cancel/reopen; No Results on empty search; No Results on invalid search'
  },
  {
    id: 'FAS-007', spec: 'tests/functional/fr-address-search-enhanced.spec.js', suite: 'FR Address Search Enhanced',
    test: 'TC#460659: Postcode Checker UI boundaries', category: 'Functional',
    tags: '@module, @regression, @functional, @fr-only', country: 'FR', status: 'Active',
    precondition: 'FR order',
    checks: 'Modal cannot be dragged outside screen boundaries'
  },

  // ==================== SALESFORCE SEARCH ====================
  {
    id: 'SFS-001', spec: 'tests/functional/salesforce-search.spec.js', suite: 'Salesforce Search',
    test: 'TC#459524: OE retrieves Cases/Opportunities/Contacts from SF', category: 'Functional',
    tags: '@module, @regression, @functional, @salesforce', country: 'All', status: 'Active',
    precondition: 'Sold-To with SF Cases, Opportunities, Contacts',
    checks: 'Case search works; Opportunity search works; Contact search works; Fields populated correctly'
  },

  // ==================== ANGULAR REGRESSION ====================
  {
    id: 'ANG-001', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Account search from all places', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'User authenticated',
    checks: 'Account search from create order; From partner functions; Results correct'
  },
  {
    id: 'ANG-002', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Order info loads correctly', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Create/edit/save order',
    checks: 'Data persists; Values correct after save; Correct after navigation'
  },
  {
    id: 'ANG-003', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Common flows - create/edit/save/regenerate', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'User authenticated',
    checks: 'Create works; Edit works; Save works; Regenerate works; Tab navigation works'
  },
  {
    id: 'ANG-004', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Error pages display correctly', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Validation error scenario',
    checks: 'Error model loads; Navigation back works'
  },
  {
    id: 'ANG-005', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Copy order functionality', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Saved order',
    checks: 'Copy button works; New order created from copy'
  },
  {
    id: 'ANG-006', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Product search modal', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order in edit mode',
    checks: 'Modal opens; Products found; Products added; Modal closes'
  },
  {
    id: 'ANG-007', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Pricing display and update', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with materials',
    checks: 'Pricing displayed; Recalc works; Pricing persists after save'
  },
  {
    id: 'ANG-008', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Validation and submission', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Valid order',
    checks: 'Validation works; Submission works; No UI issues'
  },
  {
    id: 'ANG-009', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Order search and resize', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'User authenticated',
    checks: 'Search works; Layout adjusts on resize; No UI issues at different viewports'
  },
  {
    id: 'ANG-010', spec: 'tests/functional/angular-regression.spec.js', suite: 'Angular v21 Regression',
    test: 'TC#450192: Dropdowns and tab indicators', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Order with tabs',
    checks: 'oe-select placeholder works; Tab indicators correct; Behavior consistent after resize'
  },

  // ==================== MATERIAL DESCRIPTION LANGUAGE ====================
  {
    id: 'MDL-001', spec: 'tests/functional/material-description-lang.spec.js', suite: 'Material Description Language',
    test: 'TC#462405: Material description locale for SnD orders', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Ingested SnD order with multi-language material',
    checks: 'Description in correct locale language on Quick Add/Pricing'
  },
  {
    id: 'MDL-002', spec: 'tests/functional/material-description-lang.spec.js', suite: 'Material Description Language',
    test: 'TC#462405: Material description locale for ServiceNow orders', category: 'Functional',
    tags: '@module, @regression, @functional', country: 'All', status: 'Active',
    precondition: 'Ingested ServiceNow order with multi-language material',
    checks: 'Description in correct locale language on Quick Add/Pricing'
  },

];

const wb = XLSX.utils.book_new();

const headers = ['Test ID', 'Spec File', 'Test Suite', 'Test Name', 'Category', 'Tags', 'Country', 'Status', 'Preconditions', 'What It Checks / Verifies'];

const rows = tests.map(t => [
  t.id,
  t.spec,
  t.suite,
  t.test,
  t.category,
  t.tags,
  t.country,
  t.status,
  t.precondition,
  t.checks
]);

const wsData = [headers, ...rows];
const ws = XLSX.utils.aoa_to_sheet(wsData);

ws['!cols'] = [
  { wch: 12 },   // Test ID
  { wch: 50 },   // Spec File
  { wch: 30 },   // Test Suite
  { wch: 65 },   // Test Name
  { wch: 14 },   // Category
  { wch: 45 },   // Tags
  { wch: 18 },   // Country
  { wch: 22 },   // Status
  { wch: 50 },   // Preconditions
  { wch: 120 },  // Checks
];

XLSX.utils.book_append_sheet(wb, ws, 'Test Inventory');

// Summary sheet
const categoryCounts = {};
const suiteCounts = {};
const statusCounts = {};
const countryCounts = {};
tests.forEach(t => {
  categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
  suiteCounts[t.suite] = (suiteCounts[t.suite] || 0) + 1;
  statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
});

const summaryData = [
  ['ORDER ENGINE PLAYWRIGHT — TEST INVENTORY SUMMARY'],
  [`Generated: ${new Date().toISOString().split('T')[0]}`],
  [`Total Tests: ${tests.length}`],
  [],
  ['BY CATEGORY', 'Count'],
  ...Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
  [],
  ['BY STATUS', 'Count'],
  ...Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
  [],
  ['BY TEST SUITE', 'Count'],
  ...Object.entries(suiteCounts).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]),
];

const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
wsSummary['!cols'] = [{ wch: 45 }, { wch: 10 }];
XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

const outPath = path.join(__dirname, 'Order_Engine_Test_Inventory.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`Excel file generated: ${outPath}`);
console.log(`Total tests documented: ${tests.length}`);
