const COMMAND_PREFIX = '[MOCK-LLM-COMMAND: ';

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isMockLlmCommand(value) {
  return (
    isPlainObject(value) &&
    typeof value.tool === 'string' &&
    value.tool.length > 0 &&
    isPlainObject(value.arguments)
  );
}

/**
 * Creates a command that can be embedded in an otherwise ordinary user message.
 * The JSON payload is intentionally generic so new mock interactions do not need
 * another command constant in both the server and the e2e suite.
 */
export function buildMockLlmCommand(command) {
  if (!isMockLlmCommand(command)) {
    throw new TypeError('Mock LLM command must have a non-empty tool and plain arguments object');
  }
  return `${COMMAND_PREFIX}${JSON.stringify(command)}]`;
}

/**
 * Finds and parses the first complete command in text. JSON strings are handled
 * while looking for the closing bracket, so expressions may contain quotes or
 * nested arrays/objects and messages may continue after the command.
 */
export function parseMockLlmCommand(text) {
  let searchFrom = 0;
  while (searchFrom < text.length) {
    const start = text.indexOf(COMMAND_PREFIX, searchFrom);
    if (start < 0) return null;
    const jsonStart = start + COMMAND_PREFIX.length;
    const nextPrefix = text.indexOf(COMMAND_PREFIX, jsonStart);
    const scanEnd = nextPrefix < 0 ? text.length : nextPrefix;
    const brackets = [];
    let inString = false;
    let escaped = false;

    for (let index = jsonStart; index < scanEnd; index += 1) {
      const character = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === '\\') escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') {
        inString = true;
      } else if (character === '{' || character === '[') {
        brackets.push(character);
      } else if (character === '}' || character === ']') {
        const opening = brackets.pop();
        if ((character === '}' && opening !== '{') || (character === ']' && opening !== '[')) break;
        if (brackets.length === 0) {
          if (character !== '}' || text[index + 1] !== ']') break;
          try {
            const command = JSON.parse(text.slice(jsonStart, index + 1));
            if (isMockLlmCommand(command)) return command;
          } catch {
            // Continue searching; a later command may still be valid.
          }
          break;
        }
      }
    }
    searchFrom = start + 1;
  }
  return null;
}
