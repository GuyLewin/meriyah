import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - Identifier', () => {
  const tokens: Array<[Context, any, any]> = [
    [Context.Empty, 'a', 'a'],
    [Context.Empty, 'A', 'A'],
    [Context.Empty, 'gy', 'gy'],
    [Context.Empty, 'M5', 'M5'],
    [Context.Empty, '$e', '$e'],
    [Context.Empty, '$A', '$A'],
    [Context.Empty, '_', '_'],
    [Context.Empty, '_$', '_$'],
    [Context.Empty, '__', '__'],
    [Context.Empty, '$x', '$x'],
    [Context.Empty, '$_', '$_'],
    [Context.Empty, '$$', '$$'],
    [Context.Empty, '$', '$'],
    [Context.Empty, '$i', '$i'],
    [Context.Empty, '_O', '_O'],
    [Context.Empty, '_r', '_r'],
    [Context.Empty, 'x_y', 'x_y'],
    [Context.Empty, 'xyz123', 'xyz123'],
    [Context.Empty, 'x1y1z1', 'x1y1z1'],
    [Context.Empty, 'a____123___b$', 'a____123___b$'],
    [Context.Empty, '_$$$$', '_$$$$'],
    [Context.Empty, '$$$$', '$$$$'],
    [Context.Empty, 'a1234', 'a1234'],
    [Context.Empty, 'a_______3333333', 'a_______3333333'],
    [Context.Empty, 'abc', 'abc'],
    [Context.Empty, '    $', '$'],
    [Context.Empty, '𐀀', '𐀀'],
    [Context.Empty, '𠮷野家', '𠮷野家'],
    [Context.Empty, '𢭃', '𢭃'],
    [Context.Empty, '/* skip */   $', '$'],
    [Context.Empty, 'CAN_NOT_BE_A_KEYWORD', 'CAN_NOT_BE_A_KEYWORD'],

    // IdentifierStart - Unicode 4.0

    [Context.Empty, '℘', '℘'],
    [Context.Empty, '℮', '℮'],
    [Context.Empty, '゛', '゛'],
    [Context.Empty, '゜', '゜'],

    // IdentifierStart - Unicode 9.0

    [Context.Empty, ' ᢅ', 'ᢅ'],
    [Context.Empty, ' ᢆ', 'ᢆ'],

    [Context.Empty, 'a111', 'a111'],
    [Context.Empty, 'abc', 'abc'],
    [Context.Empty, '\\u0061sync', 'async'],
    [Context.Empty, '\\u0061sync', 'async'],
    [Context.Empty, '\\u0061sync', 'async'],
    [Context.Empty, '\\u0061sync', 'async'],
    [Context.Empty, '\\u0061sync', 'async'],
    [Context.Empty, 'br\\u0065ak', 'break'],
    [Context.Empty, 'ab\\u{0072}', 'abr'],
    [Context.Empty, 'fina\\u{6c}ly', 'finally'],
    [Context.Empty, 'a𐊧123', 'a𐊧123'],
    [Context.Empty, '\\u004C', 'L'],
    [Context.Empty, 'a᧚', 'a᧚'],

    // Long unicode escape

    [Context.Empty, '\\u{70}bc', 'pbc'],
    [Context.Empty, '$\\u{32}', '$2'],
    [Context.Empty, '\\u{37}', '7'],
    [Context.Empty, '\\u{70}bc\\u{70}bc', 'pbcpbc'],
    [Context.Empty, '\\u{070}bc', 'pbc'],
    [Context.Empty, 'ab\\u{0072}', 'abr'],
    [Context.Empty, 'ab\\u{00072}', 'abr'],
    [Context.Empty, 'ab\\u{072}', 'abr'],
    [Context.Empty, '\\u{4fff}', '俿'],
    [Context.Empty, '\\u{222}', 'Ȣ'],
    [Context.Empty, '\\u{1EE00}', '{Ȁ'],
    [Context.Empty, 'a\\u{0000000000000000000071}c', 'aqc'],

    // Keywords
    [Context.Empty, 'Yield', 'Yield'],

    // Russian letters
    [Context.Empty, 'б', 'б'],
    [Context.Empty, 'е', 'е'],
    [Context.Empty, 'ц', 'ц'],

    // Escaped Russian letters
    [Context.Empty, '\\u0431', 'б'],
    [Context.Empty, '\\u0434', 'д'],
    [Context.Empty, '\\u0447', 'ч'],
    [Context.Empty, '\\u004C', 'L'],
    [Context.Empty, '\\u004C', 'L'],
    [Context.Empty, '\\u{413}', 'Г'],
    [Context.Empty, '\\u{419}', 'Й'],
    [Context.Empty, '\\u{424}', 'Ф'],

    // Others

    [Context.Empty, 'a𐊧123', 'a𐊧123'],
    [Context.Empty, 'название', 'название'],
    [Context.Empty, 'دیوانه', 'دیوانه'],
    [Context.Empty, 'a℮', 'a℮'],
    [Context.Empty, 'aᢆ', 'aᢆ'],
    [Context.Empty, 'ᢆ', 'ᢆ'],
    [Context.Empty, 'a፰', 'a፰'],
    [Context.Empty, 'a℮', 'a℮'],
    [Context.Empty, '゛', '゛'],
    [Context.Empty, '℮', '℮'],
    [Context.Empty, '℘', '℘'],
    [Context.Empty, 'a᧚', 'a᧚'],
    [Context.Empty, '$00xxx\\u0069\\u0524\\u{20BB7}', '$00xxxiԤη']
  ];

  for (const [ctx, op, value] of tokens) {
    it(`scans '${op}' at the end`, () => {
      const parser = create(op, undefined);
      scanSingleToken(parser, ctx);
      t.deepEqual(
        {
          value,
          hasNext: parser.index < parser.length,
          line: parser.line
        },
        {
          value: parser.tokenValue,
          hasNext: false,
          line: 1
        }
      );
    });

    it(`scans '${op}' with more to go`, () => {
      const parser = create(`${op} rest`, undefined);
      const found = scanSingleToken(parser, ctx);

      t.deepEqual(
        {
          hasNext: parser.index < parser.length,
          line: parser.line
        },
        {
          hasNext: true,
          line: 1
        }
      );
    });
  }

  function fail(name: string, source: string, context: Context) {
    it(name, () => {
      const state = create(source);
      t.throws(() => scanSingleToken(state, context));
    });
  }

  fail('fails on abc\\u{}', 'abc\\u{}', Context.Empty);
  fail('fails on abc\\u{}', '\\u{}', Context.Empty);
  fail('fails on abc\\u{}', '\\u{}abc', Context.Empty);
  fail('fails on abc\\u{}', '\\{}abc', Context.Empty);
  fail('fails on abc\\u{}', '\\u{abc', Context.Empty);
  fail('fails on 0.1n', '0.1n', Context.Empty);
  fail('fails on 2017.8n', '2017.8n', Context.Empty);
  fail('fails on 0xgn', '0xgn', Context.Empty);
});
