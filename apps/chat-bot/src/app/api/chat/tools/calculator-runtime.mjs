import { all, create } from 'mathjs';

const math = create(all);
math.config({ number: 'BigNumber', precision: 64, predictable: true });

const ALLOWED_FUNCTIONS = new Set([
  'sqrt',
  'abs',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'log',
  'log10',
  'exp',
  'round',
  'floor',
  'ceil',
  'min',
  'max',
]);
const ALLOWED_CONSTANTS = new Set(['pi', 'e', 'tau']);
const ALLOWED_UNITS = new Set([
  'm',
  'cm',
  'mm',
  'km',
  'in',
  'ft',
  'yd',
  'mi',
  'g',
  'kg',
  'mg',
  'lb',
  'oz',
  's',
  'ms',
  'min',
  'h',
  'd',
  'L',
  'l',
  'mL',
  'ml',
  'K',
  'degC',
  'degF',
  'rad',
  'deg',
  'Hz',
  'N',
  'Pa',
  'J',
  'W',
  'V',
  'A',
  'ohm',
  'mol',
  'bit',
  'byte',
]);
const ALLOWED_OPERATORS = new Set(['+', '-', '*', '/', '^', 'to']);

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
    if (!ALLOWED_CONSTANTS.has(node.name) && !ALLOWED_UNITS.has(node.name))
      throw new InvalidNodeError('Variables and unknown symbols are not allowed');
    return;
  }
  if (node.isFunctionNode) {
    const name = node.fn?.name;
    if (!ALLOWED_FUNCTIONS.has(name)) throw new FunctionNotAllowedError(name);
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

function containsComplexInput(expression) {
  return (
    /\bi\b/.test(expression) || /\d\s*i(?:\b|$)/.test(expression) || /\d+i(?:\b|$)/.test(expression)
  );
}

function parseExpression(expression) {
  try {
    return math.parse(expression);
  } catch {
    throw new InvalidExpressionError();
  }
}

function isComplexValue(value, expression) {
  return Boolean(
    value?.isComplex || value?.im !== undefined || /(?:\d|\))\s*i(?:\b|$)/.test(expression),
  );
}

function resultIsFinite(value, isUnit) {
  if (isUnit) return Number.isFinite(Number(value.value));
  return typeof value?.isFinite === 'function' ? value.isFinite() : Number.isFinite(Number(value));
}

function validateResult(value, expression) {
  if (isComplexValue(value, expression))
    throw new InvalidNodeError('Complex values are not supported');
  const isUnit = Boolean(value?.isUnit || value?.unit);
  if (!resultIsFinite(value, isUnit)) throw new NonFiniteResultError();
  return isUnit;
}

function serializeResult(value) {
  return value?.toString?.() ?? String(value);
}

export function evaluateExpression(expression) {
  if (containsComplexInput(expression))
    throw new InvalidNodeError('Complex values are not supported');
  const node = parseExpression(expression);
  validateExpression(node);
  const value = node.evaluate();
  const isUnit = validateResult(value, expression);
  const result = serializeResult(value);
  if (!result) throw new NonFiniteResultError();
  return { result, representation: isUnit ? 'unit' : 'scalar' };
}
