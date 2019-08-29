import { Context, Flags, CommentCallback, ErrorCallback, ParserState } from './common';
import { Token, KeywordDescTable } from './token';
import { nextToken } from './scanner/scan';
import { consume, consumeOpt, consumeSemicolon, canParseSemicolon } from './common';
import { Errors, report } from './errors';
import { NodeKind } from './incremental';
import { scanTemplateTail } from './scanner/string';
/**
 * Create a new parser instance.
 */
export function create(source: string, onError?: ErrorCallback, onComment?: CommentCallback): ParserState {
  return {
    source,
    onComment,
    onError,
    flags: Flags.Empty,
    index: 0,
    line: 1,
    column: 0,
    tokenPos: 0,
    startPos: 0,
    uid: 0,
    ast: {},
    precedingLineBreak: 0,
    length: source.length,
    token: Token.EndOfSource,
    tokenValue: undefined,
    tokenRaw: '',
    tokenRegExp: undefined,
    errors: [],
    nextCodePoint: source.charCodeAt(0)
  };
}

export function parseStatementList(parser: ParserState, context: Context): any {
  const statements: any[] = [];
  nextToken(parser, context);
  while (parser.token !== Token.EndOfSource) {
    statements.push(parseStatementListItem(parser, context, parser.tokenPos));
  }
  return statements;
}

export function parseStatementListItem(parser: ParserState, context: Context, pos: number): any {
  switch (parser.token) {
    case Token.FunctionKeyword:
      return parseFunctionDeclaration(parser, context, pos);
  }
  return parseStatement(parser, context, pos);
}

export function parseStatement(parser: ParserState, context: Context, pos: number): any {
  switch (parser.token) {
    default:
      return parseExpressionOrLabelledStatement(parser, context, pos);
  }
}

export function parseExpressionOrLabelledStatement(parser: ParserState, context: Context, pos: number): any {
  const { token } = parser;

  let expr = parsePrimaryExpression(parser, context);

  if (parser.token === Token.Colon) return parseLabelledStatement(parser, context, token, expr, pos);

  expr = parseMemberOrUpdateExpression(parser, context, expr);

  if (parser.token === Token.Comma) expr = parseSequenceExpression(parser, context, expr);

  expr = parseAssignmentExpression(parser, context, expr);

  return parseExpressionStatement(parser, context, expr);
}

function parseSequenceExpression(parser: ParserState, context: Context, expr: any) {
  const expressions: any[] = [expr];
  while (consumeOpt(parser, context, Token.Comma)) {
    expressions.push(parseExpression(parser, context));
  }

  return {
    type: 'SequenceExpression',
    expressions
  };
}

function parseExpression(parser: ParserState, context: Context): any {
  let expr = parseLeftHandSideExpression(parser, context);
  return parseAssignmentExpression(parser, context, expr);
}

export function parseExpressions(parser: ParserState, context: Context): any {
  const expr = parseExpression(parser, context);
  return parser.token === Token.Comma ? parseSequenceExpression(parser, context, expr) : expr;
}

function parseLeftHandSideExpression(parser: ParserState, context: Context): any {
  let expr = parsePrimaryExpression(parser, context);
  return parseMemberOrUpdateExpression(parser, context, expr);
}

function parseAssignmentExpression(parser: ParserState, context: Context, left: any): any {
  if ((parser.token & Token.IsAssignOp) === Token.IsAssignOp) {
    const token = parser.token;
    nextToken(parser, context | Context.AllowRegExp);
    const right = parseExpression(parser, context);

    return {
      type: 'AssignmentExpression',
      left,
      operator: KeywordDescTable[token & Token.Type],
      right
    };
  }

  if ((parser.token & Token.IsBinaryOp) === Token.IsBinaryOp) {
    // We start using the binary expression parser for prec >= 4 only!
    left = parseBinaryExpression(parser, context, 4, parser.token, left);
  }

  /**
   * Conditional expression
   * https://tc39.github.io/ecma262/#prod-ConditionalExpression
   *
   */
  if (consumeOpt(parser, context | Context.AllowRegExp, Token.QuestionMark)) {
    left = parseConditionalExpression(parser, context, left);
  }
  return left;
}

function parseConditionalExpression(parser: ParserState, context: Context, test: any) {
  const consequent = parseExpression(parser, context);
  consume(parser, context | Context.AllowRegExp, Token.Colon);
  const alternate = parseExpression(parser, context);
  return {
    type: 'ConditionalExpression',
    test,
    consequent,
    alternate
  };
}

function parseBinaryExpression(
  parser: ParserState,
  context: Context,
  minPrec: number,
  operator: Token,
  left: any
): any {
  const bit = -((context & Context.DisallowIn) > 0) & Token.InKeyword;
  let t: Token;
  let prec: number;

  while (parser.token & Token.IsBinaryOp) {
    t = parser.token;
    prec = t & Token.Precedence;

    if ((t & Token.IsLogical && operator & Token.IsCoalesc) || (operator & Token.IsLogical && t & Token.IsCoalesc)) {
      report(parser, context, Errors.InvalidCoalescing);
    }

    // 0 precedence will terminate binary expression parsing

    if (prec + (((t === Token.Exponentiate) as any) << 8) - (((bit === t) as any) << 12) <= minPrec) break;
    nextToken(parser, context | Context.AllowRegExp);

    left = {
      type: t & Token.IsLogical ? 'LogicalExpression' : t & Token.IsCoalesc ? 'CoalesceExpression' : 'BinaryExpression',
      left,
      right: parseBinaryExpression(parser, context, prec, t, parseLeftHandSideExpression(parser, context)),
      operator: KeywordDescTable[t & Token.Type]
    };
  }

  return left;
}

function parseMemberOrUpdateExpression(parser: ParserState, context: Context, expr: any): any {
  if ((parser.token & Token.IsMemberOrCallExpression) === Token.IsMemberOrCallExpression) {
    switch (parser.token) {
      /* Property */
      case Token.Period: {
        nextToken(parser, context);

        const property = parseIdentifier(parser, context);

        expr = {
          type: 'MemberExpression',
          object: expr,
          computed: false,
          property
        };
        break;
      }

      /* Property */
      case Token.LeftBracket: {
        nextToken(parser, context | Context.AllowRegExp);

        const property = parseExpressions(parser, context);

        consume(parser, context, Token.RightBracket);

        expr = {
          type: 'MemberExpression',
          object: expr,
          computed: true,
          property
        };

        break;
      }

      /* Call */
      case Token.LeftParen: {
        const args = parseArguments(parser, context);

        expr = {
          type: 'CallExpression',
          callee: expr,
          arguments: args
        };
        break;
      }

      /* Optional chaining */
      case Token.QuestionMarkPeriod: {
        nextToken(parser, context); // skips: '?.'
        expr = {
          type: 'OptionalExpression',
          object: expr,
          chain: parseOptionalChain(parser, context)
        };
        break;
      }

      default:
        /* Tagged Template */

        expr = {
          type: 'TaggedTemplateExpression',
          tag: expr,
          quasi:
            parser.token === Token.TemplateCont
              ? parseTemplateLiteral(parser, context | Context.TaggedTemplate)
              : parseNoSubstitutionTemplate(parser, context)
        };
    }

    return parseMemberOrUpdateExpression(parser, context, expr);
  }

  return expr;
}

export function parseOptionalChain(parser: ParserState, context: Context): any {
  let base: any = null;
  if (parser.token === Token.LeftBracket) {
    nextToken(parser, context | Context.AllowRegExp);
    const property = parseExpressions(parser, context);
    consume(parser, context, Token.RightBracket);
    base = {
      type: 'OptionalChain',
      base: null,
      computed: true,
      property
    };
  } else if (parser.token === Token.LeftParen) {
    const args = parseArguments(parser, context);

    base = {
      type: 'OptionalChain',
      base: null,
      arguments: args
    };
  } else {
    const property = parseIdentifier(parser, context);
    base = {
      type: 'OptionalChain',
      base: null,
      computed: false,
      property
    };
  }

  while ((parser.token & Token.IsMemberOrCallExpression) === Token.IsMemberOrCallExpression) {
    if (parser.token === Token.Period) {
      nextToken(parser, context);
      const property = parseIdentifier(parser, context);
      base = {
        type: 'OptionalChain',
        base,
        computed: false,
        property
      };
    } else if (parser.token === Token.LeftBracket) {
      nextToken(parser, context | Context.AllowRegExp);
      const property = parseExpressions(parser, context);
      consume(parser, context, Token.RightBracket);
      base = {
        type: 'OptionalChain',
        base,
        computed: true,
        property
      };
    } else if (parser.token === Token.LeftParen) {
      const args = parseArguments(parser, context);

      base = {
        type: 'OptionalChain',
        base,
        arguments: args
      };
    } else if (parser.token === Token.TemplateCont || parser.token === Token.TemplateTail) {
      report(parser, context, Errors.UnexpectedToken, 'Errors.OptionalChainingNoTemplate');
    } else {
      break;
    }
  }

  return base;
}

export function parseArguments(parser: ParserState, context: Context): any[] {
  nextToken(parser, context | Context.AllowRegExp);

  const args: any[] = [];

  if (consumeOpt(parser, context, Token.RightParen)) return args;

  while (parser.token !== Token.RightParen) {
    if (parser.token === Token.Ellipsis) {
      args.push(parseSpreadElement(parser, context));
    } else {
      args.push(parseExpression(parser, context));
    }

    if (parser.token !== Token.Comma) break;

    nextToken(parser, context | Context.AllowRegExp);

    if (parser.token === Token.RightParen) break;
  }

  consume(parser, context, Token.RightParen);

  return args;
}

function parseSpreadElement(parser: ParserState, context: Context): any {
  consume(parser, context | Context.AllowRegExp, Token.Ellipsis);
  const argument = parseExpression(parser, context);
  return {
    type: 'SpreadElement',
    argument
  };
}

function parseLabelledStatement(parser: ParserState, context: Context, _t: Token, expr: any, pos: number) {
  nextToken(parser, context); // skip: ':'

  const body = parseStatement(parser, context, pos);

  return {
    type: 'LabeledStatement',
    label: expr as any,
    body
  };
}

function parseExpressionStatement(parser: ParserState, context: Context, expression: any): any {
  consumeSemicolon(parser, context);
  return context & Context.OptionsRecovery
    ? {
        type: NodeKind.ExpressionStatement,
        uid: parser.uid++,
        start: 0,
        id: 0,
        expression
      }
    : {
        type: 'ExpressionStatement',
        expression
      };
}

export function parseFunctionDeclaration(parser: ParserState, context: Context, start: number): any {
  nextToken(parser, context); // skip: 'function'
  let id: any = null;
  if (parser.token !== Token.LeftParen) {
    id = parseIdentifier(parser, context);
  }
  console.log(start);
  const params = parseFormalParametersOrFormalList(parser, context);
  const body = parseAndCheckFunctionBody(parser, context);

  return context & Context.OptionsRecovery
    ? {
        type: NodeKind.FunctionDeclaration,
        params,
        body,
        async: false,
        generator: false,
        id,
        start,
        end: parser.index,
        flags: 0,
        uid: parser.uid++
      }
    : {
        type: 'FunctionDeclaration',
        params,
        body,
        async: false,
        generator: false,
        id
      };
}
export function parseFormalParametersOrFormalList(parser: ParserState, context: Context): any {
  nextToken(parser, context);
  consume(parser, context, Token.RightParen);
  return [];
}
export function parseAndCheckFunctionBody(parser: ParserState, context: Context): any {
  if (parser.token === Token.LeftBrace) {
    return parseBlock(parser, context);
  }
  if (canParseSemicolon(parser)) {
    consumeSemicolon(parser, context);
    return undefined;
  }
  report(parser, context, Errors.UnexpectedToken, ';'); // block or ';' expected
}

export function parseBlock(parser: ParserState, context: Context): any {
  const start = parser.tokenPos;
  let body: any[] = [];

  if (consume(parser, context, Token.LeftBrace)) {
    while (parser.token !== Token.RightBrace) {
      body.push(parseStatementListItem(parser, context, parser.startPos));
      consume(parser, context, Token.RightBrace);
    }
  } else {
    body = [parser.startPos, parser.startPos];
  }

  return context & Context.OptionsRecovery
    ? {
        type: NodeKind.Block,
        body,
        uid: parser.uid++,
        start,
        end: parser.index
      }
    : {
        type: 'BlockStatement',
        body
      };
}

export function parsePrimaryExpression(parser: ParserState, context: Context): any {
  if ((parser.token & Token.IdentifierOrKeyword) !== 0) {
    return parseIdentifier(parser, context);
  }

  if ((parser.token & Token.IsStringOrNumber) !== 0) {
    return parseLiteral(parser, context);
  }

  switch (parser.token) {
    case Token.Increment:
    case Token.Decrement:
      return parseUpdateExpressionPrefixed(parser, context, 0);
    case Token.DeleteKeyword:
    case Token.Negate:
    case Token.Complement:
    case Token.Add:
    case Token.Subtract:
    case Token.TypeofKeyword:
    case Token.VoidKeyword:
      return parseUnaryExpression(parser, context);
    case Token.FalseKeyword:
    case Token.TrueKeyword:
    case Token.NullKeyword:
      return parseNullOrTrueOrFalseLiteral(parser, context);
    case Token.ThisKeyword:
      return parseThisExpression(parser, context);
    case Token.RegularExpression:
      return parseRegExpLiteral(parser, context);
    case Token.LeftBrace:
      return parseObjectLiteral(parser, context);
    case Token.LeftBracket:
      return parseArrayLiteral(parser, context);
    case Token.LeftParen:
      return parseParenthesizedExpression(parser, context);
    case Token.ClassKeyword:
      return parseClassExpression(parser, context);
    case Token.SuperKeyword:
      return parseSuperExpression(parser, context);
    case Token.TemplateTail:
      return parseNoSubstitutionTemplate(parser, context);
    case Token.TemplateCont:
      return parseTemplateLiteral(parser, context);
    case Token.NewKeyword:
      return parseNewExpression(parser, context);
    case Token.BigIntLiteral:
      return parseBigIntLiteral(parser, context);
    default:
      nextToken(parser, context);
  }
}

export function parseObjectLiteral(_parser: ParserState, _context: Context): any {}
export function parseArrayLiteral(_parser: ParserState, _context: Context): any {}
export function parseParenthesizedExpression(_parser: ParserState, _context: Context): any {}
export function parseClassExpression(_parser: ParserState, _context: Context): any {}
export function parseSuperExpression(_parser: ParserState, _context: Context): any {}
export function parseNewExpression(_parser: ParserState, _context: Context): any {}

export function parseNoSubstitutionTemplate(parser: ParserState, context: Context): any {
  consume(parser, context, Token.TemplateTail);
  return {
    type: 'TemplateLiteral',
    expressions: [],
    quasis: [parseTemplateElement(parser, context, true)]
  };
}

export function parseTemplateLiteral(parser: ParserState, context: Context): any {
  let quasis = [parseTemplateElement(parser, context | Context.InTemplate, false)];

  consume(parser, context | Context.AllowRegExp, Token.TemplateCont);

  const expressions = [parseExpressions(parser, context)];
  while ((parser.token = scanTemplateTail(parser, context)) !== Token.TemplateTail) {
    quasis.push(parseTemplateElement(parser, context, /* tail */ false));
    consume(parser, context | Context.AllowRegExp, Token.TemplateCont);
    expressions.push(parseExpressions(parser, context));
  }

  quasis.push(parseTemplateElement(parser, context, /* tail */ true));

  consume(parser, context, Token.TemplateTail);

  return {
    type: 'TemplateLiteral',
    expressions,
    quasis
  };
}

function parseTemplateElement(parser: ParserState, _context: Context, tail: boolean): any {
  return {
    type: 'TemplateElement',
    tail,
    value: {
      cooked: parser.tokenValue,
      raw: parser.tokenRaw
    }
  };
}

export function parseBigIntLiteral(parser: ParserState, context: Context): any {
  const { tokenRaw, tokenValue } = parser;
  nextToken(parser, context);
  return {
    type: 'BigIntLiteral',
    value: tokenValue,
    bigint: tokenRaw
  };
}

export function parseUnaryExpression(parser: ParserState, context: Context): any {
  const unaryOperator = parser.token;
  nextToken(parser, context | Context.AllowRegExp);
  const arg = parseLeftHandSideExpression(parser, context);
  if (parser.token === Token.Exponentiate) report(parser, context, Errors.Unexpected);
  if (context & Context.Strict && unaryOperator === Token.DeleteKeyword) {
    if (arg.type === 'Identifier') {
      report(parser, context, Errors.Unexpected);
      // Prohibit delete of private class elements
    }
  }

  return {
    type: 'UnaryExpression',
    operator: KeywordDescTable[unaryOperator & Token.Type],
    argument: arg,
    prefix: true
  };
}

export function parseUpdateExpressionPrefixed(parser: ParserState, context: Context, inNew: 0 | 1): any {
  if (inNew) report(parser, context, Errors.Unexpected);

  const { token } = parser;

  nextToken(parser, context | Context.AllowRegExp);

  const arg = parseLeftHandSideExpression(parser, context);

  return {
    type: 'UpdateExpression',
    argument: arg,
    operator: KeywordDescTable[token & Token.Type],
    prefix: true
  };
}

export function parseLiteral(parser: ParserState, context: Context): any {
  const { tokenValue } = parser;
  nextToken(parser, context);
  return {
    type: 'Literal',
    value: tokenValue
  };
}

export function parseIdentifier(parser: ParserState, context: Context): any {
  const { tokenValue } = parser;
  nextToken(parser, context);
  return {
    type: 'Identifier',
    name: tokenValue
  };
}

export function parseThisExpression(parser: ParserState, context: Context): any {
  nextToken(parser, context);
  return {
    type: 'ThisExpression'
  };
}

export function parseNullOrTrueOrFalseLiteral(parser: ParserState, context: Context): any {
  const raw = KeywordDescTable[parser.token & Token.Type];
  const value = parser.token === Token.NullKeyword ? null : raw === 'true';
  nextToken(parser, context);
  return {
    type: 'Literal',
    value
  };
}

export function parseRegExpLiteral(parser: ParserState, context: Context): any {
  const { tokenRegExp, tokenValue } = parser;
  nextToken(parser, context);
  return {
    type: 'Literal',
    value: tokenValue,
    regex: tokenRegExp
  };
}
