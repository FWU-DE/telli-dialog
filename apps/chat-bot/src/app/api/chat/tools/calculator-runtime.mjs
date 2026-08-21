import { all, create } from 'mathjs';

const math = create(all);
math.config({ number: 'BigNumber', precision: 64, predictable: true });
const FUNCTIONS = new Set([
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
const CONSTANTS = new Set(['pi', 'e', 'tau']);
const UNITS = new Set([
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
const OPERATORS = new Set(['+', '-', '*', '/', '^', 'to']);
export const LIMITS = {
  nodes: 200,
  depth: 32,
  literals: 100,
  exponent: 1000,
  cost: 1000,
  output: 8192,
};

function complexityError(message) {
  return Object.assign(new Error(message), { code: 'EXPRESSION_TOO_COMPLEX' });
}

function addCost(state, amount) {
  state.cost += amount;
  if (state.cost > LIMITS.cost)
    throw complexityError('Expression exceeds deterministic complexity limits');
}

function exponentValue(node) {
  if (node?.type === 'ConstantNode') return Number(node.value);
  if (node?.isOperatorNode && node.op === '-' && node.args.length === 1) {
    const value = exponentValue(node.args[0]);
    return Number.isFinite(value) ? -value : undefined;
  }
  return undefined;
}

export function validateExpression(node, depth = 0, state = { nodes: 0, literals: 0, cost: 0 }) {
  state.nodes++;
  addCost(state, 1);
  if (
    state.nodes > LIMITS.nodes ||
    depth > LIMITS.depth ||
    state.literals > LIMITS.literals ||
    state.cost > LIMITS.cost
  ) {
    throw complexityError('Expression exceeds deterministic complexity limits');
  }
  if (
    node.type === 'ConstantNode' &&
    (typeof node.value === 'number' || node.value?.isBigNumber === true)
  ) {
    state.literals++;
    if (state.literals > LIMITS.literals)
      throw complexityError('Expression exceeds literal limits');
    const literal = String(node.value);
    if (literal.replace(/[^0-9]/g, '').length > 100 || /e[+-]?\d{4,}$/i.test(literal))
      throw complexityError('Numeric literal exceeds limits');
    return;
  }
  if (node.type === 'ConstantNode') {
    throw Object.assign(new Error('Only numeric constants are supported'), {
      code: 'INVALID_NODE',
    });
  }
  if (node.isSymbolNode) {
    if (!CONSTANTS.has(node.name) && !UNITS.has(node.name))
      throw Object.assign(new Error('Variables and unknown symbols are not allowed'), {
        code: 'INVALID_NODE',
      });
    return;
  }
  if (node.isFunctionNode) {
    const name = node.fn?.name;
    if (!FUNCTIONS.has(name))
      throw Object.assign(new Error(`Function ${name ?? 'unknown'} is not allowed`), {
        code: 'FUNCTION_NOT_ALLOWED',
      });
    addCost(state, 10);
    node.args.forEach((arg) => validateExpression(arg, depth + 1, state));
    return;
  }
  if (node.isOperatorNode) {
    if (!OPERATORS.has(node.op))
      throw Object.assign(new Error(`Operator ${node.op} is not allowed`), {
        code: 'OPERATOR_NOT_ALLOWED',
      });
    if (node.op === '^') {
      const numericExponent = exponentValue(node.args[1]);
      const isSignedLiteral =
        node.args[1]?.type === 'ConstantNode' ||
        (node.args[1]?.isOperatorNode &&
          node.args[1].op === '-' &&
          node.args[1].args.length === 1 &&
          node.args[1].args[0]?.type === 'ConstantNode');
      if (!isSignedLiteral)
        throw Object.assign(new Error('Exponent must be a signed numeric literal'), {
          code: 'EXPONENT_NOT_ALLOWED',
        });
      if (numericExponent !== undefined) {
        if (!Number.isFinite(numericExponent) || Math.abs(numericExponent) > LIMITS.exponent)
          throw complexityError('Exponent exceeds deterministic limits');
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
  throw Object.assign(new Error('Expression contains a disallowed node'), { code: 'INVALID_NODE' });
}

export function evaluateExpression(expression) {
  if (
    /\bi\b/.test(expression) ||
    /\d\s*i(?:\b|$)/.test(expression) ||
    /\d+i(?:\b|$)/.test(expression)
  )
    throw Object.assign(new Error('Complex values are not supported'), { code: 'INVALID_NODE' });
  let node;
  try {
    node = math.parse(expression);
  } catch {
    throw Object.assign(new Error('Expression could not be parsed'), {
      code: 'INVALID_EXPRESSION',
    });
  }
  validateExpression(node);
  const value = node.evaluate();
  const result = value?.toString?.() ?? String(value);
  const isUnit = Boolean(value?.isUnit || value?.unit);
  if (value?.isComplex || value?.im !== undefined || /(?:\d|\))\s*i(?:\b|$)/.test(expression))
    throw Object.assign(new Error('Complex values are not supported'), { code: 'INVALID_NODE' });
  const isFinite = isUnit
    ? Number.isFinite(Number(value.value))
    : typeof value?.isFinite === 'function'
      ? value.isFinite()
      : Number.isFinite(Number(value));
  if (!result || !isFinite)
    throw Object.assign(new Error('Result is not finite'), { code: 'NONFINITE_RESULT' });
  return { result, representation: isUnit ? 'unit' : 'scalar' };
}
