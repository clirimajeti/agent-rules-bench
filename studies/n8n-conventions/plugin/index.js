// Local ESLint plugin for this study: one rule per convention in conventions.mjs, named after it, so a finding
// names exactly one convention. The message of every rule is the convention's prose.
import { conventions } from './conventions.mjs';

const named = (node, name) => node?.type === 'Identifier' && node.name === name;
const decoratorName = (d) => (d.expression.type === 'CallExpression' ? d.expression.callee : d.expression)?.name;
const REPOSITORY_BASES = new Set(['BaseRepository', 'Repository']);

// typeof v === 'object', v !== null and !Array.isArray(v), on the same name, in one && chain (any order)
function isHandRolledRecordCheck(node) {
  if (node.parent?.type === 'LogicalExpression' && node.parent.operator === '&&') return false; // report the whole chain once
  const parts = [];
  const flatten = (n) => (n.type === 'LogicalExpression' && n.operator === '&&' ? (flatten(n.left), flatten(n.right)) : parts.push(n));
  flatten(node);
  const subject = (n) => n?.type === 'Identifier' ? n.name : null;
  const kinds = new Map();
  for (const p of parts) {
    if (p.type === 'BinaryExpression' && ['===', '=='].includes(p.operator) && p.left.type === 'UnaryExpression' && p.left.operator === 'typeof' && p.right.value === 'object') kinds.set('typeof', subject(p.left.argument));
    if (p.type === 'BinaryExpression' && ['!==', '!='].includes(p.operator) && p.right.type === 'Literal' && p.right.value === null) kinds.set('null', subject(p.left));
    if (p.type === 'UnaryExpression' && p.operator === '!' && p.argument.type === 'CallExpression' && p.argument.callee.type === 'MemberExpression' && named(p.argument.callee.object, 'Array') && named(p.argument.callee.property, 'isArray')) kinds.set('array', subject(p.argument.arguments[0]));
  }
  const names = new Set(kinds.values());
  return kinds.size === 3 && names.size === 1 && !names.has(null);
}

const checks = {
  // an exported or @Service()-decorated class that extends BaseRepository or Repository; a file-private,
  // undecorated subclass is the allowed table
  'repositories-compose': (report) => ({
    'ClassDeclaration, ClassExpression': (node) => {
      if (!node.superClass || !REPOSITORY_BASES.has(node.superClass.name)) return;
      const exported = /^Export(Named|Default)Declaration$/.test(node.parent?.type);
      const service = (node.decorators ?? []).some((d) => decoratorName(d) === 'Service');
      if (exported || service) report(node);
    },
  }),

  // `.manager` or a createQueryBuilder(...) call in business logic (the config leaves out the persistence layer)
  'no-manager-in-business-logic': (report) => ({
    'MemberExpression[property.name="manager"]': report,
    'CallExpression[callee.property.name="createQueryBuilder"], CallExpression[callee.name="createQueryBuilder"]': report,
  }),

  // any `x as T` except `as const` (the config leaves out test code, where n8n allows `as`)
  'no-as-cast': (report) => ({
    TSAsExpression: (node) => {
      const t = node.typeAnnotation;
      if (t.type === 'TSTypeReference' && named(t.typeName, 'const')) return;
      report(node);
    },
  }),

  // a local isRecord, or the hand-rolled check it wraps (the config leaves out @n8n/utils, where it belongs)
  'shared-helpers': (report) => ({
    'FunctionDeclaration[id.name="isRecord"], VariableDeclarator[id.name="isRecord"]': report,
    'LogicalExpression[operator="&&"]': (node) => { if (isHandRolledRecordCheck(node)) report(node); },
  }),

  // Task 4
  'central-debounce-times': () => ({}),
  'editor-ui-alias-imports': () => ({}),
  'node-errors': () => ({}),
  'no-any-in-nodes': () => ({}),
};

export default {
  rules: Object.fromEntries(conventions.map((c) => [c.id, {
    meta: { type: 'problem', messages: { rule: c.prose } },
    create: (context) => checks[c.id]((node) => context.report({ node, messageId: 'rule' }), context),
  }])),
};
