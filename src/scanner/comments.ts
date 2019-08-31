import { ParserState, Context } from '../common';
import { advance } from './common';
import { Chars } from '../chars';
import { report, Errors } from '../errors';

export function skipSingleLineComment(parser: ParserState): any {
  while (parser.index < parser.length) {
    const next = parser.source.charCodeAt(parser.index);
    if (next === Chars.CarriageReturn) {
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      parser.precedingLineBreak = 1;
      parser.column = 0;
      parser.line++;
      if (parser.index < parser.length && parser.source.charCodeAt(parser.index) === Chars.LineFeed) {
        parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      }
      return 1;
    } else if (next === Chars.LineFeed || (next ^ Chars.LineSeparator) <= 1) {
      parser.precedingLineBreak = 1;
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      parser.column = 0;
      parser.line++;
      return 1;
    } else {
      parser.column++;
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
    }
  }
}

export function skipMultiLineComment(parser: ParserState, context: Context): any {
  let lastIsCR = 0;
  while (parser.index < parser.length) {
    const next = parser.source.charCodeAt(parser.index);

    if (next === Chars.Asterisk) {
      advance(parser);
      lastIsCR = 0;
      if (parser.source.charCodeAt(parser.index) === Chars.Slash) {
        advance(parser);
        return 1;
      }
    }

    if (next === Chars.CarriageReturn) {
      lastIsCR = 1;
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      parser.precedingLineBreak = 1;
      parser.column = 0;
      parser.line++;
    } else if (next === Chars.LineFeed) {
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      parser.precedingLineBreak = 1;
      if (lastIsCR === 0) {
        parser.column = 0;
        parser.line++;
      }
      lastIsCR = 0;
    } else if ((next ^ Chars.LineSeparator) <= 1) {
      lastIsCR = 0;
      parser.precedingLineBreak = 1;
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      parser.column = 0;
      parser.line++;
    } else {
      lastIsCR = 0;
      advance(parser);
    }
  }

  report(parser, context, Errors.UnterminatedComment);
  return -1;
}
