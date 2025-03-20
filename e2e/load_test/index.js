'use strict';
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all) __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if ((from && typeof from === 'object') || typeof from === 'function') {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, {
          get: () => from[key],
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
        });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, '__esModule', { value: true }), mod);

// e2e/load_test/index.ts
var index_exports = {};
__export(index_exports, {
  LOAD_TEST_OPTIONS: () => LOAD_TEST_OPTIONS,
  default: () => main,
  options: () => options,
});
module.exports = __toCommonJS(index_exports);
var import_browser = require('k6/browser');

// e2e/load_test/const.ts
var BASE_URL = 'http://localhost:3000';

// e2e/load_test/index.ts
var LOAD_TEST_OPTIONS = {
  scenarios: {
    ui_with_browser: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '30s', target: 10 },
        // { duration: '1m', target: 500 },
        // { duration: '1m', target: 1000 },
        // { duration: '2m', target: 1000 },
        // { duration: '30s', target: 0 },
      ],
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate>0.9'],
    // 90% of checks must pass
    http_req_duration: ['p(95)<5000'],
    // 95% of requests must complete within 5s
  },
};
var TEST_OPTIONS = {
  scenarios: {
    ui_test: {
      executor: 'constant-vus',
      vus: 1,
      // Only run 1 user to see the UI
      duration: '2m',
      // Run long enough for debugging
      options: {
        browser: {
          type: 'chromium',
          // Required to enable browser execution
        },
      },
    },
  },
};
var options = TEST_OPTIONS;
function getUserNameByNumber(n) {
  if (n % 2 === 0) {
    return `teacher_test_${n}`;
  }
  if (n % 2 !== 0) {
    return `student_test_${n}`;
  }
  throw Error('Math not mathing');
}
async function main() {
  const context = await import_browser.browser.newContext({
    // headless: false // For debugging
  });
  await context.clearCookies();
  const page = await context.newPage();
  const userIndex = __VU + __ITER;
  const userName = getUserNameByNumber(userIndex);
  try {
    await page.goto(`${BASE_URL}/login?mocklogin=true`);
    await page.screenshot({ path: `debug-before-login-${userIndex}.png` });
    const loginButton = page.locator('button[aria-label="Login with VIDIS"]');
    await loginButton.waitFor();
    await loginButton.click();
    await page.fill('input[placeholder="Enter any login"]', userName);
    await page.fill('input[placeholder="and password"]', 'test');
    const signInButton = page.locator('button[type="submit"]');
    await signInButton.waitFor();
    await signInButton.click();
    await page.waitForTimeout(1e3);
    const authorizeButton = page.locator('button[type="submit"]');
    await authorizeButton.waitFor();
    await authorizeButton.click();
    await page.waitForTimeout(2e3);
    await sendMessage('Wieviel ist 2+2?', page);
    await page.waitForTimeout(1e4);
    await sendMessage('Wieviel ist 3+3?', page);
    await page.waitForTimeout(1e4);
  } catch (error) {
    console.error('Error during test execution:', error);
    await page.screenshot({ path: `error-screenshot-${userIndex}.png` });
  } finally {
    page.close();
    context.close();
  }
}
async function sendMessage(text, page) {
  const inputField = page.locator('textarea[placeholder="Wie kann ich Dir helfen?"]');
  await inputField.waitFor();
  await inputField.fill(text);
  const sendMessageButton = page.locator('button[aria-label="Send Message"]');
  await sendMessageButton.waitFor();
  await sendMessageButton.click();
}
// Annotate the CommonJS export names for ESM import in node:
0 &&
  (module.exports = {
    LOAD_TEST_OPTIONS,
    options,
  });
