---
applyTo: '**'
---

# Project general instructions

## Context

You are assisting with a full-stack TypeScript project consisting of:

- Node.js backend
- turbo monorepo for managing multiple packages
- next.js with app router
- react frontend with server components
- TailwindCSS for styling
- shadcn/ui component library
- Vitest for unit testing
- Playwright for end-to-end testing
- Business logic belongs in services, not in ui components or routes

Follow the instructions below when generating or modifying code.

## General principles

- Always write TypeScript, never plain JavaScript.
- Prefer clean, readable, maintainable code over clever solutions.
- Follow modular architecture and keep files small.
- Avoid code duplication.

## Project structure

- apps/admin/ --> contains the admin web application
- apps/api/ --> contains the public rest api
- apps/dialog/ --> contains the main web application
- packages/shared/ --> contains shared code, mainly types, services and utilities
- packages/ui/src/components --> shadcn components
- packages/ui/src/styles/globals.css --> global styles, theme, tailwind customizations

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

File organization:

apps/_/src/components/ --> specific components for use case in the app
apps/_/src/components/common/ --> reusable UI components
apps/_/src/components/hooks/ --> custom hooks
apps/_/src/components/utils/ --> custom utility functions

## State Management

- Prefer React hooks.
- Keep state close to where it is used.
- Avoid global state unless necessary.

## Error handling

- Use try-catch blocks to handle exceptions.

## Logging

- Use a consistent logging framework for debugging and monitoring.
- Do not log to console.

## Comments

- Write comments only when the intent is not obvious.
- Prefer self-explanatory code over excessive comments.

## Unit Testing (Vitest)

Only write tests when the user asks for them.
