// The conventions of this study, taken word for word from Formbricks' own instruction files at the pinned commit.
// One entry each: `source` is the file and the exact line the rules arm removes, `prose` is that line without its
// bullet (it is also the lint message and the review's words), `pointer` marks a design-shaping rule (the rules
// arm adds that line to apps/web/AGENTS.md), and the examples are what the tests run. Globs are relative to the
// copy root.

const WEB = 'apps/web';
const TS = [`${WEB}/**/*.{ts,tsx}`];
const TSX = [`${WEB}/**/*.tsx`];
export const LOCALES = [`${WEB}/locales/*.json`];
export const TESTS = ['**/*.test.{ts,tsx}', '**/__tests__/**', '**/__mocks__/**', '**/*.stories.tsx', '**/stories.tsx', `${WEB}/playwright/**`];

const line = (file, text) => ({ file, line: `- ${text}` });
const SERVER_ACTIONS = 'Server actions are legacy — do not add new ones. New backend work belongs in an `/api/v3` route consumed from the client with TanStack Query, with server data living in the query cache rather than mirrored into `useState` or Jotai. The existing server actions wrap service calls and return `{ data }` or `{ error }` consistently; keep that contract when changing them.';
const READONLY = 'React component props use `Readonly<>`.';
const DATES = 'All user-facing dates and times must use shared formatting helpers instead of ad hoc `date-fns`, `Intl`, or `toLocale*` calls in components.';
const EN_US = '**Only ever add or edit strings in `en-US.json`.** Never hand-write, translate, or edit the other (non-English) locale files yourself — those are machine-generated from en-US by Lingo.dev.';

const f = (p) => `${WEB}/${p}`;

export const conventions = [
  {
    id: 'no-new-server-actions', files: TS,
    source: line('AGENTS.md', SERVER_ACTIONS), prose: SERVER_ACTIONS,
    pointer: 'Server actions are legacy: do not add new ones; new backend work goes in an `/api/v3` route consumed with TanStack Query (enforced by lint).',
    valid: [
      { filename: f('app/api/v3/tags/route.ts'), code: 'export const GET = async () => Response.json({ data: [] });' },
      { filename: f('modules/x/lib/service.ts'), code: 'export const rotate = async () => 1;' },
    ],
    invalid: [
      { filename: f('modules/x/actions.ts'), code: '"use server";\nexport const updateXAction = async () => ({ data: 1 });' },
      // the pilot's case: a new action added to an existing actions file, below its directive
      { filename: f('modules/x/actions.ts'), code: '"use server";\nimport { z } from "zod";\nexport const rotateApiKeyAction = authenticatedActionClient.inputSchema(z.object({})).action(async () => 1);', line: 3 },
      { filename: f('modules/x/components/form.tsx'), code: 'export const Form = () => { async function save() { "use server"; } return null; };' },
    ],
  },
  {
    id: 'readonly-props', files: TSX,
    source: line('CODING_STANDARDS.md', READONLY), prose: READONLY,
    valid: [
      { filename: f('modules/x/components/a.tsx'), code: 'interface AProps { name: string }\nexport const A = ({ name }: Readonly<AProps>) => <p>{name}</p>;' },
      { filename: f('modules/x/components/a.tsx'), code: 'export function A(props: Readonly<{ name: string }>) { return <p>{props.name}</p>; }' },
      { filename: f('modules/x/components/a.tsx'), code: 'export const A = () => <p>hi</p>;' },
      { filename: f('modules/x/lib/a.tsx'), code: 'export const Parse = (value: string) => value.trim();' },
    ],
    invalid: [
      { filename: f('modules/x/components/a.tsx'), code: 'interface AProps { name: string }\nexport const A = ({ name }: AProps) => <p>{name}</p>;' },
      { filename: f('modules/x/components/a.tsx'), code: 'export function A({ name }: { name: string }) { return <p>{name}</p>; }' },
    ],
  },
  {
    id: 'shared-date-formatting', files: TSX,
    source: line('CODING_STANDARDS.md', DATES), prose: DATES,
    valid: [
      { filename: f('modules/x/components/a.tsx'), code: 'import { formatDateForDisplay } from "@/lib/utils/datetime";\nexport const A = ({ d }: Readonly<{ d: Date }>) => <p>{formatDateForDisplay(d, "en-US")}</p>;' },
      { filename: f('modules/x/components/a.tsx'), code: 'export const A = ({ n }: Readonly<{ n: number }>) => <p>{n.toLocaleString()}</p>;' },
    ],
    invalid: [
      { filename: f('modules/x/components/a.tsx'), code: 'export const A = ({ d }: Readonly<{ d: Date }>) => <p>{d.toLocaleDateString()}</p>;' },
      { filename: f('modules/x/components/a.tsx'), code: 'export const A = ({ d }: Readonly<{ d: Date }>) => <p>{new Intl.DateTimeFormat("en").format(d)}</p>;' },
      { filename: f('modules/x/components/a.tsx'), code: 'import { format } from "date-fns";\nexport const A = ({ d }: Readonly<{ d: Date }>) => <p>{format(d, "PP")}</p>;' },
    ],
  },
  {
    id: 'en-us-locale-only', files: LOCALES, ignores: [`${WEB}/locales/en-US.json`],
    source: line('AGENTS.md', EN_US), prose: EN_US,
    valid: [{ filename: f('locales/en-US.json'), code: '{ "common": { "save": "Save" } }' }],
    invalid: [{ filename: f('locales/de-DE.json'), code: '{ "common": { "save": "Speichern" } }' }],
  },
];

export const ruleText = Object.fromEntries(conventions.map((c) => [`local/${c.id}`, c.prose]));
