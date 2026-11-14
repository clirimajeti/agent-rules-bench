// Local ESLint plugin for this study: one rule per convention in conventions.mjs, named after it, so a finding
// names exactly one convention. The message of every rule is the convention's prose line.
import { conventions } from './conventions.mjs';

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const isFn = (n) => /^(FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/.test(n?.type);

// The name of a function as a component would carry it: `function Name`, or `const Name = (...) =>`.
const fnName = (fn) => fn.id?.name ?? (fn.parent?.type === 'VariableDeclarator' && fn.parent.id.type === 'Identifier' ? fn.parent.id.name : null);
const isReadonly = (t) => t?.type === 'TSTypeReference' && t.typeName?.type === 'Identifier' && t.typeName.name === 'Readonly';

const checks = {
  // a "use server" directive, at the top of a file or inside a function, and every export of a file whose top
  // has one (each is a server action). The checkers count only added lines, so a new action in an existing
  // actions file is a finding, and a change inside an existing action is not.
  'no-new-server-actions': (report) => ({
    'ExpressionStatement[directive="use server"]': report,
    Program: (program) => {
      if (!program.body.some((s) => s.directive === 'use server')) return;
      for (const s of program.body) if (s.type === 'ExportNamedDeclaration' || s.type === 'ExportDefaultDeclaration') report(s);
    },
  }),

  // a function component (PascalCase name, renders JSX itself) whose typed first parameter is not Readonly<...>;
  // an untyped parameter (for example inside forwardRef) is left alone
  'readonly-props': (report, context) => {
    const rendersJsx = new Set();
    const mark = (node) => {
      const fn = context.sourceCode.getAncestors(node).reverse().find(isFn);
      if (fn) rendersJsx.add(fn);
    };
    return {
      JSXElement: mark,
      JSXFragment: mark,
      'Program:exit': () => {
        for (const fn of rendersJsx) {
          const name = fnName(fn);
          const t = fn.params[0]?.typeAnnotation?.typeAnnotation;
          if (name && PASCAL.test(name) && t && !isReadonly(t)) report(fn.params[0]);
        }
      },
    };
  },

  // ad hoc date formatting in a component: toLocaleDateString / toLocaleTimeString, Intl.DateTimeFormat or
  // Intl.RelativeTimeFormat, or an import from date-fns. toLocaleString is left out: on numbers it is not a date.
  'shared-date-formatting': (report) => {
    const isIntl = (c) => c?.type === 'MemberExpression' && c.object.type === 'Identifier' && c.object.name === 'Intl' && ['DateTimeFormat', 'RelativeTimeFormat'].includes(c.property.name);
    return {
      'CallExpression > MemberExpression.callee[property.name=/^toLocale(Date|Time)String$/]': report,
      NewExpression: (n) => { if (isIntl(n.callee)) report(n); },
      CallExpression: (n) => { if (isIntl(n.callee)) report(n); },
      ImportDeclaration: (n) => { if (/^date-fns(\/|$)/.test(n.source.value)) report(n); },
    };
  },

  // any key in a non-English locale file; the checkers count only the lines a run added
  'en-us-locale-only': (report) => ({ Member: report }),
};

export default {
  rules: Object.fromEntries(conventions.map((c) => [c.id, {
    meta: { type: 'problem', messages: { rule: c.prose } },
    create: (context) => checks[c.id]((node) => context.report({ node, messageId: 'rule' }), context),
  }])),
};
