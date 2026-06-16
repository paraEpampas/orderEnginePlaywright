const { BasePage } = require('../../base.page');

class HeaderTabPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    this.headerTab = page.locator("div[data-name='Header']");
    this.headerUdfsTab = page.locator("div[data-name='Header UDFs']");
    this.quickAddPricingTab = page.locator("div[data-name='Quick add / pricing']");
    this.rebatesTab = page.locator("div[data-name='Rebates']");
    this.costsSourcingTab = page.locator("div[data-name='Costs & Sourcing']");
    this.textOtherTab = page.locator("div[data-name='Text/Other']");
    this.blockingGroupingTab = page.locator("div[data-name='Blocking & Grouping']");
    this.orderTitle = page.locator('h2.order');
    this.logoText = page.locator("p:has-text('Order Engine')");

    this.customerOrderRef = page.locator("oe-input[formcontrolname='orderCustomerReference'] input, input[formcontrolname='orderCustomerReference']").first();
    this.additionalCustomerOrderRef = page.locator("oe-input[formcontrolname='orderCustAddReference'] input");
    this.requestedDeliveryDate = page.locator("oe-datepicker[formcontrolname='deliveryDate'] input");
    this.dateCustomerOrder = page.locator("oe-datepicker[formcontrolname='orderDate'] input");
    this.orderType = page.locator("oe-select[formcontrolname='orderType']");
    this.salesOffice = page.locator("oe-select[formcontrolname='salesOffice']");
    this.warehouse = page.locator("oe-select[formcontrolname='warehouse']");
    this.customerPOType = page.locator("oe-select[formcontrolname='code']");
    this.shippingType = page.locator("oe-select[formcontrolname='shippingType']");
    this.shippingCondition = page.locator("oe-select[formcontrolname='shippingCondition']");
    this.incoTerms = page.locator("oe-select[formcontrolname='incoTerms']");
    this.incoTermsText = page.locator("oe-input[formcontrolname='incoTermsText'] input").or(
      page.locator("div:has-text('Incoterms Text') input").first()
    );
    this.billingOption = page.locator("oe-select[formcontrolname='billingOption']");
    this.currencySelector = page.locator("select[formcontrolname='currency']");

    this.soldToDisplay = page.locator("button:has-text('Sold-To')");
    this.shipToSection = page.locator('div').filter({ has: page.locator(':text-is("Ship-To:")') }).locator('button:has-text("SEARCH")').first();
    this.billToDisplay = page.locator("button:has-text('Bill-To')");
    this.payerDisplay = page.locator("button:has-text('Payer')");

    this.shipToDropdown = page.locator('div').filter({ has: page.locator(':text-is("Ship-To:")') }).first();
    this.billToDropdown = page.locator('div').filter({ has: page.locator(':text-is("Bill-To:")') }).first();
    this.payerDropdown = page.locator('div').filter({ has: page.locator(':text-is("Payer:")') }).first();

    this.findAddressButton = page.locator("button:has-text('FIND AN ADDRESS'), button:has-text('Find address'), button:has-text('Find an Address')").first();
  }
}

module.exports = { HeaderTabPage };
