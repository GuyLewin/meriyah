import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { scanSingleToken } from '../../src/scanner/scan';

const donna = require('esprima').parse;

console.log(JSON.stringify(donna('foo', { loc: true })));

describe('Scanner - Whitespace', () => {
  context('script', () => run(false));
  context('module', () => run(true));
});

function run(isModule: boolean) {
  function pass(name: string, opts: any) {
    it(name, () => {
      const state = create(opts.source, undefined, undefined);
      scanSingleToken(state, isModule ? Context.Module : Context.Empty);
      t.deepEqual(
        {
          value: state.tokenValue,
          index: state.index,
          column: state.column,
          line: state.line,
          newLine: state.precedingLineBreak
        },
        {
          value: opts.value,
          index: opts.index,
          column: opts.column,
          line: opts.line,
          newLine: opts.newLine
        }
      );
    });
  }
  pass('skips spaces', {
    source: '        ',
    newLine: false,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 1,
    column: 8
  });

  pass('skips tabs', {
    source: '\t\t\t\t\t\t\t\t',
    newLine: false,
    hasNext: false,
    index: 8,
    value: undefined,
    line: 1,
    column: 8
  });

  pass('skips vertical tabs', {
    source: '\v\v\v\v\v\v\v\v',
    newLine: 0,
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
    newLine: false,
    line: 1,
    index: 1,
    column: 1
  });

  pass('skips white space', {
    source: '\u0009\u000B\u000C\u0020\u00A0\u000A\u000D\u2028\u2029',
    hasNext: false,
    value: undefined,
    newLine: true,
    line: 5,
    index: 9,
    column: 0
  });

  pass('skips paragraphseparator', {
    source: '\u2028',
    hasNext: false,
    value: undefined,
    newLine: true,
    line: 2,
    index: 1,
    column: 0
  });

  pass('skips paragraphseparator', {
    source: '\u2029',
    hasNext: false,
    value: undefined,
    newLine: 1,
    line: 2,
    index: 1,
    column: 0
  });

  pass('skips white space', {
    source: '\true',
    hasNext: false,
    value: 'rue',
    newLine: false,
    line: 1,
    index: 4,
    column: 4
  });

  function passAll(name: (lt: string) => string, opts: (lt: string) => any) {
    pass(name('line feed'), opts('\n'));
    pass(name('carriage return'), opts('\r'));
    pass(name('Windows newline'), opts('\r'));
    pass(name('line separators'), opts('\u2028'));
    pass(name('paragraph separators'), opts('\u2029'));
  }

  pass('skips nothing in an empty source', {
    source: '',
    hasNext: false,
    newLine: 0,
    index: 0,
    line: 1,
    column: 0
  });

  pass('skips nothing before an identifier', {
    source: 'foo',
    hasNext: true,
    value: 'foo',
    newLine: 0,
    index: 3,
    line: 1,
    column: 3
  });

  pass('skips spaces', {
    source: '        ',
    newLine: 0,
    index: 8,
    hasNext: false,
    line: 1,
    column: 8
  });

  pass('skips tabs', {
    source: '\t\t\t\t\t\t\t\t',
    newLine: 0,
    index: 8,
    hasNext: false,
    line: 1,
    column: 8
  });

  pass('skips vertical tabs', {
    source: '\v\v\v\v\v\v\v\v',
    newLine: 0,
    index: 8,
    hasNext: false,
    line: 1,
    column: 8
  });

  passAll(
    lt => `skips ${lt}s`,
    lt => ({
      source: `${lt}${lt}${lt}${lt}${lt}${lt}${lt}${lt}`,
      newLine: 1,
      index: 8,
      hasNext: false,
      line: 9,
      column: 0
    })
  );

  pass('skips mixed whitespace', {
    source: '    \t \r\n \n\r \v\f\t ',
    newLine: 1,
    index: 16,
    hasNext: false,
    line: 4,
    column: 5
  });

  passAll(
    lt => `skips single line comments with ${lt}`,
    lt => ({
      source: `  \t // foo bar${lt}  `,
      newLine: 1,
      index: 17,
      hasNext: false,
      line: 2,
      column: 2
    })
  );

  passAll(
    lt => `skips multiple single line comments with ${lt}`,
    lt => ({
      source: `  \t // foo bar${lt} // baz ${lt} //`,
      newLine: 1,
      index: 27,
      hasNext: false,
      line: 3,
      column: 3
    })
  );

  pass('skips multiline comments with nothing', {
    source: '  \t /* foo * /* bar */  ',
    newLine: 0,
    index: 24,
    hasNext: false,
    line: 1,
    column: 24
  });

  passAll(
    lt => `skips multiline comments with ${lt}`,
    lt => ({
      source: `  \t /* foo * /* bar ${lt} */  `,
      newLine: 1,
      index: 26,
      hasNext: false,
      line: 2,
      column: 5
    })
  );
  passAll(
    lt => `skips multiple multiline comments with ${lt}`,
    lt => ({
      source: `  \t /* foo bar${lt} *//* baz*/ ${lt} /**/`,
      newLine: 1,
      index: 33,
      hasNext: false,
      line: 3,
      column: 5
    })
  );
  if (isModule) {
    /*
  passAll(lt => `avoids HTML single line comments with ${lt}`, lt => ({
    source: `  \t <!-- foo bar${lt}  `,
    newLine: 1,
  index: 19,
    hasNext: true,
    line: 1, column: 4,
}));

*/
    pass('avoids single-line block on line of HTML close w/o line terminator', {
      source:
        '  \t /* optional SingleLineDelimitedCommentSequence */ ' +
        "   --> the comment doesn't extend to these characters\n ",
      newLine: 0,
      index: 59,
      hasNext: true,
      line: 1,
      column: 59
    });
  } else {
    passAll(
      lt => `skips HTML single line comments with ${lt}`,
      lt => ({
        source: `  \t <!-- foo bar${lt}  `,
        newLine: 1,
        index: 19,
        hasNext: false,
        line: 2,
        column: 2
      })
    );

    passAll(
      lt => `skips multiple HTML single line comments with ${lt}`,
      lt => ({
        source: `  \t <!-- foo bar${lt} <!-- baz ${lt} <!--`,
        newLine: 1,
        index: 33,
        hasNext: false,
        line: 3,
        column: 6
      })
    );

    passAll(
      lt => `skips single HTML close comment after ${lt}`,
      lt => ({
        source: `  \t ${lt}-->  `,
        newLine: 1,
        index: 10,
        hasNext: false,
        line: 2,
        column: 5
      })
    );

    passAll(
      lt => `skips line of single HTML close comment after ${lt}`,
      lt => ({
        source: `  \t ${lt}--> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 50,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `allows HTML close comment after ${lt} + WS`,
      lt => ({
        source: `  \t ${lt}   --> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 53,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `skips single-line block on line of HTML close after ${lt}`,
      lt => ({
        source: `  \t /*${lt}*/ /* optional SingleLineDelimitedCommentSequence */    ${''}--> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 108,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `skips 2 single-line block on line of HTML close after ${lt}`,
      lt => ({
        source: `  \t /*${lt}*/ /**/ /* second optional ${''}SingleLineDelimitedCommentSequence */    ${''}--> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 120,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `skips block HTML close with ${lt} + empty line`,
      lt => ({
        source: `  \t /*${lt}*/  -->${lt} `,
        newLine: 1,
        index: 16,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `skips block HTML close with ${lt}`,
      lt => ({
        source: `  \t /*${lt}*/  --> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 56,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `skips first line block HTML close with ${lt}`,
      lt => ({
        source: `  \t /* optional FirstCommentLine ${lt}*/  --> ` + `the comment extends to these characters${lt} `,
        newLine: 1,
        index: 83,
        hasNext: false,
        line: 3,
        column: 1
      })
    );

    passAll(
      lt => `skips multi block + HTML close with ${lt}`,
      lt => ({
        source: `  \t /*${lt}optional${lt}MultiLineCommentChars ${lt}*/  --> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 88,
        hasNext: false,
        line: 5,
        column: 1
      })
    );

    passAll(
      lt => `skips multi block + single block + HTML close with ${lt}`,
      lt => ({
        source: `  \t /*${lt}*/ /* optional SingleLineDelimitedCommentSequence ${lt}*/  --> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 107,
        hasNext: false,
        line: 4,
        column: 1
      })
    );

    passAll(
      lt => `skips multi block + 2 single block + HTML close with ${lt}`,
      lt => ({
        source: `  \t /*${lt}*/ /**/ /* optional SingleLineDelimitedCommentSequence ${lt}*/  --> the comment extends to these characters${lt} `,
        newLine: 1,
        index: 112,
        hasNext: false,
        line: 4,
        column: 1
      })
    );
  }
  /*
pass("avoids single HTML close comment w/o line terminator", {
  source: "  \t -->  ",
  newLine: 1,
  index: 112,
  hasNext: true,
  line: 1, column: 4,
});

pass("avoids line of single HTML close comment w/o line terminator", {
  source: "  \t --> the comment doesn't extend to these characters\n ",
  newLine: 1,
  index: 112,
  hasNext: true,
  line: 1, column: 4,
});
*/
}
