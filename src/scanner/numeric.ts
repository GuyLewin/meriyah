import { CharTypes, CharFlags, isIdentifierStart } from './charClassifier';
import { Token } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { advance } from './common';
import { report, Errors } from '../errors';

export function scanNumber(parser: ParserState, context: Context, isFloat: 0 | 1, value: any): Token {
  let digit = 9;
  let allowSeparator: 0 | 1 = 0;

  if (isFloat) {
    value = '.' + scanDecimalDigits(parser, context);
  } else {
    while (digit >= 0 && CharTypes[parser.nextCodePoint] & (CharFlags.Decimal | CharFlags.Underscore)) {
      if (parser.nextCodePoint === Chars.Underscore) {
        advance(parser);
        if (parser.nextCodePoint === Chars.Underscore) {
          report(parser, context, Errors.ContinuousNumericSeparator);
          return Token.Error;
        }
        allowSeparator = 1;
        continue;
      }
      allowSeparator = 0;
      value = 10 * value + (parser.nextCodePoint - Chars.Zero);
      advance(parser);
      --digit;
    }

    if (allowSeparator) {
      report(parser, context, Errors.TrailingNumericSeparator);
      return Token.Error;
    }

    if (digit >= 0 && !isIdentifierStart(parser.nextCodePoint) && parser.nextCodePoint !== Chars.Period) {
      parser.tokenValue = value;
      return Token.NumericLiteral;
    }

    value += scanDecimalDigits(parser, context);

    if (parser.nextCodePoint === Chars.Period) {
      advance(parser);
      value += '.' + scanDecimalDigits(parser, context);
    }
  }
  const end = parser.index;

  if (parser.nextCodePoint === Chars.LowerN) {
    advance(parser);
    parser.tokenValue = value;
    return Token.BigIntLiteral;
  }

  if ((parser.nextCodePoint | 32) == Chars.LowerE) {
    advance(parser);
    // '-', '+'
    if (CharTypes[parser.nextCodePoint] & CharFlags.Exponent) advance(parser);

    const { index } = parser;

    // Exponential notation must contain at least one digit
    if ((CharTypes[parser.nextCodePoint] & CharFlags.Decimal) < 1) {
      report(parser, context, Errors.MissingExponent);
      return Token.Error;
    }

    // Consume exponential digits
    value += parser.source.substring(end, index) + scanDecimalDigits(parser, context);
  }

  // The source character immediately following a numeric literal must
  // not be an identifier start or a decimal digit
  if (
    (parser.index < parser.length && CharTypes[parser.nextCodePoint] & CharFlags.Decimal) ||
    isIdentifierStart(parser.nextCodePoint)
  ) {
    report(parser, context, Errors.IDStartAfterNumber);
    return Token.Error;
  }

  parser.tokenValue = value;
  return Token.NumericLiteral;
}

export function scanDecimalDigits(parser: ParserState, context: Context): any {
  let allowSeparator: 0 | 1 = 0;
  let start = parser.index;
  let ret = '';

  while (CharTypes[parser.nextCodePoint] & (CharFlags.Decimal | CharFlags.Underscore)) {
    if (parser.nextCodePoint === Chars.Underscore) {
      const { index } = parser;
      advance(parser);
      if (parser.nextCodePoint === Chars.Underscore) {
        report(parser, context, Errors.ContinuousNumericSeparator);
        return Token.Error;
      }
      allowSeparator = 1;
      ret += parser.source.substring(start, index);
      start = parser.index;
      continue;
    }
    allowSeparator = 0;
    advance(parser);
  }
  if (allowSeparator) {
    report(parser, context, Errors.TrailingNumericSeparator);
    return Token.Error;
  }
  return ret + parser.source.substring(start, parser.index);
}

export function toHex(code: number): number {
  return code < Chars.UpperA ? code - Chars.Zero : (code - Chars.UpperA + 10) & 0xf;
}

export function scanLeadingZero(parser: ParserState, context: Context, radix: number, c: CharFlags, isHex: 0 | 1) {
  let value = 0;
  let digits = 0;
  let allowSeparator = 0;
  advance(parser);
  while (CharTypes[parser.nextCodePoint] & (c | CharFlags.Underscore)) {
    if (parser.nextCodePoint === Chars.Underscore) {
      if (!allowSeparator) {
        report(parser, context, Errors.ContinuousNumericSeparator);
        return Token.Error;
      }
      allowSeparator = 0;
      advance(parser);
      continue;
    }
    allowSeparator = 1;
    value = isHex ? value * radix + toHex(parser.nextCodePoint) : value * radix + (parser.nextCodePoint - Chars.Zero);
    digits++;
    advance(parser);
  }
  if (digits < 1 || !allowSeparator) {
    report(parser, context, Errors.TrailingNumericSeparator);
    return Token.Error;
  }
  parser.tokenValue = value;
  if (parser.nextCodePoint === Chars.LowerN) {
    advance(parser);
    return Token.BigIntLiteral;
  }
  return Token.NumericLiteral;
}
