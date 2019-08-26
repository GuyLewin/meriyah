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
    // [Context.Empty, '09', 9],
    // [Context.Empty, '09.3', 9.3],
    // [Context.Empty, '09.3e1', 93],
    // [Context.Empty, '09.3e-1', 0.93],
    // [Context.Empty, '098', 98],
    // [Context.Empty, '0098', 98],
    // [Context.Empty, '000000000098', 98],
    // [Context.Empty, '0000000000234567454548', 234567454548],

    // Numeric separators
    [Context.Empty, '0', 0],
    [Context.Empty, '1.1', 1.1],
    [Context.Empty, '1_1', 11],
    [Context.Empty, '1.1_1', 1.11],

    [Context.Empty, '0O01_1', 9],
    [Context.Empty, '0O0_7_7', 63],
    [Context.Empty, '0B0_1', 1],
    [Context.Empty, '0B010_01', 9],
    [Context.Empty, '0B011_11_1_1_11_11111_1111111_1111_11111', 536870911],
    [Context.Empty, '0X0_1', 1],
    [Context.Empty, '0X0_1_0', 16],
    [Context.Empty, '0Xa', 10]
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
