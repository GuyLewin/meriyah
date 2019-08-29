import { CharTypes, CharFlags, isIdentifierStart } from './charClassifier';
import { Token } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { advance, toHex } from './common';
import { report, Errors } from '../errors';
import { isDecimal, isDecimalOrUnderscore } from './lookup';

export function scanNumber(
  parser: ParserState,
  context: Context,
  nonOctalDecimalInteger: 0 | 1,
  value: number | string,
  isFloat: 0 | 1
): Token {
  let char = parser.nextCodePoint;
  let decimalValue = 0;

  if (isFloat) {
    decimalValue = scanDecimalDigits(parser, context, char);
    if (decimalValue < 0) return Token.Error;
    value = '.' + decimalValue;
  } else {
    let digit = 9;
    let allowSeparator: 0 | 1 = 0;

    if (nonOctalDecimalInteger === 0) {
      while (digit >= 0 && isDecimalOrUnderscore[char]) {
        if (char === Chars.Underscore) {
          char = advance(parser);
          if (char === Chars.Underscore) {
            report(parser, context, Errors.ContinuousNumericSeparator);
            return Token.Error;
          }
          allowSeparator = 1;
          continue;
        }

        allowSeparator = 0;

        value = 10 * (value as number) + (char - Chars.Zero);

        char = advance(parser);

        --digit;
      }

      if (allowSeparator) {
        report(parser, context, Errors.TrailingNumericSeparator);
        return Token.Error;
      }

      if (digit >= 0 && char !== Chars.Period && !isIdentifierStart(char)) {
        parser.tokenValue = value;
        return Token.NumericLiteral;
      }
    }

    decimalValue = scanDecimalDigits(parser, context, char);

    if (decimalValue < 0) return Token.Error;

    (value as any) += decimalValue;

    char = parser.nextCodePoint;

    if (char === Chars.Period) {
      char = advance(parser);

      if (char === Chars.Underscore) report(parser, context, Errors.Unexpected);

      decimalValue = scanDecimalDigits(parser, context, char);

      if (decimalValue < 0) return Token.Error;

      value += '.' + decimalValue;

      isFloat = 1;
    }
  }

  char = parser.nextCodePoint;

  const { index: end } = parser;

  let isBigInt: 0 | 1 = 0;

  if (char === Chars.LowerN) {
    if (isFloat || nonOctalDecimalInteger) report(parser, context, Errors.InvalidBigIntLiteral);
    char = advance(parser);
  } else if ((char | 32) == Chars.LowerE) {
    char = advance(parser);
    // '-', '+'
    if (CharTypes[char] & CharFlags.Exponent) char = advance(parser);

    const { index } = parser;

    // Exponential notation must contain at least one digit
    if (!isDecimal[char]) {
      report(parser, context, Errors.MissingExponent);
      return Token.Error;
    }

    // Consume exponential digits
    decimalValue = scanDecimalDigits(parser, context, char);

    if (decimalValue < 0) return Token.Error;

    value += parser.source.substring(end, index) + decimalValue;

    char = parser.nextCodePoint;
  }

  // The source character immediately following a numeric literal must
  // not be an identifier start or a decimal digit
  if ((parser.index < parser.length && isDecimal[char]) || isIdentifierStart(char)) {
    report(parser, context, Errors.IDStartAfterNumber);
    return Token.Error;
  }

  parser.tokenValue = nonOctalDecimalInteger ? parseFloat(parser.source.slice(parser.startPos, parser.index)) : value;

  return isBigInt ? Token.BigIntLiteral : Token.NumericLiteral;
}

export function scanDecimalDigits(parser: ParserState, context: Context, char: number): any {
  let allowSeparator: 0 | 1 = 0;
  let start = parser.index;
  let value = '';

  while (isDecimalOrUnderscore[char]) {
    if (char === Chars.Underscore) {
      const { index } = parser;
      char = advance(parser);
      if (char === Chars.Underscore) {
        report(parser, context, Errors.ContinuousNumericSeparator);
        return -1;
      }
      allowSeparator = 1;
      value += parser.source.substring(start, index);
      start = parser.index;
      continue;
    }
    allowSeparator = 0;
    char = advance(parser);
  }
  if (allowSeparator) {
    report(parser, context, Errors.TrailingNumericSeparator);
    return -1;
  }

  return (value += parser.source.substring(start, parser.index));
}

export function scanLeadingZero(
  parser: ParserState,
  context: Context,
  radix: number,
  radixFlags: CharFlags,
  isHex: 0 | 1
) {
  let value = 0;
  let digits = 0;
  let allowSeparator = 0;
  let char = advance(parser);
  while (CharTypes[char] & (radixFlags | CharFlags.Underscore)) {
    if (char === Chars.Underscore) {
      if (!allowSeparator) {
        report(parser, context, Errors.ContinuousNumericSeparator);
        return Token.Error;
      }
      allowSeparator = 0;
      char = advance(parser);
      continue;
    }
    allowSeparator = 1;
    value = isHex ? value * radix + toHex(char) : value * radix + (char - Chars.Zero);
    digits++;
    char = advance(parser);
  }
  if (digits < 1 || !allowSeparator) {
    report(parser, context, Errors.TrailingNumericSeparator);
    return Token.Error;
  }
  parser.tokenValue = value;
  let isBigInt: 0 | 1 = 0;

  if (char === Chars.LowerN) {
    advance(parser);
    isBigInt = 1;
  }

  // The source character immediately following a numeric literal must
  // not be an identifier start or a decimal digit
  if ((parser.index < parser.length && CharTypes[char] & CharFlags.Decimal) || isIdentifierStart(char)) {
    report(parser, context, Errors.IDStartAfterNumber);
    return Token.Error;
  }
  return isBigInt ? Token.BigIntLiteral : Token.NumericLiteral;
}
