import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { Token } from '../../src/token';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - Template', () => {
  const tokens: [Context, Token, string, string][] = [
    [Context.Empty, Token.TemplateTail, '``', ''],
    [Context.Empty, Token.TemplateTail, '`\n`', '\n'],
    [Context.Empty, Token.TemplateTail, '`\r`', '\r'],
    [Context.Empty, Token.TemplateTail, '`\r\n`', '\r\n'],
    [Context.Empty, Token.TemplateTail, '`a\n`', 'a\n'],
    [Context.Empty, Token.TemplateTail, '`a\r`', 'a\r'],
    [Context.Empty, Token.TemplateTail, '`a\r\n`', 'a\r\n'],
    [Context.Empty, Token.TemplateTail, '`\\n`', '\n'],
    [Context.Empty, Token.TemplateTail, '`\\r`', '\r'],
    [Context.Empty, Token.TemplateTail, '`\\r\\n`', '\r\n'],
    [Context.Empty, Token.TemplateTail, '`a\\n`', 'a\n'],
    [Context.Empty, Token.TemplateTail, '`a\\r`', 'a\r'],
    [Context.Empty, Token.TemplateTail, '`a\\r\\n`', 'a\r\n'],
    [Context.Empty, Token.TemplateTail, '`a`', 'a'],
    [Context.Empty, Token.TemplateTail, '`foo `', 'foo '],
    [Context.Empty, Token.TemplateTail, '`foo `', 'foo '],
    [Context.Empty, Token.TemplateTail, '`f1o2o`', 'f1o2o'],
    [Context.Empty, Token.TemplateTail, '`دیوانه`', 'دیوانه'],
    [Context.Empty, Token.TemplateTail, '`a℮`', 'a℮'],
    [Context.Empty, Token.TemplateTail, '`℘`', '℘'],
    [Context.Empty, Token.TemplateTail, '`a᧚`', 'a᧚'],
    [Context.Empty, Token.TemplateTail, '`foo\\tbar`', 'foo\tbar'],
    [Context.Empty, Token.TemplateTail, '`$$$a}`', '$$$a}'],
    [Context.Empty, Token.TemplateTail, '`\\x55a`', 'Ua'],
    [Context.Empty, Token.TemplateTail, '`a\\nb`', 'a\nb'],
    [Context.Empty, Token.TemplateTail, '`;`', ';'],
    [Context.Empty, Token.TemplateTail, '``', ''],
    //    [Context.Empty, Token.TemplateCont, '`${\\9999`', ''],
    [Context.Empty, Token.TemplateTail, '`123`', '123'],
    [Context.Empty, Token.TemplateTail, '`true`', 'true'],
    [Context.Empty, Token.TemplateTail, '`\n\r`', '\n\r'],
    [Context.Empty, Token.TemplateTail, '`\r\n`', '\r\n'],
    [Context.Empty, Token.TemplateTail, '`\\б`', 'б'],
    [Context.Empty, Token.TemplateTail, '`\\u1000`', 'က'],
    [Context.Empty, Token.TemplateTail, '`\\u0041`', 'A']
  ];

  for (const [ctx, token, op, value] of tokens) {
    it(`scans '${op}' at the end`, () => {
      const state = create(op, undefined, undefined);
      const found = scanSingleToken(state, ctx);

      t.deepEqual(
        {
          token: found,
          hasNext: state.index < state.source.length,
          value: state.tokenValue,
          index: state.index
        },
        {
          token: token,
          hasNext: false,
          value,
          index: op.length
        }
      );
    });
  }

  describe('Lexer - Template Span', () => {
    const tokens: [Context, Token, string, string][] = [
      [Context.Empty, Token.TemplateCont, '`${`', ''],
      [Context.Empty, Token.TemplateCont, '`$$${`', '$$'],
      [Context.Empty, Token.TemplateCont, '`$$${a}`', '$$']
    ];

    for (const [ctx, token, op, value] of tokens) {
      it(`scans '${op}' at the end`, () => {
        const state = create(op, undefined);
        const found = scanSingleToken(state, ctx);

        t.deepEqual(
          {
            token: found,
            value: state.tokenValue
          },
          {
            token: token,
            value
          }
        );
      });
    }
  });
  /*
  describe('Lexer - Tagged Template', () => {
    const tokens: [Context, Token, string, string | void][] = [
      //[Context.TaggedTemplate, Token.TemplateTail, '`\\u{70bc`', undefined],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\7${', '\u0007'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\1${', '\u0001'],
      [Context.TaggedTemplate, Token.TemplateCont, "`'${", "'"],
      [Context.TaggedTemplate, Token.TemplateCont, '`"${', '"'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\`${', '`'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\`${', '`'],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\r`', '\r'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\f${', '\f'],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\f`', '\f'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\v${', '\v'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\n${', '\n'],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\n`', '\n'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\b${', '\b'],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\t`', '\t'],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\u{11ffff}${', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\u{11ffff}`', undefined],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\u{11ffff}${', undefined],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\u{110000}${', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\u{g0g}`', undefined],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\u{0g}${', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\u{g0}`', undefined],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\u{g}${', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\u{g}`', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\u{g}`', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\x0g`', undefined],
      [Context.TaggedTemplate, Token.TemplateCont, '`\\x0g${', undefined],
      [Context.TaggedTemplate, Token.TemplateTail, '`\\xg0`', undefined]
    ];

    for (const [ctx, token, op, value] of tokens) {
      it(`scans '${op}' at the end`, () => {
        const state = create(op, undefined);
        const found = scanSingleToken(state, ctx);

        t.deepEqual(
          {
            token: found,
            value: state.tokenValue
          },
          {
            token: token,
            value
          }
        );
      });
    }
  });*/

  function fail(name: string, source: string, context: Context) {
    it(name, () => {
      const state = create(source, undefined);
      t.throws(() => scanSingleToken(state, context));
    });
  }

  fail('fails on "\\9999"', '`a', Context.Empty);
  fail('fails on "\\9999"', '`\\9999`', Context.Empty);
  fail('fails on "\\9999"', '`\\9999`', Context.Strict);
  fail('fails on "\\9999"', '`\\`', Context.Strict);
  fail('fails on "\\9999"', '`\\', Context.Strict);
  fail('fails on "\\9999"', '`$\\9999`', Context.Strict);
  fail('fails on "\\u{70"', '`\\u{70`', Context.TaggedTemplate);
  fail('fails on "\\7"', '`\\7`', Context.Strict);
  fail('fails on "foo', '"foo', Context.Empty);
  fail('fails on "\\u007"', '"\\u007"', Context.OptionsNext);
  fail('fails on "\\u007Xvwxyz"', '`\\u007Xvwxyz`', Context.OptionsNext);
  fail('fails on "abc\\u{}"', '`abc\\u{}`', Context.OptionsNext);
  fail('fails on "abc\\u}"', '`abc\\u}`', Context.OptionsNext);
  fail('fails on "abc\\u{', '`abc\\u{`', Context.OptionsNext);
  fail('fails on `\\u{70bc`', '`\\u{70bc`', Context.OptionsNext);
  fail('fails on "\\u{70"', '`\\u{70`', Context.OptionsNext);
  fail('fails on "\\u{!"', '`\\u{!`', Context.Empty);
  fail('fails on "\\u"', '`\\u`', Context.Empty);
  fail('fails on "\\8"', '`\\8`', Context.Empty);
  fail('fails on "\\9', '`\\9`', Context.Empty);
  fail('fails on "\\"', '`\\`', Context.Empty);
  fail('fails on "\\u{10401"', '`\\u{10401`', Context.Empty);
  fail('fails on "\\u{110000}"', '`\\u{110000}`', Context.Empty);
  fail('fails on "\\xCq"', '`\\xCq`', Context.Empty);
  fail('fails on "\\x"', '`\\x`', Context.Empty);
  fail('fails on "\\xb"', '`\\xb`', Context.Empty);
  fail('fails on `\\u{00000000000000000000110000}`', '`\\u{00000000000000000000110000}`', Context.Empty);
});
