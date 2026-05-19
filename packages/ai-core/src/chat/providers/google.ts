import type { AiModel, Message, TextGenerationFn, TextStreamFn, TokenUsage } from '../types';
import { AiGenerationError, ResponsibleAIError } from '../../errors';
import {
  createGoogleClient,
  getGoogleAccessToken,
  getGoogleServiceAddress,
  type GoogleClientConfig,
} from '../../google-client';

interface GoogleVertexInlineData {
  mimeType: string;
  data: string;
}

interface GoogleVertexFileData {
  mimeType: string;
  fileUri: string;
}

interface GoogleVertexPart {
  text?: string;
  inlineData?: GoogleVertexInlineData;
  fileData?: GoogleVertexFileData;
}

interface GoogleVertexContent {
  role?: 'user' | 'model';
  parts?: GoogleVertexPart[];
}

interface GoogleVertexSafetyRating {
  category?: string;
  blocked?: boolean;
}

interface GoogleVertexCandidate {
  content?: GoogleVertexContent;
  finishReason?: string;
  safetyRatings?: GoogleVertexSafetyRating[];
}

interface GoogleVertexUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

interface GoogleVertexGenerateContentResponse {
  candidates?: GoogleVertexCandidate[];
  usageMetadata?: GoogleVertexUsageMetadata;
}

type GoogleVertexMethod = 'generateContent' | 'streamGenerateContent';

interface GoogleRequestConfig {
  projectId: string;
  location: string;
  auth: GoogleClientConfig['auth'];
  modelName: string;
  requestBody: Record<string, unknown>;
}

const blockedFinishReasons = new Set([
  'SAFETY',
  'FINISH_REASON_SAFETY',
  'BLOCKLIST',
  'FINISH_REASON_BLOCKLIST',
  'PROHIBITED_CONTENT',
  'FINISH_REASON_PROHIBITED_CONTENT',
  'RECITATION',
  'FINISH_REASON_RECITATION',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDataUrl(url: string): GoogleVertexInlineData | undefined {
  const match = url.match(/^data:([^;,]+);base64,(.+)$/);

  if (!match) {
    return undefined;
  }

  const [, mimeType, data] = match;

  if (!mimeType || !data) {
    return undefined;
  }

  return {
    mimeType,
    data,
  };
}

function toGooglePartsFromAttachments(message: Message): GoogleVertexPart[] {
  return (
    message.attachments
      ?.filter((attachment) => attachment.type === 'image')
      .map((attachment) => {
        const inlineData = parseDataUrl(attachment.url);

        if (inlineData) {
          return { inlineData } satisfies GoogleVertexPart;
        }

        return {
          fileData: {
            mimeType: attachment.contentType,
            fileUri: attachment.url,
          },
        } satisfies GoogleVertexPart;
      }) ?? []
  );
}

function toGoogleParts(message: Message): GoogleVertexPart[] {
  const parts: GoogleVertexPart[] = [];

  if (message.content !== '') {
    parts.push({ text: message.content });
  }

  parts.push(...toGooglePartsFromAttachments(message));

  if (parts.length === 0) {
    parts.push({ text: '' });
  }

  return parts;
}

function toGoogleContents(messages: Message[]): GoogleVertexContent[] {
  return messages
    .filter((message) => message.role !== 'system')
    .map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: toGoogleParts(message),
    }));
}

function toGoogleSystemInstruction(messages: Message[]): { parts: GoogleVertexPart[] } | undefined {
  const parts = messages
    .filter((message) => message.role === 'system' && message.content !== '')
    .map((message) => ({ text: message.content }));

  if (parts.length === 0) {
    return undefined;
  }

  return { parts };
}

function toGoogleTokenUsage(
  usageMetadata: GoogleVertexUsageMetadata | undefined,
): TokenUsage | undefined {
  if (
    usageMetadata?.promptTokenCount === undefined ||
    usageMetadata.totalTokenCount === undefined
  ) {
    return undefined;
  }

  return {
    completionTokens:
      usageMetadata.candidatesTokenCount ??
      usageMetadata.totalTokenCount - usageMetadata.promptTokenCount,
    promptTokens: usageMetadata.promptTokenCount,
    totalTokens: usageMetadata.totalTokenCount,
  };
}

function requireGoogleTokenUsage(
  usageMetadata: GoogleVertexUsageMetadata | undefined,
  errorMessage: string,
): TokenUsage {
  const usage = toGoogleTokenUsage(usageMetadata);

  if (!usage) {
    throw new AiGenerationError(errorMessage);
  }

  return usage;
}

function extractGoogleText(response: GoogleVertexGenerateContentResponse): string {
  return (
    response.candidates?.[0]?.content?.parts
      ?.flatMap((part) => (part.text !== undefined ? [part.text] : []))
      .join('') ?? ''
  );
}

function ensureGoogleResponseIsAllowed(response: GoogleVertexGenerateContentResponse) {
  const candidate = response.candidates?.[0];
  if (!candidate) {
    return;
  }

  const blockedCategories =
    candidate.safetyRatings
      ?.filter((rating) => rating.blocked === true)
      .flatMap((rating) => (rating.category ? [rating.category] : [])) ?? [];

  if (candidate.finishReason && blockedFinishReasons.has(candidate.finishReason)) {
    const details = [candidate.finishReason, ...blockedCategories].join(', ');
    throw new ResponsibleAIError(`Text generation was blocked due to safety settings: ${details}`);
  }

  if (blockedCategories.length > 0 && extractGoogleText(response) === '') {
    throw new ResponsibleAIError(
      `Text generation was blocked due to safety settings: ${blockedCategories.join(', ')}`,
    );
  }
}

function buildGoogleRequestBody({
  messages,
  maxTokens,
  temperature,
  additionalParameters,
}: {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  additionalParameters: Record<string, unknown>;
}) {
  const systemInstruction = toGoogleSystemInstruction(messages);
  const baseGenerationConfig = isRecord(additionalParameters.generationConfig)
    ? additionalParameters.generationConfig
    : undefined;

  const generationConfig = {
    ...(baseGenerationConfig ?? {}),
    ...(maxTokens !== undefined ? { maxOutputTokens: maxTokens } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
  };

  return {
    ...additionalParameters,
    ...(systemInstruction ? { systemInstruction } : {}),
    contents: toGoogleContents(messages),
    ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
  };
}

function buildGoogleEndpoint({
  projectId,
  location,
  modelName,
  method,
}: {
  projectId: string;
  location: string;
  modelName: string;
  method: GoogleVertexMethod;
}): string {
  const address = getGoogleServiceAddress(location);
  const baseEndpoint = `https://${address}/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:${method}`;

  return method === 'streamGenerateContent' ? `${baseEndpoint}?alt=sse` : baseEndpoint;
}

function createGoogleRequestConfig({
  clientConfig,
  model,
  messages,
  maxTokens,
  temperature,
}: {
  clientConfig: GoogleClientConfig;
  model: AiModel;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}): GoogleRequestConfig {
  return {
    projectId: clientConfig.projectId,
    location: clientConfig.location,
    auth: clientConfig.auth,
    modelName: model.name,
    requestBody: buildGoogleRequestBody({
      messages,
      maxTokens,
      temperature,
      additionalParameters: model.additionalParameters,
    }),
  };
}

async function fetchGoogleResponse({
  projectId,
  location,
  modelName,
  method,
  auth,
  requestBody,
}: {
  projectId: string;
  location: string;
  modelName: string;
  method: GoogleVertexMethod;
  auth: GoogleClientConfig['auth'];
  requestBody: Record<string, unknown>;
}) {
  const accessToken = await getGoogleAccessToken(auth);
  const requestBodyJson = JSON.stringify(requestBody);
  const endpoint = buildGoogleEndpoint({
    projectId,
    location,
    modelName,
    method,
  });

  return fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: requestBodyJson,
  });
}

function applyGoogleStreamChunk({
  accumulatedText,
  chunkText,
}: {
  accumulatedText: string;
  chunkText: string;
}): { accumulatedText: string; delta?: string } {
  if (chunkText === '') {
    return { accumulatedText };
  }

  if (chunkText.startsWith(accumulatedText)) {
    const delta = chunkText.slice(accumulatedText.length);

    return {
      accumulatedText: chunkText,
      ...(delta !== '' ? { delta } : {}),
    };
  }

  return {
    accumulatedText: accumulatedText + chunkText,
    delta: chunkText,
  };
}

async function parseGoogleJsonResponse(
  response: Response,
  errorLabel: string,
): Promise<GoogleVertexGenerateContentResponse> {
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new AiGenerationError(
      `${errorLabel} request failed with status ${response.status}: ${response.statusText}\n\n${errorDetails}`,
    );
  }

  return (await response.json()) as GoogleVertexGenerateContentResponse;
}

function parseSseEvent(rawEvent: string): GoogleVertexGenerateContentResponse | undefined {
  const data = rawEvent
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (data === '' || data === '[DONE]') {
    return undefined;
  }

  try {
    return JSON.parse(data) as GoogleVertexGenerateContentResponse;
  } catch {
    throw new AiGenerationError('Failed to parse Google Vertex AI stream response');
  }
}

async function* parseGoogleSseStream(
  response: Response,
): AsyncGenerator<GoogleVertexGenerateContentResponse> {
  if (!response.ok) {
    const errorDetails = await response.text();
    throw new AiGenerationError(
      `Google Vertex AI text streaming request failed with status ${response.status}: ${response.statusText}\n\n${errorDetails}`,
    );
  }

  if (!response.body) {
    throw new AiGenerationError('No response body returned from Google Vertex AI stream');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    let separatorMatch = buffer.match(/\r?\n\r?\n/);

    while (separatorMatch?.index !== undefined) {
      const rawEvent = buffer.slice(0, separatorMatch.index);
      buffer = buffer.slice(separatorMatch.index + separatorMatch[0].length);

      const event = parseSseEvent(rawEvent.trim());
      if (event) {
        yield event;
      }

      separatorMatch = buffer.match(/\r?\n\r?\n/);
    }

    if (done) {
      const tailEvent = parseSseEvent(buffer.trim());
      if (tailEvent) {
        yield tailEvent;
      }
      break;
    }
  }
}

export function constructGoogleTextGenerationFn(model: AiModel): TextGenerationFn {
  const clientConfig = createGoogleClient(model);

  return async function getGoogleTextGeneration({ messages, maxTokens, temperature }) {
    const requestConfig = createGoogleRequestConfig({
      clientConfig,
      model,
      messages,
      maxTokens,
      temperature,
    });

    const response = await fetchGoogleResponse({
      projectId: requestConfig.projectId,
      location: requestConfig.location,
      modelName: requestConfig.modelName,
      method: 'generateContent',
      auth: requestConfig.auth,
      requestBody: requestConfig.requestBody,
    });

    const result = await parseGoogleJsonResponse(response, 'Google Vertex AI text generation');

    ensureGoogleResponseIsAllowed(result);

    return {
      text: extractGoogleText(result),
      usage: requireGoogleTokenUsage(
        result.usageMetadata,
        'No usage data returned from Google Vertex AI',
      ),
    };
  };
}

export function constructGoogleTextStreamFn(model: AiModel): TextStreamFn {
  const clientConfig = createGoogleClient(model);

  return async function* getGoogleTextStream({ messages, maxTokens, temperature }, onComplete) {
    const requestConfig = createGoogleRequestConfig({
      clientConfig,
      model,
      messages,
      maxTokens,
      temperature,
    });

    const response = await fetchGoogleResponse({
      projectId: requestConfig.projectId,
      location: requestConfig.location,
      modelName: requestConfig.modelName,
      method: 'streamGenerateContent',
      auth: requestConfig.auth,
      requestBody: requestConfig.requestBody,
    });

    let usage: TokenUsage | undefined;
    let accumulatedText = '';

    for await (const chunk of parseGoogleSseStream(response)) {
      ensureGoogleResponseIsAllowed(chunk);

      const streamChunk = applyGoogleStreamChunk({
        accumulatedText,
        chunkText: extractGoogleText(chunk),
      });
      accumulatedText = streamChunk.accumulatedText;

      if (streamChunk.delta) {
        yield streamChunk.delta;
      }

      const chunkUsage = toGoogleTokenUsage(chunk.usageMetadata);
      if (chunkUsage) {
        usage = chunkUsage;
      }
    }

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Google Vertex AI stream');
    }

    if (onComplete) {
      await onComplete(usage);
    }
  };
}
