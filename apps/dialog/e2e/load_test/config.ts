// export const BASE_URL = 'https://chat-staging.telli.schule';
export const BASE_URL = 'http://localhost:3000';

export const SAVE_SCREENSHOTS = true;

export const WAIT_TIMES_IN_MS = {
  PAGE_LOAD: 5000, // Time to wait for a new page to load
  PAGE_ELEMENT_TIMEOUT: 10000, // Maximum time to wait for an element to appear
  ELEMENT_LOAD: 1000, // Time to wait for elements to load after actions
  POLL_TIME: 1000, // Time to wait between polling attempts
};

export const SELECTORS = {
  LOGIN_BUTTON: 'button[aria-label="Mit VIDIS einloggen"]',
  USERNAME_INPUT: 'input[placeholder="Enter any login"]',
  PASSWORD_INPUT: 'input[placeholder="and password"]',
  SIGN_IN_BUTTON: 'button[type="submit"]',
  LLM_DROPDOWN: 'button[aria-label="Select Llm Dropdown"]',
  LLAMA_MODEL: 'button[aria-label="Select meta-llama/Meta-Llama-3.1-8B-Instruct Model"]',
  LLAMA_MODEL_NAME: 'Llama-3.1-8B',
  GPT_MODEL: 'button[aria-label="Select gpt-4o-mini Model"]',
  GPT_MODEL_NAME: 'GPT-4o-mini',
  MESSAGE_INPUT: 'textarea[placeholder="Wie kann ich Dir helfen?"]',
  SEND_BUTTON: 'button[aria-label="Nachricht abschicken"]',
  AI_MESSAGE: '[aria-label="assistant message 1"]',
};

export const DEFAULT_PROMPT = `Ich bin eine Lehrerin an einer Schule und unterrichte ein technisches Fach. 
Wie kann ich dennoch dazu beitragen, den Schülerinnen und Schülern soziale Werte zu vermitteln?`;

export const SCREENSHOT_FOLDERS = {
  SUCCESS_RESULTS: 'e2e/load_test/success-results',
  ERROR_RESULTS: 'e2e/load_test/error-results',
};

export const HEADLESS_BROWSER_OPTIONS = {
  scenarios: {
    ui_with_browser: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 10 }, // Ramp up gradually
        { duration: '2m', target: 50 }, // Moderate load
        { duration: '2m', target: 100 }, // Peak load
        { duration: '5m', target: 100 }, // Sustain peak
        { duration: '1m', target: 0 }, // Ramp down
      ],
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
  scenarios: {
    ui_test: {
      executor: 'constant-vus',
      vus: 1, // Only run 1 user to see the UI
      duration: '2m', // Run long enough for debugging
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};
