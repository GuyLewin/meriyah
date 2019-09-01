import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { Token } from '../../src/token';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Lexer - Comments', () => {
  const tokens: [Context, Token, string, string][] = [
    [Context.Empty, Token.EndOfSource, '//', ''],
    [Context.Empty, Token.EndOfSource, '//', ''],
    [Context.Empty, Token.EndOfSource, '// foo', ''],
    [Context.Empty, Token.EndOfSource, '// foo\n', ''],
    [Context.Empty, Token.EndOfSource, '// /', ''],
    [Context.Empty, Token.EndOfSource, '// */', ''],
    [Context.Empty, Token.EndOfSource, '// /* */ foo', ''],
    [Context.Empty, Token.EndOfSource, '//\\n \\r \\x0a \\u000a foo bar', ''],
    [Context.Empty, Token.EndOfSource, '//\\unope \\u{nope} \\xno ', ''],
    [Context.Empty, Token.EndOfSource, '/**/', ''],
    [Context.Empty, Token.EndOfSource, '/* comment */', ''],
    [Context.Empty, Token.EndOfSource, '/*foo*/', ''],
    [Context.Empty, Token.EndOfSource, '/*foo\nbar\nbaz*/', ''],
    [Context.Empty, Token.EndOfSource, '/*\n*/', ''],
    [Context.Empty, Token.EndOfSource, '/* \n */', ''],
    [Context.Empty, Token.EndOfSource, '/* \n\n\n */', ''],
    [Context.Empty, Token.EndOfSource, '/* \\n \\r \\x0a \\u000a */', ''],
    [Context.Empty, Token.EndOfSource, '/* /* */', ''],
    [Context.Empty, Token.EndOfSource, '/*\u000C multi line \u000C comment \u000C*/', ''],
    [Context.Empty, Token.EndOfSource, '/*\u00A0 multi line \u00A0 comment \u00A0 x = 1;*/', ''],
    [Context.Empty, Token.EndOfSource, '/*\u0020 multi line \u0020 comment \u0020 x = 1;*/', ''],
    [Context.Empty, Token.EndOfSource, '//\u000B single line \u000B comment \u000B x = 1;', ''],
    [Context.Empty, Token.EndOfSource, '// single line comment x = 1;', ''],
    [Context.Empty, Token.EndOfSource, '// single line comment x = 1;', ''],
    [Context.Empty, Token.EndOfSource, '/*/ try and confuse the lexer\n */\n', ''],
    [Context.Empty, Token.EndOfSource, '/* comments can have embedded "strings" */', ''],
    [Context.Empty, Token.EndOfSource, '/* " /* */', ''],
    [Context.DisableWebCompat, Token.Identifier, '//foo!@#^&$1234\nbar', ''],
    [Context.Empty, Token.EndOfSource, '/* abcd!@#@$* { } && null*/', ''],
    [Context.Empty, Token.EndOfSource, '/*x*x*/', ''],
    [Context.Empty, Token.EndOfSource, '/**/', ''],
    [Context.Empty, Token.EndOfSource, '//\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r\r\r\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r/*\n*/\r\r\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r//\n\r\r\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r\n\t\r\n\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r\n\r\n\r', ''],
    [Context.Empty, Token.EndOfSource, '//\r\n\r\n\r', ''],
    [Context.Empty, Token.EndOfSource, '//\n\n\n\n\n\n\n\n', ''],
    [Context.Empty, Token.EndOfSource, '// \n\r\r\v\n\n\n\n', ''],
    [Context.Empty, Token.EndOfSource, '//\n', ''],
    [Context.Empty, Token.EndOfSource, '<!--', ''],
    [Context.Empty, Token.EndOfSource, '\n--' + '>', '']
  ];

  for (const [ctx, token, op] of tokens) {
    it(`scans '${op}' at the end`, () => {
      const state = create(op);
      const found = scanSingleToken(state, ctx);

      t.deepEqual(
        {
          token: found,
          hasNext: state.index < state.source.length,
          index: state.index
        },
        {
          token: token,
          hasNext: false,
          index: op.length
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

  fail('fails on /**', '/**', Context.Empty);
  fail('fails on -->', '-->', Context.DisableWebCompat);
});
