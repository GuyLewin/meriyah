import { Errors } from '../errors';

export const enum Escape {
  Empty = -1,
  InvalidCodePoint = -2,
  InvalidHex = -3,
  UnicodeOverflow = -4,
  InvalidSequence = -5,
  InvalidUnicode = -6
}

export const enum UnicodeEscape {
  Empty = -1,
  StrictOctal = -2,
  EightOrNine = -3,
  InvalidHex = -4,
  OutOfRange = -5
}

export function handleIdentifierError(code: Escape): Errors {
  switch (code) {
    case Escape.InvalidCodePoint:
      return Errors.InvalidCodePoint;

    case Escape.InvalidHex:
      return Errors.InvalidHexEscapeSequence;

    case Escape.UnicodeOverflow:
      return Errors.UnicodeOverflow;

    case Escape.InvalidUnicode:
    case Escape.InvalidSequence:
      return Errors.InvalidUnicodeEscapeSequence;

    default:
      return Errors.Unexpected;
  }
}

export function handleEscapeError(code: UnicodeEscape, isTemplate: 0 | 1): Errors {
  if (code === UnicodeEscape.StrictOctal) {
    return isTemplate ? Errors.TemplateOctalLiteral : Errors.StrictOctalEscape;
  }
  if (code === UnicodeEscape.EightOrNine) {
    return Errors.InvalidEightAndNine;
  }
  if (code === UnicodeEscape.InvalidHex) {
    return Errors.InvalidHexEscapeSequence;
  }
  if (code === UnicodeEscape.OutOfRange) {
    return Errors.UnicodeOverflow;
  }

  return Errors.Unexpected;
}
