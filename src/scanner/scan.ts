import { Token } from '../token';
import { Chars } from '../chars';
import { ParserState, Context } from '../common';
import { scanNumber, scanLeadingZero } from './numeric';
import { scanStringLiteral, scanTemplate } from './string';
import { scanIdentifierOrKeyword, scanIdentifierSlowPath, scanUnicodeEscapeIdStart } from './identifier';
import { advance, isExoticECMAScriptWhitespace } from './common';
import { report, Errors } from '../errors';
import { skipSingleLineComment, skipMultiLineComment } from './comments';
import { scanRegularExpression } from './regexp';
import { unicodeLookup } from './unicode';

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
  /*  92 - \                  */ Token.Backslash,
  /*  93 - ]                  */ Token.RightBracket,
  /*  94 - ^                  */ Token.BitwiseXor,
  /*  95 - _                  */ Token.Identifier,
  /*  96 - `                  */ Token.TemplateTail,
  /*  97 - a                  */ Token.IdentifierOrKeyword,
  /*  98 - b                  */ Token.IdentifierOrKeyword,
  /*  99 - c                  */ Token.IdentifierOrKeyword,
  /* 100 - d                  */ Token.IdentifierOrKeyword,
  /* 101 - e                  */ Token.IdentifierOrKeyword,
  /* 102 - f                  */ Token.IdentifierOrKeyword,
  /* 103 - g                  */ Token.IdentifierOrKeyword,
  /* 104 - h                  */ Token.Identifier,
  /* 105 - i                  */ Token.IdentifierOrKeyword,
  /* 106 - j                  */ Token.Identifier,
  /* 107 - k                  */ Token.Identifier,
  /* 108 - l                  */ Token.IdentifierOrKeyword,
  /* 109 - m                  */ Token.Identifier,
  /* 110 - n                  */ Token.IdentifierOrKeyword,
  /* 111 - o                  */ Token.Identifier,
  /* 112 - p                  */ Token.IdentifierOrKeyword,
  /* 113 - q                  */ Token.Identifier,
  /* 114 - r                  */ Token.IdentifierOrKeyword,
  /* 115 - s                  */ Token.IdentifierOrKeyword,
  /* 116 - t                  */ Token.IdentifierOrKeyword,
  /* 117 - u                  */ Token.Identifier,
  /* 118 - v                  */ Token.IdentifierOrKeyword,
  /* 119 - w                  */ Token.IdentifierOrKeyword,
  /* 120 - x                  */ Token.Identifier,
  /* 121 - y                  */ Token.IdentifierOrKeyword,
  /* 122 - z                  */ Token.IdentifierOrKeyword,
  /* 123 - {                  */ Token.LeftBrace,
  /* 124 - |                  */ Token.BitwiseOr,
  /* 125 - }                  */ Token.RightBrace,
  /* 126 - ~                  */ Token.Complement,
  /* 127 - Delete             */ Token.Error
];

export function scanSingleToken(parser: ParserState, context: Context): Token {
  let lastIsCR = 0;

  const isStartOfLine = parser.index === 0;

  while (parser.index < parser.length) {
    parser.tokenPos = parser.index;

    let char = parser.nextCodePoint;

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
          lastIsCR = 1;
          parser.column = 0;
          parser.line++;

        case Token.LineFeed: {
          parser.precedingLineBreak = 1;
          parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
          if (lastIsCR === 0) {
            parser.column = 0;
            parser.line++;
          }
          lastIsCR = 0;
          continue;
        }

        // `a`...`z`
        case Token.IdentifierOrKeyword:
          return scanIdentifierOrKeyword(parser, context, /* canBeKeyword */ 1);

        // `A`...`Z`, `_var`, `$var`
        case Token.Identifier:
          return scanIdentifierOrKeyword(parser, context, /* canBeKeyword */ 0);

        // `1`...`9`
        case Token.NumericLiteral:
          return scanNumber(parser, context, /* nonOctalDecimalInteger */ 0, 0);

        // `'string'`, `"string"`
        case Token.StringLiteral:
          return scanStringLiteral(parser, context, char);

        // `0`
        case Token.LeadingZero:
          return scanLeadingZero(parser, context, char);

        // `\\u{N}var`
        case Token.Backslash:
          return scanUnicodeEscapeIdStart(parser, context);

        // ``string``
        case Token.TemplateTail:
          return scanTemplate(parser, context);

        // `.`, `...`, `.123` (numeric literal)
        case Token.Period:
          const next = advance(parser);
          if (next >= Chars.Zero && next <= Chars.Nine)
            return scanNumber(parser, context, /* nonOctalDecimalInteger */ 0, 1);
          if (next === Chars.Period) {
            const index = parser.index + 1;
            if (index < parser.source.length && parser.source.charCodeAt(index) === Chars.Period) {
              parser.column += 2;
              parser.nextCodePoint = parser.source.charCodeAt((parser.index += 2));
              return Token.Ellipsis;
            }
          }
          return Token.Period;

        // `<`, `<=`, `<<`, `<<=`, `</`, `<!--`
        case Token.LessThan:
          advance(parser);
          if (parser.index < parser.length) {
            const next = parser.nextCodePoint;

            if (next === Chars.LessThan) {
              if (advance(parser) === Chars.EqualSign) {
                parser.index++;
                return Token.ShiftLeftAssign;
              }
              return Token.ShiftLeft;
            }
            if (next === Chars.EqualSign) {
              advance(parser);
              return Token.LessThanOrEqual;
            }
            if (next === Chars.Exclamation) {
              // Treat HTML begin-comment as comment-till-end-of-line.
              if (
                parser.source.charCodeAt(parser.index + 2) === Chars.Hyphen &&
                parser.source.charCodeAt(parser.index + 1) === Chars.Hyphen
              ) {
                parser.index += 2;
                parser.column += 3;

                skipSingleLineComment(parser);
                continue;
              }
            }
          }
          return Token.LessThan;

        // `?`, `??`, `?.`
        case Token.QuestionMark: {
          advance(parser);
          if (context & Context.OptionsNext) {
            let ch = parser.nextCodePoint;
            if (ch === Chars.QuestionMark) {
              advance(parser);
              return Token.Coalesce;
            }
            if (ch === Chars.Period) {
              // Check that it's not followed by any numbers
              ch = parser.source.charCodeAt(parser.index + 1) | 0;
              if (ch > Chars.Nine || ch <= Chars.Zero) {
                advance(parser);
                return Token.QuestionMarkPeriod;
              }
            }
          }
          return Token.QuestionMark;
        }

        // `=`, `==`, `===`, `=>`
        case Token.Assign: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Assign;
          const char = parser.nextCodePoint;

          if (char === Chars.EqualSign) {
            if (advance(parser) === Chars.EqualSign) {
              advance(parser);
              return Token.StrictEqual;
            }
            return Token.LooseEqual;
          }
          if (char === Chars.GreaterThan) {
            advance(parser);
            return Token.Arrow;
          }

          return Token.Assign;
        }

        // `!`, `!=`, `!==`
        case Token.Negate:
          if (advance(parser) !== Chars.EqualSign) return Token.Negate;
          if (advance(parser) !== Chars.EqualSign) return Token.LooseNotEqual;
          advance(parser);
          return Token.StrictNotEqual;

        // `%`, `%=`
        case Token.Modulo:
          if (advance(parser) !== Chars.EqualSign) return Token.Modulo;
          advance(parser);
          return Token.ModuloAssign;

        // `*`, `**`, `*=`, `**=`
        case Token.Multiply: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Multiply;
          const char = parser.nextCodePoint;

          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.MultiplyAssign;
          }

          if (char !== Chars.Asterisk) return Token.Multiply;
          advance(parser);
          if (parser.nextCodePoint !== Chars.EqualSign) return Token.Exponentiate;

          advance(parser);

          return Token.ExponentiateAssign;
        }

        // `^`, `^=`
        case Token.BitwiseXor:
          if (advance(parser) !== Chars.EqualSign) return Token.BitwiseXor;
          advance(parser);
          return Token.BitwiseXorAssign;

        // `+`, `++`, `+=`
        case Token.Add: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Add;
          const char = parser.nextCodePoint;
          if (char === Chars.Plus) {
            advance(parser);
            return Token.Increment;
          }

          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.AddAssign;
          }

          return Token.Add;
        }

        // `-`, `--`, `-=`, `-->`
        case Token.Subtract: {
          advance(parser);
          if (parser.index >= parser.length) return Token.Subtract;
          const char = parser.nextCodePoint;

          if (char === Chars.Hyphen) {
            advance(parser);
            if (
              (context & Context.Module) === 0 &&
              (parser.precedingLineBreak || isStartOfLine) &&
              parser.nextCodePoint === Chars.GreaterThan
            ) {
              if (context & Context.DisableWebCompat) {
                report(parser, context, Errors.HtmlCommentInWebCompat);
                return Token.Error;
              }
              skipSingleLineComment(parser);
              continue;
            }
            return Token.Decrement;
          }

          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.SubtractAssign;
          }

          return Token.Subtract;
        }

        // `/`, `/=`, `/>`, '/*..*/'
        case Token.Divide: {
          const char = advance(parser);
          if (char === Chars.Slash) {
            advance(parser);
            skipSingleLineComment(parser);
            continue;
          }
          if (char === Chars.Asterisk) {
            advance(parser);
            const state = skipMultiLineComment(parser, context);
            if (state < 1) return Token.Error;
            continue;
          }
          if (context & Context.AllowRegExp) {
            return scanRegularExpression(parser, context);
          }
          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.DivideAssign;
          }

          return Token.Divide;
        }

        // `|`, `||`, `|=`
        case Token.BitwiseOr: {
          advance(parser);
          if (parser.index >= parser.length) return Token.BitwiseOr;

          const char = parser.nextCodePoint;

          if (char === Chars.VerticalBar) {
            advance(parser);
            return Token.LogicalOr;
          }
          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.BitwiseOrAssign;
          }

          return Token.BitwiseOr;
        }

        // `>`, `>=`, `>>`, `>>>`, `>>=`, `>>>=`
        case Token.GreaterThan: {
          advance(parser);
          if (parser.index >= parser.length) return Token.GreaterThan;

          let char = parser.nextCodePoint;

          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.GreaterThanOrEqual;
          }

          if (char !== Chars.GreaterThan) return Token.GreaterThan;

          char = advance(parser);

          if (char === Chars.GreaterThan) {
            if (advance(parser) !== Chars.EqualSign) return Token.LogicalShiftRight;
            advance(parser);
            return Token.LogicalShiftRightAssign;
          }
          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.ShiftRightAssign;
          }

          return Token.ShiftRight;
        }

        // `&`, `&&`, `&=`
        case Token.BitwiseAnd: {
          advance(parser);
          if (parser.index >= parser.source.length) return Token.BitwiseAnd;
          const char = parser.nextCodePoint;

          if (char === Chars.Ampersand) {
            advance(parser);
            return Token.LogicalAnd;
          }

          if (char === Chars.EqualSign) {
            advance(parser);
            return Token.BitwiseAndAssign;
          }

          return Token.BitwiseAnd;
        }

        default: // ignore
      }
    }
    if ((char ^ Chars.LineSeparator) <= 1) {
      lastIsCR = 0;
      parser.precedingLineBreak = 1;
      parser.nextCodePoint = parser.source.charCodeAt(++parser.index);
      parser.column = 0;
      parser.line++;
      continue;
    }

    if ((char & 0xfc00) === 0xd800 || ((unicodeLookup[(char >>> 5) + 34816] >>> char) & 31 & 1) !== 0) {
      if ((char & 0xfc00) === 0xdc00) {
        char = ((char & 0x3ff) << 10) | (char & 0x3ff) | 0x10000;
        if (((unicodeLookup[(char >>> 5) + 0] >>> char) & 31 & 1) === 0) {
          report(parser, context, Errors.InvalidSMPCharacter);
          return Token.Error;
        }
        parser.index++;
        parser.nextCodePoint = char;
        parser.column++;
      }

      return scanIdentifierSlowPath(parser, context, '', /* canBeKeyword */ 0);
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
