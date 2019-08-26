import { CharTypes, CharFlags } from './charClassifier';
import { Token } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { advance, toHex, fromCodePoint } from './common';
import { report, Errors } from '../errors';

// Intentionally negative
export const enum Escape {
  Empty = -1,
  StrictOctal = -2,
  EightOrNine = -3,
  InvalidHex = -4,
  OutOfRange = -5
}

export function parseStringLiteral(parser: ParserState, context: Context, quote: number): Token {
  advance(parser); // Skips the quote

  let res = '';
  let start = parser.index;

  while ((CharTypes[parser.nextCodePoint] & CharFlags.IsWhiteSpaceOrLineTerminator) === 0) {
    if (parser.index >= parser.length) {
      res += parser.source.substring(start, parser.index);
      break;
    }

    const ch = parser.nextCodePoint;

    if (ch === quote) {
      res += parser.source.substring(start, parser.index);
      advance(parser);
      parser.tokenValue = res;
      return Token.StringLiteral;
    }

    if (ch === Chars.Backslash) {
      res += parser.source.substring(start, parser.index);
      advance(parser);
      if (parser.index >= parser.length) {
        report(parser, context, Errors.UnterminatedString);
        return Token.Error;
      }
      const code = scanEscape(parser, context);
      if (code >= 0) {
        res += fromCodePoint(code);
        start = parser.index;
      } else {
        handleStringError(parser, context, code as Escape, /* isTemplate */ 0);
        return Token.Error;
      }

      continue;
    }
    advance(parser);
  }

  parser.tokenValue = res;

  report(parser, context, Errors.UnterminatedString);

  return Token.Error;
}
export function handleStringError(state: ParserState, context: Context, code: Escape, isTemplate: 0 | 1): void {
  switch (code) {
    case Escape.Empty:
      return;

    case Escape.StrictOctal:
      report(state, context, isTemplate ? Errors.TemplateOctalLiteral : Errors.StrictOctalEscape);

    case Escape.EightOrNine:
      report(state, context, Errors.InvalidEightAndNine);

    case Escape.InvalidHex:
      report(state, context, Errors.InvalidHexEscapeSequence);

    case Escape.OutOfRange:
      report(state, context, Errors.UnicodeOverflow);

    default: // ignore
  }
}
export function scanEscape(parser: ParserState, context: Context): number {
  const ch = parser.nextCodePoint;
  advance(parser);
  switch (ch) {
    case Chars.LowerB:
      return Chars.Backspace;
    case Chars.LowerF:
      return Chars.FormFeed;
    case Chars.LowerR:
      return Chars.CarriageReturn;
    case Chars.LowerN:
      return Chars.LineFeed;
    case Chars.LowerT:
      return Chars.Tab;
    case Chars.LowerV:
      return Chars.VerticalTab;
    // Line continuations
    case Chars.CarriageReturn: {
      if (parser.index < parser.length) {
        if (parser.nextCodePoint === Chars.LineFeed) {
          parser.index = parser.index + 1;
          parser.nextCodePoint = parser.source.charCodeAt(parser.index);
        }
      }
      break;
    }

    case Chars.LowerU: {
      // '\u{DDDDDDDD}'
      if (parser.index < parser.length && parser.nextCodePoint === Chars.LeftBrace) {
        let code = 0;
        while ((CharTypes[advance(parser)] & CharFlags.Hex) !== 0) {
          code = (code << 4) | toHex(parser.nextCodePoint);
          if (code > 0x10ffff) return Escape.OutOfRange;
        }

        if ((parser.nextCodePoint as number) !== Chars.RightBrace) {
          return Escape.InvalidHex;
        }
        advance(parser); // skip: '{'
        return code;
      }

      let code = 0;
      for (let i = 0; i < 4; i++) {
        const value = toHex(parser.nextCodePoint);
        if (value < 0) return Escape.InvalidHex;
        code = code * 16 + value;
        advance(parser);
      }

      return code;
    }
    case Chars.LowerX: {
      const ch1 = parser.nextCodePoint;
      if ((CharTypes[ch1] & CharFlags.Hex) === 0) return Escape.InvalidHex;
      advance(parser);
      const ch2 = parser.nextCodePoint;
      if ((CharTypes[ch2] & CharFlags.Hex) === 0) return Escape.InvalidHex;
      const code = (toHex(ch1) << 4) | toHex(ch2);
      advance(parser);
      return code;
    }
    // Null character, octals
    case Chars.Zero:
    case Chars.One:
    case Chars.Two:
    case Chars.Three:
    case Chars.Four:
    case Chars.Five:
    case Chars.Six:
    case Chars.Seven: {
      if (context & Context.Strict) {
        if (ch !== Chars.Zero || CharTypes[parser.nextCodePoint] & CharFlags.Octal) {
          return Escape.StrictOctal;
        }
        return 0;
      }

      let code = ch - Chars.Zero;

      if (parser.index < parser.length) {
        const next = parser.nextCodePoint;
        if (CharTypes[next] & CharFlags.Octal) {
          // Two octal characters
          advance(parser);
          const second = parser.nextCodePoint;
          if (ch >= Chars.Zero && ch <= Chars.Three && CharTypes[second] & CharFlags.Octal) {
            code = (ch - Chars.Zero) * 64 + (next - Chars.Zero) * 8 + second - Chars.Zero;
            advance(parser);
          } else {
            code = (ch - Chars.Zero) * 8 + next - Chars.Zero;
          }
        }
      }
      return code;
    }
    // `8`, `9` (invalid escapes)
    case Chars.Eight:
    case Chars.Nine:
      return Escape.EightOrNine;
    default:
      return ch;
  }
  return ch;
}

export function parseTemplate(parser: ParserState, context: Context, startedWithBacktick: 0 | 1): Token {
  advance(parser);

  let badEscapes: 0 | 1 = 0;
  let start = parser.index;
  let contents = '';

  while (parser.index < parser.length) {
    if (parser.index >= parser.length) {
      contents += parser.source.substring(start, parser.index);
      report(parser, context, Errors.UnterminatedString);
      return startedWithBacktick ? Token.NoSubstitutionTemplateLiteral : Token.TemplateTail;
    }

    const currChar = parser.nextCodePoint;

    // '`'
    if (currChar === Chars.Backtick) {
      contents += parser.source.substring(start, parser.index);
      advance(parser);
      parser.tokenValue = contents;
      return (
        (startedWithBacktick ? Token.NoSubstitutionTemplateLiteral : Token.TemplateTail) |
        (badEscapes ? Token.BadTemplate : 0)
      );
    }

    // '${'
    if (
      currChar === Chars.Dollar &&
      parser.index + 1 < parser.length &&
      parser.source.charCodeAt(parser.index + 1) === Chars.LeftBrace
    ) {
      contents += parser.source.substring(start, parser.index);
      parser.index += 2;
      parser.tokenValue = contents;
      return (startedWithBacktick ? Token.TemplateHead : Token.TemplateMiddle) | (badEscapes ? Token.BadTemplate : 0);
    }

    // Escape character
    if (currChar === Chars.Backslash) {
      contents += parser.source.substring(start, parser.index);
      const code = scanEscape(parser, context);
      if (code >= 0) {
        contents += fromCodePoint(code);
      } else {
        handleStringError(parser, context, code as Escape, /* isTemplate */ 0);
        badEscapes = 1;
      }

      start = parser.index;
      continue;
    }

    if (currChar === Chars.CarriageReturn) {
      contents += parser.source.substring(start, parser.index);
      advance(parser);
      parser.line++;

      if (parser.index < parser.length && parser.nextCodePoint === Chars.LineFeed) {
        advance(parser);
      }

      contents += '\n';
      start = parser.index;
      continue;
    }

    advance(parser);
  }

  return Token.Error;
}
