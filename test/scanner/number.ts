import * as t from 'assert';
import { Context } from '../../src/common';
import { create } from '../../src/parser';
import { scanSingleToken } from '../../src/scanner/scan';

describe('Scanner - Identifier', () => {
  const tokens: Array<[Context, string, number]> = [
    [Context.Empty, '1', 1],
    [Context.Empty, '.31', 0.31],
    [Context.Empty, '0', 0],
    [Context.Empty, '1', 1],
    [Context.Empty, '3', 3],
    [Context.Empty, '10', 10],
    [Context.Empty, '32', 32],
    [Context.Empty, '98', 98],
    [Context.Empty, '7890', 7890],
    [Context.Empty, '123', 123],
    [Context.Empty, '.5', 0.5],
    [Context.Empty, '.9', 0.9],
    [Context.Empty, '.123', 0.123],
    [Context.Empty, '.1234567890', 0.123456789],
    [Context.Empty, '.0000', 0],
    [Context.Empty, '32.', 32],
    [Context.Empty, '8.', 8],
    [Context.Empty, '1234567890.', 1234567890],
    [Context.Empty, '.12343243289787943289742348974897487', 0.12343243289787943],
    [Context.Empty, '456.', 456],
    [Context.Empty, '2.3', 2.3],
    [Context.Empty, '5.5', 5.5],
    [Context.Empty, '0.00', 0],
    [Context.Empty, '0.001', 0.001],
    [Context.Empty, '0.0', 0],
    [Context.Empty, '4.0', 4],
    [Context.Empty, '0.0', 0],
    [Context.Empty, '456.345', 456.345],
    [Context.Empty, '1234567890.0987654321', 1234567890.0987654321],

    // Numeric literals with exponent
    [Context.Empty, '0e1', 0],
    [Context.Empty, '1e2', 100],
    [Context.Empty, '5e6', 5000000],
    [Context.Empty, '10e10', 100000000000],
    [Context.Empty, '7890e789', Infinity],
    [Context.Empty, '1234567890e1234567890', Infinity],
    [Context.Empty, '.0E10', 0],
    [Context.Empty, '.5E00', 0.5],
    [Context.Empty, '.10E1', 1],
    [Context.Empty, '1.e2', 1e2],
    [Context.Empty, '1.e-2', 0.01],
    [Context.Empty, '1.E2', 100],
    [Context.Empty, '1.E-2', 0.01],
    [Context.Empty, '.5e3', 500],
    [Context.Empty, '.5e-3', 0.0005],
    [Context.Empty, '0.5e3', 500],
    [Context.Empty, '55.55e10', 555500000000],
    [Context.Empty, '0e-100', 0],
    [Context.Empty, '0E-100', 0],
    [Context.Empty, '0e+1', 0],
    [Context.Empty, '0e01', 0],
    [Context.Empty, '6e+1', 60],
    [Context.Empty, '9e+1', 90],
    [Context.Empty, '1E-1', 0.1],
    [Context.Empty, '0e-1', 0],
    [Context.Empty, '7E1', 70],
    [Context.Empty, '0e0', 0],
    [Context.Empty, '0E0', 0],
    [Context.Empty, '.6e1', 6],
    [Context.Empty, '1.1E-100', 1.1e-100],
    [Context.Empty, '.1e-100', 1e-101],
    [Context.Empty, '0e+100', 0],
    [Context.Empty, '1E+100', 1e100],
    [Context.Empty, '.1E+100', 1e99],

    // Hex
    [Context.Empty, '0xcafe', 51966],
    [Context.Empty, '0x12345678', 305419896],
    [Context.Empty, '0x0001', 1],
    [Context.Empty, '0x0', 0],
    [Context.Empty, '0x2', 2],
    [Context.Empty, '0xD', 13],
    [Context.Empty, '0xf', 15],
    [Context.Empty, '0xb', 11],
    [Context.Empty, '0x7', 7],
    [Context.Empty, '0x45', 69],
    [Context.Empty, '0xC0', 192],
    [Context.Empty, '0xF6', 246],
    [Context.Empty, '0xd1', 209],
    [Context.Empty, '0xAc', 172],
    [Context.Empty, '0xD2', 210],
    [Context.Empty, '0x23', 35],
    [Context.Empty, '0X1', 1],
    [Context.Empty, '0Xd', 13],
    [Context.Empty, '0Xf', 15],
    [Context.Empty, '0X010000000', 268435456],
    [Context.Empty, '0X01', 1],
    [Context.Empty, '0X010', 16],
    [Context.Empty, '0Xa', 10],
    [Context.Empty, '0x1234ABCD', 305441741],
    [Context.Empty, '0x9a', 154],
    [Context.Empty, '0x1234567890abcdefABCEF', 1.3754889323622168e24],
    [Context.Empty, '0X1234567890abcdefABCEF1234567890abcdefABCEF', 2.6605825358829506e49],
    [Context.Empty, '0X14245890abcdefABCE234567890ab234567890abcdeF1234567890abefABCEF', 5.694046700000817e74],

    // Binary
    [Context.Empty, '0b0', 0],
    [Context.Empty, '0b00', 0],
    [Context.Empty, '0b11', 3],
    [Context.Empty, '0b10', 2],
    [Context.Empty, '0B01', 1],
    [Context.Empty, '0B00', 0],
    [Context.Empty, '0b010', 2],
    [Context.Empty, '0b10', 2],
    [Context.Empty, '0b011', 3],
    [Context.Empty, '0B011', 3],
    [Context.Empty, '0B01', 1],
    [Context.Empty, '0B01001', 9],
    [Context.Empty, '0B011111111111111111111111111111', 536870911],
    [Context.Empty, '0B00000111111100000011', 32515],
    [Context.Empty, '0B0000000000000000000000000000000000000000000000001111111111', 1023],

    // Octals
    [Context.Empty, '0O12345670', 2739128],
    [Context.Empty, '0o45', 37],
    [Context.Empty, '0o5', 5],
    [Context.Empty, '0o12', 10],
    [Context.Empty, '0o70', 56],
    [Context.Empty, '0o0', 0],
    [Context.Empty, '0O1', 1],
    [Context.Empty, '0o07', 7],
    [Context.Empty, '0O011', 9],
    [Context.Empty, '0O077', 63],
    [Context.Empty, '0O1234567', 342391],
    [Context.Empty, '0O12345670003567234567435', 96374499007469390000],

    // Implicit octal
    [Context.Empty, '0123', 83],
    [Context.Empty, '01', 1],
    [Context.Empty, '043', 35],
    [Context.Empty, '07', 7],
    [Context.Empty, '09', 9],
    [Context.Empty, '09.3', 9.3],
    [Context.Empty, '09.3e1', 93],
    [Context.Empty, '09.3e-1', 0.93],
    [Context.Empty, '098', 98],
    [Context.Empty, '0098', 98],
    [Context.Empty, '000000000098', 98],
    [Context.Empty, '0000000000234567454548', 234567454548],

    // Numeric separators
    [Context.Empty, '0', 0],
    [Context.Empty, '1.1', 1.1],
    [Context.Empty, '1_1', 11],
    [Context.Empty, '1.1_1', 1.11],
    [Context.Empty, '1_1.1_1', 11.11],
    [Context.Empty, '0O01_1', 9],
    [Context.Empty, '0O0_7_7', 63],
    [Context.Empty, '0B0_1', 1],
    [Context.Empty, '0B010_01', 9],
    [Context.Empty, '0B011_11_1_1_11_11111_1111111_1111_11111', 536870911],
    [Context.Empty, '0X0_1', 1],
    [Context.Empty, '0X0_1_0', 16],
    [Context.Empty, '0Xa', 10],
    [Context.Empty, '0o7_0', 56],
    [Context.Empty, '0o0', 0],
    [Context.Empty, '0o0_7', 7],
    [Context.Empty, '0O0_1_1', 9],
    [Context.Empty, '0O12345_670_0_035672345674_3_5', 96374499007469390000],
    [Context.Empty, '0B0_1', 1],
    [Context.Empty, '0B01_0_0_1', 9],
    [Context.Empty, '0B0111111_1_1_111111111111111_1111_11', 536870911],

    // BigInt
    [Context.Empty, '1n', 1],
    [Context.Empty, '14567890672136732763333337n', 1.4567890672136733e25],
    [Context.Empty, '111n', 111],
    [Context.Empty, '0b01_0n', 2],
    [Context.Empty, '0B0_1n', 1],
    [Context.Empty, '0X0_1_0n', 16],
    [Context.Empty, '0O0_10n', 8],
    [Context.Empty, '0o3_3n', 27],
    [Context.Empty, '1_0123456789n', 10123456789],
    [Context.Empty, '1_1n', 11],
    [Context.Empty, '2_2n', 22],
    [Context.Empty, '0x2_2n', 34]
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

  fail('fails on 11.1n', '11.1n', Context.Strict);
  fail('fails on 0.1n', '0.1n', Context.Empty);
  fail('fails on 2017.8n', '2017.8n', Context.Empty);
  fail('fails on 0xgn', '0xgn', Context.Strict);
  fail('fails on 0e0n', '0e0n', Context.Empty);
  fail('fails on 0o9n', '0o9n', Context.Empty);
  fail('fails on 0b2n', '0b2n', Context.Empty);
  fail('fails on 008.3', '008.3', Context.Strict);
  fail('fails on 008.3n', '008.3n', Context.Empty);
  fail('fails on 0b2', '0b2', Context.Empty);
  fail('fails on 0b', '0b', Context.Empty);
  fail('fails on 00', '00', Context.Strict);
  fail('fails on 000', '000', Context.Strict);
  fail('fails on 005', '005', Context.Strict);
  fail('fails on 08', '08', Context.Strict);
  fail('fails on 0o8', '0o8', Context.Empty);
  fail('fails on 0x', '0x', Context.Empty);
  fail('fails on 10e', '10e', Context.Empty);
  fail('fails on 10e-', '10e-', Context.Empty);
  fail('fails on 10e+', '10e+', Context.Empty);
  fail('fails on 10ef', '10ef', Context.Empty);
  fail('fails on decimal integer followed by identifier', '12adf00', Context.Empty);
  fail('fails on decimal integer followed by identifier', '3in1', Context.Empty);
  fail('fails on decimal integer followed by identifier', '3.e', Context.Empty);
  fail('fails on decimal integer followed by identifier', '3.e+abc', Context.Empty);
  fail('fails on Binary-integer-literal-like sequence with a leading 0', '00b0;', Context.Empty);
  fail('fails on Octal-integer-literal-like sequence containing an invalid digit', '0o8', Context.Strict);
  fail('fails on Octal-integer-literal-like sequence containing an invalid digit', '0b3', Context.Strict);
  fail('fails on Octal-integer-literal-like sequence without any digits', '0o', Context.Strict);
  fail('fails on Binary-integer-literal-like sequence without any digits', '0b;', Context.Strict);
  fail('fails on Binary-integer-literal-like sequence containing an invalid digit', '0b2;', Context.Strict);
  fail('fails on Binary-integer-literal-like sequence containing an invalid digit', '0077', Context.Strict);
  fail('fails on invalid BigInt literal', '1ne-1', Context.OptionsNext);
  fail('fails on 1__', '1__', Context.Empty);
  fail('fails on 1__2', '1__2', Context.Empty);
  fail('fails on 1.__', '1.__', Context.Empty);
  fail('fails on 1.__1', '1.__1', Context.Empty);
  fail('fails on 1._1', '1._1', Context.Empty);
  fail('fails on 0O_01_1_', '0O_01_1_', Context.Empty);
  fail('fails on 0O_01_____1_', '0O_01_____1_', Context.Empty);
  fail('fails on 1E-1____', '1E-1____', Context.Empty);
  fail('fails on 9_1e+1_', '9_1e+1_', Context.Empty);
  fail('fails on 0b_', '0b_', Context.Empty);
  fail('fails on 0O_01_1', '0O_01_1', Context.Empty);
  fail('fails on 0b__0', '0b__0', Context.Empty);
  fail('fails on 0b0_', '0b0_', Context.Empty);
  fail('fails on 0X0__10', '0X0__10', Context.Empty);
  fail('fails on 0X_a_', '0X_a_', Context.Empty);
  fail('fails on 0e+1__2_', '0e+1__2_', Context.Empty);
  fail('fails on 0e+_1', '0e+_1', Context.Empty);
  fail('fails on 0e+1_', '0e+1_', Context.Empty);
  fail('fails on 0_', '0_', Context.Empty);
  fail('fails on 0x1_', '0x1_', Context.Empty);
  fail('fails on 0x_1', '0x_1', Context.Empty);
  fail('fails on 0o_1', '0o_1', Context.Empty);
  fail('fails on 0o_', '0o_', Context.Empty);
  fail('fails on 0o_', '0o_', Context.Empty);
  fail('fails on 0o2_', '0o_', Context.Empty);
  fail('fails on 0o2_________', '0o_', Context.Empty);
  fail('fails on 0b_1', '0b_1', Context.Empty);
  fail('fails on 0b1_', '0b1_', Context.Empty);
  fail('fails on 0b', '0b', Context.Empty);
  fail('fails on 0o', '0o', Context.Empty);
  fail('fails on 0x', '0x', Context.Empty);
  fail('fails on 1_', '1_', Context.Empty);
  fail('fails on 1__', '1__', Context.Empty);
  fail('fails on 1_1_', '1_1_', Context.Empty);
  fail('fails on 1__1_', '1__1_', Context.Empty);
  fail('fails on 1_1__', '1_1__', Context.Empty);
  fail('fails on 1_.1', '1_.1', Context.Empty);
  fail('fails on 1_.1_', '1_.1_', Context.Empty);
  fail('fails on 0O1_', '0O1_', Context.Empty);
  fail('fails on 0O1__', '0O1__', Context.Empty);
  fail('fails on 0O1_1_', '0O1_1_', Context.Empty);
  fail('fails on 0O1__1_', '0O1__1_', Context.Empty);
  fail('fails on 0O1_1__', '0O1_1__', Context.Empty);
  fail('fails on 09.3en', '09.3en', Context.Empty);
  fail('fails on 09.3e-1n', '09.3e-n', Context.Empty);
  fail('fails on 00123n', '00123n', Context.Empty);
  fail('fails on .3e-1n', '.3e-1n', Context.Empty);
  fail('fails on .3e-1n', '.3e-n', Context.Empty);
  fail('fails on 09_0n;', '09_0n;', Context.Empty);
  fail('fails on 0098n', '0098n', Context.Empty);
  fail('fails on 0b98n33', '0b98n33', Context.Empty);
  fail('fails on 0O98n33', '0O98n33', Context.Empty);
  fail('fails on .0000000001n', '.0000000001n', Context.Empty);
  fail('fails on 0xabcinstanceof x', '0xabcinstanceof x', Context.Empty);
  fail('fails on .0000000001n', '.0000000001n', Context.Empty);
  fail('fails on .0000000001n', '.0000000001n', Context.Empty);
  fail('fails on .1n', '.1n', Context.Empty);
  fail('fails on 0.1n', '0.1n', Context.Empty);
  fail('fails on 00n', '00n', Context.Empty);
  fail('fails on 0008n', '0008n', Context.Empty);
  fail('fails on 012348n', '012348n', Context.Empty);
  fail('fails on 08n', '08n', Context.Empty);
  fail('fails on 09n', '09n', Context.Empty);
  fail('fails on 0b_1n', '0b_1n', Context.Empty);
  fail('fails on 0b0_n', '0b0_n', Context.Empty);
  fail('fails on 1__0123456789n', '1__0123456789n', Context.Empty);
  fail('fails on 1_n', '1_n', Context.Empty);
  fail('fails on 10__0123456789n', '10__0123456789n', Context.Empty);
  fail('fails on 10_n', '10_n', Context.Empty);
  fail('fails on 0x_1n', '0x_1n', Context.Empty);
  fail('fails on 0x0__0n', '0x0__0n', Context.Empty);
  fail('fails on 0x0_n', '0x0_n', Context.Empty);
  fail('fails on 00_0n', '00_0n', Context.Empty);
  fail('fails on 0_8n', '0_8n', Context.Empty);
  fail('fails on 0__0123456789n', '0__0123456789n', Context.Empty);
  fail('fails on 0o0__0n', '0o0__0n', Context.Empty);
  fail('fails on 0O12345_670_0_035672345674_3_5_', '0O12345_670_0_035672345674_3_5_', Context.Empty);
});
