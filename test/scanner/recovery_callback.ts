import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { Token } from '../../src/token';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - Identifier (recovery)', () => {
  interface Opts {
    source: string;
    context: Context;
    token: Token;
    hasNext: boolean;
    line: number;
    column: number;
  }

  const tokens: Array<[string, string]> = [
    // Multiline comment
    ['Multiline comment was not closed properly', '/* unclosed'],

    // HTML comment - Web compat disabled
    ['HTML comments are only allowed with web compability (Annex B)', '-->'],

    // ScanSingleToken
    ['Invalid character', '@'],

    // Regular expression

    ['Unterminated regular expression', '/'],
    ["Duplicate regular expression flag 's'", '/a/ss'],
    ["Duplicate regular expression flag 'i'", '/a/ii'],
    ["Duplicate regular expression flag 'u'", '/a/uu'],
    ["Duplicate regular expression flag 'm'", '/a/mm'],
    //['Unexpected regular expression flag', '/a/uuasdffdsa%&/()'],

    // String literal
    ['Unterminated string literal', '"Unterminated string'],
    ['Unterminated string literal', '"\\"'],
    ['Invalid hexadecimal escape sequence', '"\\u0"'],
    ['Invalid hexadecimal escape sequence', '"\\u{"'],
    ['Invalid hexadecimal escape sequence', '"\\u{!}"'],
    ['Invalid hexadecimal escape sequence', '"\\u{"'],
    ['Invalid hexadecimal escape sequence', '"\\xx55a"'],
    ['Invalid hexadecimal escape sequence', '"\\x!55a"'],
    ['Invalid hexadecimal escape sequence', '"\\xx55a"'],
    ['Expected a closing curly brace `}`', '"\\u{10ffff"'],
    ['Invalid hexadecimal escape sequence', '"\\u0!062"'],
    ['Unicode escape sequence value is higher than 0x10FFFF', '"\\u{1100033}"'],
    ['Invalid hexadecimal escape sequence', '"\\u0!062"'],
    ['Expected a closing curly brace `}`', '"\\u{70bc"'],
    ['Expected a closing curly brace `}`', '"\\u{10401"'],
    ['Invalid hexadecimal escape sequence', '"\\x4"'],
    ['Unterminated string literal', '"\\1'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\999998"'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\8"'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\9"'],

    // Identifiers
    ['Invalid character', '፰'],
    ['Invalid Unicode escape sequence', '\\'],
    ['Invalid hexadecimal escape sequence', '\\u'],
    ['Invalid hexadecimal escape sequence', '\\u'],
    ['Expected a closing curly brace `}`', '\\u{'],
    ['Unexpected', '\\u{}'],
    ['Unicode escape sequence value is higher than 0x10FFFF', '\\u{1100033}'],
    ['Invalid hexadecimal escape sequence', '\\u}'],
    ['Invalid Unicode escape sequence', '\\0061sync'],
    ['Invalid hexadecimal escape sequence', '\\u0(061sync'],
    ['Expected a closing curly brace `}`', '\\u{10401'],
    ['Invalid Unicode escape sequence', '\\x4'],
    ['Invalid hexadecimal escape sequence', '\\u!55a'],
    ['Unexpected', '\\u{}'],
    ['Expected a closing curly brace `}`', '\\u{'],

    // Numbers

    ['Numeric separators are not allowed at the end of numeric literals', '1_'],
    ['Unexpected identifier after numeric literal', '1.dd_'],
    ['Non-number found after exponent indicator', '1e'],
    ['Invalid BigInt syntax', '.1n'],
    ["Missing octal digits after '0o'", '0O98n33'],
    ['Only one underscore is allowed as numeric separato', '1__0123456789n'],
    ['Only one underscore is allowed as numeric separato', '0x0__0n'],
    ["Numeric separators '_' are not allowed in numbers that start with '0'", '00_0n'],
    ["Numeric separators '_' are not allowed in numbers that start with '0'", '0_'],
    ['Numeric separators are not allowed at the end of numeric literals', '0O12345_670_0_035672345674_3_5_'],
    ["Missing octal digits after '0o'", '0o'],
    ["Missing binary digits after '0b'", '0b'],
    ["Missing hexadecimal digits after '0x'", '0x'],
    ['Only one underscore is allowed as numeric separato', '0o_1'],
    ['Only one underscore is allowed as numeric separato', '0b_1'],
    ['Only one underscore is allowed as numeric separato', '0x_1'],
    ['Only one underscore is allowed as numeric separato', '0o2_________'],
    ['Invalid BigInt syntax', '.1n'],
    ['Invalid BigInt syntax', '0.1n'],
    ['Invalid BigInt syntax', '1.1n'],
    ['Unexpected identifier after numeric literal', '1.1e1n'],
    ['Unexpected identifier after numeric literal', '3in1'],
    ['Non-number found after exponent indicator', '3.e+abc'],
    ['Non-number found after exponent indicator', '3.e+abc'],
    ['Numeric separators are not allowed at the end of numeric literals', '3_.e+abc'],
    ['Non-number found after exponent indicator', '1_3.e+abc'],
    ['Unexpected identifier after numeric literal', '3.e+1abc'],
    ['Unexpected', '1._'],
    ['Invalid BigInt syntax', '2017.8n'],
    ["Missing octal digits after '0o'", '0o9n'],
    ["Missing binary digits after '0b'", '0b2n'],
    ['Numeric separators are not allowed at the end of numeric literals', '.1_'],
    ['Numeric separators are not allowed at the end of numeric literals', '234565434565_1_'],
    ['Only one underscore is allowed as numeric separato', '1.1__'],
    ['Numeric separators are not allowed at the end of numeric literals', '10e10_'],
    ['Invalid BigInt syntax', '0123n'],
    ['Unexpected identifier after numeric literal', '0b10100e1eee']
  ];

  for (const [error, op] of tokens) {
    it(`scans '${op}' with more to go`, () => {
      const parser = create(
        `${op} rest`,
        (err: any) => {
          t.deepEqual(error, err);
        },
        undefined
      );

      const token = scanSingleToken(parser, Context.OptionsRecovery | Context.AllowRegExp | Context.DisableWebCompat);

      t.deepEqual(Token.Error, token);
    });
  }
});
