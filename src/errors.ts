import { Context, ParserState } from './common';

/*@internal*/
export const enum Errors {
  Unexpected,
  InvalidCharacter,
  StrictOctalLiteral,
  InvalidHexEscapeSequence,
  InvalidCodePoint,
  InvalidUnicodeEscapeSequence,
  InvalidEscapeIdentifier,
  ContinuousNumericSeparator,
  MissingHexDigits,
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
  UnterminatedRegExp
}

/*@internal*/
export const errorMessages: {
  [key: string]: string;
} = {
  [Errors.Unexpected]: 'Unexpected',
  [Errors.InvalidCharacter]: 'Invalid character',
  [Errors.StrictOctalLiteral]: 'Octal literals are not allowed in strict mode',
  [Errors.InvalidHexEscapeSequence]: 'Invalid hexadecimal escape sequence',
  [Errors.InvalidCodePoint]: 'Invalid code point %0',
  [Errors.InvalidUnicodeEscapeSequence]: 'Invalid Unicode escape sequence',
  [Errors.InvalidEscapeIdentifier]: 'Only unicode escapes are legal in identifier names',
  [Errors.ContinuousNumericSeparator]: 'Only one underscore is allowed as numeric separato',
  [Errors.MissingHexDigits]: 'Missing hexadecimal digits',
  [Errors.TrailingNumericSeparator]: 'Numeric separators are not allowed at the end of numeric literals',
  [Errors.MissingExponent]: 'Non-number found after exponent indicator',
  [Errors.IDStartAfterNumber]: 'No identifiers allowed directly after numeric literal',
  [Errors.UnterminatedString]: 'Unterminated string literal',
  [Errors.UnterminatedTemplate]: 'Unterminated template literal',
  [Errors.TemplateOctalLiteral]: 'Octal escape sequences are not allowed in template strings',
  [Errors.StrictOctalEscape]: 'Octal escape sequences are not allowed in strict mode',
  [Errors.InvalidEightAndNine]: 'Escapes \\8 or \\9 are not syntactically valid escapes',
  [Errors.UnicodeOverflow]: 'Unicode codepoint must not be greater than 0x10FFFF',
  [Errors.DuplicateRegExpFlag]: "Duplicate regular expression flag '%0'",
  [Errors.UnexpectedTokenRegExpFlag]: 'Unexpected regular expression flag',
  [Errors.UnterminatedRegExp]: 'Unterminated regular expression'
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
