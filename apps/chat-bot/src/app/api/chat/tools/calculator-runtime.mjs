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
