import { ToolCall, ToolInvocation, ToolResult } from 'ai';
import { z } from 'zod';

export const WEBSEARCH_TOOL_NAME = 'websearch' as const;

export type WebsearchSource = {
  type: 'websearch';
  name?: string;
  link: string;
  content?: string;
  error?: boolean;
};

export type WebsearchToolResult =
  | {
      type: typeof WEBSEARCH_TOOL_NAME;
      state: 'success';
      sources: Record<string, WebsearchSource>;
      content: string;
    }
  | { type: typeof WEBSEARCH_TOOL_NAME; state: 'error' };

export const websearchToolArgsSchema = z.object({
  search_query: z.string().describe('Die Suchanfrage, mit der im Internet gesucht werden soll.'),
});
export type WebsearchToolArgs = z.infer<typeof websearchToolArgsSchema>;

export function isWebsearchToolCall(t: ToolInvocation): t is {
  state: 'call';
} & ToolCall<string, WebsearchToolArgs> {
  return t.state === 'call' && t.toolName === WEBSEARCH_TOOL_NAME;
}

export function isWebsearchToolResult(t: ToolInvocation): t is {
  state: 'result';
  step?: number;
} & ToolResult<string, WebsearchToolArgs, WebsearchToolResult> {
  return t.state === 'result' && t.toolName === WEBSEARCH_TOOL_NAME;
}
