import { Token } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { scanNumber, scanLeadingZero } from './numeric';
import { parseStringLiteral, scanTemplate } from './string';
import { scanIdentifier, scanIdentifierSlowPath, scanUnicodeEscapeIdStart } from './identifier';
import { advance, consumeMultiUnitCodePoint, isExoticECMAScriptWhitespace } from './common';
import { report, Errors } from '../errors';
import { skipSingleLineComment, parseCommentMulti } from './comments';
import { isIDStart } from './unicode';
import { scanRegularExpression } from './regexp';
import { isDecimal } from './lookup';

export const firstCharKinds = [
  /*   0 - Null               */ Token.Error,
  /*   1 - Start of Heading   */ Token.Error,
  /*   2 - Start of Text      */ Token.Error,
  /*   3 - End of Text        */ Token.Error,
  /*   4 - End of Transm.     */ Token.Error,
  /*   5 - Enquiry            */ Token.Error,
  /*   6 - Acknowledgment     */ Token.Error,
  /*   7 - Bell               */ Token.Error,
  /*   8 - Backspace          */ Token.Error,
  /*   9 - Horizontal Tab     */ Token.WhiteSpace,
  /*  10 - Line Feed          */ Token.LineFeed,
  /*  11 - Vertical Tab       */ Token.WhiteSpace,
  /*  12 - Form Feed          */ Token.WhiteSpace,
  /*  13 - Carriage Return    */ Token.CarriageReturn,
  /*  14 - Shift Out          */ Token.Error,
  /*  15 - Shift In           */ Token.Error,
  /*  16 - Data Line Escape   */ Token.Error,
  /*  17 - Device Control 1   */ Token.Error,
  /*  18 - Device Control 2   */ Token.Error,
  /*  19 - Device Control 3   */ Token.Error,
  /*  20 - Device Control 4   */ Token.Error,
  /*  21 - Negative Ack.      */ Token.Error,
  /*  22 - Synchronous Idle   */ Token.Error,
  /*  23 - End of Transmit    */ Token.Error,
  /*  24 - Cancel             */ Token.Error,
  /*  25 - End of Medium      */ Token.Error,
  /*  26 - Substitute         */ Token.Error,
  /*  27 - Escape             */ Token.Error,
  /*  28 - File Separator     */ Token.Error,
  /*  29 - Group Separator    */ Token.Error,
  /*  30 - Record Separator   */ Token.Error,
  /*  31 - Unit Separator     */ Token.Error,
  /*  32 - Space              */ Token.WhiteSpace,
  /*  33 - !                  */ Token.Negate,
  /*  34 - "                  */ Token.StringLiteral,
  /*  35 - #                  */ Token.PrivateField,
  /*  36 - $                  */ Token.Identifier,
  /*  37 - %                  */ Token.Modulo,
  /*  38 - &                  */ Token.BitwiseAnd,
  /*  39 - '                  */ Token.StringLiteral,
  /*  40 - (                  */ Token.LeftParen,
  /*  41 - )                  */ Token.RightParen,
  /*  42 - *                  */ Token.Multiply,
  /*  43 - +                  */ Token.Add,
  /*  44 - ,                  */ Token.Comma,
  /*  45 - -                  */ Token.Subtract,
  /*  46 - .                  */ Token.Period,
  /*  47 - /                  */ Token.Divide,
  /*  48 - 0                  */ Token.LeadingZero,
  /*  49 - 1                  */ Token.NumericLiteral,
  /*  50 - 2                  */ Token.NumericLiteral,
  /*  51 - 3                  */ Token.NumericLiteral,
  /*  52 - 4                  */ Token.NumericLiteral,
  /*  53 - 5                  */ Token.NumericLiteral,
  /*  54 - 6                  */ Token.NumericLiteral,
  /*  55 - 7                  */ Token.NumericLiteral,
  /*  56 - 8                  */ Token.NumericLiteral,
  /*  57 - 9                  */ Token.NumericLiteral,
  /*  58 - :                  */ Token.Colon,
  /*  59 - ;                  */ Token.Semicolon,
  /*  60 - <                  */ Token.LessThan,
  /*  61 - =                  */ Token.Assign,
  /*  62 - >                  */ Token.GreaterThan,
  /*  63 - ?                  */ Token.QuestionMark,
  /*  64 - @                  */ Token.Error,
  /*  65 - A                  */ Token.Identifier,
  /*  66 - B                  */ Token.Identifier,
  /*  67 - C                  */ Token.Identifier,
  /*  68 - D                  */ Token.Identifier,
  /*  69 - E                  */ Token.Identifier,
  /*  70 - F                  */ Token.Identifier,
  /*  71 - G                  */ Token.Identifier,
  /*  72 - H                  */ Token.Identifier,
  /*  73 - I                  */ Token.Identifier,
  /*  74 - J                  */ Token.Identifier,
  /*  75 - K                  */ Token.Identifier,
  /*  76 - L                  */ Token.Identifier,
  /*  77 - M                  */ Token.Identifier,
  /*  78 - N                  */ Token.Identifier,
  /*  79 - O                  */ Token.Identifier,
  /*  80 - P                  */ Token.Identifier,
  /*  81 - Q                  */ Token.Identifier,
  /*  82 - R                  */ Token.Identifier,
  /*  83 - S                  */ Token.Identifier,
  /*  84 - T                  */ Token.Identifier,
  /*  85 - U                  */ Token.Identifier,
  /*  86 - V                  */ Token.Identifier,
  /*  87 - W                  */ Token.Identifier,
  /*  88 - X                  */ Token.Identifier,
  /*  89 - Y                  */ Token.Identifier,
  /*  90 - Z                  */ Token.Identifier,
  /*  91 - [                  */ Token.LeftBracket,
  /*  92 - \                  */ Token.UnicodeEscapeIdStart,
  /*  93 - ]                  */ Token.RightBracket,
  /*  94 - ^                  */ Token.BitwiseXor,
  /*  95 - _                  */ Token.Identifier,
  /*  96 - `                  */ Token.TemplateTail,
  /*  97 - a                  */ Token.Identifier,
  /*  98 - b                  */ Token.Identifier,
  /*  99 - c                  */ Token.Identifier,
  /* 100 - d                  */ Token.Identifier,
  /* 101 - e                  */ Token.Identifier,
  /* 102 - f                  */ Token.Identifier,
  /* 103 - g                  */ Token.Identifier,
  /* 104 - h                  */ Token.Identifier,
  /* 105 - i                  */ Token.Identifier,
  /* 106 - j                  */ Token.Identifier,
  /* 107 - k                  */ Token.Identifier,
  /* 108 - l                  */ Token.Identifier,
  /* 109 - m                  */ Token.Identifier,
  /* 110 - n                  */ Token.Identifier,
  /* 111 - o                  */ Token.Identifier,
  /* 112 - p                  */ Token.Identifier,
  /* 113 - q                  */ Token.Identifier,
  /* 114 - r                  */ Token.Identifier,
  /* 115 - s                  */ Token.Identifier,
  /* 116 - t                  */ Token.Identifier,
  /* 117 - u                  */ Token.Identifier,
  /* 118 - v                  */ Token.Identifier,
  /* 119 - w                  */ Token.Identifier,
  /* 120 - x                  */ Token.Identifier,
  /* 121 - y                  */ Token.Identifier,
  /* 122 - z                  */ Token.Identifier,
  /* 123 - {                  */ Token.LeftBrace,
  /* 124 - |                  */ Token.BitwiseOr,
  /* 125 - }                  */ Token.RightBrace,
  /* 126 - ~                  */ Token.Complement,
  /* 127 - Delete             */ Token.Error
];

export function scanSingleToken(parser: ParserState, context: Context): Token {
  while (parser.index < parser.length) {
    parser.tokenPos = parser.index;

    const char = parser.nextCodePoint;

    if (char <= 0x7e) {
      const token = firstCharKinds[char];

      switch (token) {
        case Token.RightBrace:
        case Token.LeftBrace:
        case Token.Comma:
        case Token.Colon:
        case Token.Complement:
        case Token.LeftParen:
        case Token.RightParen:
        case Token.Semicolon:
        case Token.LeftBracket:
        case Token.RightBracket:
        case Token.Error:
          advance(parser);
          return token;

        case Token.WhiteSpace:
          advance(parser);
          continue;

        case Token.CarriageReturn:
          advance(parser);
          parser.precedingLineBreak = 1;
          if (parser.index < parser.length && parser.nextCodePoint === Chars.LineFeed) {
            advance(parser);
          }
          continue;

        case Token.LineFeed: {
          parser.precedingLineBreak = 1;
          advance(parser);
          continue;
        }

        case Token.Identifier:
          return scanIdentifier(parser, context);

        case Token.StringLiteral:
          return parseStringLiteral(parser, context, char);

        case Token.LeadingZero:
          return scanLeadingZero(parser, context, char);

        case Token.NumericLiteral:
          return scanNumber(parser, context, /* nonOctalDecimalInteger */ 0, /* value */ 0, 0);

        // `.`, `...`, `.123` (numeric literal)
        case Token.Period:
          advance(parser);
          if (isDecimal[parser.nextCodePoint])
            return scanNumber(parser, context, /* nonOctalDecimalInteger */ 0, /* value */ 0, 1);
          if (parser.nextCodePoint === Chars.Period) {
            advance(parser);
            if (parser.nextCodePoint === Chars.Period) {
              advance(parser);
              return Token.Ellipsis;
            }
          }

          return Token.Period;

        case Token.UnicodeEscapeIdStart:
          return scanUnicodeEscapeIdStart(parser, context);

        case Token.TemplateTail:
          return scanTemplate(parser, context);

        // `<`, `<=`, `<<`, `<<=`, `</`, `<!--`
        case Token.LessThan:
          advance(parser);
          if (parser.index < parser.length) {
            if (parser.nextCodePoint === Chars.LessThan) {
              advance(parser);
              // @ts-ignore
              if (parser.index < parser.length && parser.nextCodePoint === Chars.EqualSign) {
                parser.index++;
                return Token.ShiftLeftAssign;
              }
              return Token.ShiftLeft;
            }
            if (parser.nextCodePoint === Chars.EqualSign) {
              advance(parser);
              return Token.LessThanOrEqual;
            }
          }
          return Token.LessThan;

        // `?`, `??`, `?.`
        case Token.QuestionMark: {
          advance(parser);
          if ((context & Context.OptionsNext) < 1) return Token.QuestionMark;
          if (parser.nextCodePoint === Chars.QuestionMark) {
            advance(parser);
            return Token.Coalesce;
          }
          if (parser.nextCodePoint === Chars.Period) {
            // Check that it's not followed by any numbers
            if (!isDecimal[parser.source.charCodeAt(parser.index + 1)]) {
              advance(parser);
              return Token.QuestionMarkPeriod;
            }
          }
          return Token.QuestionMark;
        }

        // `=`, `==`, `===`, `=>`
        case Token.Assign: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Assign;
          const ch = parser.nextCodePoint;

          if (ch === Chars.EqualSign) {
            advance(parser);
            if (parser.nextCodePoint === Chars.EqualSign) {
              advance(parser);
              return Token.StrictEqual;
            }
            return Token.LooseEqual;
          }
          if (ch === Chars.GreaterThan) {
            advance(parser);
            return Token.Arrow;
          }

          return Token.Assign;
        }

        // `!`, `!=`, `!==`
        case Token.Negate:
          advance(parser);
          if (parser.nextCodePoint !== Chars.EqualSign) return Token.Negate;
          advance(parser);
          if (parser.nextCodePoint !== Chars.EqualSign) {
            return Token.LooseNotEqual;
          }
          advance(parser);
          return Token.StrictNotEqual;

        // `%`, `%=`
        case Token.Modulo:
          advance(parser);
          if (parser.nextCodePoint !== Chars.EqualSign) return Token.Modulo;
          advance(parser);
          return Token.ModuloAssign;

        // `*`, `**`, `*=`, `**=`
        case Token.Multiply: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Multiply;

          const ch = parser.nextCodePoint;

          if (ch === Chars.EqualSign) {
            advance(parser);
            return Token.MultiplyAssign;
          }

          if (ch !== Chars.Asterisk) return Token.Multiply;
          advance(parser);
          if (parser.nextCodePoint !== Chars.EqualSign) return Token.Exponentiate;

          advance(parser);

          return Token.ExponentiateAssign;
        }

        // `^`, `^=`
        case Token.BitwiseXor:
          advance(parser);
          if (parser.nextCodePoint !== Chars.EqualSign) return Token.BitwiseXor;
          advance(parser);
          return Token.BitwiseXorAssign;

        // `+`, `++`, `+=`
        case Token.Add: {
          advance(parser);
          const ch = parser.nextCodePoint;
          if (ch === Chars.Plus) {
            advance(parser);
            return Token.Increment;
          }

          if (ch === Chars.EqualSign) {
            advance(parser);
            return Token.AddAssign;
          }

          return Token.Add;
        }

        // `-`, `--`, `-=`, `-->`
        case Token.Subtract: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Subtract;
          const ch = parser.nextCodePoint;

          if (ch === Chars.Hyphen) {
            advance(parser);
            return Token.Decrement;
          }

          if (ch === Chars.EqualSign) {
            advance(parser);
            return Token.SubtractAssign;
          }

          return Token.Subtract;
        }

        // `/`, `/=`, `/>`, '/*..*/'
        case Token.Divide: {
          advance(parser);
          if (parser.index < parser.length) {
            const ch = parser.nextCodePoint;
            if (ch === Chars.Slash) {
              advance(parser);
              skipSingleLineComment(parser);
              continue;
            }
            if (context & Context.AllowRegExp) {
              return scanRegularExpression(parser, context);
            }
            if (ch === Chars.Asterisk) {
              advance(parser);
              parseCommentMulti(parser, context);
              continue;
            }
            if (ch === Chars.EqualSign) {
              advance(parser);
              return Token.DivideAssign;
            }
          }

          return Token.Divide;
        }

        // `|`, `||`, `|=`
        case Token.BitwiseOr: {
          advance(parser);
          if (parser.index >= parser.length) return Token.BitwiseOr;

          const ch = parser.nextCodePoint;

          if (ch === Chars.VerticalBar) {
            advance(parser);
            return Token.LogicalOr;
          }
          if (ch === Chars.EqualSign) {
            advance(parser);
            return Token.BitwiseOrAssign;
          }

          return Token.BitwiseOr;
        }

        // `>`, `>=`, `>>`, `>>>`, `>>=`, `>>>=`
        case Token.GreaterThan: {
          advance(parser);
          if (parser.index >= parser.length) return Token.GreaterThan;

          const ch = parser.nextCodePoint;

          if (ch === Chars.EqualSign) {
            advance(parser);
            return Token.GreaterThanOrEqual;
          }

          if (ch !== Chars.GreaterThan) return Token.GreaterThan;

          advance(parser);

          if (parser.index < parser.length) {
            const ch = parser.nextCodePoint;

            if (ch === Chars.GreaterThan) {
              advance(parser);
              if (parser.nextCodePoint === Chars.EqualSign) {
                advance(parser);
                return Token.LogicalShiftRightAssign;
              }
              return Token.LogicalShiftRight;
            }
            if (ch === Chars.EqualSign) {
              advance(parser);
              return Token.ShiftRightAssign;
            }
          }

          return Token.ShiftRight;
        }

        // `&`, `&&`, `&=`
        case Token.BitwiseAnd: {
          advance(parser);
          if (parser.index >= parser.length) return Token.BitwiseAnd;
          const ch = parser.nextCodePoint;

          if (ch === Chars.Ampersand) {
            advance(parser);
            return Token.LogicalAnd;
          }

          if (ch === Chars.EqualSign) {
            advance(parser);
            return Token.BitwiseAndAssign;
          }

          return Token.BitwiseAnd;
        }

        default: // ignore
      }
    }
    if ((char ^ Chars.LineSeparator) <= 1) {
      parser.precedingLineBreak = 1;
      advance(parser);
      continue;
    }

    if (isIDStart(char) || consumeMultiUnitCodePoint(parser, parser.nextCodePoint)) {
      return scanIdentifierSlowPath(parser, context, '');
    }

    if (isExoticECMAScriptWhitespace(char)) {
      advance(parser);
      continue;
    }

    // Invalid ASCII code point/unit
    report(parser, context, Errors.InvalidCharacter);

    return Token.Error;
  }

  return Token.EndOfSource;
}

/**
 * Scans next token in the stream
 *
 * @param parser  Parser object
 * @param context Context masks
 */
export function nextToken(parser: ParserState, context: Context): Token {
  parser.precedingLineBreak = 0;
  parser.startPos = parser.index;
  parser.token = scanSingleToken(parser, context);
  return parser.token;
}
