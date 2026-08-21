# TD-1469 calculator spike

## Scope

`calculate` is a generic-chat-only assistant tool. It is registered when no
character, learning scenario, or assistant context is selected; custom contexts
deliberately do not receive it. The chat service persists a non-excluded
assistant tool-call message and its tool-result message, preserving the call ID.
Tool-result content is JSON produced by the calculator tool.

Registration coverage belongs at the `buildTools` seam: its existing registry
tests prove generic inclusion and custom-context exclusion. Repeating that
assertion in this chat-service test would require mocking the registry builder
and would not test registration behavior.

## Supported surface

The calculator supports broad scalar mathjs functions, constants, and units.
Meta, mutation, reparser, collection, matrix, range, generator, and data
functions, plus nondeterministic `random`, are rejected. Conversions use `to`.

Deliberate exclusions include unknown symbols, blacklisted functions, unsupported
operators, assignments, indirect calls, comparisons, factorials, arrays/indexing,
objects, ranges, blocks, conditionals, strings, and non-finite or complex results.

## Determinism and process boundary

The tool limits input to 1,000 bytes and worker output to 8,192 bytes. Runtime
validation limits are 200 AST nodes, depth 32, 100 literals, exponent magnitude
1,000, and cost 1,000. Stable error codes include `INVALID_INPUT`,
`FUNCTION_NOT_ALLOWED`, `OPERATOR_NOT_ALLOWED`, `INVALID_NODE`,
`EXPONENT_NOT_ALLOWED`, `EXPRESSION_TOO_COMPLEX`, `NONFINITE_RESULT`,
`EXPRESSION_TIMEOUT`, and `PROTOCOL_ERROR`. Malformed expressions currently
are normalized as `INVALID_EXPRESSION`.

The module lazily creates a warm workerpool process pool with 1–4 workers, a
16-task replica-local queue, and a 3-second task timeout. `terminateCalculatorPool`
is exported for tests and graceful pool recreation. The module also installs
one-time `SIGTERM`/`SIGINT` handlers: shutdown marks the pool unavailable, lets
active tasks finish within the bounded termination timeout, and then exits.
Standalone deployment must include worker/runtime source and a full Node.js
runtime.

## Evidence collection

The deterministic generic-chat E2E scenario can be run with:

```sh
cd apps/chat-bot
pnpm e2e -- tests/generic-chat/calculator.test.ts
```

That deterministic mock scenario proves the handler round-trip only when its
final output is sourced from the mock model's `function_call_output` for
`calculate`, and assertions observe the corresponding tool-call/result
messages with the same call ID. A successful page render alone does not prove
invocation. Final live Bifrost evidence and persisted DB evidence remain a
separate mandatory verification step. The focused unit seam is:

```sh
cd apps/chat-bot
pnpm vitest run src/app/api/chat/chat-service.test.ts
```

For safe Bifrost evidence, record request/response metadata such as timestamp,
model identifier, status, latency, and redacted tool name/call ID. Do not log
API keys, authorization headers, raw private prompts, or full user content.
For persistence evidence, query only an approved non-production/test
conversation and project fields such as message role, tool name, call ID, and
whether content parses as JSON; redact expressions and result values unless
explicitly approved. This document does not claim that any E2E or live Bifrost
run has completed.
