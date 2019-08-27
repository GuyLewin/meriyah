import { Context, Flags, CommentCallback, ErrorCallback, ParserState } from './common';
import { Token, KeywordDescTable } from './token';
import { nextToken } from './scanner/scan';
import { expect } from './common';
import { Errors, report } from './errors';

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
    statements.push(parseStatementListItem(parser, context));
  }
  return statements;
}

export function parseStatementListItem(parser: ParserState, context: Context): any {
  switch (parser.token) {
    case Token.FunctionKeyword:
      return parseFunctionDeclaration(parser, context);
  }
  return parseStatement(parser, context);
}

export function parseStatement(parser: ParserState, context: Context): any {
  return parsePrimaryExpression(parser, context);
}

export function parseFunctionDeclaration(parser: ParserState, context: Context): any {
  nextToken(parser, context);
  expect(parser, context, Token.LeftParen);
  expect(parser, context, Token.RightParen);
  expect(parser, context, Token.LeftBrace);
  expect(parser, context, Token.RightBrace);
}

export function parsePrimaryExpression(parser: ParserState, context: Context): any {
  switch (parser.token) {
    case Token.Error:
      report(parser, context, Errors.Unexpected);
      nextToken(parser, context);

    case Token.Identifier:
      const { tokenValue } = parser;
      nextToken(parser, context);
      return {
        type: 'Identifier',
        value: tokenValue
      };
    default:
      report(parser, context, Errors.UnexpectedToken, KeywordDescTable[parser.token & Token.Type]);
      nextToken(parser, context);
  }
}
