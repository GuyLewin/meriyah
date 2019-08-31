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
  Keywords = 1 << 13,
  FutureReserved = 1 << 14,
  BadTemplate = 1 << 15,
  Identifier = (1 << 16) | Contextual,
  IdentifierOrKeyword = (1 << 17) | Identifier | Keywords,
  IsExpressionStart = 1 << 18,
  IsInOrOf = 1 << 19, // 'in' or 'of'
  IsLogical = 1 << 20,
  IsAutoSemicolon = 1 << 21,
  IsPatternStart = 1 << 22, // Start of pattern, '[' or '{'
  IsAssignOp = 1 << 23,
  IsBinaryOp = (1 << 24) | IsExpressionStart,
  IsUnaryOp = (1 << 25) | IsExpressionStart,
  IsUpdateOp = (1 << 26) | IsExpressionStart,
  IsMemberOrCallExpression = 1 << 27,
  IsStringOrNumber = 1 << 28,
  IsCoalesc = 1 << 29,

  /* Node types */
  EndOfSource = 0, // Pseudo

  /* Constants/Bindings */
  IsIdentifier = 1,
  NumericLiteral = 2 | IsExpressionStart | IsStringOrNumber,
  StringLiteral = 3 | IsExpressionStart | IsStringOrNumber,
  RegularExpression = 4 | IsExpressionStart,
  FalseKeyword = 5 | Keywords | IsExpressionStart,
  TrueKeyword = 6 | Keywords | IsExpressionStart,
  NullKeyword = 7 | Keywords | IsExpressionStart,

  /* Template nodes */
  TemplateCont = 8 | IsExpressionStart | IsMemberOrCallExpression,
  TemplateTail = 9 | IsExpressionStart | IsMemberOrCallExpression,

  /* Punctuators */
  Arrow = 10, // =>
  LeftParen = 11 | IsExpressionStart | IsMemberOrCallExpression, // (
  LeftBrace = 12 | IsExpressionStart | IsPatternStart, // {
  Period = 13 | IsMemberOrCallExpression, // .
  Ellipsis = 14, // ...
  RightBrace = 15 | IsAutoSemicolon, // }
  RightParen = 16, // )
  Semicolon = 17 | IsAutoSemicolon, // ;
  Comma = 18, // ,
  LeftBracket = 19 | IsExpressionStart | IsPatternStart | IsMemberOrCallExpression, // [
  RightBracket = 20, // ]
  Colon = 21, // :
  QuestionMark = 22, // ?
  QuestionMarkPeriod = 23 | IsMemberOrCallExpression, // ?.
  SingleQuote = 24, // '
  DoubleQuote = 25, // "
  JSXClose = 26, // </
  JSXAutoClose = 27, // />

  /* Update operators */
  Increment = 28 | IsUpdateOp, // ++
  Decrement = 29 | IsUpdateOp, // --

  /* Assign operators */
  Assign = 30 | IsAssignOp, // =
  ShiftLeftAssign = 31 | IsAssignOp, // <<=
  ShiftRightAssign = 32 | IsAssignOp, // >>=
  LogicalShiftRightAssign = 33 | IsAssignOp, // >>>=
  ExponentiateAssign = 34 | IsAssignOp, // **=
  AddAssign = 35 | IsAssignOp, // +=
  SubtractAssign = 36 | IsAssignOp, // -=
  MultiplyAssign = 37 | IsAssignOp, // *=
  DivideAssign = 38 | IsAssignOp, // /=
  ModuloAssign = 39 | IsAssignOp, // %=
  BitwiseXorAssign = 40 | IsAssignOp, // ^=
  BitwiseOrAssign = 41 | IsAssignOp, // |=
  BitwiseAndAssign = 42 | IsAssignOp, // &=

  /* Unary/binary operators */
  TypeofKeyword = 43 | IsUnaryOp | Keywords,
  DeleteKeyword = 44 | IsUnaryOp | Keywords,
  VoidKeyword = 45 | IsUnaryOp | Keywords,
  Negate = 46 | IsUnaryOp, // !
  Complement = 47 | IsUnaryOp, // ~
  Add = 48 | IsUnaryOp | IsBinaryOp | (10 << PrecStart), // +
  Subtract = 49 | IsUnaryOp | IsBinaryOp | (10 << PrecStart), // -
  InKeyword = 50 | IsBinaryOp | IsInOrOf | (8 << PrecStart) | Keywords,
  InstanceofKeyword = 51 | IsBinaryOp | (8 << PrecStart) | Keywords,
  Multiply = 52 | IsBinaryOp | (11 << PrecStart), // *
  Modulo = 53 | IsBinaryOp | (11 << PrecStart), // %
  Divide = 54 | IsBinaryOp | (11 << PrecStart), // /
  Exponentiate = 55 | IsBinaryOp | (12 << PrecStart), // **
  LogicalAnd = 56 | IsBinaryOp | IsLogical | (3 << PrecStart), // &&
  LogicalOr = 57 | IsBinaryOp | IsLogical | (2 << PrecStart), // ||
  StrictEqual = 58 | IsBinaryOp | (7 << PrecStart), // ===
  StrictNotEqual = 59 | IsBinaryOp | (7 << PrecStart), // !==
  LooseEqual = 60 | IsBinaryOp | (7 << PrecStart), // ==
  LooseNotEqual = 61 | IsBinaryOp | (7 << PrecStart), // !=
  LessThanOrEqual = 62 | IsBinaryOp | (8 << PrecStart), // <=
  GreaterThanOrEqual = 63 | IsBinaryOp | (8 << PrecStart), // >=
  LessThan = 64 | IsBinaryOp | (8 << PrecStart), // <
  GreaterThan = 65 | IsBinaryOp | (8 << PrecStart), // >
  ShiftLeft = 66 | IsBinaryOp | (9 << PrecStart), // <<
  ShiftRight = 67 | IsBinaryOp | (9 << PrecStart), // >>
  LogicalShiftRight = 68 | IsBinaryOp | (9 << PrecStart), // >>>
  BitwiseAnd = 69 | IsBinaryOp | (6 << PrecStart), // &
  BitwiseOr = 70 | IsBinaryOp | (4 << PrecStart), // |
  BitwiseXor = 71 | IsBinaryOp | (5 << PrecStart), // ^
  Coalesce = 72 | IsBinaryOp | IsCoalesc | (1 << PrecStart), // ?.

  /* Variable declaration kinds */
  VarKeyword = 73 | Keywords,
  LetKeyword = 74 | FutureReserved,
  ConstKeyword = 75 | Keywords,

  /* Other Keywords words */
  BreakKeyword = 76 | Keywords,
  CaseKeyword = 77 | Keywords,
  CatchKeyword = 78 | Keywords,
  ClassKeyword = 79 | Keywords | IsExpressionStart,
  ContinueKeyword = 80 | Keywords,
  DebuggerKeyword = 81 | Keywords,
  DefaultKeyword = 82 | Keywords,
  DoKeyword = 83 | Keywords,
  ElseKeyword = 84 | Keywords,
  ExportKeyword = 85 | Keywords,
  ExtendsKeyword = 86 | Keywords,
  FinallyKeyword = 87 | Keywords,
  ForKeyword = 88 | Keywords,
  FunctionKeyword = 89 | Keywords | IsExpressionStart,
  IfKeyword = 90 | Keywords,
  ImportKeyword = 91 | Keywords | IsExpressionStart,
  NewKeyword = 92 | Keywords | IsExpressionStart,
  ReturnKeyword = 93 | Keywords,
  SuperKeyword = 94 | Keywords | IsExpressionStart,
  SwitchKeyword = 95 | Keywords | IsExpressionStart,
  ThisKeyword = 96 | Keywords | IsExpressionStart,
  ThrowKeyword = 97 | Keywords,
  TryKeyword = 98 | Keywords,
  WhileKeyword = 99 | Keywords,
  WithKeyword = 100 | Keywords,

  /* Strict mode Keywords words */
  ImplementsKeyword = 101 | FutureReserved,
  InterfaceKeyword = 102 | FutureReserved,
  PackageKeyword = 103 | FutureReserved,
  PrivateKeyword = 104 | FutureReserved,
  ProtectedKeyword = 105 | FutureReserved,
  PublicKeyword = 106 | FutureReserved,
  StaticKeyword = 107 | FutureReserved,
  YieldKeyword = 108 | FutureReserved | IsExpressionStart,

  /* Contextual keywords */
  AsKeyword = 109 | Contextual,
  AsyncKeyword = 110 | Contextual,
  AwaitKeyword = 111 | Contextual | IsExpressionStart,
  ConstructorKeyword = 112 | Contextual,
  GetKeyword = 113 | Contextual,
  SetKeyword = 114 | Contextual,
  FromKeyword = 115 | Contextual,
  OfKeyword = 116 | Contextual | IsInOrOf,

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
  NoSubstitutionTemplateLiteral = 128,

  /* TypeScript */

  DeclareKeyword = 129 | Identifier,
  TypeKeyword = 130 | Identifier,
  AbstractKeyword = 131 | Identifier,
  NamespaceKeyword = 132 | Identifier,
  ModuleKeyword = 133 | Identifier,
  GlobalKeyword = 134 | Identifier,
  KeyOfKeyword = 135 | Identifier,
  UniqueKeyword = 136 | Identifier,
  IsKeyword = 137 | Identifier,
  ReadOnlyKeyword = 138 | Identifier,
  InferKeyword = 139 | Identifier,

  /* Escapes */

  EscapedStrictReserved = 140,
  EscapedKeyword = 141,
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
  '?.',
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

  /* Other Keywords words */
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
  'UnicodeEscapeIdStart',

  'TemplateHead',
  'TemplateMiddle',
  'NoSubstitutionTemplateLiteral',
  'NoSubstitutionTemplateLiteral',

  /* TypeScript */

  'declare',
  'type',
  'abstract',
  'namespace',
  'module',
  'global',
  'keyof',
  'unique',
  'is',
  'readonly',
  'infer',

  /* Escapes */

  'EscapedStrictReserved',
  'EscapedKeyword'
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
  as: { value: Token.AsKeyword },
  declare: { value: Token.DeclareKeyword },
  type: { value: Token.TypeKeyword },
  abstract: { value: Token.AbstractKeyword },
  namespace: { value: Token.NamespaceKeyword },
  module: { value: Token.ModuleKeyword },
  global: { value: Token.GlobalKeyword },
  keyof: { value: Token.KeyOfKeyword },
  unique: { value: Token.UniqueKeyword },
  is: { value: Token.IsKeyword },
  readonly: { value: Token.ReadOnlyKeyword },
  infer: { value: Token.InferKeyword }
});
