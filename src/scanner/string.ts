import { CharTypes, CharFlags } from './charClassifier';
import { Token } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { advance, toHex, fromCodePoint } from './common';
import { report, Errors } from '../errors';
import { handleEscapeError, UnicodeEscape } from './recovery';

export function scanStringLiteral(parser: ParserState, context: Context, quote: number): Token {
  let ret = '';
  const { index: start } = parser;

  let ch = parser.source.charCodeAt(++parser.index);

  while ((CharTypes[ch] & CharFlags.IsWhiteSpaceOrLineTerminator) === 0) {
    if (ch === quote) {
      advance(parser); // Consume the quote

      if (context & Context.OptionsRaw) parser.source.slice(start, parser.index);

      parser.tokenValue = ret;

      return Token.StringLiteral;
    }

    if (ch === Chars.Backslash) {
      ch = parser.source.charCodeAt(++parser.index);

      if (ch >= 128) {
        ret += fromCodePoint(ch);
      } else {
        parser.nextCodePoint = ch;
        const code = parseEscape(parser, context, ch);

        if (code >= 0) ret += fromCodePoint(code);
        else {
          report(parser, context, handleEscapeError(code as UnicodeEscape, /* isTemplate */ 0));
          return Token.Error;
        }
        ch = parser.nextCodePoint;
      }
    } else {
      ret += fromCodePoint(ch);
    }
    ch = parser.source.charCodeAt(++parser.index);

    if (parser.index >= parser.length) {
      report(parser, context, Errors.UnterminatedString);
      return Token.Error;
    }
  }

  report(parser, context, Errors.InvalidASCIILineBreak);

  return Token.Error;
}

export function scanTemplate(parser: ParserState, context: Context): Token {
  const { index: start } = parser;

  let ret: string | null = '';
  let token: Token = Token.TemplateTail;
  let ch = parser.source.charCodeAt(++parser.index);

  while (ch !== Chars.Backtick) {
    if (ch === Chars.Dollar) {
      const index = parser.index + 1;
      if (index < parser.source.length && parser.source.charCodeAt(index) === Chars.LeftBrace) {
        parser.index = index;
        parser.column++;
        token = Token.TemplateCont;
        break;
      }
      ret += '$';
    } else if (ch === Chars.Backslash) {
      ch = parser.source.charCodeAt(++parser.index);

      if (ch >= 128) {
        ret += fromCodePoint(ch);
      } else {
        parser.nextCodePoint = ch;

        const code = parseEscape(parser, context | Context.Strict, ch);

        if (code >= 0) {
          ret += fromCodePoint(code);
        } else if (code !== UnicodeEscape.Empty && context & Context.TaggedTemplate) {
          ret = null;
          ch = scanLooserTemplateSegment(parser, context, parser.nextCodePoint);
          if (ch < 0) {
            ch = -ch;
            token = Token.TemplateCont;
          }
          break;
        } else {
          report(parser, context, handleEscapeError(code as UnicodeEscape, /* isTemplate */ 1));
          return Token.Error;
        }

        ch = parser.nextCodePoint;
      }
    } else if (CharTypes[ch] & CharFlags.IsWhiteSpaceOrLineTerminator || (ch ^ Chars.LineSeparator) <= 1) {
      if (ch === Chars.CarriageReturn) {
        if (parser.index < parser.length && parser.source.charCodeAt(parser.index) === Chars.LineFeed) {
          ret += fromCodePoint(ch);
          ch = parser.source.charCodeAt(parser.index);
          parser.index++;
        }
      }

      parser.column = -1;
      parser.line++;
      ret += fromCodePoint(ch);
    } else {
      ret += fromCodePoint(ch);
    }

    ch = parser.source.charCodeAt(++parser.index);

    if (parser.index >= parser.length) {
      report(parser, context, Errors.UnterminatedTemplate);
      return Token.Error;
    }
  }

  advance(parser); // Consume the quote or opening brace

  parser.tokenValue = ret;
  parser.tokenRaw = parser.source.slice(start + 1, parser.index - (Token.TemplateTail ? 1 : 2));

  return token;
}

/**
 * Scan looser template segment
 *
 * @param parser Parser object
 * @param ch codepoint
 */
function scanLooserTemplateSegment(parser: ParserState, context: Context, ch: number): number {
  while (ch !== Chars.Backtick) {
    if (ch === Chars.Dollar) {
      const index = parser.index + 1;
      if (index < parser.source.length && parser.source.charCodeAt(index) === Chars.LeftBrace) {
        parser.index = index;
        parser.column++;
        return -ch;
      }
    }

    ch = parser.source.charCodeAt(++parser.index);

    if (parser.index >= parser.length) {
      report(parser, context, Errors.UnterminatedTemplate);
      return Token.Error;
    }
  }

  return ch;
}

export function scanTemplateTail(parser: ParserState, context: Context): Token {
  // if (parser.index >= parser.end) report(parser, Errors.Unexpected);
  parser.index--;
  //parser.column--;
  return scanTemplate(parser, context);
}

export function parseEscape(parser: ParserState, context: Context, first: number): number {
  // https://tc39.github.io/ecma262/#prod-SingleEscapeCharacter
  // one of ' " \ b f n r t v
  switch (first) {
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
      const { index } = parser;

      if (index < parser.source.length) {
        const ch = parser.source.charCodeAt(index);

        if (ch === Chars.LineFeed) {
          parser.nextCodePoint = ch;
          parser.index = index + 1;
        }
      }
    }

    case Chars.LineFeed:
    case Chars.LineSeparator:
    case Chars.ParagraphSeparator:
      parser.column = -1;
      parser.line++;
      return UnicodeEscape.Empty;

    // Null character, octals
    case Chars.Zero:
    case Chars.One:
    case Chars.Two:
    case Chars.Three: {
      let code = first - Chars.Zero;
      let index = parser.index + 1;
      let column = parser.column + 1;

      if (index < parser.source.length) {
        const next = parser.source.charCodeAt(index);

        if (next < Chars.Zero || next > Chars.Seven) {
          if ((code !== 0 || CharTypes[next] & CharFlags.ImplicitOctalDigits) && context & Context.Strict)
            return UnicodeEscape.StrictOctal;
        } else if (context & Context.Strict) {
          return UnicodeEscape.StrictOctal;
        } else {
          parser.nextCodePoint = next;
          code = (code << 3) | (next - Chars.Zero);
          index++;
          column++;

          if (index < parser.source.length) {
            const next = parser.source.charCodeAt(index);

            if (next >= Chars.Zero && next <= Chars.Seven) {
              parser.nextCodePoint = next;
              code = (code << 3) | (next - Chars.Zero);
              index++;
              column++;
            }
          }

          parser.index = index - 1;
          parser.column = column - 1;
        }
      }

      return code;
    }

    case Chars.Four:
    case Chars.Five:
    case Chars.Six:
    case Chars.Seven: {
      if (context & Context.Strict) return UnicodeEscape.StrictOctal;
      let code = first - Chars.Zero;
      const index = parser.index + 1;
      const column = parser.column + 1;

      if (index < parser.source.length) {
        const next = parser.source.charCodeAt(index);

        if (next >= Chars.Zero && next <= Chars.Seven) {
          code = (code << 3) | (next - Chars.Zero);
          parser.nextCodePoint = next;
          parser.index = index;
          parser.column = column;
        }
      }

      return code;
    }

    // `8`, `9` (invalid escapes)
    case Chars.Eight:
    case Chars.Nine:
      return UnicodeEscape.EightOrNine;

    // ASCII escapes
    case Chars.LowerX: {
      const hi = (parser.nextCodePoint = parser.source.charCodeAt(++parser.index));
      if ((CharTypes[hi] & CharFlags.Hex) === 0) return UnicodeEscape.InvalidHex;
      const lo = (parser.nextCodePoint = parser.source.charCodeAt(++parser.index));
      if ((CharTypes[lo] & CharFlags.Hex) === 0) return UnicodeEscape.InvalidHex;
      return (toHex(hi) << 4) | toHex(lo);
    }

    // UCS-2/Unicode escapes
    case Chars.LowerU: {
      let ch = parser.source.charCodeAt(++parser.index);

      if (ch === Chars.LeftBrace) {
        ch = parser.source.charCodeAt(++parser.index); // skip: '{'

        let code = 0;
        let digits = 0;

        while (CharTypes[ch] & CharFlags.Hex) {
          code = (code << 4) | toHex(ch);
          if (code > 0x10ffff) return UnicodeEscape.OutOfRange;
          ch = parser.source.charCodeAt(++parser.index);
          digits++;
        }

        if (digits < 4) return UnicodeEscape.InvalidHex;
        if (ch !== Chars.RightBrace) return UnicodeEscape.MissingCurlyBrace;

        return code;
      }

      if ((CharTypes[ch] & CharFlags.Hex) === 0) return UnicodeEscape.InvalidHex; // first one is mandatory
      const ch2 = parser.source.charCodeAt(parser.index + 1);
      if ((CharTypes[ch2] & CharFlags.Hex) === 0) return UnicodeEscape.InvalidHex;
      const ch3 = parser.source.charCodeAt(parser.index + 2);
      if ((CharTypes[ch3] & CharFlags.Hex) === 0) return UnicodeEscape.InvalidHex;
      const ch4 = parser.source.charCodeAt(parser.index + 3);
      if ((CharTypes[ch4] & CharFlags.Hex) === 0) return UnicodeEscape.InvalidHex;

      parser.nextCodePoint = parser.source.charCodeAt((parser.index += 3));

      return (toHex(ch) << 12) | (toHex(ch2) << 8) | (toHex(ch3) << 4) | toHex(ch4);
    }

    default:
      return parser.source.charCodeAt(parser.index);
  }
}
