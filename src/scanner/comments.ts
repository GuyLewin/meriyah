import { ParserState, Context } from '../common';
import { advance, consumeLineFeed, advanceNewline } from './common';
import { Chars } from '../chars';
import { report, Errors } from '../errors';

export function skipSingleLineComment(parser: ParserState): any {
  while (parser.index < parser.length) {
    const next = parser.source.charCodeAt(parser.index);
    if (next === Chars.CarriageReturn) {
      advanceNewline(parser);
      if (parser.index < parser.length && parser.source.charCodeAt(parser.index) === Chars.LineFeed) {
        parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      }
      return 1;
      // ES 2015 11.3 Line Terminators
    }
    if (next === Chars.LineFeed || (next ^ Chars.LineSeparator) <= 1) {
      advanceNewline(parser);
      return 1;
    }

    advance(parser);
  }
}

export function skipMultiLineComment(parser: ParserState, context: Context): any {
  let lastIsCR: 0 | 1 = 0;
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
      advanceNewline(parser);
    } else if (next === Chars.LineFeed) {
      consumeLineFeed(parser, lastIsCR);
      lastIsCR = 0;
    } else if ((next ^ Chars.LineSeparator) <= 1) {
      lastIsCR = 0;
      advanceNewline(parser);
    } else {
      lastIsCR = 0;
      advance(parser);
    }
  }

  report(parser, context, Errors.UnterminatedComment);
  return -1;
}
