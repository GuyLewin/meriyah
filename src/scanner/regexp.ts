import { Chars } from '../chars';
import { Context, ParserState } from '../common';
import { Token } from '../token';
import { isIdentifierPart } from './charClassifier';
import { advance } from './common';
import { report, Errors } from '../errors';

/**
 * Scans regular expression
 *
 * @param parser Parser object
 * @param context Context masks
 */

export function scanRegularExpression(parser: ParserState, context: Context): Token {
  const enum RegexState {
    Empty = 0,
    Escape = 0x1,
    Class = 0x2
  }
  const bodyStart = parser.index;
  // Scan: ('/' | '/=') RegularExpressionBody '/' RegularExpressionFlags
  let preparseState = RegexState.Empty;

  loop: while (true) {
    const ch = parser.nextCodePoint;
    advance(parser);

    if (preparseState & RegexState.Escape) {
      preparseState &= ~RegexState.Escape;
    } else {
      switch (ch) {
        case Chars.Slash:
          if (!preparseState) break loop;
          else break;
        case Chars.Backslash:
          preparseState |= RegexState.Escape;
          break;
        case Chars.LeftBracket:
          preparseState |= RegexState.Class;
          break;
        case Chars.RightBracket:
          preparseState &= RegexState.Escape;
          break;
        case Chars.CarriageReturn:
        case Chars.LineFeed:
        case Chars.LineSeparator:
        case Chars.ParagraphSeparator:
          report(parser, context, Errors.UnterminatedRegExp);
          return Token.Error;
        default: // ignore
      }
    }

    if (parser.index >= parser.source.length) {
      report(parser, context, Errors.UnterminatedRegExp);
      return Token.Error;
    }
  }

  const bodyEnd = parser.index - 1;

  const enum RegexFlags {
    Empty = 0b00000,
    IgnoreCase = 0b00001,
    Global = 0b00010,
    Multiline = 0b00100,
    Unicode = 0b10000,
    Sticky = 0b01000,
    DotAll = 0b1100
  }

  let mask = RegexFlags.Empty;
  let char = parser.nextCodePoint;

  const { index: flagStart } = parser;

  while (isIdentifierPart(char)) {
    switch (char) {
      case Chars.LowerG:
        if (mask & RegexFlags.Global) report(parser, context, Errors.DuplicateRegExpFlag, 'g');
        mask |= RegexFlags.Global;
        break;

      case Chars.LowerI:
        if (mask & RegexFlags.IgnoreCase) {
          report(parser, context, Errors.DuplicateRegExpFlag, 'i');
          return Token.Error;
        }
        mask |= RegexFlags.IgnoreCase;
        break;

      case Chars.LowerM:
        if (mask & RegexFlags.Multiline) {
          report(parser, context, Errors.DuplicateRegExpFlag, 'm');
          return Token.Error;
        }
        mask |= RegexFlags.Multiline;
        break;

      case Chars.LowerU:
        if (mask & RegexFlags.Unicode) {
          report(parser, context, Errors.DuplicateRegExpFlag, 'u');
          return Token.Error;
        }
        mask |= RegexFlags.Unicode;
        break;

      case Chars.LowerY:
        if (mask & RegexFlags.Sticky) {
          report(parser, context, Errors.DuplicateRegExpFlag, 'y');
          return Token.Error;
        }
        mask |= RegexFlags.Sticky;
        break;

      case Chars.LowerS:
        if (mask & RegexFlags.DotAll) {
          report(parser, context, Errors.DuplicateRegExpFlag, 's');
          return Token.Error;
        }
        mask |= RegexFlags.DotAll;
        break;

      default:
        report(parser, context, Errors.UnexpectedTokenRegExpFlag);
        return Token.Error;
    }

    char = advance(parser);
  }

  const flags = parser.source.slice(flagStart, parser.index);

  const pattern = parser.source.slice(bodyStart, bodyEnd);

  parser.tokenRegExp = { pattern, flags };

  if (context & Context.OptionsRaw) parser.tokenRaw = parser.source.slice(parser.tokenPos, parser.index);

  parser.tokenValue = validate(parser, context, pattern, flags);

  return Token.RegularExpression;
}

/**
 * Validates regular expressions
 *
 *
 * @param state Parser instance
 * @param context Context masks
 * @param pattern Regexp body
 * @param flags Regexp flags
 */
function validate(parser: ParserState, context: Context, pattern: string, flags: string): RegExp | null | Token {
  try {
    RegExp(pattern);
  } catch (e) {
    report(parser, context, Errors.UnterminatedRegExp);
    return Token.Error;
  }

  try {
    return new RegExp(pattern, flags);
  } catch (e) {
    return null;
  }
}
