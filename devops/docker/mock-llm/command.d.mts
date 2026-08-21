export interface MockLlmCommand {
  tool: string;
  arguments: Record<string, unknown>;
}

export function buildMockLlmCommand(command: MockLlmCommand): string;
export function parseMockLlmCommand(text: string): MockLlmCommand | null;
