---
name: browser-testing
description: 'Validate frontend changes in telli-dialog with browser automation. Use when asked to open web app locally, log in via VIDIS, reproduce UI bugs, verify visual fixes, and capture screenshots.'
---

# Browser Testing for telli-dialog

Use this skill to validate frontend changes directly in the running web app.

## When to use

Use this skill when the user asks to:

- Open the web app and verify UI behavior
- Reproduce a frontend bug in the browser
- Validate a visual fix after code changes
- Capture screenshot evidence of UI state

## Environment assumptions

- Local app entry URL: http://localhost:3000/
- The required local auth provider is available
- Browser tools are available in the current Copilot session

## Local test login (VIDIS)

Use this local-only test account for browser validation.

- Username: teacher1-by
- Password: password

Login steps:

1. Navigate to http://localhost:3000/
2. Click button with text: Mit VIDIS einloggen
3. On the sign-in page, enter username and password above
4. Click Sign In
5. Confirm redirect back to http://localhost:3000/

## Default frontend validation workflow

1. Open or reuse a browser page at http://localhost:3000/
2. Log in via the VIDIS steps above
3. Navigate to the target UI area
4. Reproduce the issue with the requested interactions
5. Apply code fix if needed
6. Re-open the affected UI interaction
7. Capture screenshot(s) with the relevant UI open
8. Report outcome and include whether issue is fixed or still reproducible

## Evidence expectations

For each validation run:

- Include at least one screenshot of the target UI state
- State what was clicked and what was observed
- Explicitly state pass/fail for the reported issue

## Notes

- This account is intended for local testing only.
- Prefer deterministic selectors (role/label/text) and avoid brittle selectors when possible.
- If login fails, report the exact failing step and stop assumptions.
