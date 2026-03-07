/**
 * 安全な計算式エンジン
 * eval()を使わず、トークン化→AST→評価のパターンで計算式を処理する
 *
 * サポート関数:
 *   SUM, IF, ROUND, ROUNDUP, ROUNDDOWN, MAX, MIN, AVG, ABS, INT
 * サポート演算子:
 *   +, -, *, /, %, (, )
 * 比較演算子 (IF内):
 *   ==, !=, >=, <=, >, <
 */

// ===== トークン定義 =====
type TokenType =
  | 'NUMBER'
  | 'FIELD'
  | 'FUNCTION'
  | 'OPERATOR'
  | 'COMPARISON'
  | 'COMMA'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

// ===== AST ノード定義 =====
type ASTNode =
  | { type: 'number'; value: number }
  | { type: 'field'; code: string }
  | { type: 'binary'; op: string; left: ASTNode; right: ASTNode }
  | { type: 'unary'; op: string; operand: ASTNode }
  | { type: 'call'; name: string; args: ASTNode[] };

// ===== トークナイザー =====
const FUNCTIONS = ['SUM', 'IF', 'ROUND', 'ROUNDUP', 'ROUNDDOWN', 'MAX', 'MIN', 'AVG', 'ABS', 'INT'];
const COMPARISON_OPS = ['==', '!=', '>=', '<=', '>', '<'];

function tokenize(formula: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < formula.length) {
    // 空白スキップ
    if (/\s/.test(formula[i])) {
      i++;
      continue;
    }

    // 数値リテラル
    if (/[0-9]/.test(formula[i]) || (formula[i] === '.' && i + 1 < formula.length && /[0-9]/.test(formula[i + 1]))) {
      let num = '';
      while (i < formula.length && /[0-9.]/.test(formula[i])) {
        num += formula[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // 括弧
    if (formula[i] === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (formula[i] === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    // カンマ
    if (formula[i] === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }

    // 比較演算子（2文字）
    if (i + 1 < formula.length) {
      const twoChar = formula[i] + formula[i + 1];
      if (COMPARISON_OPS.includes(twoChar)) {
        tokens.push({ type: 'COMPARISON', value: twoChar });
        i += 2;
        continue;
      }
    }

    // 比較演算子（1文字: > <）
    if (formula[i] === '>' || formula[i] === '<') {
      tokens.push({ type: 'COMPARISON', value: formula[i] });
      i++;
      continue;
    }

    // 演算子
    if ('+-*/%'.includes(formula[i])) {
      tokens.push({ type: 'OPERATOR', value: formula[i] });
      i++;
      continue;
    }

    // 識別子（関数名またはフィールドコード）
    if (/[a-zA-Z_\u3000-\u9FFF\uF900-\uFAFF]/.test(formula[i])) {
      let ident = '';
      while (i < formula.length && /[a-zA-Z0-9_\u3000-\u9FFF\uF900-\uFAFF]/.test(formula[i])) {
        ident += formula[i];
        i++;
      }
      const upper = ident.toUpperCase();
      if (FUNCTIONS.includes(upper)) {
        tokens.push({ type: 'FUNCTION', value: upper });
      } else {
        tokens.push({ type: 'FIELD', value: ident });
      }
      continue;
    }

    // 不明な文字はスキップ
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// ===== パーサー（再帰下降） =====
class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '' };
  }

  private consume(type?: TokenType): Token {
    const token = this.peek();
    if (type && token.type !== type) {
      throw new Error(`Expected ${type} but got ${token.type} (${token.value})`);
    }
    this.pos++;
    return token;
  }

  parse(): ASTNode {
    const node = this.parseExpression();
    return node;
  }

  // expression = comparison
  private parseExpression(): ASTNode {
    return this.parseComparison();
  }

  // comparison = additive (('==' | '!=' | '>=' | '<=' | '>' | '<') additive)?
  private parseComparison(): ASTNode {
    let left = this.parseAdditive();
    const token = this.peek();
    if (token.type === 'COMPARISON') {
      const op = this.consume().value;
      const right = this.parseAdditive();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  // additive = multiplicative (('+' | '-') multiplicative)*
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();
    while (this.peek().type === 'OPERATOR' && (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  // multiplicative = unary (('*' | '/' | '%') unary)*
  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();
    while (this.peek().type === 'OPERATOR' && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')) {
      const op = this.consume().value;
      const right = this.parseUnary();
      left = { type: 'binary', op, left, right };
    }
    return left;
  }

  // unary = ('-' | '+') unary | primary
  private parseUnary(): ASTNode {
    if (this.peek().type === 'OPERATOR' && (this.peek().value === '-' || this.peek().value === '+')) {
      const op = this.consume().value;
      const operand = this.parseUnary();
      if (op === '-') {
        return { type: 'unary', op: '-', operand };
      }
      return operand;
    }
    return this.parsePrimary();
  }

  // primary = NUMBER | FIELD | FUNCTION '(' args ')' | '(' expression ')'
  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (token.type === 'NUMBER') {
      this.consume();
      return { type: 'number', value: parseFloat(token.value) };
    }

    if (token.type === 'FUNCTION') {
      const name = this.consume().value;
      this.consume('LPAREN');
      const args = this.parseArgList();
      this.consume('RPAREN');
      return { type: 'call', name, args };
    }

    if (token.type === 'FIELD') {
      this.consume();
      return { type: 'field', code: token.value };
    }

    if (token.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }

    throw new Error(`Unexpected token: ${token.type} (${token.value})`);
  }

  private parseArgList(): ASTNode[] {
    const args: ASTNode[] = [];
    if (this.peek().type === 'RPAREN') return args;

    args.push(this.parseExpression());
    while (this.peek().type === 'COMMA') {
      this.consume();
      args.push(this.parseExpression());
    }
    return args;
  }
}

// ===== 評価器 =====
function evaluate(node: ASTNode, values: Record<string, unknown>): number {
  switch (node.type) {
    case 'number':
      return node.value;

    case 'field': {
      const val = values[node.code];
      const num = Number(val ?? 0);
      return isNaN(num) ? 0 : num;
    }

    case 'unary': {
      const operand = evaluate(node.operand, values);
      if (node.op === '-') return -operand;
      return operand;
    }

    case 'binary': {
      const left = evaluate(node.left, values);
      const right = evaluate(node.right, values);
      switch (node.op) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return right === 0 ? 0 : left / right;
        case '%': return right === 0 ? 0 : left % right;
        // 比較演算子は 1 (true) / 0 (false) を返す
        case '==': return left === right ? 1 : 0;
        case '!=': return left !== right ? 1 : 0;
        case '>': return left > right ? 1 : 0;
        case '<': return left < right ? 1 : 0;
        case '>=': return left >= right ? 1 : 0;
        case '<=': return left <= right ? 1 : 0;
        default: throw new Error(`Unknown operator: ${node.op}`);
      }
    }

    case 'call':
      return evaluateFunction(node.name, node.args, values);

    default:
      throw new Error('Unknown node type');
  }
}

function evaluateFunction(name: string, args: ASTNode[], values: Record<string, unknown>): number {
  switch (name) {
    case 'SUM': {
      let sum = 0;
      for (const arg of args) {
        sum += evaluate(arg, values);
      }
      return sum;
    }

    case 'IF': {
      if (args.length < 3) throw new Error('IF requires 3 arguments');
      const condition = evaluate(args[0], values);
      return condition !== 0 ? evaluate(args[1], values) : evaluate(args[2], values);
    }

    case 'ROUND': {
      if (args.length < 2) throw new Error('ROUND requires 2 arguments');
      const val = evaluate(args[0], values);
      const dec = evaluate(args[1], values);
      const factor = Math.pow(10, dec);
      return Math.round(val * factor) / factor;
    }

    case 'ROUNDUP': {
      if (args.length < 2) throw new Error('ROUNDUP requires 2 arguments');
      const val = evaluate(args[0], values);
      const dec = evaluate(args[1], values);
      const factor = Math.pow(10, dec);
      return Math.ceil(val * factor) / factor;
    }

    case 'ROUNDDOWN': {
      if (args.length < 2) throw new Error('ROUNDDOWN requires 2 arguments');
      const val = evaluate(args[0], values);
      const dec = evaluate(args[1], values);
      const factor = Math.pow(10, dec);
      return Math.floor(val * factor) / factor;
    }

    case 'MAX': {
      if (args.length === 0) return 0;
      let max = -Infinity;
      for (const arg of args) {
        const v = evaluate(arg, values);
        if (v > max) max = v;
      }
      return max;
    }

    case 'MIN': {
      if (args.length === 0) return 0;
      let min = Infinity;
      for (const arg of args) {
        const v = evaluate(arg, values);
        if (v < min) min = v;
      }
      return min;
    }

    case 'AVG': {
      if (args.length === 0) return 0;
      let sum = 0;
      for (const arg of args) {
        sum += evaluate(arg, values);
      }
      return sum / args.length;
    }

    case 'ABS': {
      if (args.length < 1) throw new Error('ABS requires 1 argument');
      return Math.abs(evaluate(args[0], values));
    }

    case 'INT': {
      if (args.length < 1) throw new Error('INT requires 1 argument');
      return Math.trunc(evaluate(args[0], values));
    }

    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// ===== 公開API =====

/**
 * 計算式を評価する
 * @param formula 計算式文字列 (例: "SUM(price, tax)" / "IF(qty > 0, price * qty, 0)")
 * @param values フィールドコード → 値のマップ
 * @returns 計算結果の数値、エラー時はnull
 */
export function evaluateFormula(formula: string, values: Record<string, unknown>): number | null {
  if (!formula || !formula.trim()) return null;
  try {
    const tokens = tokenize(formula);
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const result = evaluate(ast, values);
    if (typeof result !== 'number' || !isFinite(result)) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * 計算結果をフォーマットする
 * @param result 計算結果
 * @param format フォーマット種別
 * @param decimals 小数桁数
 * @param localeStr ロケール文字列
 */
export function formatFormulaResult(
  result: number | null,
  format: string,
  decimals: number,
  localeStr: string,
): string {
  if (result === null) return '-';

  // decimalsに基づいて丸める
  const rounded = Math.round(result * Math.pow(10, decimals)) / Math.pow(10, decimals);

  if (format === 'currency') {
    return rounded.toLocaleString(localeStr, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  if (format === 'percent') {
    return `${(rounded * 100).toFixed(Math.max(0, decimals - 2))}%`;
  }
  return rounded.toLocaleString(localeStr, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
