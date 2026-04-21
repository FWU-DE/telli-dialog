---
name: implement-story
description: 'Connect to Jira and retrieve acceptance criteria from Jira ticket. Plan the implementation based on the acceptance criteria. Implement the story. Use when asked to implement a story.'
---

## When to use

Use this skill when the user asks to:

- Implement a story based on acceptance criteria from a Jira ticket
- Stories start with prefix "TD-" followed by the ticket number, e.g. "TD-1234"

## Steps to implement a story

- Connect to Jira and retrieve the description from the Jira ticket.
- Use script scripts/jira-description.ts to parse the description field from the Jira ticket.
- The description contains what to do and the acceptance criteria for the story.
- Plan the implementation based on the description and acceptance criteria. Break down the implementation into smaller tasks if necessary.
- Ask questions if anything is unclear or if you need more information to implement the story.
- If you are on main branch, create a new feature branch for the story using the naming convention "feat/TD-1234" where "TD-1234" is the ticket number.
- Implement unit tests for the story if applicable, especially if the story includes new features or changes existing functionality.
- Implement the story based on the acceptance criteria and the implementation plan.
- Verify that the implementation meets all acceptance criteria and all tests pass.

## Validate

- All acceptance criteria from the Jira ticket are implemented and met.
- All tests pass successfully.
- run scripts 'format', 'lint' and 'check-types' to ensure there are no formatting, linting or type errors.
- It is sufficient to run the scripts only once at the end of implementation.
