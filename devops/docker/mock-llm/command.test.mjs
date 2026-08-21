import assert from 'node:assert/strict';
import test from 'node:test';
import { buildMockLlmCommand, parseMockLlmCommand } from './command.mjs';

test('round-trips a normal calculator expression', () => {
  const command = { tool: 'calculate', arguments: { expression: '1 + 2' } };
  assert.deepEqual(parseMockLlmCommand(buildMockLlmCommand(command)), command);
});

test('supports JSON quotes and brackets', () => {
  const command = { tool: 'test', arguments: { value: 'quotes " and [brackets]' } };
  assert.deepEqual(parseMockLlmCommand(buildMockLlmCommand(command)), command);
});

test('parses commands with appended text', () => {
  const command = { tool: 'calculate', arguments: { expression: '3 * 4' } };
  assert.deepEqual(parseMockLlmCommand(`${buildMockLlmCommand(command)} afterwards`), command);
});

test('rejects invalid builder command shapes', () => {
  for (const command of [
    null,
    {},
    { tool: '', arguments: {} },
    { tool: 'calculate', arguments: null },
    { tool: 'calculate', arguments: [] },
    { tool: 'calculate', arguments: 'expression' },
  ]) {
    assert.throws(() => buildMockLlmCommand(command), TypeError);
  }
});

test('requires the command closing marker immediately after JSON', () => {
  assert.equal(parseMockLlmCommand('[MOCK-LLM-COMMAND: {"tool":"calculate","arguments":{}}'), null);
  assert.equal(
    parseMockLlmCommand('[MOCK-LLM-COMMAND: {"tool":"calculate","arguments":{}} text]'),
    null,
  );
});

test('rejects parsed commands with an invalid shape', () => {
  assert.equal(
    parseMockLlmCommand('[MOCK-LLM-COMMAND: {"tool":"calculate","arguments":[]}]'),
    null,
  );
  assert.equal(parseMockLlmCommand('[MOCK-LLM-COMMAND: {"tool":"","arguments":{}}]'), null);
});

test('continues after a malformed command prefix', () => {
  const command = { tool: 'calculate', arguments: { expression: '5 + 6' } };
  assert.deepEqual(
    parseMockLlmCommand(
      `[MOCK-LLM-COMMAND: {"tool":"calculate","arguments":{}} ${buildMockLlmCommand(command)}`,
    ),
    command,
  );
});

test('returns null for malformed JSON and unrelated text', () => {
  assert.equal(parseMockLlmCommand('[MOCK-LLM-COMMAND: {"tool":"calculate"]'), null);
  assert.equal(parseMockLlmCommand('please calculate 1 + 2'), null);
});
