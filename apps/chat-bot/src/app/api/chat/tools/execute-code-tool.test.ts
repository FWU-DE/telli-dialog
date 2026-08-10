import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  executeCode: vi.fn(),
  isPistonConfigured: vi.fn(),
}));

vi.mock('./execute-code-client', () => ({
  executeCode: mocks.executeCode,
  isPistonConfigured: mocks.isPistonConfigured,
  MAX_CODE_LENGTH: 20_000,
  MAX_STDIN_LENGTH: 10_000,
}));

describe('execute_code tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isPistonConfigured.mockReturnValue(true);
    mocks.executeCode.mockResolvedValue({
      language: 'python',
      status: 'success',
      exitCode: 0,
      signal: null,
      stdout: '2',
      stderr: '',
      truncated: false,
    });
  });

  it('registers only when enabled and configured', async () => {
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    expect(buildExecuteCodeTool({ allowExecution: true, calls: { count: 0 } })).not.toBeNull();
    expect(buildExecuteCodeTool({ allowExecution: false, calls: { count: 0 } })).toBeNull();
    mocks.isPistonConfigured.mockReturnValue(false);
    expect(buildExecuteCodeTool({ allowExecution: true, calls: { count: 0 } })).toBeNull();
  });

  it('validates arguments and enforces input and call limits', async () => {
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const calls = { count: 0 };
    const tool = buildExecuteCodeTool({ allowExecution: true, calls })!;

    await expect(tool.handler({ language: 'ruby', code: '1', stdin: null })).resolves.toContain(
      'Ungültige Sprache',
    );
    await expect(tool.handler({ language: 'python', code: '', stdin: null })).resolves.toContain(
      'nicht leer',
    );
    await expect(
      tool.handler({ language: 'python', code: 'x'.repeat(20_001), stdin: null }),
    ).resolves.toContain('20000');
    await expect(
      tool.handler({ language: 'python', code: 'x', stdin: 'x'.repeat(10_001) }),
    ).resolves.toContain('10000');
    await tool.handler({ language: 'python', code: 'x', stdin: null });
    await expect(tool.handler({ language: 'python', code: 'x', stdin: null })).resolves.toContain(
      'eine Code-Ausführung',
    );
  });

  it('returns bounded execution result', async () => {
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const tool = buildExecuteCodeTool({ allowExecution: true, calls: { count: 0 } })!;
    await expect(tool.handler({ language: 'python', code: 'print(2)', stdin: null })).resolves.toBe(
      JSON.stringify({
        language: 'python',
        status: 'success',
        exitCode: 0,
        signal: null,
        stdout: '2',
        stderr: '',
        truncated: false,
      }),
    );
    expect(mocks.executeCode).toHaveBeenCalledWith({
      language: 'python',
      code: 'print(2)',
      stdin: '',
    });
  });

  it('accepts TypeScript as a supported language', async () => {
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const tool = buildExecuteCodeTool({ allowExecution: true, calls: { count: 0 } })!;
    await tool.handler({ language: 'typescript', code: 'const x: number = 2;', stdin: null });
    expect(mocks.executeCode).toHaveBeenCalledWith({
      language: 'typescript',
      code: 'const x: number = 2;',
      stdin: '',
    });
  });
});
