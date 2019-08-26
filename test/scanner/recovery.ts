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
    ['Invalid hexadecimal escape sequence', '"\\xx55a"'],
    ['Invalid hexadecimal escape sequence', '"\\u{10ffff"'],
    ['Invalid hexadecimal escape sequence', '"\\u0!062"'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\1'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\999998"'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\8"'],
    ['Escapes \\8 or \\9 are not syntactically valid escapes', '"\\9"'],

    // Identifiers
    ['Invalid character', '፰'],
    ['Invalid Unicode escape sequence', '\\'],
    ['Invalid hexadecimal escape sequence', '\\u'],
    ['Invalid hexadecimal escape sequence', '\\u'],
    ['Invalid hexadecimal escape sequence', '\\u{'],
    ['Unexpected', '\\u{}'],
    ['Invalid hexadecimal escape sequence', '\\u}'],
    ['Invalid Unicode escape sequence', '\\0061sync'],
    ['Invalid hexadecimal escape sequence', '\\u0(061sync'],
    ['Unexpected', '\\u{}'],
    ['Invalid hexadecimal escape sequence', '\\u{'],

    // Numbers

    ['Numeric separators are not allowed at the end of numeric literals', '1_'],
    ['No identifiers allowed directly after numeric literal', '1.dd_'],
    ['Non-number found after exponent indicator', '1e']
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

      const token = scanSingleToken(parser, Context.OptionsRecovery | Context.AllowRegExp);

      t.deepEqual(Token.Error, token);
    });
  }
});
