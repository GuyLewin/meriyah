import { Comment } from './estree';
import { Token } from './token';
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

  Strict = 1 << 8,
  Module = 1 << 9,

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
