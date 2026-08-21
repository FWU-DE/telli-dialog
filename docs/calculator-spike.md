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

Scientific functions are `sqrt`, `abs`, `sin`, `cos`, `tan`, `asin`, `acos`,
`atan`, `log`, `log10`, `exp`, `round`, `floor`, `ceil`, `min`, and `max`.
Constants are `pi`, `e`, and `tau`. Units are an explicit allowlist, not every
unit supported by mathjs: length (`m`, `cm`, `mm`, `km`, `in`, `ft`, `yd`, `mi`),
mass (`g`, `kg`, `mg`, `lb`, `oz`), time (`s`, `ms`, `min`, `h`, `d`), volume
(`L`, `l`, `mL`, `ml`), temperature (`K`, `degC`, `degF`), angles (`rad`, `deg`),
frequency/derived units (`Hz`, `N`, `Pa`, `J`, `W`, `V`, `A`, `ohm`), amount
(`mol`), and data (`bit`, `byte`). Conversions use the `to` operator.

Deliberate exclusions include variables and unknown symbols, unapproved
functions/operators, assignments, comparisons, factorials, arrays/indexing,
and non-finite results. This is not a general-purpose math-language sandbox.

## Determinism and process boundary

The tool limits input to 1,000 bytes and child output to 8,192 bytes. Runtime
validation limits are 200 AST nodes, depth 32, 100 literals, exponent magnitude
1,000, and cost 1,000. Stable error codes include `INVALID_INPUT`,
`FUNCTION_NOT_ALLOWED`, `OPERATOR_NOT_ALLOWED`, `INVALID_NODE`,
`EXPONENT_NOT_ALLOWED`, `EXPRESSION_TOO_COMPLEX`, `NONFINITE_RESULT`,
`EXPRESSION_TIMEOUT`, and `PROTOCOL_ERROR`. Malformed expressions currently
fall through the child-process boundary as `INVALID_EXPRESSION`; document a
replacement only once it is visible in the runtime implementation.

Each invocation runs a child process with a 3-second timeout and kills it on
timeout or oversized output. The process-local scheduler runs at most
`MAX_CONCURRENT = 4` children and queues at most `MAX_QUEUE = 16` additional
calls. When all slots are occupied, a new call returns `CALCULATOR_BUSY` once
the queue is full. These counters are module-local, not cross-instance rate
limiting; separate processes or replicas have separate limits.

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
