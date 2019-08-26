import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - String', () => {
  const tokens: Array<[Context, any, any]> = [
    [Context.Empty, '"a"', 'a'],
    [Context.Empty, '"foo"', 'foo'],
    [Context.Empty, '"foo "', 'foo '],
    [Context.Empty, '"foo "', 'foo '],
    [Context.Empty, '"f1o2o"', 'f1o2o'],
    [Context.Empty, '"دیوانه"', 'دیوانه'],
    [Context.Empty, '"a℮"', 'a℮'],
    [Context.Empty, '"℘"', '℘'],
    [Context.Empty, '"a᧚"', 'a᧚'],
    [Context.Empty, '"a\\n"', 'a\n'],
    [Context.Empty, '"foo\\tbar"', 'foo\tbar'],
    [Context.Empty, '"\\u0001"', '\u0001'],
    [Context.Empty, '"\\x55"', 'U'],
    [Context.Empty, '"\\x55a"', 'Ua'],
    [Context.Empty, '"a\\nb"', 'a\nb'],
    [Context.Empty, '";"', ';'],
    [Context.Empty, '"\\r"', '\r'],
    [Context.Empty, '""', ''],
    [Context.Empty, '"123"', '123'],
    [Context.Empty, '"true"', 'true'],
    [Context.Empty, '"\
    "', '    '],

    // Russian letters
    [Context.Empty, '"\\б"', 'б'],
    [Context.Empty, '"\\И"', 'И'],
    [Context.Empty, '"\\Й"', 'Й'],
    [Context.Empty, '"\\К"', 'К'],
    [Context.Empty, '"\\Л"', 'Л'],
    [Context.Empty, '"\\О"', 'О'],
    [Context.Empty, '"\\Ф"', 'Ф'],
    [Context.Empty, '"\\Ц"', 'Ц'],
    [Context.Empty, '"\\Ш"', 'Ш'],
    [Context.Empty, '"\\Э"', 'Э'],
    [Context.Empty, '"\\ж"', 'ж'],
    [Context.Empty, '"\\з"', 'з'],

    // Escaped letters
    [Context.Empty, '"\\b"', '\b'],
    [Context.Empty, '"\\v"', '\v'],
    [Context.Empty, '"\\t"', '\t'],
    [Context.Empty, '"\\f"', '\f'],
    [Context.Empty, '"\\j"', 'j'],
    [Context.Empty, '"\\A"', 'A'],
    [Context.Empty, '"\\t"', '\t'],
    [Context.Empty, '"\\fsuffix"', '\fsuffix'],
    [Context.Empty, '"\\Rsuffix"', 'Rsuffix'],
    [Context.Empty, '"prefix\\r\\n"', 'prefix\r\n'],

    // Unicode escape sequence

    [Context.Empty, '"\\u1000"', 'က'],
    [Context.Empty, '"\\uf2ff"', ''],
    [Context.Empty, '"\\u0041"', 'A'],
    [Context.Empty, '"\\uf2ff"', ''],
    [Context.Empty, '"\\u0123"', 'ģ'],
    [Context.Empty, '"\\x55a"', 'Ua'],
    [Context.Empty, '"\\u0123 postfix"', 'ģ postfix'],
    [Context.Empty, '"\\u{89abc}"', 'Ȧʼ'],
    [Context.Empty, '"\\u{CDEF}"', '췯'],
    [Context.Empty, '"\\u{0000000000000000000010ffff}"', 'пϿ'],
    [Context.Empty, '"\\u{10ffff}"', 'пϿ'],
    [Context.Empty, '"\\u0062"', 'b'],
    [Context.Empty, '"\\u0410"', 'А'],
    [Context.Empty, '"\\u0412"', 'В'],
    [Context.Empty, '"\\u0419"', 'Й'],
    [Context.Empty, '"\\u042E"', 'Ю'],
    [Context.Empty, '"\\u0432"', 'в'],
    [Context.Empty, '"\\u0030"', '0'],
    [Context.Empty, '"\\u0035"', '5'],
    [Context.Empty, '"\\u0003"', '\u0003'],
    [Context.Empty, '"\\u180E"', '᠎'],

    // Escaped hex

    [Context.Empty, '"\\x01F"', '\u0001F'],
    [Context.Empty, '"\\x05B"', '\u0005B'],
    [Context.Empty, '"\\x0D3"', '\r3'],
    [Context.Empty, '"\\x088"', '\b8'],
    [Context.Empty, '"\\x34"', '4'],
    [Context.Empty, '"\\xCd"', 'Í'],
    [Context.Empty, '"\\xF0"', 'ð'],
    [Context.Empty, '"\\xF000111FEEEDDAAAB77777999344BBBCCD0"', 'ð00111FEEEDDAAAB77777999344BBBCCD0'],
    [Context.Empty, '"\\x128"', '\u00128'],
    [Context.Empty, '"\\xCd#"', 'Í#'],
    [Context.Empty, '"\\xDe\\x00"', 'Þ\u0000'],
    [Context.Empty, '"\\0x0061"', '\u0000x0061'],
    [Context.Empty, '"\\x41"', 'A'],
    [Context.Empty, '"\\x4A"', 'J'],
    [Context.Empty, '"\\x4F"', 'O'],
    [Context.Empty, '"\\x69"', 'i'],

    // Escaped octals
    [Context.Empty, '"\\01"', '\u0001'],
    [Context.Strict, '"\\0"', '\u0000'],
    [Context.Empty, '"\\023"', '\u0013'],
    [Context.Empty, '"\\04"', '\u0004'],
    [Context.Empty, '"\\44444444444"', '$444444444'],
    [Context.Empty, '"\\777777"', '?7777'],
    [Context.Empty, '"\\052"', '*'],
    [Context.Empty, '"\\08"', '\u00008'],
    [Context.Empty, '"\\7"', '\u0007'],
    [Context.Empty, '"\\052"', '*'],
    [Context.Empty, '"Hello\\nworld"', 'Hello\nworld'],
    [Context.Empty, '"Hello\\312World"', 'HelloÊWorld'],
    [Context.Empty, '"Hello\\712World"', 'Hello92World'],
    [Context.Empty, '"Hello\\1World"', 'Hello\u0001World'],
    [Context.Empty, '"Hello\\02World"', 'Hello\u0002World'],
    [Context.Empty, '"\\46"', '&'],
    [Context.Empty, '"\\5*"', '\u0005*'],
    [Context.Empty, '"\\10"', '\b'],
    [Context.Empty, '"\\02"', '\u0002'],
    [Context.Empty, '"\\02a"', '\u0002a'],
    [Context.Empty, '"\\02a"', '\u0002a'],
    [Context.Empty, '"\\73"', ';'],
    [Context.Empty, '"\\62a"', '2a'],
    [Context.Empty, '"\\023"', '\u0013'],
    [Context.Empty, '"\\7"', '\u0007'],
    [Context.Empty, '"\\012"', '\n'],
    [Context.Empty, '"\\126"', 'V'],
    [Context.Empty, '"\\302"', 'Â'],
    [Context.Empty, '"\\000"', '\u0000'],
    [Context.Empty, '"\\104"', 'D'],
    [Context.Empty, '"\\221"', '']
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
});
