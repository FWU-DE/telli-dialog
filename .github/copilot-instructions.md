---
applyTo: '**'
---

# Project general instructions

## Context

You are assisting with a full-stack TypeScript project consisting of:

- Node.js backend
- TurboRepo for managing multiple packages
- Next.js with app router
- React frontend with server components
- TailwindCSS for styling
- shadcn/ui component library
- Vitest for unit testing
- Playwright for end-to-end testing
- Business logic belongs in services, not in UI components or routes

Follow the instructions below when generating or modifying code.

## General principles

- Always write TypeScript, never plain JavaScript.
- Prefer clean, readable, maintainable code over clever solutions.
- Follow modular architecture and keep files small.
- Avoid code duplication.

## Project structure

- apps/admin/ --> contains the admin web application
- apps/api/ --> contains the public REST API
- apps/dialog/ --> contains the main web application
- packages/shared/ --> contains shared code for Next.js apps, mainly types, services, and utilities that can be used in admin and dialog apps
- packages/shared-core/ --> contains cross-app shared utilities used by all apps (admin, dialog, api)
- packages/ai-core/ --> contains logic to communicate with AI providers and LLMs
- packages/api-database/ --> contains database access logic and models for the api app
- packages/ui/src/components/ --> contains reusable shadcn UI components
- packages/ui/src/styles/globals.css --> contains global styles, theme, tailwind customizations

## Naming conventions

- Use camelCase for variables and functions.
- Use PascalCase for classes and interfaces.
- Use UPPER_SNAKE_CASE for constants.

## UI components

- Prefer React Server Components when possible.
- Use client components only when needed (state, events, browser APIs).
- Keep components small and reusable.
- Prefer composition over complex props.
- Prefer shadcn components from @telli/ui before creating custom UI components.
- Follow the patterns used by shadcn components.
- Take accessibility into account when designing UI components.
- Ensure that components are responsive.
- Check for cross-browser compatibility.
- Check that all text content is internationalized and can be easily translated.

File organization:

apps/<app_name>/src/components/ --> specific components for use case in the app
apps/<app_name>/src/components/common/ --> reusable UI components
apps/<app_name>/src/components/hooks/ --> custom hooks
apps/<app_name>/src/components/utils/ --> custom utility functions

## State Management

- Prefer React hooks.
- Keep state close to where it is used.
- Avoid global state unless necessary.

## Error handling

- Use try-catch blocks to handle exceptions.

## Logging

- Use a consistent logging framework for debugging and monitoring.
- # Do not log to console.
- Use the functions from packages/shared/src/logging/logging.ts for consistent logging.
- Avoid direct console.\* in application code; use the shared logging helpers instead (console may be OK in scripts/tests).

## Comments

- Write comments only when the intent is not obvious.
- Write comments only for reusable functions or components.
- Prefer self-explanatory code over excessive comments.
- Comments are written in English.

## Unit Testing (Vitest)

Only write tests when the user asks for them.

## Verification Commands

- After making any file changes, run `pnpm format`, then `pnpm lint`, and then `pnpm test` from the repository root.
- Treat formatting, lint, and test issues as blocking: fix problems when possible before finishing.
- If verification cannot be run (for example, due to missing dependencies or environment limitations), clearly report that.
