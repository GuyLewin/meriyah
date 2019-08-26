/*
 * The tokens are laid out and packed in an unconventional way. Here's how it's
 * all laid out:
 *
 * Token enum:
 *
 * - `Type` mask, for stripping all the other constants.
 * - Attributes (e.g. literal, statement start, etc.) for simplifying boolean
 *   tests against ranges of nodes.
 * - Precedence start/mask (for binary operators)
 * - Node types, starting at 0
 *
 * Conversions: They leverage the token representation to convert the values
 * based on a static array table. They must be updated to reflect the existing
 * nodes.
 *
 * Note that there is limited space for token metadata, to maintain the 31-bit
 * size invariant in V8.
 */

/**
 * The token types and attributes.
 */
export const enum Token {
  Type = 0xff,

  /* Precedence for binary operators (always positive) */
  PrecStart = 8,
  Precedence = 15 << PrecStart, // 8-11

  /* Attribute names */
  Contextual = 1 << 12,
  Reserved = 1 << 13,
  FutureReserved = 1 << 14,

  BadTemplate = 1 << 15,

  /* Node types */
  EndOfSource = 0, // Pseudo

  /* Constants/Bindings */
  Identifier = 1,
  NumericLiteral = 2,
  StringLiteral = 3,
  RegularExpression = 4,
  FalseKeyword = 5 | Reserved,
  TrueKeyword = 6 | Reserved,
  NullKeyword = 7 | Reserved,

  /* Template nodes */
  TemplateCont = 8,
  TemplateTail = 9,

  /* Punctuators */
  Arrow = 10, // =>
  LeftParen = 11, // (
  LeftBrace = 12, // {
  Period = 13, // .
  Ellipsis = 14, // ...
  RightBrace = 15, // }
  RightParen = 16, // )
  Semicolon = 17, // ;
  Comma = 18, // ,
  LeftBracket = 19, // [
  RightBracket = 20, // ]
  Colon = 21, // :
  QuestionMark = 22, // ?
  QuestionMarkPeriod = 23, // ?.
  SingleQuote = 24, // '
  DoubleQuote = 25, // "
  JSXClose = 26, // </
  JSXAutoClose = 27, // />

  /* Update operators */
  Increment = 28, // ++
  Decrement = 29, // --

  /* Assign operators */
  Assign = 30, // =
  ShiftLeftAssign = 31, // <<=
  ShiftRightAssign = 32, // >>=
  LogicalShiftRightAssign = 33, // >>>=
  ExponentiateAssign = 34, // **=
  AddAssign = 35, // +=
  SubtractAssign = 36, // -=
  MultiplyAssign = 37, // *=
  DivideAssign = 38, // /=
  ModuloAssign = 39, // %=
  BitwiseXorAssign = 40, // ^=
  BitwiseOrAssign = 41, // |=
  BitwiseAndAssign = 42, // &=

  /* Unary/binary operators */
  TypeofKeyword = 43 | Reserved,
  DeleteKeyword = 44 | Reserved,
  VoidKeyword = 45 | Reserved,
  Negate = 46, // !
  Complement = 47, // ~
  Add = 48 | (10 << PrecStart), // +
  Subtract = 49 | (10 << PrecStart), // -
  InKeyword = 50 | (8 << PrecStart) | Reserved,
  InstanceofKeyword = 51 | (8 << PrecStart) | Reserved,
  Multiply = 52 | (11 << PrecStart), // *
  Modulo = 53 | (11 << PrecStart), // %
  Divide = 54 | (11 << PrecStart), // /
  Exponentiate = 55 | (12 << PrecStart), // **
  LogicalAnd = 56 | (3 << PrecStart), // &&
  LogicalOr = 57 | (2 << PrecStart), // ||
  StrictEqual = 58 | (7 << PrecStart), // ===
  StrictNotEqual = 59 | (7 << PrecStart), // !==
  LooseEqual = 60 | (7 << PrecStart), // ==
  LooseNotEqual = 61 | (7 << PrecStart), // !=
  LessThanOrEqual = 62 | (8 << PrecStart), // <=
  GreaterThanOrEqual = 63 | (8 << PrecStart), // >=
  LessThan = 64 | (8 << PrecStart), // <
  GreaterThan = 65 | (8 << PrecStart), // >
  ShiftLeft = 66 | (9 << PrecStart), // <<
  ShiftRight = 67 | (9 << PrecStart), // >>
  LogicalShiftRight = 68 | (9 << PrecStart), // >>>
  BitwiseAnd = 69 | (6 << PrecStart), // &
  BitwiseOr = 70 | (4 << PrecStart), // |
  BitwiseXor = 71 | (5 << PrecStart), // ^
  Coalesce = 72 | (1 << PrecStart), // ?.

  /* Variable declaration kinds */
  VarKeyword = 73 | Reserved,
  LetKeyword = 74 | FutureReserved,
  ConstKeyword = 75 | Reserved,

  /* Other reserved words */
  BreakKeyword = 76 | Reserved,
  CaseKeyword = 77 | Reserved,
  CatchKeyword = 78 | Reserved,
  ClassKeyword = 79 | Reserved,
  ContinueKeyword = 80 | Reserved,
  DebuggerKeyword = 81 | Reserved,
  DefaultKeyword = 82 | Reserved,
  DoKeyword = 83 | Reserved,
  ElseKeyword = 84 | Reserved,
  ExportKeyword = 85 | Reserved,
  ExtendsKeyword = 86 | Reserved,
  FinallyKeyword = 87 | Reserved,
  ForKeyword = 88 | Reserved,
  FunctionKeyword = 89 | Reserved,
  IfKeyword = 90 | Reserved,
  ImportKeyword = 91 | Reserved,
  NewKeyword = 92 | Reserved,
  ReturnKeyword = 93 | Reserved,
  SuperKeyword = 94 | Reserved,
  SwitchKeyword = 95 | Reserved,
  ThisKeyword = 96 | Reserved,
  ThrowKeyword = 97 | Reserved,
  TryKeyword = 98 | Reserved,
  WhileKeyword = 99 | Reserved,
  WithKeyword = 100 | Reserved,

  /* Strict mode reserved words */
  ImplementsKeyword = 101 | FutureReserved,
  InterfaceKeyword = 102 | FutureReserved,
  PackageKeyword = 103 | FutureReserved,
  PrivateKeyword = 104 | FutureReserved,
  ProtectedKeyword = 105 | FutureReserved,
  PublicKeyword = 106 | FutureReserved,
  StaticKeyword = 107 | FutureReserved,
  YieldKeyword = 108 | FutureReserved,

  /* Contextual keywords */
  AsKeyword = 109 | Contextual,
  AsyncKeyword = 110 | Contextual,
  AwaitKeyword = 111 | Contextual,
  ConstructorKeyword = 112 | Contextual,
  GetKeyword = 113 | Contextual,
  SetKeyword = 114 | Contextual,
  FromKeyword = 115 | Contextual,
  OfKeyword = 116 | Contextual,

  /* Others */
  WhiteSpace = 117,
  CarriageReturn = 118,
  LineFeed = 119,
  LeadingZero = 120,
  Error = 121,
  PrivateField = 122,
  BigIntLiteral = 123,
  EnumKeyword = 124,
  UnicodeEscapeIdStart = 125,

  /* Template */

  TemplateHead = 126,
  TemplateMiddle = 127,
  NoSubstitutionTemplateLiteral = 128
}

// Note: this *must* be kept in sync with the enum's order.
//
// It exploits the enum value ordering, and it's necessarily a complete and
// utter hack.
//
// All to lower it to a single monomorphic array access.
export const KeywordDescTable = [
  'end of source',

  /* Constants/Bindings */
  'identifier',
  'number',
  'string',
  'regular expression',
  'false',
  'true',
  'null',

  /* Template nodes */
  'template continuation',
  'template end',

  /* Punctuators */
  '=>',
  '(',
  '{',
  '.',
  '...',
  '}',
  ')',
  ';',
  ',',
  '[',
  ']',
  ':',
  '?',
  "'",
  '"',
  '</',
  '/>',

  /* Update operators */
  '++',
  '--',

  /* Assign operators */
  '=',
  '<<=',
  '>>=',
  '>>>=',
  '**=',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '^=',
  '|=',
  '&=',

  /* Unary/binary operators */
  'typeof',
  'delete',
  'void',
  '!',
  '~',
  '+',
  '-',
  'in',
  'instanceof',
  '*',
  '%',
  '/',
  '**',
  '&&',
  '||',
  '===',
  '!==',
  '==',
  '!=',
  '<=',
  '>=',
  '<',
  '>',
  '<<',
  '>>',
  '>>>',
  '&',
  '|',
  '^',

  /* Variable declaration kinds */
  'var',
  'let',
  'const',

  /* Other reserved words */
  'break',
  'case',
  'catch',
  'class',
  'continue',
  'debugger',
  'default',
  'do',
  'else',
  'export',
  'extends',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'new',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'try',
  'while',
  'with',

  /* Strict mode reserved words */
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
  'static',
  'yield',

  /* Contextual keywords */
  'as',
  'async',
  'await',
  'constructor',
  'get',
  'set',
  'from',
  'of',

  /* Others */

  'Whitespace',
  'CarriageReturn',
  'LineFeed',
  'LeadingZero',
  'Error',
  '#',
  'bigInt',
  'enum',
  'UnicodeEscapeIdStart'
];

// Normal object is much faster than Object.create(null), even with typeof check to avoid Object.prototype interference
export const descKeywordTable: { [key: string]: Token } = Object.create(null, {
  this: { value: Token.ThisKeyword },
  function: { value: Token.FunctionKeyword },
  if: { value: Token.IfKeyword },
  return: { value: Token.ReturnKeyword },
  var: { value: Token.VarKeyword },
  else: { value: Token.ElseKeyword },
  for: { value: Token.ForKeyword },
  new: { value: Token.NewKeyword },
  in: { value: Token.InKeyword },
  typeof: { value: Token.TypeofKeyword },
  while: { value: Token.WhileKeyword },
  case: { value: Token.CaseKeyword },
  break: { value: Token.BreakKeyword },
  try: { value: Token.TryKeyword },
  catch: { value: Token.CatchKeyword },
  delete: { value: Token.DeleteKeyword },
  throw: { value: Token.ThrowKeyword },
  switch: { value: Token.SwitchKeyword },
  continue: { value: Token.ContinueKeyword },
  default: { value: Token.DefaultKeyword },
  instanceof: { value: Token.InstanceofKeyword },
  do: { value: Token.DoKeyword },
  void: { value: Token.VoidKeyword },
  finally: { value: Token.FinallyKeyword },
  async: { value: Token.AsyncKeyword },
  await: { value: Token.AwaitKeyword },
  class: { value: Token.ClassKeyword },
  const: { value: Token.ConstKeyword },
  constructor: { value: Token.ConstructorKeyword },
  debugger: { value: Token.DebuggerKeyword },
  export: { value: Token.ExportKeyword },
  extends: { value: Token.ExtendsKeyword },
  false: { value: Token.FalseKeyword },
  from: { value: Token.FromKeyword },
  get: { value: Token.GetKeyword },
  implements: { value: Token.ImplementsKeyword },
  import: { value: Token.ImportKeyword },
  interface: { value: Token.InterfaceKeyword },
  let: { value: Token.LetKeyword },
  null: { value: Token.NullKeyword },
  of: { value: Token.OfKeyword },
  package: { value: Token.PackageKeyword },
  private: { value: Token.PrivateKeyword },
  protected: { value: Token.ProtectedKeyword },
  public: { value: Token.PublicKeyword },
  set: { value: Token.SetKeyword },
  static: { value: Token.StaticKeyword },
  super: { value: Token.SuperKeyword },
  true: { value: Token.TrueKeyword },
  with: { value: Token.WithKeyword },
  yield: { value: Token.YieldKeyword },
  enum: { value: Token.EnumKeyword },
  as: { value: Token.AsKeyword }
});
