import { CharTypes, CharFlags, identifierPart, isIdentifierPart } from './charClassifier';
import { Token, descKeywordTable } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { advance, fromCodePoint, toHex, consumeMultiUnitCodePoint } from './common';
import { report } from '../errors';
import { handleIdentifierError, Escape } from './recovery';

export function scanIdentifierOrKeyword(parser: ParserState, context: Context, canBeKeyword: 0 | 1): Token {
  while (identifierPart[advance(parser)]) {}

  const value = parser.source.slice(parser.tokenPos, parser.index);

  if (parser.nextCodePoint !== Chars.Backslash && parser.nextCodePoint < 0x7e) {
    parser.tokenValue = value;

    if (canBeKeyword === 0) return Token.Identifier;

    return descKeywordTable[parser.tokenValue] || Token.Identifier;
  }

  return scanIdentifierSlowPath(parser, context, value, canBeKeyword);
}

export function scanIdentifierSlowPath(
  parser: ParserState,
  context: Context,
  value: string,
  canBeKeyword: 0 | 1
): Token {
  let start = parser.index;
  let hasEscape: 0 | 1 = 0;

  while (parser.index < parser.length) {
    if (isIdentifierPart(parser.nextCodePoint)) {
      advance(parser);
    } else if (parser.nextCodePoint === Chars.Backslash) {
      value += parser.source.slice(start, parser.index);
      hasEscape = 1;
      const code = scanIdentifierUnicodeEscape(parser);
      if (!isIdentifierPart(code)) {
        report(parser, context, handleIdentifierError(code));
        return Token.Error;
      }
      canBeKeyword = 1;
      value += fromCodePoint(code);
      start = parser.index;
    } else if (consumeMultiUnitCodePoint(parser, parser.nextCodePoint)) {
      advance(parser);
    } else {
      break;
    }
  }

  if (parser.index <= parser.length) value += parser.source.slice(start, parser.index);

  const length = value.length;

  parser.tokenValue = value;

  if (canBeKeyword && length >= 2 && length <= 11) {
    const token: Token | undefined = descKeywordTable[parser.tokenValue];

    if (token === void 0) return Token.Identifier;

    if (hasEscape === 0) return token;

    if (context & Context.Strict) {
      if ((token & Token.FutureReserved) === Token.FutureReserved) {
        return Token.EscapedStrictReserved;
      }

      if (token === Token.LetKeyword || token === Token.StaticKeyword) {
        return Token.EscapedStrictReserved;
      }
    }

    return Token.EscapedKeyword;
  }

  return Token.Identifier;
}

/**
 * Scans unicode identifier
 *
 * @param parser  Parser object
 */
export function scanIdentifierUnicodeEscape(parser: ParserState): Escape | number {
  // Check for Unicode escape of the form '\uXXXX'
  // and return code point value if valid Unicode escape is found.
  if (parser.source.charCodeAt(parser.index + 1) !== Chars.LowerU) {
    return Escape.InvalidSequence;
  }

  parser.nextCodePoint = parser.source.charCodeAt((parser.index += 2));

  return scanUnicodeEscape(parser);
}

/**
 * Scans unicode escape value
 *
 * @param parser  Parser object
 */
export function scanUnicodeEscape(parser: ParserState): number {
  // Accept both \uxxxx and \u{xxxxxx}
  let codePoint = 0;
  let char = parser.nextCodePoint;

  // First handle a delimited Unicode escape, e.g. \u{1F4A9}
  if (char === Chars.LeftBrace) {
    while (CharTypes[advance(parser)] & CharFlags.Hex) {
      codePoint = (codePoint << 4) | toHex(parser.nextCodePoint);
      if (codePoint > 0x10ffff) return Escape.UnicodeOverflow;
    }

    // At least 4 characters have to be read
    if ((parser.nextCodePoint as number) !== Chars.RightBrace) return Escape.MissingCurlyBrace;

    advance(parser); // consumes '}'
    return codePoint;
  }

  for (let i = 0; i < 4; i++) {
    char = toHex(parser.nextCodePoint);
    if (char < 0) return Escape.InvalidHex;
    codePoint = (codePoint << 4) | char;
    advance(parser);
  }

  return codePoint;
}

export function scanUnicodeEscapeIdStart(parser: ParserState, context: Context): Token {
  const cookedChar = scanIdentifierUnicodeEscape(parser);
  if (isIdentifierPart(cookedChar)) {
    return scanIdentifierSlowPath(parser, context, fromCodePoint(cookedChar), /* canBeKeyword */ 1);
  }
  parser.index++; // skip: '\'
  report(parser, context, handleIdentifierError(cookedChar));
  return Token.Error;
}
