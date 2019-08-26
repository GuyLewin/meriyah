import * as ESTree from './estree';
import { CommentCallback, ErrorCallback, Context } from './common';
import { create, parseStatementList } from './parser';

/**
 * The parser options.
 */
export interface Options {
  onComment?: CommentCallback;
  onError?: ErrorCallback;
  next?: boolean;
  ranges?: boolean;
  jsx?: boolean;
  raw?: boolean;
}

export function parseSource(source: string, options: Options | void, context: Context): ESTree.Program {
  let onComment: CommentCallback;
  let onError: ErrorCallback;

  if (options != null) {
    if (options.next) context |= Context.OptionsNext;
    if (options.jsx) context |= Context.OptionsJSX;
    if (options.ranges) context |= Context.OptionsRanges;
    if (options.raw) context |= Context.OptionsRaw;
    if (options.onError != null) onError = options.onError;
    if (options.onComment != null) onComment = options.onComment;
  }

  const parser = create(source, onError, onComment);
  //  skipMeta(parser);

  const node: ESTree.Program = {
    type: 'Program',
    sourceType: context & Context.Module ? 'module' : 'script',
    body: parseStatementList(parser, context)
  };

  if (context & Context.OptionsRanges) {
    node.start = 0;
    node.end = source.length;
  }

  return node;
}

/**
 * Parse a script, optionally with various options.
 */
export function parseScript(source: string, options?: Options) {
  return parseSource(source, options, Context.Empty);
}

/**
 * Parse a module, optionally with various options.
 */
export function parseModule(source: string, options?: Options) {
  return parseSource(source, options, Context.Strict | Context.Module);
}
