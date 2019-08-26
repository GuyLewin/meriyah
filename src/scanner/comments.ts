import { ParserState, Context } from '../common';
import { advance } from './common';
import { CharTypes, CharFlags } from './charClassifier';
import { Chars } from '../chars';
import { Token } from '../token';
import { report, Errors } from '../errors';

export function skipSingleLineComment(parser: ParserState): Token {
  let lastIsCR = 0;

  while (parser.index < parser.length) {
    if (
      CharTypes[parser.nextCodePoint] & CharFlags.IsWhiteSpaceOrLineTerminator ||
      (parser.nextCodePoint ^ Chars.LineSeparator) <= 1
    ) {
      if (parser.nextCodePoint === Chars.CarriageReturn) {
        lastIsCR = 2; // So it gets decremented to 1
      }
      if (!--lastIsCR) parser.line++;
      advance(parser);
      return Token.WhiteSpace;
    }
    if (lastIsCR) {
      parser.line++;
      lastIsCR = 0;
    }
    advance(parser);
  }

  return Token.Error;
}

export function parseCommentMulti(parser: ParserState, context: Context): Token {
  while (parser.index < parser.length) {
    let char = advance(parser);
    while (char === Chars.Asterisk) {
      char = advance(parser);
      if (char === Chars.Slash) {
        return Token.WhiteSpace;
      }
    }
    if (char === Chars.CarriageReturn) {
      advance(parser);
      // crlf is considered one line for the sake of reporting line-numbers
      if (parser.index < parser.length && parser.nextCodePoint === Chars.LineFeed) {
        advance(parser);
      }
    } else if (
      CharTypes[parser.nextCodePoint] & CharFlags.IsWhiteSpaceOrLineTerminator ||
      (parser.nextCodePoint ^ Chars.LineSeparator) <= 1
    ) {
      parser.index++;
    }
  }
  report(parser, context, Errors.Unexpected);
  return Token.Error;
}
