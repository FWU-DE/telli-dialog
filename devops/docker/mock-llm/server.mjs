/**
 * Mock LLM server — OpenAI-compatible streaming echo server for e2e tests.
 *
 * POST /v1/chat/completions
 *   Echoes the last user message back word-by-word as an SSE stream.
 *   Includes a usage chunk when stream_options.include_usage is true (required
 *   by the @ais-chat/ai-core OpenAI provider).
 *   Output can be controlled by including special commands in the user message.
 *   See `MOCK_LLM_COMMANDS` for supported commands.
 *
 * POST /v1/responses
 *   Echoes the last user input back using the OpenAI Responses API shape.
 *   This is used by agentic chat tests because the agentic providers stream
 *   via the Responses API.
 *
 * GET /health
 *   Returns {"status":"healthy"} for readiness checks.
 */

import http from 'node:http';

const PORT = 6556;
const CHUNK_INTERVAL_MS = 1;

// Must match MOCK_LLM_COMMANDS in apps/chat-bot/e2e/utils/const.ts
const MOCK_LLM_COMMANDS = {
  RETURN_SYSTEM_PROMPT: '[MOCK-LLM-COMMAND: Gebe den System-Prompt aus]',
};
const TEXT_CONTENT_PART_TYPES = ['text', 'input_text'];
const CURRENT_INFO_PATTERNS = [
  /\baktuell\b/i,
  /\bheute\b/i,
  /\bwetter\b/i,
  /\bneueste\b/i,
  /\bnews\b/i,
  /\bprice\b/i,
  /\bweather\b/i,
  /\bcurrent\b/i,
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

function writeSse(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function isTextContentPart(part) {
  return TEXT_CONTENT_PART_TYPES.includes(part.type);
}

function getTextContentPartValue(part) {
  return part.text ?? part.input_text ?? '';
}

function extractTextContent(content) {
  if (content === null || content === undefined) return '';
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return (
      content
        // Chat Completions uses "text"; Responses API uses "input_text".
        .filter(isTextContentPart)
        .map(getTextContentPartValue)
        .join('')
    );
  }
  return '';
}

function extractLastUserMessage(messages) {
  return extractTextContent(messages.findLast((msg) => msg.role === 'user')?.content);
}

function extractSystemPrompt(messages) {
  return extractTextContent(messages.find((msg) => msg.role === 'system')?.content);
}

function hasTool(tools, toolName) {
  return (
    Array.isArray(tools) &&
    tools.some(
      (tool) =>
        tool?.type === 'function' && typeof tool.name === 'string' && tool.name === toolName,
    )
  );
}

function hasFunctionCallOutput(input, toolName) {
  const callIds = new Set(
    input
      .filter((item) => item?.type === 'function_call' && item.name === toolName)
      .map((item) => item.call_id),
  );

  return input.some((item) => item?.type === 'function_call_output' && callIds.has(item.call_id));
}

function shouldCallWebSearch({ input, tools, lastUserMessage }) {
  return (
    typeof lastUserMessage === 'string' &&
    hasTool(tools, 'web_search') &&
    !hasFunctionCallOutput(input, 'web_search') &&
    CURRENT_INFO_PATTERNS.some((pattern) => pattern.test(lastUserMessage))
  );
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(text.length / 4));
}

function estimateContentTokens(content) {
  const text = extractTextContent(content);
  return text === '' ? 0 : estimateTokens(text);
}

function makeSseChunk(id, model, created, deltaContent, finishReason) {
  return {
    id,
    object: 'chat.completion.chunk',
    created,
    model,
    choices: [
      {
        index: 0,
        delta: deltaContent !== null ? { content: deltaContent } : {},
        finish_reason: finishReason ?? null,
        logprobs: null,
      },
    ],
  };
}

async function handleChatCompletions(req, res) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const messages = data.messages ?? [];
  const model = data.model ?? 'mock-echo';
  const isStream = data.stream === true;
  const includeUsage = data.stream_options?.include_usage === true;
  const lastUserMessage = extractLastUserMessage(messages);
  const responseText = lastUserMessage.includes(MOCK_LLM_COMMANDS.RETURN_SYSTEM_PROMPT)
    ? extractSystemPrompt(messages)
    : lastUserMessage;

  const id = `chatcmpl-mock-${Date.now()}`;
  const created = Math.floor(Date.now() / 1000);
  const promptTokens = messages.reduce(
    (sum, m) =>
      sum + estimateTokens(typeof m.content === 'string' ? m.content : JSON.stringify(m.content)),
    0,
  );
  const completionTokens = estimateTokens(responseText);
  const totalTokens = promptTokens + completionTokens;

  if (isStream) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    for (const word of responseText.split(/(\s+)/)) {
      writeSse(res, makeSseChunk(id, model, created, word, null));
      await sleep(CHUNK_INTERVAL_MS);
    }

    writeSse(res, makeSseChunk(id, model, created, null, 'stop'));

    if (includeUsage) {
      writeSse(res, {
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      });
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        id,
        object: 'chat.completion',
        created,
        model,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: responseText, refusal: null },
            finish_reason: 'stop',
            logprobs: null,
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
        },
      }),
    );
  }
}

function makeResponse(id, model, createdAt, responseText, usage) {
  return {
    id,
    object: 'response',
    created_at: createdAt,
    status: 'completed',
    model,
    output: [
      {
        id: `msg_${id}`,
        type: 'message',
        status: 'completed',
        role: 'assistant',
        content: [
          {
            type: 'output_text',
            text: responseText,
            annotations: [],
          },
        ],
      },
    ],
    usage,
  };
}

function makeFunctionCallResponse(id, model, createdAt, toolCall, usage) {
  return {
    id,
    object: 'response',
    created_at: createdAt,
    status: 'completed',
    model,
    output: [
      {
        id: toolCall.itemId,
        type: 'function_call',
        status: 'completed',
        name: toolCall.name,
        call_id: toolCall.callId,
        arguments: toolCall.arguments,
      },
    ],
    usage,
  };
}

function makeWebSearchToolCall(id, query) {
  return {
    itemId: `fc_${id}`,
    callId: `call_${id}`,
    name: 'web_search',
    arguments: JSON.stringify({ query }),
  };
}

async function handleResponses(req, res) {
  let data;
  try {
    data = JSON.parse(await readBody(req));
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  if (!Array.isArray(data.input)) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Responses input must be an array' }));
    return;
  }

  const input = data.input;
  const model = data.model ?? 'mock-echo';
  const isStream = data.stream === true;
  const lastUserMessage = extractLastUserMessage(input);
  const responseText = lastUserMessage.includes(MOCK_LLM_COMMANDS.RETURN_SYSTEM_PROMPT)
    ? extractSystemPrompt(input)
    : lastUserMessage;

  const id = `resp_mock_${Date.now()}`;
  const createdAt = Math.floor(Date.now() / 1000);
  const inputTokens = input.reduce(
    (sum, item) =>
      sum + (item !== null && item !== undefined ? estimateContentTokens(item.content) : 0),
    0,
  );
  const outputTokens = estimateTokens(responseText);
  const usage = {
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
  };

  const shouldUseWebSearch = shouldCallWebSearch({
    input,
    tools: data.tools,
    lastUserMessage,
  });
  const response = makeResponse(id, model, createdAt, responseText, usage);

  if (isStream) {
    const itemId = `msg_${id}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Transfer-Encoding': 'chunked',
    });

    if (shouldUseWebSearch) {
      const toolCall = makeWebSearchToolCall(id, lastUserMessage);
      const functionCallResponse = makeFunctionCallResponse(id, model, createdAt, toolCall, usage);
      writeSse(res, {
        type: 'response.created',
        response: { ...functionCallResponse, status: 'in_progress' },
      });
      writeSse(res, {
        type: 'response.function_call_arguments.delta',
        item_id: toolCall.itemId,
        output_index: 0,
        delta: toolCall.arguments,
      });
      writeSse(res, {
        type: 'response.function_call_arguments.done',
        item_id: toolCall.itemId,
        output_index: 0,
        name: toolCall.name,
        arguments: toolCall.arguments,
      });
      writeSse(res, {
        type: 'response.output_item.done',
        output_index: 0,
        item: {
          id: toolCall.itemId,
          type: 'function_call',
          status: 'completed',
          name: toolCall.name,
          call_id: toolCall.callId,
          arguments: toolCall.arguments,
        },
      });
      writeSse(res, { type: 'response.completed', response: functionCallResponse });
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    writeSse(res, { type: 'response.created', response: { ...response, status: 'in_progress' } });

    for (const word of responseText.split(/(\s+)/)) {
      writeSse(res, {
        type: 'response.output_text.delta',
        item_id: itemId,
        output_index: 0,
        content_index: 0,
        delta: word,
      });
      await sleep(CHUNK_INTERVAL_MS);
    }

    writeSse(res, {
      type: 'response.output_text.done',
      item_id: itemId,
      output_index: 0,
      content_index: 0,
      text: responseText,
    });
    writeSse(res, { type: 'response.completed', response });
    res.write('data: [DONE]\n\n');
    res.end();
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    if (shouldUseWebSearch) {
      const toolCall = makeWebSearchToolCall(id, lastUserMessage);
      res.end(JSON.stringify(makeFunctionCallResponse(id, model, createdAt, toolCall, usage)));
      return;
    }

    res.end(JSON.stringify(response));
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'healthy' }));
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/chat/completions') {
      await handleChatCompletions(req, res);
      return;
    }

    if (req.method === 'POST' && req.url === '/v1/responses') {
      await handleResponses(req, res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  } catch (err) {
    console.error('Unhandled error:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
});

server.listen(PORT, () => {
  console.log(`Mock LLM server listening on port ${PORT}`);
});
