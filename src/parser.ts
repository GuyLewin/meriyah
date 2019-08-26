import { Context, Flags, CommentCallback, ErrorCallback, ParserState } from './common';
import { Token } from './token';
import { nextToken } from './scanner/scan';

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
    statements.push(parseStatement(parser, context));
  }
  return statements;
}

export function parseStatement(parser: ParserState, context: Context): any {
  return parsePrimaryExpression(parser, context);
}

export function parsePrimaryExpression(parser: ParserState, context: Context): any {
  switch (parser.token) {
    case Token.Error:
      nextToken(parser, context);
    default:
      const { tokenValue } = parser;
      nextToken(parser, context);
      return {
        type: 'Identifier',
        value: tokenValue
      };
  }
}
