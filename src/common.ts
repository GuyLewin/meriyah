import { Comment } from './estree';
import { Token, KeywordDescTable } from './token';
import { nextToken } from './scanner/scan';
import { Errors, report } from './errors';

/**
 * The core context, passed around everywhere as a simple immutable bit set.
 */
export const enum Context {
  Empty = 0,

  OptionsNext = 1 << 0,
  OptionsRanges = 1 << 1,
  OptionsJSX = 1 << 2,
  OptionsRaw = 1 << 3,
  OptionsRecovery = 1 << 4,
  OptionsTS = 1 << 5,
  DisallowIn = 1 << 6,
  Strict = 1 << 8,
  Module = 1 << 9,
  TaggedTemplate = 1 << 7,
  ExpressionStart = 1 << 10,
  InTemplate = 1 << 11,
  AllowRegExp = 1 << 12
}

/**
 * The mutable parser flags, in case any flags need passed by reference.
 */
export const enum Flags {
  Empty = 0
}

/**
 * The type of the `onComment` option.
 */
export type CommentCallback = void | Comment[] | ((type: string, value: string, start: number, end: number) => any);

/**
 * The type of the `onError` option.
 */
export type ErrorCallback = void | { (message: string): void };

/**
 * The parser interface.
 */
export interface ParserState {
  source: string;
  onComment: CommentCallback | undefined;
  onError: ErrorCallback | undefined;
  startPos: number;
  tokenPos: number;
  errors: any[];
  flags: Flags;
  index: number;
  line: number;
  column: number;
  length: number;
  uid: number;
  ast: any;
  precedingLineBreak: 0 | 1;
  token: Token;
  tokenValue: any;
  tokenRaw: string;
  tokenRegExp: void | {
    pattern: string;
    flags: string;
  };

  // For the scanner to work around lack of multiple return.
  nextCodePoint: number;
}

export function consume(parser: ParserState, context: Context, t: Token) {
  if (parser.token === t) {
    nextToken(parser, context);
    return true;
  }
  report(parser, context, Errors.Expected, KeywordDescTable[t & Token.Type]);
  return false;
}

export function consumeOpt(parser: ParserState, context: Context, t: Token): boolean {
  if (parser.token === t) {
    nextToken(parser, context);
    return true;
  }
  return false;
}

export function canParseSemicolon(parser: ParserState) {
  // If there's a real semicolon, then we can always parse it out.
  if (parser.token === Token.Semicolon) {
    return true;
  }

  // We can parse out an optional semicolon in ASI cases in the following cases.
  return parser.token === Token.LeftBrace || parser.token === Token.EndOfSource || parser.precedingLineBreak;
}

export function consumeSemicolon(parser: ParserState, context: Context): boolean {
  if (canParseSemicolon(parser)) {
    if (parser.token === Token.Semicolon) {
      // consume the semicolon if it was explicitly provided.
      nextToken(parser, context);
    }

    return true;
  } else {
    return consume(parser, context, Token.Semicolon);
  }
}
