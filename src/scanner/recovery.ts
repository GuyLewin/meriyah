import { Errors } from '../errors';

// Intentionally negative
export const enum Escape {
  Empty = -1,
  InvalidCodePoint = -2,
  InvalidHex = -3,
  UnicodeOverflow = -4,
  InvalidSequence = -5,
  InvalidUnicode = -6
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
