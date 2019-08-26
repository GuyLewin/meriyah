import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - Whitespace', () => {
  function pass(name: string, opts: any) {
    it(name, () => {
      const state = create(opts.source, undefined, undefined);
      scanSingleToken(state, Context.Empty);
      t.deepEqual(
        {
          value: state.tokenValue,
          index: state.index,
          column: state.index
          //newLine: (state.flags & Flags.NewLine) !== 0
        },
        {
          value: opts.value,
          index: opts.index,
          column: opts.column
          //  newLine: opts.newLine
        }
      );
    });
  }

  pass('skips nothing', {
    source: '',
    //newLine: false,
    hasNext: false,
    index: 0,
    value: undefined,
    line: 1,
    column: 0
  });

  pass('skips spaces', {
    source: '        ',
    //    newLine: false,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 1,
    column: 8
  });

  pass('skips tabs', {
    source: '\t\t\t\t\t\t\t\t',
    //    newLine: false,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 1,
    column: 8
  });

  pass('skips vertical tabs', {
    source: '\v\v\v\v\v\v\v\v',
    //    newLine: false,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 1,
    column: 8
  });

  pass('skips white spacee', {
    source: '\u0020',
    hasNext: false,
    value: undefined,
    // newLine: false,
    line: 1,
    index: 1,
    column: 1
  });

  pass('skips white space', {
    source: '\u0009\u000B\u000C\u0020\u00A0\u000A\u000D\u2028\u2029',
    hasNext: false,
    value: undefined,
    line: 1,
    index: 9,
    column: 9
  });

  pass('skips line feeds', {
    source: '\n\n\n\n\n\n\n\n',
    hasNext: false,
    index: 8,
    value: undefined,
    line: 9,
    column: 8
  });

  pass('skips carriage returns', {
    source: '\r\r\r\r\r\r\r\r',
    newLine: true,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 9,
    column: 8
  });

  pass('skips Windows newlines', {
    source: '\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n',
    newLine: true,
    hasNext: false,
    index: 16,
    value: undefined,
    line: 9,
    column: 16
  });

  pass('skips line separators', {
    source: '\u2028\u2028\u2028\u2028\u2028\u2028\u2028\u2028',
    newLine: true,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 9,
    column: 8
  });

  pass('skips paragraph separators', {
    source: '\u2029\u2029\u2029\u2029\u2029\u2029\u2029\u2029',
    newLine: true,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 9,
    column: 8
  });
  pass('skips mixed whitespace', {
    source: '    \t \r\n \n\r \v\f\t ',
    newLine: true,
    hasNext: false,
    index: 16,
    value: undefined,
    line: 4,
    column: 16
  });

  pass('skips single line comments with line feed', {
    source: '  \t // foo bar\n  ',
    newLine: true,
    hasNext: false,
    index: 17,
    value: undefined,
    line: 2,
    column: 17
  });

  pass('skips single line comments with carriage return', {
    source: '  \t // foo bar\r  ',
    newLine: true,
    hasNext: false,
    index: 17,
    value: undefined,
    line: 2,
    column: 17
  });

  pass('skips single line comments with Windows newlines', {
    source: '  \t // foo bar\r\n  ',
    newLine: true,
    hasNext: false,
    index: 18,
    value: undefined,
    line: 2,
    column: 18
  });
});
