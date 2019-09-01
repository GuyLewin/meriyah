import { Context, ParserState } from './common';

/*@internal*/
export const enum Errors {
  Unexpected,
  UnexpectedToken,
  Expected,
  InvalidCharacter,
  InvalidSMPCharacter,
  StrictOctalLiteral,
  InvalidHexEscapeSequence,
  InvalidCodePoint,
  InvalidUnicodeEscapeSequence,
  InvalidEscapeIdentifier,
  ContinuousNumericSeparator,
  MissingHexDigits,
  MissingOctalDigits,
  MissingBinaryDigits,
  TrailingNumericSeparator,
  MissingExponent,
  IDStartAfterNumber,
  UnterminatedString,
  UnterminatedTemplate,
  TemplateOctalLiteral,
  StrictOctalEscape,
  InvalidEightAndNine,
  UnicodeOverflow,
  DuplicateRegExpFlag,
  UnexpectedTokenRegExpFlag,
  UnterminatedRegExp,
  RestricedLetProduction,
  InvalidCoalescing,
  InvalidBigIntLiteral,
  MissingCurlyBrace,
  SeparatorInZeroPrefixedNumber,
  InvalidASCIILineBreak,
  InvalidEOFInEscape,
  HtmlCommentInWebCompat,
  UnterminatedComment
}

/*@internal*/
export const errorMessages: {
  [key: string]: string;
} = {
  [Errors.Unexpected]: 'Unexpected',
  [Errors.UnexpectedToken]: 'Unexpected token %0',
  [Errors.Expected]: 'Expected %0',
  [Errors.InvalidCharacter]: 'Invalid character',
  [Errors.InvalidSMPCharacter]: 'Invalid SMP character',
  [Errors.StrictOctalLiteral]: 'Octal numeric literals and escape characters not allowed in strict mode',
  [Errors.InvalidHexEscapeSequence]: 'Invalid hexadecimal escape sequence',
  [Errors.InvalidCodePoint]: 'Invalid code point %0',
  [Errors.InvalidUnicodeEscapeSequence]: 'Invalid Unicode escape sequence',
  [Errors.InvalidEscapeIdentifier]: 'Only unicode escapes are legal in identifier names',
  [Errors.ContinuousNumericSeparator]: 'Only one underscore is allowed as numeric separato',
  [Errors.SeparatorInZeroPrefixedNumber]: "Numeric separators '_' are not allowed in numbers that start with '0'",
  [Errors.MissingHexDigits]: "Missing hexadecimal digits after '0x'",
  [Errors.MissingOctalDigits]: "Missing octal digits after '0o'",
  [Errors.MissingBinaryDigits]: "Missing binary digits after '0b'",
  [Errors.TrailingNumericSeparator]: 'Numeric separators are not allowed at the end of numeric literals',
  [Errors.MissingExponent]: 'Non-number found after exponent indicator',
  [Errors.IDStartAfterNumber]: 'Unexpected identifier after numeric literal',
  [Errors.UnterminatedString]: 'Unterminated string literal',
  [Errors.UnterminatedTemplate]: 'Unterminated template literal',
  [Errors.TemplateOctalLiteral]: 'Octal escape sequences are not allowed in template strings',
  [Errors.StrictOctalEscape]: 'Octal escape sequences are not allowed in strict mode',
  [Errors.InvalidEightAndNine]: 'Escapes \\8 or \\9 are not syntactically valid escapes',
  [Errors.UnicodeOverflow]: 'Unicode escape sequence value is higher than 0x10FFFF',
  [Errors.DuplicateRegExpFlag]: "Duplicate regular expression flag '%0'",
  [Errors.UnexpectedTokenRegExpFlag]: 'Unexpected regular expression flag',
  [Errors.UnterminatedRegExp]: 'Unterminated regular expression',
  [Errors.InvalidBigIntLiteral]: 'Invalid BigInt syntax',
  [Errors.MissingCurlyBrace]: 'Expected a closing curly brace `}`',
  [Errors.RestricedLetProduction]: '`let \n [` is a restricted production at the start of a statement',
  [Errors.InvalidASCIILineBreak]: 'Invalid unescaped line break in string literal',
  [Errors.InvalidEOFInEscape]: 'Reached end of script in the middle of an escape sequence',
  [Errors.HtmlCommentInWebCompat]: 'HTML comments are only allowed with web compability (Annex B)',
  [Errors.UnterminatedComment]: 'Multiline comment was not closed properly',
  [Errors.InvalidCoalescing]:
    'Coalescing and logical operators used together in the same expression must be disambiguated with parentheses'
};

export function report(parser: ParserState, _context: Context, type: Errors, ...params: string[]): void {
  const message = errorMessages[type].replace(/%(\d+)/g, (_: string, i: number) => params[i]);

  if (parser.onError) {
    parser.onError(message);
  } else {
    const error: any = new SyntaxError(`Line ${1}, column ${1}: ${message}`);
    error.index = 1;
    error.line = 1;
    error.column = 2;
    error.description = message;
    throw error;
  }
}
