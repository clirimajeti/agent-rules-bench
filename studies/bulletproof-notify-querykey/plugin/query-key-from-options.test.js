import { RuleTester } from 'eslint';
import tsParser from '@typescript-eslint/parser';
import plugin from './index.js';

const rule = plugin.rules['query-key-from-options'];
new RuleTester({ languageOptions: { parser: tsParser } }).run('query-key-from-options', rule, {
  valid: [
    "export const getUsersQueryOptions = () => queryOptions({ queryKey: ['users'], queryFn: getUsers });",
    "infiniteQueryOptions({ queryKey: ['comments', id], queryFn: f });",
    "queryOptions({ queryKey: page ? ['discussions', { page }] : ['discussions'], queryFn: f });",
    'queryClient.invalidateQueries({ queryKey: getUsersQueryOptions().queryKey });',
    'useQuery({ ...getUsersQueryOptions(), queryKey: key });',
  ],
  invalid: [
    { code: "queryClient.invalidateQueries({ queryKey: ['users'] });", errors: [{ messageId: 'literal' }] },
    { code: "useQuery({ queryKey: ['discussions', params], queryFn: f });", errors: [{ messageId: 'literal' }] },
    { code: "queryClient.setQueryData({ queryKey: cond ? ['a'] : ['b'] }, x);", errors: [{ messageId: 'literal' }] },
    { code: "useMutation({ onSuccess: () => qc.invalidateQueries({ 'queryKey': ['teams'] }) });", errors: [{ messageId: 'literal' }] },
  ],
});
