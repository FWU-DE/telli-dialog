---
name: implement-story
description: 'Connect to Jira and retrieve acceptance criterias from Jira ticket. Plan the implementation based on the acceptance criterias. Implement the story. Use when asked to implement a story.'
---

## When to use

Use this skill when the user asks to:

- Implement a story based on acceptance criterias from a Jira ticket
- Stories start with prefix "TD-" followed by the ticket number, e.g. "TD-1234"
- The acceptance criterias are listed in the Jira ticket description

## Steps to implement a story

- Connect to Jira and retrieve the acceptance criterias from the Jira ticket.
- Use script scripts/jira-description.ts to parse the acceptance criterias from the Jira ticket description.
- Plan the implementation based on the acceptance criterias.
- Ask questions if any acceptance criteria is unclear or if you need more information to implement the story.
- If you are on main branch, create a new branch for the story using the naming convention "feat/TD-1234" where "TD-1234" is the ticket number.
- Implement unit tests for the story if applicable, especially if the story includes new features or changes to existing functionality.
- Implement the story based on the acceptance criterias and the implementation plan.
- Verify that the implementation meets all acceptance criterias and that all tests pass.

## Validate

- All acceptance criterias from the Jira ticket are implemented and met.
- All tests pass successfully.
- run scripts 'format', 'lint' and 'check-types' to ensure there are no formatting, linting or type errors.
