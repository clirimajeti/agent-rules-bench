// Local ESLint plugin for this study: one rule per convention in conventions.mjs, named after it, so a finding
// names exactly one convention. The message of every rule is the convention's prose line.
import path from 'node:path';
import { conventions } from './conventions.mjs';

// The file's path below its `src/` folder, with forward slashes, or null outside src.
const srcPath = (filename) => {
  const p = filename.split(path.sep).join('/');
  const i = p.lastIndexOf('/src/');
  return i < 0 ? null : p.slice(i + 5);
};

// Where an import points, as a path below src (`@/x` and relative specifiers), or null for a package.
const resolveImport = (spec, file) => {
  if (spec.startsWith('@/')) return spec.slice(2);
  if (!spec.startsWith('.') || file === null) return null;
  return path.posix.normalize(path.posix.join(path.posix.dirname(file), spec));
};

const unwrap = (n) => (n?.type === 'ChainExpression' ? n.expression : n);
const isMember = (n, prop) => { const m = unwrap(n); return m?.type === 'MemberExpression' && !m.computed && m.property.name === prop; };

const QUERY_OPTION_FACTORIES = new Set(['queryOptions', 'infiniteQueryOptions']);
const containsArray = (node) =>
  node?.type === 'ArrayExpression' ||
  (node?.type === 'ConditionalExpression' && (containsArray(node.consequent) || containsArray(node.alternate))) ||
  (node?.type === 'LogicalExpression' && (containsArray(node.left) || containsArray(node.right)));

// The function a node sits in, as `const <name> = (...) =>` (or a function expression), with its name.
const enclosingConst = (ancestors) => {
  for (let i = ancestors.length - 1; i > 0; i--) {
    const fn = ancestors[i], decl = ancestors[i - 1];
    if (/Function/.test(fn.type) && decl.type === 'VariableDeclarator' && decl.init === fn && decl.id.type === 'Identifier') return { fn, decl };
  }
  return null;
};
const firstParamKeys = (fn) => {
  let p = fn.params[0];
  if (p?.type === 'AssignmentPattern') p = p.left;
  return p?.type === 'ObjectPattern' ? p.properties.map((x) => x.key?.name).filter(Boolean) : [];
};

// Each check kind returns ESLint visitors; `report(node)` reports the convention.
const kinds = {
  // allowParentProperty: `x.env.DEV` is fine when the flagged node is the object of a member named DEV
  syntax: ({ selectors, allowParentProperty = [] }, report) => Object.fromEntries(selectors.map((s) => [s, (node) => {
    const p = node.parent;
    if (p?.type === 'MemberExpression' && p.object === node && allowParentProperty.includes(p.property.name)) return;
    report(node);
  }])),

  import: ({ module, resolved, importNames }, report, context) => {
    const file = srcPath(context.filename);
    const mod = module && new RegExp(module), res = resolved && new RegExp(resolved);
    const hit = (spec) => (mod && mod.test(spec)) || (res && (resolveImport(spec, file) ?? '').match(res));
    const check = (node, specifiers) => {
      const spec = node.source?.value ?? node.arguments?.[0]?.value;
      if (typeof spec !== 'string' || !hit(spec)) return;
      if (!importNames) return report(node);
      // with importNames only those named imports count; a dynamic import or require cannot be told apart
      const named = (specifiers ?? []).filter((s) => (s.imported ?? s.local)?.name && importNames.includes((s.imported ?? s.local).name) && s.importKind !== 'type');
      if (named.length && node.importKind !== 'type') report(node);
    };
    return {
      ImportDeclaration: (n) => check(n, n.specifiers),
      ExportNamedDeclaration: (n) => n.source && check(n, n.specifiers),
      ExportAllDeclaration: (n) => !importNames && check(n),
      ImportExpression: (n) => !importNames && check(n),
      "CallExpression[callee.name='require']": (n) => !importNames && check(n),
    };
  },

  'cross-feature': (_, report, context) => {
    const file = srcPath(context.filename);
    const own = file?.match(/^features\/([^/]+)\//)?.[1];
    const check = (node) => {
      const spec = node.source?.value ?? node.arguments?.[0]?.value;
      const other = typeof spec === 'string' && resolveImport(spec, file)?.match(/^features\/([^/]+)\//)?.[1];
      if (own && other && other !== own) report(node);
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: (n) => n.source && check(n), ExportAllDeclaration: check, ImportExpression: check, "CallExpression[callee.name='require']": check };
  },

  'query-key': (_, report, context) => ({
    Property(node) {
      const name = node.key.type === 'Identifier' ? node.key.name : node.key.value;
      if (name !== 'queryKey' || !containsArray(node.value)) return;
      const inside = context.sourceCode.getAncestors(node).some((n) => n.type === 'CallExpression' && n.callee.type === 'Identifier' && QUERY_OPTION_FACTORIES.has(n.callee.name));
      if (!inside) report(node.value);
    },
  }),

  'query-options-named': (_, report, context) => ({
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || !QUERY_OPTION_FACTORIES.has(node.callee.name)) return;
      const ancestors = context.sourceCode.getAncestors(node);
      const c = enclosingConst(ancestors);
      const exported = c && ancestors.some((a) => a.type === 'ExportNamedDeclaration');
      if (!c || !exported || !/^get[A-Za-z]*QueryOptions$/.test(c.decl.id.name)) report(node);
    },
  }),

  'hook-option': ({ call, param }, report, context) => ({
    [`CallExpression[callee.name='${call}']`](node) {
      const c = enclosingConst(context.sourceCode.getAncestors(node));
      if (c && /^use[A-Z]/.test(c.decl.id.name) && !firstParamKeys(c.fn).includes(param)) report(c.decl.id);
    },
  }),

  'fetcher-return-type': (_, report, context) => ({
    "CallExpression[callee.object.name='api']"(node) {
      const ancestors = context.sourceCode.getAncestors(node);
      const c = enclosingConst(ancestors);
      if (!c || /^use[A-Z]|^get[A-Za-z]*QueryOptions$/.test(c.decl.id.name)) return;
      if (ancestors.some((a) => a.type === 'ExportNamedDeclaration') && !c.fn.returnType) report(c.decl.id);
    },
  }),

  'spread-options': (_, report) => ({
    CallExpression(node) {
      if (node.callee.type !== 'Identifier' || !/^use(Infinite|Suspense)?Query$/.test(node.callee.name)) return;
      const arg = node.arguments[0];
      const spreads = arg?.type === 'ObjectExpression' && arg.properties.some((p) => p.type === 'SpreadElement' && p.argument.type === 'CallExpression' && /^get[A-Za-z]*QueryOptions$/.test(p.argument.callee.name ?? ''));
      if (!spreads) report(node);
    },
  }),

  // A handler is a function passed to http.<method>(...). Each option is one requirement on its body.
  'mock-handler': ({ first, tryBlock, calls, persist }, report) => {
    const isCall = (n, name) => n?.type === 'CallExpression' && n.callee.type === 'Identifier' && n.callee.name === name;
    const callsIn = (root, test) => {
      const stack = [root];
      while (stack.length) {
        const n = stack.pop();
        if (test(n)) return true;
        for (const [k, v] of Object.entries(n)) if (k !== 'parent' && v && typeof v === 'object') for (const c of Array.isArray(v) ? v : [v]) if (c && typeof c.type === 'string') stack.push(c);
      }
      return false;
    };
    return {
      "CallExpression[callee.object.name='http']"(node) {
        const fn = node.arguments.find((a) => /Function/.test(a.type));
        if (!fn || fn.body.type !== 'BlockStatement') return;
        const body = fn.body.body;
        const writes = (n) => n.type === 'CallExpression' && n.callee.type === 'MemberExpression' && /^(create|update|updateMany|delete|deleteMany)$/.test(n.callee.property.name ?? '') && n.callee.object.type === 'MemberExpression' && n.callee.object.object.name === 'db';
        if (first && !(body[0]?.type === 'ExpressionStatement' && body[0].expression.type === 'AwaitExpression' && isCall(body[0].expression.argument, first))) report(node);
        if (tryBlock && !body.some((s) => s.type === 'TryStatement')) report(node);
        if (calls && !callsIn(fn.body, (n) => isCall(n, calls))) report(node);
        if (persist && callsIn(fn.body, writes) && !callsIn(fn.body, (n) => isCall(n, 'persistDb'))) report(node);
      },
    };
  },

  'member-comparison': ({ property, both }, report) => ({
    BinaryExpression(node) {
      if (!['===', '!==', '==', '!='].includes(node.operator)) return;
      const l = isMember(node.left, property), r = isMember(node.right, property);
      if (both ? l && r : l || r) report(node);
    },
  }),

  filename: ({ require: req, folders, forbid, testsFolder, selectors = [] }, report, context) => {
    const file = srcPath(context.filename);
    const parts = file ? file.split('/') : [];
    const base = parts.at(-1) ?? '', dirs = parts.slice(0, -1);
    const bad = file !== null && (
      (req && !new RegExp(req).test(base)) ||
      (folders && dirs.some((d) => !new RegExp(folders).test(d))) ||
      (forbid && new RegExp(forbid).test(file)) ||
      (testsFolder && /\.test\.tsx?$/.test(base) && dirs.at(-1) !== testsFolder));
    return { Program: (node) => bad && report(node, { line: 1, column: 0 }), ...kinds.syntax({ selectors }, report) };
  },
};

const makeRule = (c) => ({
  meta: { type: 'problem', messages: { broken: c.prose }, schema: [] },
  create(context) {
    const report = (node, loc) => context.report(loc ? { node, loc, messageId: 'broken' } : { node, messageId: 'broken' });
    return kinds[c.check.kind](c.check, report, context);
  },
});

export default { rules: Object.fromEntries(conventions.map((c) => [c.id, makeRule(c)])) };
