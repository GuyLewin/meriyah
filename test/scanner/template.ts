import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { Token } from '../../src/token';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - Template', () => {
  const tokens: [Context, Token, string, string][] = [
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '``', ''],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`a`', 'a'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`foo `', 'foo '],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`foo `', 'foo '],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`f1o2o`', 'f1o2o'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`دیوانه`', 'دیوانه'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`a℮`', 'a℮'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`℘`', '℘'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`a᧚`', 'a᧚'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`foo\\tbar`', 'foo\tbar'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`\\x55a`', 'Ua'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`a\\nb`', 'a\nb'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`;`', ';'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '``', ''],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`123`', '123'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`true`', 'true'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`\n\r`', '\n\n'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`\r\n`', '\n'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`$$$a}`', '$$$a}'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`\\u1000`', 'က'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`\\u0041`', 'A'],
    [Context.Empty, Token.NoSubstitutionTemplateLiteral, '`\\б`', 'б'],
    [Context.InTemplate, Token.TemplateTail, '}`', '']
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
});
