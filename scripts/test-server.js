#!/usr/bin/env node
/**
 * Order Engine Playwright Test Server
 * Comprehensive backend: serves UI, runs tests, streams logs, parses results,
 * maintains run history, and supports comparison between runs.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { URL } = require('url');

const PORT = process.env.PORT || 8080;
const PROJECT_ROOT = path.resolve(__dirname, '..');
const HTML_PATH = path.join(PROJECT_ROOT, 'test-runner.html');
const RESULTS_JSON = path.join(PROJECT_ROOT, 'test-results', 'results.json');
const HISTORY_DIR = path.join(PROJECT_ROOT, 'test-results', 'history');
const HISTORY_FILE = path.join(HISTORY_DIR, 'run-history.json');

let testProcess = null;
let logBuffer = [];
const MAX_LOGS = 5000;
let lastResults = { passed: 0, failed: 0, skipped: 0, totalTime: 0, totalExpected: 0 };
let isRunning = false;
let runStartTime = null;
let currentSuite = '';
let currentCountry = '';
let currentEnv = '';

const SUITE_MAP = {
  'regression':       { grep: '@regression', label: 'Regression Tests' },
  'health-check':     { grep: '@health-check', label: 'Health Checks' },
  'smoke':            { grep: '@smoke', label: 'Smoke Tests' },
  'functional':       { grep: '@functional', label: 'Functional Tests' },
  'api':              { grep: '@api', label: 'API Tests' },
  'udf':              { grep: '@udf', label: 'UDF Tests' },
  'create-order':     { file: 'tests/functional/create-order.spec.js', label: 'Create Order' },
  'order-creation':   { file: 'tests/functional/order-creation.spec.js', label: 'Order Creation' },
  'order-edit':       { file: 'tests/functional/order-edit.spec.js', label: 'Order Edit' },
  'reject-order':     { file: 'tests/functional/reject-order.spec.js', label: 'Reject Order' },
  'quick-add-pricing':{ file: 'tests/functional/quick-add-pricing.spec.js', label: 'Quick Add / Pricing' },
  'search-products':  { file: 'tests/functional/search-for-product.spec.js', label: 'Search Products' },
  'search-materials': { file: 'tests/functional/search-add-materials.spec.js', label: 'Search & Add Materials' },
  'costs-sourcing':   { file: 'tests/functional/costs-sourcing-tab.spec.js', label: 'Costs & Sourcing Tab' },
  'delivery-types':   { file: 'tests/functional/delivery-types-cost-sourcing.spec.js', label: 'Delivery Types' },
  'blocking-grouping':{ file: 'tests/functional/blocking-grouping-tab.spec.js', label: 'Blocking & Grouping Tab' },
  'rebates':          { file: 'tests/functional/rebates-tab.spec.js', label: 'Rebates Tab' },
  'text-other':       { file: 'tests/functional/text-other-tab.spec.js', label: 'Text/Other Tab' },
  'messages':         { file: 'tests/functional/messages.spec.js', label: 'Messages' },
  'change-sold-to':   { file: 'tests/functional/change-sold-to-account.spec.js', label: 'Change Sold-To Account' },
  'change-currency':  { file: 'tests/functional/change-currency.spec.js', label: 'Change Currency' },
  'find-address':     { file: 'tests/functional/find-address.spec.js', label: 'Find Address' },
  'france-postcode':  { file: 'tests/functional/france-postcode-checker.spec.js', label: 'France Postcode Checker' },
  'copy-order':       { file: 'tests/functional/copy-order.spec.js', label: 'Copy Order' },
  'bulk-upload':      { file: 'tests/functional/bulk-upload.spec.js', label: 'Bulk Upload' },
  'user-management':  { file: 'tests/functional/user-management.spec.js', label: 'User Management' },
  'map-link':         { file: 'tests/functional/map-link.spec.js', label: 'MAP Link' },
  'header-udf':       { file: 'tests/functional/header-udf.spec.js', label: 'Header UDF Fields' },
  'line-udf':         { file: 'tests/functional/line-udf.spec.js', label: 'Line UDF Fields' },
  'validate-order':   { file: 'tests/functional/validate-order-sold-to.spec.js', label: 'Validate Order' },
  'submit-order':     { file: 'tests/functional/submit-order-sold-to.spec.js', label: 'Submit Order' },
  'api-order':        { file: 'tests/functional/api-order-creation.spec.js', label: 'API Order Creation' },
  'oe-login':         { file: 'tests/functional/oe-login-orders.spec.js', label: 'OE Login Orders' },
  'salesforce':       { file: 'tests/functional/salesforce-order-creation.spec.js', label: 'Salesforce' },
  'browser-nav':      { file: 'tests/smoke/browser-navigation.spec.js', label: 'Browser Navigation' },
  'login':            { file: 'tests/positive/login.spec.js', label: 'Login' },
};

function addLog(line, type = 'info') {
  logBuffer.push({ ts: Date.now(), line, type });
  if (logBuffer.length > MAX_LOGS) logBuffer.shift();
}

function parsePlaywrightOutput(data) {
  const str = data.toString();
  const lines = str.split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    let type = 'info';
    if (/^\s*[✓✔]/.test(line) || /passed/.test(line)) type = 'pass';
    else if (/^\s*[✗✘×]/.test(line) || /failed|error|timeout/i.test(line)) type = 'error';
    else if (/^\s*[-–]/.test(line) || /skipped/i.test(line)) type = 'warn';
    addLog(line, type);

    if (/^\s*[✓✔]/.test(line)) lastResults.passed++;
    if (/^\s*[✗✘×]/.test(line)) lastResults.failed++;
    if (/^\s*[-–]\s+\d+/.test(line) && /skipped/i.test(line)) lastResults.skipped++;

    const summaryPassed = line.match(/(\d+)\s+passed/);
    const summaryFailed = line.match(/(\d+)\s+failed/);
    const summarySkipped = line.match(/(\d+)\s+skipped/);
    if (summaryPassed) lastResults.passed = parseInt(summaryPassed[1], 10);
    if (summaryFailed) lastResults.failed = parseInt(summaryFailed[1], 10);
    if (summarySkipped) lastResults.skipped = parseInt(summarySkipped[1], 10);

    const totalMatch = line.match(/Running\s+(\d+)\s+tests?\s+using/i);
    if (totalMatch) lastResults.totalExpected = parseInt(totalMatch[1], 10);
  }
}

function buildPlaywrightArgs(country, env, suites, headless) {
  const args = ['playwright', 'test'];

  if (suites && suites.length > 0) {
    const first = suites[0];
    const mapping = SUITE_MAP[first];

    if (mapping && mapping.file) {
      args.push(mapping.file);
    } else if (mapping && mapping.grep) {
      args.push('--grep', mapping.grep);
    } else if (first === 'regression') {
      args.push('--grep', '@regression');
    } else {
      const patterns = suites.map(s => {
        const m = SUITE_MAP[s];
        return m ? (m.grep || '') : '';
      }).filter(Boolean);
      if (patterns.length > 0) {
        args.push('--grep', `(${patterns.join('|')})`);
      }
    }
  }

  args.push('--reporter=list,json');
  return args;
}

function runTests(country, env, suites, headless) {
  if (isRunning) return { ok: false, error: 'Tests already running' };

  logBuffer = [];
  lastResults = { passed: 0, failed: 0, skipped: 0, totalTime: 0, totalExpected: 0 };
  isRunning = true;
  runStartTime = Date.now();
  currentSuite = (suites && suites.length > 0) ? suites.join(', ') : 'all';
  currentCountry = country || 'UK';
  currentEnv = env || 'local';

  const envVars = {
    ...process.env,
    COUNTRY: currentCountry,
    ENV: env === 'uat' ? 'uat' : 'local',
    HEADLESS: headless === false ? 'false' : 'true',
    PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/results.json',
  };

  const args = buildPlaywrightArgs(country, env, suites, headless);

  addLog(`╔══════════════════════════════════════════════════════════════╗`);
  addLog(`║  Order Engine Playwright - Test Execution Starting          ║`);
  addLog(`╠══════════════════════════════════════════════════════════════╣`);
  addLog(`║  Country: ${currentCountry.padEnd(10)} Environment: ${currentEnv.padEnd(10)}       ║`);
  addLog(`║  Suite:   ${currentSuite.padEnd(49)}║`);
  addLog(`║  Headless: ${(headless !== false ? 'Yes' : 'No').padEnd(48)}║`);
  addLog(`╚══════════════════════════════════════════════════════════════╝`);
  addLog(`Command: npx ${args.join(' ')}`);
  addLog('');

  const proc = spawn('npx', args, {
    cwd: PROJECT_ROOT,
    env: envVars,
    shell: true,
  });

  testProcess = proc;

  proc.stdout.on('data', parsePlaywrightOutput);
  proc.stderr.on('data', parsePlaywrightOutput);

  proc.on('close', (code) => {
    const elapsed = ((Date.now() - runStartTime) / 1000).toFixed(1);
    lastResults.totalTime = parseFloat(elapsed);
    testProcess = null;
    isRunning = false;

    addLog('');
    addLog(`${'─'.repeat(62)}`);
    addLog(`  Run finished: ${lastResults.passed} passed, ${lastResults.failed} failed, ${lastResults.skipped} skipped (${elapsed}s)`);
    addLog(`${'─'.repeat(62)}`);

    setTimeout(() => {
      try { saveRunHistory(); } catch (e) { console.error('Failed to save history:', e.message); }
    }, 2000);
  });

  proc.on('error', (err) => {
    addLog(`Process error: ${err.message}`, 'error');
    testProcess = null;
    isRunning = false;
  });

  return { ok: true, suite: currentSuite, country: currentCountry, env: currentEnv };
}

function killTests() {
  if (!testProcess) return { ok: true, message: 'No tests running' };
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', testProcess.pid, '/f', '/t'], { shell: true });
    } else {
      process.kill(-testProcess.pid, 'SIGTERM');
    }
    addLog('Kill signal sent to test process.', 'warn');
    return { ok: true };
  } catch (e) {
    try { testProcess.kill('SIGTERM'); } catch (_) {}
    addLog(`Kill attempt: ${e.message}`, 'warn');
    return { ok: true };
  }
}

function loadParsedResults() {
  try {
    if (!fs.existsSync(RESULTS_JSON)) return null;
    const raw = fs.readFileSync(RESULTS_JSON, 'utf8');
    const data = JSON.parse(raw);
    return transformPlaywrightResults(data);
  } catch (e) {
    console.error('Failed to parse results.json:', e.message);
    return null;
  }
}

function transformPlaywrightResults(raw) {
  const result = {
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    totalExecutionTimeMs: 0,
    reportGeneratedAt: new Date().toISOString(),
    environment: currentEnv === 'uat' ? 'UAT' : 'SIT',
    runSuiteName: currentSuite || 'all',
    testResults: {},
    countryBreakdown: {},
  };

  const suites = raw.suites || [];

  function extractTests(suite) {
    const tests = [];
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const projectName = test.projectName || test.projectId || '';
        let country = 'UK';
        const countryMatch = projectName.match(/(UK|US|DE|BE|NL|FR)/i);
        if (countryMatch) country = countryMatch[1].toUpperCase();
        else if (currentCountry) country = currentCountry.toUpperCase();

        const lastResult = (test.results && test.results.length > 0) ? test.results[test.results.length - 1] : {};
        let status = (lastResult.status || test.status || 'skipped').toUpperCase();
        if (status === 'EXPECTED') status = 'PASSED';
        if (status === 'UNEXPECTED') status = 'FAILED';
        if (status === 'FLAKY') status = 'PASSED';

        const duration = lastResult.duration || 0;
        const error = lastResult.error || null;
        const attachments = lastResult.attachments || [];
        const screenshot = attachments.find(a => a.name === 'screenshot' && a.path);

        tests.push({
          testClass: suite.title || spec.file || '',
          testMethod: spec.title || '',
          status,
          executionTimeMs: duration,
          country,
          failureReason: error ? (error.message || '') : '',
          errorDetails: error ? (error.snippet || error.stack || '') : '',
          screenshot: screenshot ? screenshot.path : '',
          file: spec.file || '',
          steps: [],
        });
      }
    }
    for (const child of (suite.suites || [])) {
      tests.push(...extractTests(child));
    }
    return tests;
  }

  const allTests = [];
  for (const suite of suites) {
    allTests.push(...extractTests(suite));
  }

  for (const t of allTests) {
    result.totalTests++;
    if (t.status === 'PASSED') result.passedTests++;
    else if (t.status === 'FAILED') result.failedTests++;
    else result.skippedTests++;
    result.totalExecutionTimeMs += t.executionTimeMs;

    const c = t.country;
    if (!result.testResults[c]) result.testResults[c] = [];
    result.testResults[c].push(t);

    if (!result.countryBreakdown[c]) {
      result.countryBreakdown[c] = { total: 0, passed: 0, failed: 0, skipped: 0, executionTimeMs: 0 };
    }
    const cb = result.countryBreakdown[c];
    cb.total++;
    if (t.status === 'PASSED') cb.passed++;
    else if (t.status === 'FAILED') cb.failed++;
    else cb.skipped++;
    cb.executionTimeMs += t.executionTimeMs;
  }

  return result;
}

function saveRunHistory() {
  const results = loadParsedResults();
  if (!results || results.totalTests === 0) return;

  if (!fs.existsSync(HISTORY_DIR)) {
    fs.mkdirSync(HISTORY_DIR, { recursive: true });
  }

  let history = [];
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) { history = []; }

  const entry = {
    timestamp: new Date().toISOString(),
    suite: currentSuite,
    country: currentCountry,
    env: currentEnv,
    totalTests: results.totalTests,
    passedTests: results.passedTests,
    failedTests: results.failedTests,
    skippedTests: results.skippedTests,
    totalExecutionTimeMs: results.totalExecutionTimeMs,
    countryBreakdown: results.countryBreakdown,
  };

  history.push(entry);
  if (history.length > 50) history = history.slice(-50);

  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  console.log('Run history saved:', entry.timestamp);
}

function loadComparison() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return null;
    const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    if (history.length < 2) return null;

    const current = history[history.length - 1];
    const previous = history[history.length - 2];

    const execTimeCurrent = (current.totalExecutionTimeMs / 1000 / 60).toFixed(1) + ' min';
    const execTimePrev = (previous.totalExecutionTimeMs / 1000 / 60).toFixed(1) + ' min';
    const execTimeChange = ((current.totalExecutionTimeMs - previous.totalExecutionTimeMs) / 1000 / 60).toFixed(1) + ' min';
    const rateCurrent = current.totalTests > 0 ? ((current.passedTests / current.totalTests) * 100).toFixed(1) + '%' : '0%';
    const ratePrev = previous.totalTests > 0 ? ((previous.passedTests / previous.totalTests) * 100).toFixed(1) + '%' : '0%';
    const rateDiff = (parseFloat(rateCurrent) - parseFloat(ratePrev)).toFixed(1);

    const comparison = {
      currentRun: current.timestamp,
      previousRun: previous.timestamp,
      totalTests: { current: current.totalTests, previous: previous.totalTests, change: current.totalTests - previous.totalTests },
      passedTests: { current: current.passedTests, previous: previous.passedTests, change: current.passedTests - previous.passedTests },
      failedTests: { current: current.failedTests, previous: previous.failedTests, change: current.failedTests - previous.failedTests },
      skippedTests: { current: current.skippedTests || 0, previous: previous.skippedTests || 0, change: (current.skippedTests || 0) - (previous.skippedTests || 0) },
      executionTime: { current: execTimeCurrent, previous: execTimePrev, change: execTimeChange },
      successRate: { current: rateCurrent, previous: ratePrev, change: (rateDiff >= 0 ? '+' : '') + rateDiff + 'pp' },
      countryComparison: {},
    };

    const allCountries = new Set([
      ...Object.keys(current.countryBreakdown || {}),
      ...Object.keys(previous.countryBreakdown || {}),
    ]);

    for (const c of allCountries) {
      const cur = (current.countryBreakdown || {})[c] || { total: 0, passed: 0, failed: 0, skipped: 0, executionTimeMs: 0 };
      const prev = (previous.countryBreakdown || {})[c] || { total: 0, passed: 0, failed: 0, skipped: 0, executionTimeMs: 0 };
      comparison.countryComparison[c] = {
        passedChange: cur.passed - prev.passed,
        failedChange: cur.failed - prev.failed,
        skippedChange: (cur.skipped || 0) - (prev.skipped || 0),
        timeChange: cur.executionTimeMs - prev.executionTimeMs,
      };
    }

    return comparison;
  } catch (e) {
    console.error('Failed to load comparison:', e.message);
    return null;
  }
}

function loadHistory() {
  try {
    if (!fs.existsSync(HISTORY_FILE)) return [];
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function serveHTML() {
  return fs.readFileSync(HTML_PATH, 'utf8');
}

function sendJSON(res, data, code = 200) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(data));
}

function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (pathname === '/' || pathname === '/test-runner.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(serveHTML());
    return;
  }

  if (pathname === '/run-test' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { country = 'UK', env = 'local', suites = [], headless = true } = JSON.parse(body || '{}');
        const result = runTests(country, env, suites, headless);
        sendJSON(res, result);
      } catch (e) {
        sendJSON(res, { ok: false, error: e.message }, 400);
      }
    });
    return;
  }

  if (pathname === '/logs' && method === 'GET') {
    sendJSON(res, { lines: logBuffer.map(l => l.line) });
    return;
  }

  if (pathname === '/status' && method === 'GET') {
    const elapsed = runStartTime ? ((Date.now() - runStartTime) / 1000).toFixed(1) : 0;
    sendJSON(res, {
      running: isRunning,
      passed: lastResults.passed,
      failed: lastResults.failed,
      skipped: lastResults.skipped,
      totalTime: lastResults.totalTime || parseFloat(elapsed),
      totalExpected: lastResults.totalExpected,
      suiteStatus: isRunning ? 'RUNNING' : (lastResults.failed > 0 ? 'FAILED' : 'COMPLETED'),
      suite: currentSuite,
      country: currentCountry,
      env: currentEnv,
    });
    return;
  }

  if (pathname === '/kill-tests' && method === 'POST') {
    sendJSON(res, killTests());
    return;
  }

  if (pathname === '/results' && method === 'GET') {
    const results = loadParsedResults();
    sendJSON(res, results || { totalTests: 0, passedTests: 0, failedTests: 0, skippedTests: 0, testResults: {}, countryBreakdown: {} });
    return;
  }

  if (pathname === '/comparison' && method === 'GET') {
    sendJSON(res, loadComparison());
    return;
  }

  if (pathname === '/history' && method === 'GET') {
    sendJSON(res, loadHistory());
    return;
  }

  if (pathname === '/report' && method === 'GET') {
    const proc = spawn('npx', ['playwright', 'show-report'], {
      cwd: PROJECT_ROOT,
      detached: true,
      stdio: 'ignore',
      shell: true,
    });
    proc.unref();
    sendJSON(res, { ok: true, message: 'Report opening' });
    return;
  }

  if (pathname === '/suites' && method === 'GET') {
    const suiteList = Object.entries(SUITE_MAP).map(([id, info]) => ({
      id,
      label: info.label,
      type: info.grep ? 'tag' : 'file',
    }));
    sendJSON(res, suiteList);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n  Order Engine Test Runner`);
  console.log(`  ───────────────────────`);
  console.log(`  UI:      http://localhost:${PORT}`);
  console.log(`  API:     http://localhost:${PORT}/status`);
  console.log(`  Results: http://localhost:${PORT}/results`);
  console.log(`  History: http://localhost:${PORT}/history\n`);
});
