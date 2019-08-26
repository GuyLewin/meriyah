import { ParserState, Context } from '../common';
import { Chars } from '../chars';
import { unicodeLookup } from './unicode';
import { Escape } from './recovery';

export function advance(parser: ParserState): number {
  return (parser.nextCodePoint = parser.source.charCodeAt(++parser.index));
}

/**
 * Optimized version of 'fromCodePoint'
 *
 * @param {number} code
 * @returns {string}
 */
export function fromCodePoint(codePoint: number): string {
  return codePoint <= 65535
    ? String.fromCharCode(codePoint)
    : String.fromCharCode(codePoint >>> 10) + String.fromCharCode(codePoint & 0x3ff);
}

/**
 * Converts a value to a hex value
 *
 * @param code CodePoint
 */
export function toHex(code: number): number {
  return code < Chars.UpperA ? code - Chars.Zero : (code - Chars.UpperA + 10) & 0xf;
}

export function consumeMultiUnitCodePoint(parser: ParserState, hi: number): Escape {
  // See: https://tc39.github.io/ecma262/#sec-ecmascript-language-types-string-type
  if ((hi & 0xfc00) !== 0xd800) return 0;
  const lo = parser.source.charCodeAt(parser.index + 1);
  if ((lo & 0xfc00) !== 0xdc00) return 0;
  hi = parser.nextCodePoint = 0x10000 + ((hi & 0x3ff) << 10) + (lo & 0x3ff);
  if (((unicodeLookup[(hi >>> 5) + 0] >>> hi) & 31 & 1) === 0) {
    return Escape.InvalidCodePoint;
  }
  parser.index++;
  return 1;
}

// ECMA-262 11.2 White Space
export function isExoticECMAScriptWhitespace(code: number): boolean {
  /**
   * There are 25 white space characters we need to correctly class.
   * The lower ASCII range (127) white space have already been classified, so
   * only needed is to validate against the remaining
   * 15 Unicode category "Zs" ("Space_Separator") chars.
   *
   * - 0x1680
   * - 0x2000
   * - 0x2001
   * - 0x2002
   * - 0x2003
   * - 0x2004
   * - 0x2005
   * - 0x2006
   * - 0x2007
   * - 0x2008
   * - 0x2009
   * - 0x200a
   * - 0x2028 // <LS> LineTerminator (LINE SEPARATOR)
   * - 0x2029 // <PS> LineTerminator (PARAGRAPH SEPARATOR)
   * - 0x202f
   * - 0x205f
   * - 0x3000
   * - 0xfeff // <ZWNBSP>
   */
  return (
    code === Chars.NonBreakingSpace ||
    code === Chars.ZeroWidthNoBreakSpace ||
    code === Chars.NextLine ||
    code === Chars.Ogham ||
    (code >= Chars.EnQuad && code <= Chars.ZeroWidthSpace) ||
    code === Chars.NarrowNoBreakSpace ||
    code === Chars.MathematicalSpace ||
    code === Chars.IdeographicSpace ||
    code === Chars.ByteOrderMark
  );
}
