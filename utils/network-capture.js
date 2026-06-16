const { expect } = require('@playwright/test');

/**
 * Utility for intercepting and asserting on API network requests during Playwright tests.
 * Wraps page.waitForResponse() with JSON body parsing and structured assertion helpers.
 */
class NetworkCaptureHelper {
  constructor(page) {
    this.page = page;
    this.captures = [];
  }

  /**
   * Capture a response matching a URL pattern while performing an action.
   * @param {Object} options
   * @param {string|RegExp} options.urlPattern - URL substring or regex to match
   * @param {Function} options.action - async function that triggers the request
   * @param {string} [options.method] - HTTP method filter (GET, POST, PUT, etc.)
   * @param {number} [options.timeout=60000] - max wait time in ms
   * @returns {Object} { url, status, method, headers, body }
   */
  async captureResponse({ urlPattern, action, method, timeout = 60000 }) {
    const matchFn = (response) => {
      const url = response.url();
      const urlMatches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      if (!urlMatches) return false;
      if (method && response.request().method().toUpperCase() !== method.toUpperCase()) return false;
      return true;
    };

    const [response] = await Promise.all([
      this.page.waitForResponse(matchFn, { timeout }),
      action(),
    ]);

    const result = {
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
      requestHeaders: response.request().headers(),
      responseHeaders: response.headers(),
      requestBody: null,
      responseBody: null,
    };

    try {
      const postData = response.request().postData();
      if (postData) {
        try {
          result.requestBody = JSON.parse(postData);
        } catch {
          result.requestBody = postData;
        }
      }
    } catch { /* no post data */ }

    try {
      result.responseBody = await response.json();
    } catch {
      try {
        result.responseBody = await response.text();
      } catch { /* empty response */ }
    }

    this.captures.push(result);
    return result;
  }

  /**
   * Capture multiple responses matching a pattern while performing an action.
   * Useful when an action triggers multiple API calls.
   */
  async captureMultipleResponses({ urlPattern, action, method, timeout = 60000, count = 5 }) {
    const results = [];
    const matchFn = (response) => {
      const url = response.url();
      const urlMatches = typeof urlPattern === 'string'
        ? url.includes(urlPattern)
        : urlPattern.test(url);
      if (!urlMatches) return false;
      if (method && response.request().method().toUpperCase() !== method.toUpperCase()) return false;
      return true;
    };

    const collectPromise = (async () => {
      const start = Date.now();
      while (Date.now() - start < timeout && results.length < count) {
        try {
          const remaining = timeout - (Date.now() - start);
          if (remaining <= 0) break;
          const response = await this.page.waitForResponse(matchFn, { timeout: remaining });
          const entry = {
            url: response.url(),
            status: response.status(),
            method: response.request().method(),
            requestBody: null,
            responseBody: null,
          };
          try {
            const postData = response.request().postData();
            if (postData) entry.requestBody = JSON.parse(postData);
          } catch { /* no post data */ }
          try {
            entry.responseBody = await response.json();
          } catch { /* non-json */ }
          results.push(entry);
        } catch {
          break;
        }
      }
    })();

    await action();
    await this.page.waitForTimeout(3000);
    await Promise.race([collectPromise, new Promise(r => setTimeout(r, timeout))]);

    this.captures.push(...results);
    return results;
  }

  /**
   * Assert that a captured request body contains expected fields.
   */
  static assertRequestBodyContains(captured, expectedFields) {
    expect(captured, 'Captured response should exist').toBeTruthy();
    expect(captured.requestBody, 'Request body should exist').toBeTruthy();
    const body = typeof captured.requestBody === 'string'
      ? JSON.parse(captured.requestBody)
      : captured.requestBody;

    for (const [key, expectedValue] of Object.entries(expectedFields)) {
      const actualValue = getNestedValue(body, key);
      if (expectedValue instanceof RegExp) {
        expect(String(actualValue), `Request body field "${key}" should match pattern`).toMatch(expectedValue);
      } else if (expectedValue === undefined) {
        expect(actualValue, `Request body should contain field "${key}"`).toBeDefined();
      } else {
        expect(actualValue, `Request body field "${key}" should equal expected value`).toEqual(expectedValue);
      }
    }
  }

  /**
   * Assert that a captured response body contains expected fields.
   */
  static assertResponseBodyContains(captured, expectedFields) {
    expect(captured, 'Captured response should exist').toBeTruthy();
    expect(captured.responseBody, 'Response body should exist').toBeTruthy();
    const body = typeof captured.responseBody === 'string'
      ? JSON.parse(captured.responseBody)
      : captured.responseBody;

    for (const [key, expectedValue] of Object.entries(expectedFields)) {
      const actualValue = getNestedValue(body, key);
      if (expectedValue instanceof RegExp) {
        expect(String(actualValue), `Response body field "${key}" should match pattern`).toMatch(expectedValue);
      } else if (expectedValue === undefined) {
        expect(actualValue, `Response body should contain field "${key}"`).toBeDefined();
      } else {
        expect(actualValue, `Response body field "${key}" should equal expected value`).toEqual(expectedValue);
      }
    }
  }

  /**
   * Assert a captured request was successful (2xx status).
   */
  static assertSuccess(captured) {
    expect(captured, 'Captured response should exist').toBeTruthy();
    expect(captured.status, `Expected 2xx status, got ${captured.status}`).toBeGreaterThanOrEqual(200);
    expect(captured.status, `Expected 2xx status, got ${captured.status}`).toBeLessThan(300);
  }

  /**
   * Assert a captured request returned an error status.
   */
  static assertError(captured, expectedStatus) {
    expect(captured, 'Captured response should exist').toBeTruthy();
    if (expectedStatus) {
      expect(captured.status).toBe(expectedStatus);
    } else {
      expect(captured.status).toBeGreaterThanOrEqual(400);
    }
  }

  /**
   * Get all captured requests (useful for debugging).
   */
  getAllCaptures() {
    return this.captures;
  }

  /**
   * Clear captured request history.
   */
  clearCaptures() {
    this.captures = [];
  }
}

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current) && /^\d+$/.test(key)) {
      current = current[parseInt(key, 10)];
    } else {
      current = current[key];
    }
  }
  return current;
}

module.exports = { NetworkCaptureHelper };
