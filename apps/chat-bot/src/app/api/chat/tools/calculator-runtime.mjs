import { all, create } from 'mathjs';

const math = create(all);
math.config({ number: 'BigNumber', precision: 64, predictable: true });
const parse = math.parse.bind(math);

const BLOCKED_FUNCTIONS = new Set([
  'import',
  'createUnit',
  'reviver',
  'evaluate',
  'parse',
  'simplify',
  'derivative',
  'resolve',
  'random',
  'range',
  'matrix',
  'bignumber',
  'complex',
  'boolean',
  'string',
  'fraction',
  'index',
  'zeros',
  'ones',
  'identity',
  'diag',
  'reshape',
  'resize',
  'subset',
  'concat',
  'map',
  'filter',
  'forEach',
  'reduce',
  'sort',
  'flatten',
  'squeeze',
  'size',
  'det',
  'inv',
  'transpose',
  'lusolve',
  'eigs',
  'fft',
  'ifft',
  'gamma',
  'factorial',
  'combinations',
  'combinationsWithRep',
  'permutations',
  'isPrime',
  'pow',
  'nthRoot',
]);
const ALLOWED_OPERATORS = new Set(['+', '-', '*', '/', '^', 'to']);
const GROWTH_FUNCTIONS = new Set(['exp', 'expm1', 'sinh', 'cosh', 'tanh']);
const MAX_GROWTH_INPUT = math.bignumber(230);
const ONE = math.bignumber(1);
// BigNumber's `e` is the adjusted decimal exponent (not the exponent text in
// the input), so this also covers decimals such as 0.1e-999.
export const MAX_NUMERIC_EXPONENT = 100;

const blockedFunction = () => {
  throw new FunctionNotAllowedError('blocked');
};
math.import(Object.fromEntries([...BLOCKED_FUNCTIONS].map((name) => [name, blockedFunction])), {
  override: true,
});

export const LIMITS = {
  nodes: 200,
  depth: 32,
  literals: 100,
  exponent: 1000,
  cost: 1000,
  output: 8192,
};

class CalculatorError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'CalculatorError';
    this.code = code;
  }
}

class ExpressionTooComplexError extends CalculatorError {
  constructor(message = 'Expression exceeds deterministic complexity limits') {
    super(message, 'EXPRESSION_TOO_COMPLEX');
  }
}

class InvalidNodeError extends CalculatorError {
  constructor(message) {
    super(message, 'INVALID_NODE');
  }
}

class FunctionNotAllowedError extends CalculatorError {
  constructor(name) {
    super(`Function ${name ?? 'unknown'} is not allowed`, 'FUNCTION_NOT_ALLOWED');
  }
}

class OperatorNotAllowedError extends CalculatorError {
  constructor(operator) {
    super(`Operator ${operator} is not allowed`, 'OPERATOR_NOT_ALLOWED');
  }
}

class ExponentNotAllowedError extends CalculatorError {
  constructor() {
    super('Exponent must be a signed numeric literal', 'EXPONENT_NOT_ALLOWED');
  }
}

class InvalidExpressionError extends CalculatorError {
  constructor() {
    super('Expression could not be parsed', 'INVALID_EXPRESSION');
  }
}

class NonFiniteResultError extends CalculatorError {
  constructor() {
    super('Result is not finite', 'NONFINITE_RESULT');
  }
}

function addCost(state, amount) {
  state.cost += amount;
  if (state.cost > LIMITS.cost) throw new ExpressionTooComplexError();
}

function exponentValue(node) {
  if (node?.type === 'ConstantNode') return Number(node.value);
  if (node?.isOperatorNode && node.op === '-' && node.args.length === 1) {
    const value = exponentValue(node.args[0]);
    return Number.isFinite(value) ? -value : undefined;
  }
  return undefined;
}

function isSignedNumericLiteral(node) {
  return (
    node?.type === 'ConstantNode' ||
    (node?.isOperatorNode &&
      node.op === '-' &&
      node.args.length === 1 &&
      node.args[0]?.type === 'ConstantNode')
  );
}

function validateNumericLiteral(node, state) {
  state.literals++;
  if (state.literals > LIMITS.literals)
    throw new ExpressionTooComplexError('Expression exceeds literal limits');
  const literal = String(node.value);
  if (literal.replace(/[^0-9]/g, '').length > 100 || /e[+-]?\d{4,}$/i.test(literal))
    throw new ExpressionTooComplexError('Numeric literal exceeds limits');
  if (node.value?.isBigNumber === true) {
    const exponent = node.value.e;
    if (!Number.isFinite(exponent) || Math.abs(exponent) > MAX_NUMERIC_EXPONENT)
      throw new ExpressionTooComplexError('Numeric literal exceeds limits');
  }
}

// This is deliberately an exponent interval rather than a value evaluation.
// In particular, it lets us reject large intermediate values while leaving
// units, symbols, and non-growth functions (whose result cannot be inferred
// safely) unknown.
function literalExponent(node) {
  const text = String(node.value).replace(/^[+-]/, '');
  const match = text.match(/^([0-9]*)(?:\.([0-9]*))?(?:e([+-]?\d+))?$/i);
  if (!match) return undefined;
  const integer = match[1] ?? '';
  const fraction = match[2] ?? '';
  const digits = integer + fraction;
  const first = digits.search(/[1-9]/);
  if (first < 0) return { min: 0, max: 0, maxAbs: 0, zero: true };
  const explicitExponent = BigInt(match[3] ?? '0');
  const decimalPosition = BigInt(integer.length) + explicitExponent;
  const exponent = decimalPosition - BigInt(first) - 1n;
  const numericExponent = Number(exponent);
  return Number.isFinite(numericExponent)
    ? {
        min: numericExponent,
        max: numericExponent,
        maxAbs: Math.abs(numericExponent),
        zero: false,
      }
    : undefined;
}

function staticMagnitude(node, allowExact = true, pureValues = new WeakMap()) {
  const exact =
    allowExact && node?.isOperatorNode && node.op === '^'
      ? undefined
      : allowExact && evaluatePureArithmetic(node, pureValues);
  if (exact) return magnitudeFromBigNumber(exact);
  if (node?.type === 'ConstantNode') return literalExponent(node);
  if (node?.isParenthesisNode) return staticMagnitude(node.content, allowExact, pureValues);
  if (node?.isFunctionNode && GROWTH_FUNCTIONS.has(node.fn?.name)) {
    const input = evaluatePureArithmetic(node.args[0], pureValues);
    return input ? growthMagnitude(node.fn.name, input) : undefined;
  }
  if (node?.isOperatorNode) {
    if (node.op === 'to') return undefined;
    if (node.op === '-' && node.args.length === 1)
      return staticMagnitude(node.args[0], allowExact, pureValues);
    if (node.args.length !== 2) return undefined;
    const childAllowExact = allowExact && node.op !== '^';
    const left = staticMagnitude(node.args[0], childAllowExact, pureValues);
    const right = staticMagnitude(node.args[1], childAllowExact, pureValues);
    if (!left || !right) return undefined;
    if (node.op === '+' || node.op === '-') {
      if (left.zero && right.zero) return { min: 0, max: 0, maxAbs: 0, zero: true };
      return {
        min: Number.NEGATIVE_INFINITY,
        max: Math.max(left.max, right.max) + 1,
        maxAbs: Math.max(left.maxAbs, right.maxAbs) + 1,
        zero: false,
      };
    }
    if (node.op === '*') {
      if (left.zero || right.zero) return { min: 0, max: 0, maxAbs: 0, zero: true };
      return {
        min: left.min + right.min,
        max: left.max + right.max,
        maxAbs: left.maxAbs + right.maxAbs,
        zero: false,
      };
    }
    if (node.op === '/') {
      if (right.zero) throw new NonFiniteResultError();
      if (left.zero) return { min: 0, max: 0, maxAbs: 0, zero: true };
      return {
        min: left.min - right.max,
        max: left.max - right.min,
        maxAbs: left.maxAbs + right.maxAbs,
        zero: false,
      };
    }
    if (node.op === '^') {
      const exponent = signedLiteralBigInt(node.args[1]);
      if (exponent === undefined) return undefined;
      if (exponent === 0n) return { min: 0, max: 0, maxAbs: 0, zero: false };
      if (left.zero) {
        if (exponent < 0n) throw new NonFiniteResultError();
        return { min: 0, max: 0, maxAbs: 0, zero: true };
      }
      const min = left.min * Number(exponent);
      const max = left.max * Number(exponent);
      return {
        min: Math.min(min, max),
        max: Math.max(min, max),
        maxAbs: left.maxAbs * Math.abs(Number(exponent)),
        zero: false,
      };
    }
  }
  return undefined;
}

function isPureArithmetic(node) {
  if (node?.type === 'ConstantNode') return node.value?.isBigNumber === true;
  if (node?.isParenthesisNode) return isPureArithmetic(node.content);
  if (!node?.isOperatorNode || node.op === 'to') return false;
  if (node.op === '^') return node.args.length === 2 && isSignedNumericLiteral(node.args[1]);
  return (
    (node.args.length === 1 &&
      (node.op === '+' || node.op === '-') &&
      isPureArithmetic(node.args[0])) ||
    (node.args.length === 2 && node.args.every(isPureArithmetic))
  );
}

// Evaluation is restricted to a subtree proven to contain only BigNumber
// constants and arithmetic operators. Never use this for function arguments.
function evaluatePureArithmetic(node, cache = new WeakMap()) {
  if (!isPureArithmetic(node)) return undefined;
  if (cache.has(node)) return cache.get(node);
  try {
    const value = node.evaluate();
    const result = value?.isBigNumber === true && value.isFinite() ? value : undefined;
    cache.set(node, result);
    return result;
  } catch {
    cache.set(node, undefined);
    return undefined;
  }
}

function growthMagnitude(name, input) {
  const absoluteInput = input.abs();
  if (name === 'tanh') return { min: -1, max: 1, maxAbs: 1, zero: false };
  if (absoluteInput.lte(ONE)) {
    if (name === 'expm1' && input.isZero()) return { min: 0, max: 0, maxAbs: 0, zero: true };
    return { min: -1, max: 1, maxAbs: 1, zero: false };
  }
  if (name === 'exp' || name === 'expm1') {
    return input.isNegative()
      ? { min: -100, max: 0, maxAbs: 100, zero: false }
      : { min: 0, max: 100, maxAbs: 100, zero: false };
  }
  return { min: -100, max: 100, maxAbs: 100, zero: false };
}

function magnitudeFromBigNumber(value) {
  if (value.isZero()) return { min: 0, max: 0, maxAbs: 0, zero: true };
  const exponent = value.abs().e;
  if (!Number.isFinite(exponent)) return undefined;
  return { min: exponent, max: exponent, maxAbs: Math.abs(exponent), zero: false };
}

function signedLiteralBigInt(node) {
  if (node?.type === 'ConstantNode' && /^\d+$/.test(String(node.value)))
    return BigInt(String(node.value));
  if (
    node?.isOperatorNode &&
    node.op === '-' &&
    node.args.length === 1 &&
    node.args[0]?.type === 'ConstantNode' &&
    /^\d+$/.test(String(node.args[0].value))
  )
    return -BigInt(String(node.args[0].value));
  return undefined;
}

function validateStaticMagnitude(node, pureValues = new WeakMap()) {
  if (node?.isFunctionNode) {
    const name = node.fn?.name;
    if (GROWTH_FUNCTIONS.has(name)) {
      node.args.forEach((arg) => {
        const value = evaluatePureArithmetic(arg, pureValues);
        if (!value || value.abs().gt(MAX_GROWTH_INPUT))
          throw new ExpressionTooComplexError('Growth function input exceeds limits');
      });
    }
    node.args.forEach((arg) => validateStaticMagnitude(arg, pureValues));
    return;
  }
  if (node?.isParenthesisNode) {
    validateStaticMagnitude(node.content, pureValues);
    return;
  }
  if (node?.isOperatorNode) node.args.forEach((arg) => validateStaticMagnitude(arg, pureValues));
  const magnitude = staticMagnitude(node, true, pureValues);
  if (magnitude && magnitude.maxAbs > MAX_NUMERIC_EXPONENT)
    throw new ExpressionTooComplexError('Numeric magnitude exceeds limits');
}

export function validateExpression(node, depth = 0, state = { nodes: 0, literals: 0, cost: 0 }) {
  state.nodes++;
  addCost(state, 1);
  if (state.nodes > LIMITS.nodes || depth > LIMITS.depth || state.literals > LIMITS.literals)
    throw new ExpressionTooComplexError();

  if (node.type === 'ConstantNode') {
    if (typeof node.value === 'number' || node.value?.isBigNumber === true)
      validateNumericLiteral(node, state);
    else throw new InvalidNodeError('Only numeric constants are supported');
    return;
  }
  if (node.isSymbolNode) {
    return;
  }
  if (node.isFunctionNode) {
    const name = node.fn?.name;
    if (!node.fn?.isSymbolNode)
      throw new InvalidNodeError('Function callee must be a direct symbol');
    if (BLOCKED_FUNCTIONS.has(name) || !name) throw new FunctionNotAllowedError(name);
    addCost(state, 10);
    node.args.forEach((arg) => validateExpression(arg, depth + 1, state));
    return;
  }
  if (node.isOperatorNode) {
    if (!ALLOWED_OPERATORS.has(node.op)) throw new OperatorNotAllowedError(node.op);
    if (node.op === '^') {
      if (!isSignedNumericLiteral(node.args[1])) throw new ExponentNotAllowedError();
      const numericExponent = exponentValue(node.args[1]);
      if (numericExponent !== undefined) {
        if (!Number.isFinite(numericExponent) || Math.abs(numericExponent) > LIMITS.exponent)
          throw new ExpressionTooComplexError('Exponent exceeds deterministic limits');
        addCost(state, 20 + Math.ceil(Math.abs(numericExponent) / 10));
      } else addCost(state, 20);
    }
    node.args.forEach((arg) => validateExpression(arg, depth + 1, state));
    return;
  }
  if (node.isParenthesisNode) {
    validateExpression(node.content, depth + 1, state);
    return;
  }
  throw new InvalidNodeError('Expression contains a disallowed node');
}

function parseExpression(expression) {
  try {
    return parse(expression);
  } catch {
    throw new InvalidExpressionError();
  }
}

function isComplexValue(value) {
  return Boolean(value?.isComplex || value?.im !== undefined);
}

function resultIsFinite(value, isUnit) {
  if (isUnit) return Number.isFinite(Number(value.value));
  return typeof value?.isFinite === 'function' ? value.isFinite() : Number.isFinite(Number(value));
}

function validateResult(value) {
  if (isComplexValue(value)) throw new InvalidNodeError('Complex values are not supported');
  const isUnit = Boolean(value?.isUnit || value?.unit);
  if (!isUnit && typeof value !== 'number' && value?.isBigNumber !== true)
    throw new InvalidNodeError('Only scalar numeric results are supported');
  if (!resultIsFinite(value, isUnit)) throw new NonFiniteResultError();
  return isUnit;
}

function serializeResult(value) {
  return value?.toString?.() ?? String(value);
}

export function evaluateExpression(expression) {
  const node = parseExpression(expression);
  validateExpression(node);
  validateStaticMagnitude(node);
  let value;
  try {
    value = node.evaluate();
  } catch {
    throw new InvalidNodeError('Unknown symbol or invalid operation');
  }
  const isUnit = validateResult(value);
  const result = serializeResult(value);
  if (!result) throw new NonFiniteResultError();
  return { result, representation: isUnit ? 'unit' : 'scalar' };
}
