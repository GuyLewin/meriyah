import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - String', () => {
  const tokens: Array<[Context, string, string]> = [
    [Context.Empty, '"a"', 'a'],
    [Context.Empty, '"foo"', 'foo'],
    [Context.Empty, '"foo "', 'foo '],
    [Context.Empty, '"foo "', 'foo '],
    [Context.Empty, '"f1o2o"', 'f1o2o'],
    [Context.Empty, '"دیوانه"', 'دیوانه'],
    [Context.Empty, '"a℮"', 'a℮'],
    [Context.Empty, '"℘"', '℘'],
    [Context.Empty, '"\\u{0000}"', '\u0000'],
    [Context.Empty, '"a᧚"', 'a᧚'],
    [Context.Empty, '"a\\n"', 'a\n'],
    [Context.Empty, '"\\10ffff"', '\bffff'],
    [Context.Empty, '"{10ffff"', '{10ffff'],
    [Context.Empty, '"a\\n"', 'a\n'],
    [Context.Empty, '"a\\n"', 'a\n'],
    [Context.Empty, '"foo\\tbar"', 'foo\tbar'],
    [Context.Empty, '"\\u0001"', '\u0001'],
    [Context.Empty, '"\\u1100033"', 'ᄀ033'],
    [Context.Empty, '"\\x55"', 'U'],
    [Context.Empty, '"\\x55a"', 'Ua'],
    [Context.Empty, '"a\\x55"', 'aU'],
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
    [Context.OptionsRaw, '"\\221"', '']
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

  fail('fails on "\n"', '"\\r\\n', Context.Empty);
  fail('fails on "\n"', '"a\\r\\n', Context.Empty);
  //fail('fails on "\n"', '"a\\r\\n"', Context.Empty);
  fail('fails on "\\9999"', '"\\9999"', Context.Empty);
  fail('fails on "\\08"', '"\\08"', Context.Strict);
  fail('fails on "\\1"', '"\\1"', Context.Strict);
  fail('fails on "foo', '"foo', Context.Empty);
  fail('fails on "foo', '"foo', Context.Empty);
  fail('fails on "\\u{1F_639}"', '"\\u{1F_639}"', Context.OptionsNext);
  fail('fails on "\\u007Xvwxyz"', '"\\u007Xvwxyz"', Context.OptionsNext);
  fail('fails on "abc\\u{}"', '"abc\\u{}"', Context.OptionsNext);
  fail('fails on "abc\\u}"', '"abc\\u}"', Context.OptionsNext);
  fail('fails on "abc\\u{', '"abc\\u{"', Context.OptionsNext);
  fail('fails on "\\u{70bc"', '"\\u{70bc"', Context.OptionsNext);
  fail('fails on "\\u{70"', '"\\u{70"', Context.OptionsNext);
  fail('fails on "\\u{!"', '"\\u{!"', Context.Empty);
  fail('fails on "\\u"', '"\\u"', Context.Empty);
  fail('fails on "\\8"', '"\\8"', Context.Empty);
  fail('fails on "\\9', '"\\9"', Context.Empty);
  fail('fails on "\\"', '"\\"', Context.Empty);
  fail('fails on "\\u{10401"', '"\\u{10401"', Context.Empty);
  fail('fails on "\\u{110000}"', '"\\u{110000}"', Context.Empty);
  fail('fails on "\\u0x11ffff"', '"\\u0x11ffff"', Context.Empty);
  fail('fails on "\\xCq"', '"\\xCq"', Context.Empty);
  fail('fails on "\\x"', '"\\x"', Context.Empty);
  fail('fails on "\\xb"', '"\\xb"', Context.Empty);
  fail('fails on "\\uxxxxλ"', '"\\uxxxxλ"', Context.Empty);
  fail('fails on "\\u0fail"', '"\\u0fail"', Context.Empty);
  fail('fails on "\\uab"', '"\\uab"', Context.Empty);
  fail('fails on "\\uab"', '"\\uab"', Context.Empty);
  fail('fails on "\\u{0fail}"', '"\\u{0fail}"', Context.Empty);
  fail('fails on "\\u{xxxx}"', '"\\u{xxxx}"', Context.Empty);
  fail('fails on "\\u{12345"', '"\\u{12345"', Context.Empty);
  fail('fails on "\\u{123"', '"\\u{123"', Context.Empty);
  fail('fails on "\\u{110000}"', '"\\u{110000}"', Context.Empty);
  fail('fails on "\\u{00000000000000000000110000}"', '"\\u{00000000000000000000110000}"', Context.Empty);
  fail('fails on "\\7"', '"\\7"', Context.Strict);
  fail('fails on "\\7\\\n"', '"\\7\\\n"', Context.Strict);
  fail('fails on "\\008"', '"\\008"', Context.Strict);
  fail('fails on "\\012"', '"\\012"', Context.Strict);
  fail('fails on "\\x4"', '"\\x4"', Context.Empty);
  fail('fails on "\\6"', '"\\6"', Context.Strict);
  fail('fails on "\\8"', '"\\8"', Context.Strict);
  fail('fails on "\\9b"', '"\\9b"', Context.Strict);
  fail('fails on "\\9b"', '"\\9b"', Context.Empty);
  fail('fails on "\\1"', '"\\1"', Context.Strict);
  fail('fails on "\\01"', '"\\01"', Context.Strict);
  fail('fails on "\\21"', '"\\21"', Context.Strict);
  fail('fails on "\\10r"', '"\\10r"', Context.Strict);
  fail('fails on "\\21e"', '"\\21e"', Context.Strict);
  fail('fails on "\\10"', '"\\10"', Context.Strict);
  fail('fails on "\\012"', '"\\012"', Context.Strict);
  fail('fails on "\\126"', '"\\126"', Context.Strict);
  fail('fails on "\\324"', '"\\324"', Context.Strict);
  fail('fails on "\\x9"', '"\\x9"', Context.Empty);
  fail('fails on "\\xb"', '"\\xb"', Context.Empty);
  fail('fails on "\\xf"', '"\\xf"', Context.Empty);
  fail('fails on "\\x0"', '"\\x0"', Context.Empty);
  fail('fails on "\\x1"', '"\\x1"', Context.Empty);
  fail('fails on "\\xb"', '"\\xb"', Context.Empty);
  fail('fails on "\\xF"', '"\\xF"', Context.Empty);
  fail('fails on "\\x"', '"\\x"', Context.Empty);
  fail('fails on "\\x"', '"\\x"', Context.Empty);
  fail('fails on "\\x"', '"\\x"', Context.Empty);
  fail('fails on "\\x"', '"\\x"', Context.Empty);
  fail('fails on "\\xq7"', '"\\xq7"', Context.Empty);
  fail('fails on "\\xqf"', '"\\xqf"', Context.Empty);
  fail('fails on "\\xbq"', '"\\xbq"', Context.Empty);
  fail('fails on "\\xAq"', '"\\xAq"', Context.Empty);
  fail('fails on "\\xFq"', '"\\xFq"', Context.Empty);
});
