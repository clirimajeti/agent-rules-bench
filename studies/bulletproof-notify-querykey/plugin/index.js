// Local ESLint plugin for this study: one custom rule.
const QUERY_OPTION_FACTORIES = new Set(['queryOptions', 'infiniteQueryOptions']);

const containsArray = (node) =>
  node?.type === 'ArrayExpression' ||
  (node?.type === 'ConditionalExpression' && (containsArray(node.consequent) || containsArray(node.alternate))) ||
  (node?.type === 'LogicalExpression' && (containsArray(node.left) || containsArray(node.right)));

const insideQueryOptions = (node) => {
  for (let n = node.parent; n; n = n.parent) {
    if (n.type === 'CallExpression' && n.callee.type === 'Identifier' && QUERY_OPTION_FACTORIES.has(n.callee.name)) return true;
  }
  return false;
};

const queryKeyFromOptions = {
  meta: {
    type: 'problem',
    docs: { description: 'Query keys come from the feature\'s get...QueryOptions().queryKey; literal key arrays only inside queryOptions(...)' },
    messages: {
      literal: 'Literal query key. Use the key from the feature\'s query options (for example getUsersQueryOptions().queryKey); write key arrays only inside queryOptions(...).',
    },
    schema: [],
  },
  create(context) {
    return {
      Property(node) {
        const name = node.key.type === 'Identifier' ? node.key.name : node.key.value;
        if (name === 'queryKey' && containsArray(node.value) && !insideQueryOptions(node)) context.report({ node: node.value, messageId: 'literal' });
      },
    };
  },
};

export default { rules: { 'query-key-from-options': queryKeyFromOptions } };
