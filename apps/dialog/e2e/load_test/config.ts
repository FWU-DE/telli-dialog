export const BASE_URL = __ENV.LOADTEST_BASE_URL || 'https://chat-staging.telli.schule';
//export const BASE_URL = 'http://localhost:3000';

export const WAIT_TIMES_IN_MS = {
  PAGE_ELEMENT_TIMEOUT: 10_000, // Maximum time to wait for an element to appear
  AI_MESSAGE_TIMEOUT: 30_000, // Maximum time to wait for a chat message to appear
  FILE_UPLOAD_TIMEOUT: 30_000, // Time to wait for file uploads
};

export const SELECTORS = {
  USERNAME_INPUT: 'input[placeholder="Username"]',
  PASSWORD_INPUT: 'input[placeholder="Password"]',
  LOGIN_BUTTON: 'button[type="submit"]',
  LLM_DROPDOWN: 'button[aria-label="Select Llm Dropdown"]',
  LLAMA_MODEL: 'button[aria-label="Select meta-llama/Meta-Llama-3.1-8B-Instruct Model"]',
  LLAMA_MODEL_NAME: 'Llama-3.1-8B',
  GPT_MODEL: 'button[aria-label="Select gpt-4o-mini Model"]',
  GPT_MODEL_NAME: 'GPT-4o-mini',
  MESSAGE_INPUT: 'textarea[placeholder="Wie kann ich Dir helfen?"]',
  SEND_BUTTON: 'button[aria-label="Nachricht abschicken"]',
  AI_MESSAGE: '[aria-label="assistant message 1"]',
  RELOAD_BUTTON: '[aria-label="Reload"]',
  PROFILE_BUTTON: '[aria-label="profileDropdown"]',
  DROPDOWN_WRAPPER: 'div[data-radix-popper-content-wrapper]',
};

export const SCREENSHOT_FOLDERS = {
  SUCCESS_RESULTS: './e2e/load_test/success-results',
  ERROR_RESULTS: './e2e/load_test/error-results',
};

export const HEADLESS_BROWSER_OPTIONS = {
  cloud: {
    distribution: {
      distributionLabel1: { loadZone: 'amazon:de:frankfurt', percent: 100 },
    },
  },
  scenarios: {
    ui_with_browser: {
      executor: 'constant-vus',
      vus: 100,
      duration: '5m', // Run long enough for debugging
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate>0.95'], // 95% of checks must pass
    http_req_duration: ['p(95)<10000'], // 95% of requests must complete within 10s
    browser_web_vital_fcp: ['p(95)<3000'], // First Contentful Paint
    browser_web_vital_lcp: ['p(95)<5000'], // Largest Contentful Paint
  },
};

export const VISIBLE_BROWSER_OPTIONS = {
  cloud: {
    distribution: {
      distributionLabel1: { loadZone: 'amazon:de:frankfurt', percent: 100 },
    },
  },
  scenarios: {
    ui_test: {
      executor: 'constant-vus',
      vus: 1, // Only run 1 user to see the UI
      duration: '20m', // Run long enough for debugging
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};
