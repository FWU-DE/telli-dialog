# AGENTS.md

Conventions every agent (human or AI) should follow in this repo. Distilled from real PR feedback — see the PR each rule cites for context.

## Package manager & tooling

- **pnpm only.** Never `npm` or `yarn`. The workspace is `pnpm-workspace.yaml`, the lockfile is `pnpm-lock.yaml`.
- **Do not add `pnpm.onlyBuiltDependencies` without team discussion.** Dependabot + the lockfile cover the supply-chain angle; an explicit allowlist drifts and breaks native deps (esbuild / swc / sharp / parcel) silently. (PR #929, rlaerm)
- **Run the three CI gates locally before pushing:**
  ```sh
  pnpm --filter chat-bot format:check
  pnpm --filter chat-bot lint
  pnpm --filter chat-bot check-types
  ```
  Format / lint / type failures land as red X's on the PR and stall review.

## Repo layout

- **Server actions live with their route, not under `/api/`.**
  Put `actions.ts` in the route folder it belongs to:
  - `apps/chat-bot/src/app/(authed)/(chat-bot)/<feature>/actions.ts`
  - `apps/chat-bot/src/app/api/<feature>/<feature>-service.ts` is for the underlying service module consumed by the action.

  Example: the learning-scenario preview action lives at
  `app/(authed)/(chat-bot)/learning-scenarios/actions.ts`, the service it
  calls lives at `app/api/shared-chat/learning-scenario-preview-service.ts`.
  (PR #936, rlaerm)

- **`.gitignore`**: `.env*` already matches every `.env` file anywhere in
  the tree — don't add path-specific copies for subfolders. (PR #929, rlaerm)

## UI layout

- **`DefaultPageLayout` owns the page frame.** When a route wraps its
  contents in `<DefaultPageLayout layoutConfig={...}>`, the layout already
  provides the page chrome:
  - height (`h-full`)
  - width (`max-w-5xl mx-auto`)
  - horizontal padding (`px-6`)
  - the chat / image / form header

  Components rendered **inside** `DefaultPageLayout` should use `h-full`,
  not `h-dvh`, and should not duplicate `max-w-5xl` / `mx-auto` / horizontal
  padding. Doing so creates a nested page within the page.

  Components rendered **standalone** (the public `(unauth)` student-facing
  shared-chat routes are the canonical example) own their own frame and
  can use `h-dvh`. (PR #936, rlaerm — `learning-scenario-preview-chat.tsx`)

## Chat services

- **One streaming pipeline per chat type.** The learning-scenario streaming
  flow (file/URL retrieval → RAG chunks → system prompt → message pruning →
  image formatting → billed streaming → RabbitMQ event) lives in
  `apps/chat-bot/src/app/api/shared-chat/learning-scenario-stream.ts`.

  New learning-scenario surfaces (share, preview, embed, …) call
  `streamLearningScenarioReply(...)` with their own pre-checks (auth,
  expiry, budget) and an `onUsage` callback that decides where the tokens
  get accounted. Don't copy-paste the pipeline. (PR #936, rlaerm)

- Same principle for the other chat domains — assistant session
  (`api/chat/chat-service.ts`), character chat
  (`api/character/character-chat-service.ts`), shared chat
  (`api/shared-chat/shared-chat-service.ts`). Common building blocks
  (`limitChatHistory`, `formatMessagesWithImages`, `createTextStream`,
  `generateTextStreamWithBilling`) are not optional duplication points —
  reach for the existing helper before writing a parallel one.

## Copy & localization

- **Don't address the user directly in user-facing copy.** Avoid
  `du / dir / dich / dein / Sie / Ihre` in `messages/de.json` and in any
  inline German string a user actually reads. Use neutral / passive /
  nominal phrasing.

  ✗ `"Beim Prompt brauchst du Hilfe? Bildassistenten nutzen →"`
  ✓ `"Hilfe beim Prompt? Bildassistenten nutzen →"`

  ✗ `"Ich helfe dir, dein Bild durch einen verbesserten Prompt zu verfeinern."`
  ✓ `"Verfeinerung des Bildes durch einen verbesserten Prompt."`

  System prompts that you send **to the LLM** are exempt — those are
  instructions to the model, not user-facing copy. (PR #930, elenamahartana)

- **User-visible strings belong in `messages/de.json`**, not inline
  in `.tsx`. If you must inline a string (because it interpolates a
  runtime value the i18n setup can't handle), still apply the
  no-direct-address rule.

## Product / UX review

- **New user-visible features need UX sign-off before maintainer code
  review.** Loop Elena (`@elenamahartana`) in early — maintainers will
  block a code review on a PR that introduces new UX surface area
  without one. (PR #930, PR #934, elenamahartana / rlaerm)

## Token tracking on non-persisted chats

- When a chat flow **does not persist messages** (e.g. the teacher-side
  scenario preview), token usage still has to land on a real budget so
  the flow can't be abused to bypass limits. The current pattern is to
  write to `conversation_usage_tracking` keyed by a client-supplied
  `previewSessionId` (validated as UUID server-side) without inserting
  a `conversations` row.

  If you touch this pattern, surface it to `@recursive-hub` /
  `@AsamMax` for review — there's an open question on whether the cost
  accounting is correct when no conversation row exists. (PR #936,
  rlaerm; tagged `@recursive-hub` and `@AsamMax`)
