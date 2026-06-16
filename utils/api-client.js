const { getCountryConfig } = require('../data/constants/country-config');
const { API_ORDER_CONFIG } = require('../data/constants/api-order-config');
const { randomMessageReference, randomCustomerOrderRef, randomFutureDate } = require('../data/generators');

class ApiClient {
  constructor(country) {
    this.baseUrl = process.env.API_BASE_URL || 'http://ccecmsrvs001.computacenter.com:7096';
    this.username = process.env.API_USERNAME || 'inbordersit';
    this.password = process.env.API_PASSWORD || 'inboundorder';
    this.createEndpoint = process.env.API_CREATE_ENDPOINT || '/api/v1/create';
    this.getEndpoint = process.env.API_GET_ENDPOINT || '/api/v1/orders';
    this.country = country || process.env.COUNTRY || 'UK';
  }

  _authHeader() {
    const encoded = Buffer.from(`${this.username}:${this.password}`).toString('base64');
    return `Basic ${encoded}`;
  }

  async createOrder(orderRequest) {
    const url = `${this.baseUrl}${this.createEndpoint}`;
    console.log(`[API] Creating order at: ${url}`);
    console.log(`[API] Order ref: ${orderRequest.orderHeader.customerOrderReference}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this._authHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderRequest),
    });

    const status = response.status;
    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => '');
    }

    console.log(`[API] Response status: ${status}`);
    if (status !== 202 && status !== 200) {
      console.error(`[API] Unexpected status ${status}:`, body);
    }

    return { status, body };
  }

  async getOrder(orderReference) {
    const url = `${this.baseUrl}${this.getEndpoint}/${orderReference}`;
    console.log(`[API] Getting order: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this._authHeader(),
        'Content-Type': 'application/json',
      },
    });

    const status = response.status;
    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text().catch(() => '');
    }

    return { status, body };
  }

  _generateMessageReference() {
    const base = 'healthchecxkaszxjssjtsx1zscsd12ed1dsd1d1xc22xqce3x2jswd1s2s611s122121swss2wgs1zias2x22x23xed21xa2s2a2s23g1sf2222212jxt211fdj22f2j2dj1j1ffj1z1fj2sz11jsffd12wfg1f1ff2de1daf12111122111c11111111';
    const chars = base.split('');
    for (let i = 0; i < 3; i++) {
      const pos = 1 + Math.floor(Math.random() * (chars.length - 2));
      const c = chars[pos];
      chars[pos] = /\d/.test(c)
        ? String(Math.floor(Math.random() * 10))
        : String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(8, 17);
    return chars.join('') + '-' + ts;
  }

  _getCustomerID(countryCode) {
    const map = { UK: 'PA_UK', FR: 'PA_FR', DE: 'PA_DE', US: 'PA_US_TAKEDA', BE: 'PA_BE', NL: 'PA_NL' };
    return map[countryCode] || 'PA_UK';
  }

  buildOrderRequest(overrides = {}) {
    const countryConfig = getCountryConfig(this.country);
    const apiConfig = API_ORDER_CONFIG[countryConfig.code] || API_ORDER_CONFIG.UK;
    const now = new Date();
    const timestamp = now.toISOString();
    const futureDate = randomFutureDate();
    const orderRef = overrides.customerOrderReference || randomCustomerOrderRef();

    return {
      transactionHeader: {
        messageReference: this._generateMessageReference(),
        messageTimeStamp: timestamp,
        fromUserID: 'DummyUser',
        fromPassword: 'ToBeReplaced',
        fromApplication: 'BTP IS',
        fromApplicationCountryCode: apiConfig.fromApplicationCountryCode,
        sendServer: 'cis-ei-test.it-cpi005.cfapps.eu20.hana.ondemand.com',
        sendTimeStamp: timestamp,
        externalFormat: 'cXML',
      },
      orderHeader: {
        actionType: 'new',
        orderVersion: '1',
        customerID: this._getCustomerID(countryConfig.code),
        salesOffice: '',
        shipComplete: '',
        currencyCode: apiConfig.currencyCode,
        orderLanguageCode: apiConfig.orderLanguageCode,
        customerOrderReference: orderRef,
        sfOwnerEmployeeNumber: '',
        customerRequisitionID: '',
        contractNumber: '',
        oneTouchExtQuoteID: '',
        dateCustomerOrdered: timestamp.replace('Z', '').split('.')[0],
        dateDeliveryRequired: timestamp.replace('Z', '').split('.')[0],
        soldTo: {
          postalAddress: {
            addressNumber: apiConfig.soldToAddressNumber,
            cusAddressNumber: '', name1: '', name2: '', name3: '', name4: '',
            street: '', street4: '', city: '', district: '', stateOrCounty: '',
            postcode: '', country: '', countryCode: '', poBoxCity: '',
          },
        },
        billTo: {
          postalAddress: {
            addressNumber: apiConfig.billToAddressNumber,
            cusAddressNumber: '', name1: '', name2: '', name3: '', name4: '',
            street: '', street4: '', city: '', district: '', stateOrCounty: '',
            postcode: '', country: '', countryCode: '', poBoxCity: '',
          },
        },
        payer: {
          postalAddress: {
            addressNumber: apiConfig.payerAddressNumber,
            cusAddressNumber: '', name1: '', name2: '', name3: '', name4: '',
            street: '', street4: '', city: '', district: '', stateOrCounty: '',
            postcode: '', country: '', countryCode: '', poBoxCity: '',
          },
        },
        shipTo: {
          postalAddress: {
            addressNumber: apiConfig.shipToAddressNumber,
            cusAddressNumber: '', name1: '', name2: '', name3: '', name4: '',
            street: '', street4: '', city: '', district: '', stateOrCounty: '',
            postcode: '', country: '', countryCode: '', poBoxCity: '', careOf: '',
          },
          deliveryContactDetails: {
            contactFullName: 'Nick',
            contactEmail: 'Nick@cc.com',
            contactPhoneNumber: { number: '111111' },
          },
        },
        buyerContactDetails: {
          contactFullName: 'Connection Test',
          contactEmail: 'connection@cc.com',
          contactPhoneNumber: { number: '5555555' },
        },
        udfs: {
          udf: [{ fieldName: 'Mandatory UDF', fieldValue: '34' }],
        },
        textTypes: {
          textType: [{ textTypeCode: 'Z012', text: ['AutoTest text'], attachment: '' }],
        },
        ...(overrides.orderHeader || {}),
      },
      orderLines: {
        orderLine: overrides.orderLines || [
          {
            orderLineNumber: '1',
            cusLineNumber: '1',
            itemNumber: apiConfig.orderLineItemNumber,
            cusItemNumber: '',
            itemDescription: '',
            quantity: '1',
            unitPrice: '',
            unitOfMeasure: 'PCE',
            manufacturerName: '',
            manufacturerItemNumber: '',
            dateDeliveryRequired: timestamp.replace('Z', '').split('.')[0],
            serviceFlag: '',
            rebateSchemeId: '',
            schemeVersion: '',
            rebateSchemeValue: '',
            udfs: {
              udf: [{ fieldName: 'LL_UDF1', fieldValue: 'test' }],
            },
            textTypes: {
              textType: [{ textTypeCode: 'ZVIA', text: ['line text test'], attachment: '' }],
            },
          },
        ],
      },
    };
  }

  async createOrderForCountry(overrides = {}) {
    const request = this.buildOrderRequest(overrides);
    const result = await this.createOrder(request);
    return {
      ...result,
      orderReference: request.orderHeader.customerOrderReference,
      request,
    };
  }
}

module.exports = { ApiClient };
