---
name: browser-testing
description: Use when opening, logging into, testing, debugging, or capturing screenshots of the local chat or admin web applications with browser automation.
---

# Browser Testing

Use Playwright browser tools to validate the local applications after starting
their development servers with `pnpm dev`.

## Local services

- Chat: `http://localhost:3000/`
- Admin: `http://localhost:3001/`
- Local Keycloak: `http://localhost:8080/`

The Docker services must be running before logging in.

## Local-only test account

- Username: `teacher1-by`
- Password: `password`

Never use these credentials outside the local development environment.

## Chat login

1. Open `http://localhost:3000/`.
2. Click `Mit VIDIS einloggen` if the app does not redirect directly to Keycloak.
3. At Keycloak, fill `Username or email` with the local test username.
4. Fill `Password` and click `Sign In`.
5. If the `Willkommen bei AIS.chat!` terms dialog appears, click `Akzeptieren`.
6. Confirm the browser returns to `http://localhost:3000/`.

For deterministic local login, navigating to
`http://localhost:3000/login?vidis_idp_hint=ais-chat-local` goes directly to
the local Keycloak provider.

## Admin login

1. Open `http://localhost:3001/`.
2. Click `Sign in with Keycloak`.
3. At Keycloak, fill `Username or email` and `Password` with the local test account.
4. Click `Sign In`.
5. Confirm the browser returns to `http://localhost:3001/` and the header contains `AIS.chat-admin` and `Sign out`.

## Validation workflow

1. Reuse an authenticated tab when its session remains valid; log in again after a redirect to login.
2. Use role, label, or test-id selectors rather than fragile CSS selectors.
3. Capture a screenshot of the relevant final UI state when validating a UI change or bug.
4. Report the URL visited, interactions performed, and pass/fail outcome.
5. If login fails, report the exact failing step and do not assume authentication succeeded.
