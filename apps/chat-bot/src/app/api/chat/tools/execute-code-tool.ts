import {
  executeCode,
  MAX_CODE_LENGTH,
  MAX_STDIN_LENGTH,
  isPistonConfigured,
} from './execute-code-client';
import type { ToolDefinition, ToolRegistration } from './types';

const definition: ToolDefinition = {
  name: 'execute_code',
  description:
    'Führt stateless Python-, JavaScript- oder TypeScript-Code ohne Netzwerkzugriff aus. Verwende dies nur zum Berechnen, Überprüfen oder Debuggen.',
  parameters: {
    type: 'object',
    properties: {
      language: { type: 'string', enum: ['python', 'javascript', 'typescript'] },
      code: { type: 'string', minLength: 1 },
      stdin: { type: ['string', 'null'] },
    },
    required: ['language', 'code', 'stdin'],
    additionalProperties: false,
  },
};

export function buildExecuteCodeTool({
  allowExecution,
  calls,
}: {
  allowExecution: boolean;
  calls: { count: number };
}): ToolRegistration | null {
  if (!allowExecution || !isPistonConfigured()) return null;

  return {
    definition,
    handler: async (args) => {
      const language = args.language;
      if (language !== 'python' && language !== 'javascript' && language !== 'typescript') {
        return 'Error: Ungültige Sprache. Erlaubt sind python, javascript und typescript.';
      }
      if (typeof args.code !== 'string' || args.code.length === 0) {
        return 'Error: Der Code darf nicht leer sein.';
      }
      if (args.code.length > MAX_CODE_LENGTH) {
        return `Error: Der Code darf höchstens ${MAX_CODE_LENGTH} Zeichen enthalten.`;
      }
      if (args.stdin !== null && typeof args.stdin !== 'string') {
        return 'Error: stdin muss ein String oder null sein.';
      }
      const stdin = args.stdin ?? '';
      if (stdin.length > MAX_STDIN_LENGTH) {
        return `Error: stdin darf höchstens ${MAX_STDIN_LENGTH} Zeichen enthalten.`;
      }

      if (calls.count >= 1) return 'Error: Pro Chat-Anfrage ist nur eine Code-Ausführung erlaubt.';
      calls.count += 1;

      return JSON.stringify(await executeCode({ language, code: args.code, stdin }));
    },
  };
}
