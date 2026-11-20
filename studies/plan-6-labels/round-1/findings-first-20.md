# Findings to label

For each finding: is the flagged code a real violation of the convention (`correct`) or not (`false`)? Write the label in `findings.csv`.
The convention texts are in `conventions-<study>.md`. The arm and the run are hidden.

## X001: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/users-filter.ts` line 9; code from the final change.

```
      3 + import { UsersFilter } from '../api/get-users';
      4 + 
      5 + export const filterUsers = (users: User[], { search }: UsersFilter) => {
      6 +   const query = search.trim().toLowerCase();
      7 + 
      8 +   return users.filter((user) => {
>>    9 +     if (!query) return true;
     10 + 
     11 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     12 +     return name.includes(query) || user.email.toLowerCase().includes(query);
     13 +   });
     14 + };
```

## X002: local/ui-button

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 54; code from the final change (the line may have moved since the finding).

```
     48 +         {discussion.author && (
     49 +           <span className="ml-2 text-sm font-bold">
     50 +             by {discussion.author.firstName} {discussion.author.lastName}
     51 +           </span>
     52 +         )}
     53 +       </div>
>>   54 +       {canAdmin && (
     55 +         <div className="mb-4 flex justify-end">
     56 +           <Button
     57 +             variant="secondary"
     58 +             onClick={() => pinMutation.mutate({ discussionId })}
     59 +             disabled={pinMutation.isPending}
     60 +             className={cn(
```

## X003: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 44; code from the file as the agent wrote it.

```
     38 +     <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
     39 +       <div className="grid w-full gap-4 sm:max-w-xl sm:grid-cols-2">
     40 +         <div>
     41 +           <label htmlFor={searchId} className="text-sm font-medium">
     42 +             Search by name or email
     43 +           </label>
>>   44 +           <input
     45 +             id={searchId}
     46 +             type="search"
     47 +             value={search}
     48 +             placeholder="Search users"
     49 +             onChange={(event) => onSearchChange(event.target.value)}
     50 +             className={controlClassName}
```

## X004: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/actions/download-my-data.ts` line 13; code from the final change.

```
(no code)
```

## X005: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 10; code from the file as the agent wrote it.

```
      4 + import { Button } from '@/components/ui/button';
      5 + 
      6 + import { RoleFilter } from '../utils/filter-users';
      7 + 
      8 + const roleOptions: { label: string; value: RoleFilter }[] = [
      9 +   { label: 'All roles', value: 'ALL' },
>>   10 +   { label: 'Admin', value: 'ADMIN' },
     11 +   { label: 'User', value: 'USER' },
     12 + ];
     13 + 
     14 + const controlClassName =
     15 +   'mt-1 block w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
     16 + 
```

## X006: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 33; code from the file as the agent wrote it.

```
     27 + 
     28 +   const { onSuccess, ...restConfig } = mutationConfig || {};
     29 + 
     30 +   return useMutation({
     31 +     onSuccess: (data, ...args) => {
     32 +       // The list is re-sorted by the server, so every discussions query is stale.
>>   33 +       queryClient.invalidateQueries({ queryKey: ['discussions'] });
     34 +       queryClient.refetchQueries({
     35 +         queryKey: getDiscussionQueryOptions(data.id).queryKey,
     36 +       });
     37 +       onSuccess?.(data, ...args);
     38 +     },
     39 +     ...restConfig,
```

## X007: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 13; code from the final change.

```
      7   
      8   import { useDiscussion } from '../api/get-discussion';
      9   import { UpdateDiscussion } from '../components/update-discussion';
     10   
     11 + import { useUpdateDiscussionPinned } from '../api/update-discussion-pinned';
     12 + import { Authorization, ROLES } from '@/lib/authorization';
>>   13 + import { Button } from '@/components/ui/button';
     14 + 
     15   export const DiscussionView = ({ discussionId }: { discussionId: string }) => {
     16     const discussionQuery = useDiscussion({
     17       discussionId,
```

## X008: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 99; code from the final change.

```
     93   );
     94 + 
```

## X009: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X010: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 105; code from the final change.

```
     99 +   };
    100   
    101     if (usersQuery.isLoading) {
    102       return (
    106       );
    107     }
    108   
    109     return (
    110 +     <div className="space-y-4">
    111 +       <div className="flex items-center gap-3">
```

## X011: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 13; code from the final change.

```
      7   import { Spinner } from '@/components/ui/spinner';
      8   import { Table } from '@/components/ui/table';
      9   import { formatDate } from '@/utils/format';
     10   
     11 + import { ROLES } from '@/lib/authorization';
     12 + 
>>   13   import { useUsers } from '../api/get-users';
     14   
     15   import { DeleteUser } from './delete-user';
     16   
     17 + type RoleFilter = 'ALL' | (typeof ROLES)[keyof typeof ROLES];
     18 + 
     19 + const roleOptions: { label: string; value: RoleFilter }[] = [
```

## X012: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/server-actions.ts` line 10; code from the final change.

```
(no code)
```

## X013: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 12; code from the final change.

```
      6   import { formatDate } from '@/utils/format';
      7   
      8   import { useDiscussion } from '../api/get-discussion';
      9 + import { usePinDiscussion } from '../api/pin-discussion';
     10   import { UpdateDiscussion } from '../components/update-discussion';
     11 + import { Authorization, ROLES } from '@/lib/authorization';
>>   12   export const DiscussionView = ({ discussionId }: { discussionId: string }) => {
     13     const discussionQuery = useDiscussion({
     14       discussionId,
     15     });
     16 +   const pinDiscussionMutation = usePinDiscussion({});
     17   
     18     if (discussionQuery.isLoading) {
```

## X014: local/shared-date-formatting

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 15; code from the final change.

```
      9 + }
     10 + 
     11 + export const AccountActivity = ({ user }: Readonly<AccountActivityProps>) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   const formatDate = (date: Date | null): string => {
>>   15 +     if (!date) return t("workspace.settings.profile.no_login_yet");
     16 +     return formatDateTimeForDisplay(new Date(date));
     17 +   };
     18 + 
     19 +   return (
     20 +     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
     21 +       <div>
```

## X015: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 12; code from the final change.

```
      6 +   users: User[],
      7 +   { search }: UsersFilters,
      8 + ): User[] => {
      9 +   const query = search.trim().toLowerCase();
     10 + 
     11 +   return users.filter((user) => {
>>   12 +     if (!query) return true;
     13 + 
     14 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     15 +     return name.includes(query) || user.email.toLowerCase().includes(query);
     16 +   });
     17 + };
```

## X016: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change.

```
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6 + import { ROLES } from '@/lib/authorization';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: ROLES.ADMIN | ROLES.USER;
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (
     14 +   params?: GetUsersParams,
```

## X017: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change.

```
      2   
      3 + import { ROLES } from '@/lib/authorization';
      4   import { api } from '@/lib/api-client';
      5   import { QueryConfig } from '@/lib/react-query';
      6   import { User } from '@/types/api';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: ROLES.ADMIN | ROLES.USER;
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (
     14 +   params?: GetUsersParams,
```

## X018: local/roles-from-enum

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 20; code from the final change (the line may have moved since the finding).

```
     14   export const DiscussionView = ({ discussionId }: { discussionId: string }) => {
     15     const discussionQuery = useDiscussion({
     16       discussionId,
     17     });
     18 +   const { checkAccess, role } = useAuthorization();
     19 + 
>>   20 +   const togglePinMutation = useToggleDiscussionPin();
     21 + 
     22 +   const canPin = role === ROLES.ADMIN;
     23   
     24     if (discussionQuery.isLoading) {
     25       return (
```

## X019: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-list.tsx` line 3; code from the final change (the line may have moved since the finding).

```
      1 + import { useCallback } from 'react';
      2 + 
>>    3 + import { Button } from '@/components/ui/button';
      4   import { Spinner } from '@/components/ui/spinner';
      5   import { Table } from '@/components/ui/table';
      6   import { formatDate } from '@/utils/format';
      7 + import { Form, Select, Input } from '@/components/ui/form';
      8 + import { ROLES } from '@/lib/authorization';
      9   
```

## X020: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 71; code from the final change.

```
     65 +             type="text"
     66 +             placeholder="Search by name or email"
     67 +             value={search}
     68 +             onChange={(e) => setSearch(e.target.value)}
     69 +             className={cn(
     70 +               'h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
>>   71 +             )}
     72 +             registration={{}}
     73 +           />
     74 +         </div>
     75 +         <Select
     76 +           options={roleOptions}
     77 +           className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```

## X021: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadMyData.tsx` line 13; code from the final change.

```
      7 + 
      8 + interface DownloadMyDataProps {
      9 +   userId: string;
     10 + }
     11 + 
     12 + export const DownloadMyData = ({ userId }: Readonly<DownloadMyDataProps>) => {
>>   13 +   const { t } = useTranslation();
     14 +   const [isDownloading, setIsDownloading] = useState(false);
     15 + 
     16 +   const handleDownload = async () => {
     17 +     setIsDownloading(true);
     18 +     try {
     19 +       const response = await fetch("/api/v3/account/download-my-data", {
```

## X022: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X023: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const FORMULA_PREFIX = /^[=+\-@\t\r]/;
      6 + 
      7 + const escapeCsvCell = (value: string) => {
```

## X024: local/readonly-props

`apps/web/modules/workspaces/settings/tags/components/delete-unused-tags-button.tsx` line 15; code from the final change (the line may have moved since the finding).

```
      9 + import { useDeleteUnusedTags } from "../hooks/use-delete-unused-tags";
     10 + 
     11 + interface DeleteUnusedTagsButtonProps {
     12 +   workspaceId: string;
     13 + }
     14 + 
>>   15 + export const DeleteUnusedTagsButton = ({ workspaceId }: Readonly<DeleteUnusedTagsButtonProps>) => {
     16 +   const { t } = useTranslation();
     17 +   const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
     18 +   const deleteUnusedTags = useDeleteUnusedTags(workspaceId);
     19 + 
     20 +   const handleDeleteUnusedTags = async () => {
     21 +     try {
```

## X025: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 52; code from the agent's edit just before the finding (line numbers not known).

```
import { Form, Input, Select } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/components/ui/table';
import { formatDate } from '@/utils/format';

import { usersFilterSchema, useUsers } from '../api/get-users';
import { filterUsers } from '../utils/filter-users';

import { DeleteUser } from './delete-user';
import { ExportUsersButton } from './export-users-button';

export const UsersList = () => {
  const usersQuery = useUsers();

  if (usersQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const users = usersQuery.data?.data;

  if (!users) return null;

  return (
    <Form
      onSubmit={() => {}}
      schema={usersFilterSchema}
      options={{ defaultValues: { search: '', role: 'ALL' } }}
    >
      {({ register, watch }) => {
        const filteredUsers = filterUsers(users, watch());

        return (
          <>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-64 flex-1">
                <Input
```

## X026: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from not recoverable.

```
(no code)
```

## X027: local/shared-date-formatting

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 15; code from the final change.

```
      9 +   locale: string;
     10 + }
     11 + 
     12 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     13 +   const { t } = useTranslation();
     14 + 
>>   15 +   return (
     16 +     <div className="space-y-3">
     17 +       <div className="flex items-center justify-between">
     18 +         <span className="text-sm text-slate-700">
     19 +           {t("workspace.settings.profile.account_created")}
     20 +         </span>
     21 +         <span className="text-sm font-medium text-slate-900">{formatDate(createdAt, locale)}</span>
```

## X028: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 101; code from the final change.

```
(no code)
```

## X029: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 11; code from the agent's edit just before the finding (line numbers not known).

```
export const usersFilterSchema = z.object({
  search: z.string(),
  role: z.enum(['ALL', 'ADMIN', 'USER']),
});

export type UsersFilter = z.infer<typeof usersFilterSchema>;

export const getUsers =
```

## X030: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 13; code from the final change (the line may have moved since the finding).

```
      7 + interface AccountActivityProps {
      8 +   createdAt: Date;
      9 +   lastLoginAt: Date | null;
     10 +   locale: string;
     11 + }
     12 + 
>>   13 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     14 +   const { t } = useTranslation();
     15 + 
     16 +   const formatDate = (date: Date | null) => {
     17 +     if (!date) return t("common.never");
     18 +     return formatDateForDisplay(date, locale);
     19 +   };
```

## X031: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 12; code from the final change.

```
      6 + interface AccountActivityProps {
      7 +   createdAt: Date;
      8 +   lastLoginAt: Date | null;
      9 +   locale: string;
     10 + }
     11 + 
>>   12 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     13 +   const { t } = useTranslation();
     14 + 
     15 +   return (
     16 +     <dl className="space-y-3 text-sm">
     17 +       <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
     18 +         <dt className="text-slate-500">{t("workspace.settings.profile.account_created")}</dt>
```

## X032: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { usePinDiscussion } from '../api/pin-discussion';
      8 + 
      9 + type PinDiscussionProps = {
     10 +   discussionId: string;
```

## X033: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 2; code from the file as the agent wrote it.

```
      1 + import { Download } from 'lucide-react';
>>    2 + import { UseFormRegister } from 'react-hook-form';
      3 + 
      4 + import { Button } from '@/components/ui/button';
      5 + import { Input, Select } from '@/components/ui/form';
      6 + import { ROLES } from '@/lib/authorization';
      7 + 
      8 + import { RoleFilter, UserFilters } from '../utils/filter-users';
```

## X034: local/notifications-in-mutation-hook

`apps/react-vite/src/features/auth/components/change-password.tsx` line 5; code from the final change.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X035: local/shared-date-formatting

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 15; code from the final change (the line may have moved since the finding).

```
      9 + }
     10 + 
     11 + export const AccountActivity: React.FC<Readonly<AccountActivityProps>> = ({ user }) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   const formatDate = (date: Date | null): string => {
>>   15 +     if (!date) return t("common.not_available");
     16 +     return formatDateTimeForDisplay(date, user.locale);
     17 +   };
     18 + 
     19 +   return (
     20 +     <div className="space-y-3">
     21 +       <div className="flex items-center justify-between">
```

## X036: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 21; code from the file as the agent wrote it.

```
     15 + interface AccountActivityProps {
     16 +   createdAt: Date;
     17 +   lastLoginAt: Date | null;
     18 +   locale: string;
     19 + }
     20 + 
>>   21 + export const AccountActivity = async ({ createdAt, lastLoginAt, locale }: AccountActivityProps) => {
     22 +   const t = await getTranslate();
     23 + 
     24 +   return (
     25 +     <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
     26 +       <dt className="text-slate-500">{t("common.created_at")}</dt>
     27 +       <dd className="text-slate-800">{formatDateForDisplay(createdAt, locale, ACTIVITY_DATE_OPTIONS)}</dd>
```

## X037: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 75; code from the final change.

```
(no code)
```

## X038: local/schemas-in-api

`apps/react-vite/src/features/users/components/users-list.tsx` line 30; code from the final change (the line may have moved since the finding).

```
     24 + const roleOptions: RoleOption[] = [
     25 +   { label: 'All', value: '' },
     26 +   { label: 'Admin', value: ROLES.ADMIN },
     27 +   { label: 'User', value: ROLES.USER },
     28 + ];
     29 + 
>>   30   export const UsersList = () => {
     31 +   return (
     32 +     <Form
     33 +       schema={usersFilterSchema}
     34 +       onSubmit={() => {}}
     35 +       id="users-filter"
     36 +     >
```

## X039: local/role-checks-through-authorization

`apps/react-vite/src/features/users/api/get-users.ts` line 38; code from the final change.

```
     32 + 
     33 +   return users.filter((user) => {
     34 +     if (!term) return true;
     35 + 
     36 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     37 +     return name.includes(term) || user.email.toLowerCase().includes(term);
>>   38 +   });
     39 + };
     40 + 
     41   export const useUsers = ({ queryConfig }: UseUsersOptions = {}) => {
     42     return useQuery({
     43       ...getUsersQueryOptions(),
```

## X040: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 89; code from the final change.

```
     86   
     87     if (!users) return null;
     88   
>>   89 +   const filteredUsers = users.filter((user) => {
     90 +     if (debouncedRole && user.role !== debouncedRole) {
     91 +       return false;
     92 +     }
     93 +     if (debouncedSearch) {
     94 +       const q = debouncedSearch.toLowerCase();
     95 +       const name = `${user.firstName} ${user.lastName}`.toLowerCase();
```

## X041: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 126; code from the final change.

```
(no code)
```

## X042: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 18; code from the final change.

```
     12 + 
     13   import { useUsers } from '../api/get-users';
     14   
     15   import { DeleteUser } from './delete-user';
     16   
     17 + type RoleFilter = 'ALL' | (typeof ROLES)[keyof typeof ROLES];
>>   18 + 
     19 + const roleOptions: { label: string; value: RoleFilter }[] = [
     20 +   { label: 'All', value: 'ALL' },
     21 +   { label: 'Admin', value: ROLES.ADMIN },
     22 +   { label: 'User', value: ROLES.USER },
     23 + ];
     24 + 
```

## X043: local/query-key-from-options

`apps/react-vite/src/features/comments/api/delete-comment.ts` line 31; code from the agent's edit just before the finding (line numbers not known).

```
      queryClient.invalidateQueries({
        queryKey: getInfiniteCommentsQueryOptions(discussionId).queryKey,
      });
      // The discussions list shows comment counts and the last comment date
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      onSuccess?.(...args);
```

## X044: local/shared-date-formatting

`apps/web/modules/integrations/webhooks/components/webhook-row-data.tsx` line 108; code from the agent's edit just before the finding (line numbers not known).

```
      <div className="col-span-2 my-auto text-center text-sm whitespace-nowrap text-slate-500">
        {new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(
          new Date(webhook.createdAt)
        )}
      </div>
      <div className="col-span-2 my-auto text-center text-sm whitespace-nowrap text-slate-500">
        {timeSince(webhook.updatedAt.toString(), locale)}
      </div>
    </div>
```

## X045: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 15; code from the final change.

```
      9 + 
     10 +   if (!query) {
     11 +     return users;
     12 +   }
     13 + 
     14 +   return users.filter((user) => {
>>   15 +     const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
     16 +     const email = user.email.toLowerCase();
     17 + 
     18 +     return fullName.includes(query) || email.includes(query);
     19 +   });
     20 + };
```

## X046: local/readonly-props

`apps/web/modules/integrations/webhooks/components/duplicate-webhook-button.tsx` line 14; code from the final change.

```
      8 + import { Button } from "@/modules/ui/components/button";
      9 + import { duplicateWebhook } from "@/modules/integrations/webhooks/lib/duplicate-webhook-client";
     10 + 
     11 + interface DuplicateWebhookButtonProps {
     12 +   webhook: Webhook;
     13 + }
>>   14 + 
     15 + /**
     16 +  * Duplicate a webhook. Only user-created webhooks (source === "user") can be duplicated.
     17 +  * The new copy gets "Copy of <name>" and its own secret. Refreshes the parent query cache.
     18 +  */
     19 + export const DuplicateWebhookButton = ({
     20 +   webhook,
```

## X047: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const CSV_HEADERS = ['Name', 'Email', 'Role', 'Joined'];
      6 + 
      7 + // Spreadsheet apps may evaluate cells starting with these characters as formulas.
```

## X048: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users.ts` line 4; code from the final change (the line may have moved since the finding).

```
      1 + import { User } from '@/types/api';
      2 + import { formatDate } from '@/utils/format';
      3 + 
>>    4 + export const exportUsersToCSV = (users: User[], filename: string = 'users.csv'): void => {
      5 +   const header = 'Name,Email,Role,Joined\n';
      6 +   const rows = users
      7 +     .map((user) => {
      8 +       const name = `"${user.firstName} ${user.lastName}"`;
      9 +       const email = `"${user.email}"`;
     10 +       const role = user.role;
```

## X049: local/no-any

`apps/react-vite/src/features/users/components/users-list.tsx` line 16; code from the final change (the line may have moved since the finding).

```
     10   import { useUsers } from '../api/get-users';
     11   
     12   import { DeleteUser } from './delete-user';
     13   
     14   export const UsersList = () => {
     15 +   const [roleFilter, setRoleFilter] = React.useState<ROLES.ADMIN | ROLES.USER | ''>('');
>>   16 +   const [search, setSearch] = React.useState('');
     17 + 
     18 +   const usersQuery = useUsers({
     19 +     params: {
     20 +       role: roleFilter || undefined,
     21 +       search: search || undefined,
     22 +     },
```

## X050: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 59; code from the final change (the line may have moved since the finding).

```
     53         ),
     54       },
     55 +     {
     56 +       id: "created",
     57 +       header: t("workspace.tags.created"),
     58 +       headerClassName: "w-[15%]",
>>   59 +       align: "center",
     60 +       cellClassName: "whitespace-nowrap text-slate-900",
     61 +       skeletonWidth: "w-20",
     62 +       cell: (tag) => formatDate(new Date(tag.createdAt), locale),
     63 +     },
     64       {
     65         id: "count",
```

## X051: local/readonly-props

`apps/web/modules/workspaces/settings/tags/components/delete-unused-tags-button.tsx` line 16; code from the final change (the line may have moved since the finding).

```
     10 + 
     11 + /**
     12 +  * Exported so `page.tsx` can pass it as the `cta` slot on `SettingsCard`.
     13 +  */
     14 + export const DeleteUnusedTagsButton = ({ workspaceId }: Readonly<{ workspaceId: string }>) => {
     15 +   const { t } = useTranslation();
>>   16 +   const [open, setOpen] = useState(false);
     17 +   const { mutate: deleteUnusedTags, isPending: isDeleting } = useDeleteUnusedTags(workspaceId);
     18 + 
     19 +   const handleDelete = () => {
     20 +     deleteUnusedTags(undefined, {
     21 +       onSuccess: (data) => {
     22 +         toast.success(t("workspace.tags.tags_deleted", { count: data.count }));
```

## X052: local/schemas-in-api

`apps/react-vite/src/features/users/components/users-list.tsx` line 36; code from the final change.

```
     30     return (
     31 +     <div className="space-y-4">
     32 +       <Form
     33 +         id="users-filters"
     34 +         onSubmit={() => {}}
     35 +         schema={getUsersQueryParamsSchema}
>>   36 +       >
     37 +         {(form) => {
     38 +           const role = form.watch('role');
     39 +           const search = form.watch('search');
     40 + 
     41 +           const filteredUsers = useMemo(() => {
     42 +             return users.filter((u) => {
```

## X053: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const CSV_HEADERS = ['Name', 'Email', 'Role', 'Joined'];
      6 + 
      7 + // Prefixing with an apostrophe stops spreadsheet apps from evaluating
```

## X054: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/update-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { Lock } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   updatePasswordInputSchema,
      9 +   useUpdatePassword,
     10 + } from '../api/update-password';
     11 + 
```

## X055: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 168; code from the final change.

```
(no code)
```

## X056: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 165; code from not recoverable.

```
(no code)
```

## X057: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X058: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 9; code from the final change.

```
      3 + 
      4 + import { UsersFilter } from '../api/get-users';
      5 + 
      6 + export const filterUsers = (users: User[], { search, role }: UsersFilter) => {
      7 +   const query = search.trim().toLowerCase();
      8 + 
>>    9 +   return users.filter((user) => {
     10 +     if (!matchesRole(user, role)) {
     11 +       return false;
     12 +     }
     13 + 
     14 +     if (!query) {
     15 +       return true;
```

## X059: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 10; code from the agent's edit just before the finding (line numbers not known).

```
export const usersFilterInputSchema = z.object({
  search: z.string(),
  role: z.enum(['ALL', 'ADMIN', 'USER']),
});

export type UsersFilterInput = z.infer<typeof usersFilterInputSchema>;

export const getUsers =
```

## X060: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { usePinDiscussion } from '../api/pin-discussion';
      8 + 
      9 + type PinDiscussionProps = {
     10 +   discussionId: string;
```

## X061: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 2; code from the file as the agent wrote it.

```
      1 + import { DownloadIcon } from '@radix-ui/react-icons';
>>    2 + import { type ChangeHandler } from 'react-hook-form';
      3 + 
      4 + import { Button } from '@/components/ui/button';
      5 + import { Input, Select } from '@/components/ui/form';
      6 + 
      7 + import { type UserRoleFilter } from '../utils/filter-users';
      8 + 
```

## X062: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-list.tsx` line 1; code from the file as the agent wrote it.

```
>>    1 + import { useForm } from 'react-hook-form';
      2 + 
      3 + import { Spinner } from '@/components/ui/spinner';
      4 + import { Table } from '@/components/ui/table';
      5 + import { formatDate } from '@/utils/format';
      6 + 
      7 + import { useUsers } from '../api/get-users';
```

## X063: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 23; code from the file as the agent wrote it.

```
     17 +   hour: "numeric",
     18 +   minute: "2-digit",
     19 +   timeZone: "UTC",
     20 +   timeZoneName: "short",
     21 + };
     22 + 
>>   23 + export const AccountActivity = ({ createdAt, lastLoginAt, locale, t }: AccountActivityProps) => {
     24 +   return (
     25 +     <dl className="space-y-4 pb-4 text-sm">
     26 +       <div>
     27 +         <dt className="font-medium text-slate-900">{t("workspace.settings.profile.account_created")}</dt>
     28 +         <dd className="mt-1 text-slate-600">{formatDateTimeForDisplay(createdAt, locale, ACTIVITY_DATE_OPTIONS)}</dd>
     29 +       </div>
```

## X064: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X065: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 43; code from the final change.

```
     37 +         <Spinner />
     38         </div>
     39       );
     40     }
     41   
     42 +   const allUsers = usersQuery.data?.data ?? [];
>>   43 + 
     44 +   const filteredUsers = allUsers.filter((user) => {
     45 +     const matchesRole = !roleFilter || user.role === roleFilter;
     46 +     const query = searchQuery.toLowerCase();
     47 +     const matchesSearch =
     48 +       !query ||
     49 +       user.firstName.toLowerCase().includes(query) ||
```

## X066: local/shared-date-formatting

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 12; code from the final change.

```
      6 + import { formatDateTimeForDisplay } from "@/lib/utils/datetime";
      7 + import { getV3ApiErrorMessage } from "@/modules/api/lib/v3-client";
      8 + import { Button } from "@/modules/ui/components/button";
      9 + import { Skeleton } from "@/modules/ui/components/skeleton";
     10 + import { accountDataKeys, buildAccountDataExport, getAccountData } from "../lib/account-data-client";
     11 + 
>>   12 + const formatDateTime = (iso: string, locale: string) => formatDateTimeForDisplay(new Date(iso), locale);
     13 + 
     14 + export const AccountActivity = () => {
     15 +   const { t, i18n } = useTranslation();
     16 +   const { data, isPending, isError, error } = useQuery({
     17 +     queryKey: accountDataKeys.all,
     18 +     queryFn: getAccountData,
```

## X067: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 48; code from the final change (the line may have moved since the finding).

```
     42 +     <Form
     43 +       schema={filterUsersSchema}
     44 +       onSubmit={() => {}}
     45 +       options={{ defaultValues: { role: 'ALL', search: '' } }}
     46 +     >
     47 +       {(form) => {
>>   48 +         const { watch, register } = form;
     49 +         const role = watch('role');
     50 +         const search = watch('search');
     51   
     52 +         const usersQuery = useUsers({
     53 +           params:
     54 +             role === 'ALL' && !search
```

## X068: local/classnames-with-cn

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 57; code from the final change (the line may have moved since the finding).

```
     51 +           </span>
     52 +         )}
     53 +       </div>
     54 +       {canAdmin && (
     55 +         <div className="mb-4 flex justify-end">
     56 +           <Button
>>   57 +             variant="secondary"
     58 +             onClick={() => pinMutation.mutate({ discussionId })}
     59 +             disabled={pinMutation.isPending}
     60 +             className={cn(
     61 +               'gap-1',
     62 +               discussion.isPinned && 'bg-amber-100 text-amber-800 hover:bg-amber-200',
     63 +             )}
```

## X069: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/server-actions.ts` line 1; code from the final change.

```
(no code)
```

## X070: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const CSV_HEADERS = ['Name', 'Email', 'Role', 'Joined'];
      6 + 
      7 + // Cells starting with these characters can be interpreted as formulas by
```

## X071: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 21; code from the final change.

```
(no code)
```

## X072: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 35; code from the final change.

```
     29     if (!users) return null;
     30   
     31 +   const term = search.trim().toLowerCase();
     32 +   const filteredUsers = users.filter((user) => {
     33 +     if (!term) return true;
     34 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
>>   35 +     return name.includes(term) || user.email.toLowerCase().includes(term);
     36 +   });
     37 + 
     38     return (
     39 +     <div className="flex flex-col gap-4">
     40 +       <div className="flex flex-wrap items-end gap-4">
     41 +         <Input
```

## X073: local/roles-from-enum

`apps/react-vite/src/features/users/utils/filter-users.ts` line 8; code from the final change.

```
      2 + import { User } from '@/types/api';
      3 + 
      4 + export const ALL_ROLES = 'ALL';
      5 + 
      6 + export type RoleFilter = typeof ALL_ROLES | User['role'];
      7 + 
>>    8 + const roleValues: string[] = Object.values(ROLES);
      9 + 
     10 + export const isRoleFilter = (value: string): value is RoleFilter => {
     11 +   return value === ALL_ROLES || roleValues.includes(value);
     12 + };
     13 + 
     14 + type UserFilters = {
```

## X074: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 11; code from the final change (the line may have moved since the finding).

```
      5 + import { Small } from "@/modules/ui/components/typography";
      6 + 
      7 + interface AccountActivityProps {
      8 +   createdAt: Date | null;
      9 +   lastLoginAt: Date | null;
     10 +   locale: string | null;
>>   11 + }
     12 + 
     13 + const DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
     14 +   year: "numeric",
     15 +   month: "short",
     16 +   day: "numeric",
     17 + };
```

## X075: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X076: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 20; code from the final change.

```
     14 + type UserFilters = {
     15 +   search: string;
     16 +   role: RoleFilter;
     17 + };
     18 + 
     19 + export const filterUsers = (users: User[], { search, role }: UserFilters) => {
>>   20 +   const query = search.trim().toLowerCase();
     21 + 
     22 +   return users.filter((user) => {
     23 +     if (role !== ALL_ROLES && user.role !== role) {
     24 +       return false;
     25 +     }
     26 + 
```

## X077: local/readonly-props

`apps/web/modules/workspaces/settings/tags/page-content.tsx` line 15; code from the final change (the line may have moved since the finding).

```
      9 + 
     10 + interface TagsPageProps {
     11 +   workspaceId: string;
     12 +   isReadOnly: boolean;
     13 + }
     14 + 
>>   15 + export const TagsPage = ({ workspaceId, isReadOnly }: Readonly<TagsPageProps>) => {
     16 +   const { t } = useTranslation();
     17 + 
     18 +   return (
     19 +     <PageContentWrapper>
     20 +       <PageHeader pageTitle={t("common.tags")} />
     21 +       <SettingsCard
```

## X078: local/roles-from-enum

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 18; code from the final change (the line may have moved since the finding).

```
     12   
     13   export const DiscussionView = ({ discussionId }: { discussionId: string }) => {
     14     const discussionQuery = useDiscussion({
     15       discussionId,
     16     });
     17   
>>   18 +   const { checkAccess } = useAuthorization();
     19 +   const canAdmin = checkAccess({ allowedRoles: [ROLES.ADMIN] });
     20 + 
     21 +   const pinMutation = useTogglePinDiscussion({
     22 +     mutationConfig: {
     23 +       onSuccess: () => {
     24 +         // Query refetch is handled in the mutation
```

## X079: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 168; code from the final change.

```
(no code)
```

## X080: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 26; code from the final change.

```
     20     return queryOptions({
     21 +     queryKey: params ? ['users', params] : ['users'],
     22 +     queryFn: () => getUsers(params),
     23     });
     24   };
     25   
>>   26 + export const getUsersQueryParamsSchema = z.object({
     27 +   role: z.nativeEnum(ROLES).optional(),
     28 +   search: z.string().optional(),
     29 + });
     30 + 
     31 + export type GetUsersQueryParams = z.infer<typeof getUsersQueryParamsSchema>;
     32 + 
```

## X081: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 69; code from the final change.

```
     63 +       <div className="flex items-center gap-4">
     64 +         <Select
     65 +           label="Role"
     66 +           options={[
     67 +             { label: 'All Roles', value: '' },
     68 +             { label: 'Admin', value: ROLES.ADMIN },
>>   69 +             { label: 'User', value: ROLES.USER },
     70 +           ]}
     71 +           value={role}
     72 +           onChange={(value) => onRoleChange?.(value)}
     73 +           registration={{}}
     74 +           className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
     75 +         />
```

## X082: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 32; code from the file as the agent wrote it.

```
     26 +   const { onSuccess, ...restConfig } = mutationConfig || {};
     27 + 
     28 +   return useMutation({
     29 +     onSuccess: (data, ...args) => {
     30 +       // Invalidates the discussion itself and every cached discussions list page,
     31 +       // since pinning changes the list order.
>>   32 +       queryClient.invalidateQueries({ queryKey: ['discussions'] });
     33 +       onSuccess?.(data, ...args);
     34 +     },
     35 +     ...restConfig,
     36 +     mutationFn: pinDiscussion,
     37 +   });
     38 + };
```

## X083: local/input-types-from-zod

`apps/react-vite/src/features/users/api/update-password.ts` line 22; code from the file as the agent wrote it.

```
     16 +   });
     17 + 
     18 + export type UpdatePasswordFormValues = z.infer<
     19 +   typeof updatePasswordInputSchema
     20 + >;
     21 + 
>>   22 + export type UpdatePasswordInput = {
     23 +   currentPassword: string;
     24 +   newPassword: string;
     25 + };
     26 + 
     27 + export const updatePassword = ({ data }: { data: UpdatePasswordInput }) => {
     28 +   return api.patch(`/users/password`, data);
```

## X084: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { useDiscussion } from '../api/get-discussion';
      8 + import { usePinDiscussion } from '../api/pin-discussion';
      9 + 
     10 + type PinDiscussionProps = {
```

## X085: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 16; code from the final change.

```
     10 + import { ROLES } from '@/lib/authorization';
     11 + 
     12   import { useUsers } from '../api/get-users';
     13   
     14   import { DeleteUser } from './delete-user';
     15   
>>   16 + type UserRoleFilter = '' | ROLES.ADMIN | ROLES.USER;
     17 + 
     18 + const roleOptions = [
     19 +   { label: 'All', value: '' },
     20 +   { label: 'Admin', value: ROLES.ADMIN },
     21 +   { label: 'User', value: ROLES.USER },
     22 + ];
```

## X086: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadAccountDataButton.tsx` line 25; code from the file as the agent wrote it.

```
     19 + }
     20 + 
     21 + interface DownloadAccountDataButtonProps {
     22 +   accountData: TAccountData;
     23 + }
     24 + 
>>   25 + export const DownloadAccountDataButton = ({ accountData }: DownloadAccountDataButtonProps) => {
     26 +   const { t } = useTranslation();
     27 + 
     28 +   const handleDownload = () => {
     29 +     const json = JSON.stringify(accountData, null, 2);
     30 +     const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
     31 +     const link = document.createElement("a");
```

## X087: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 15; code from the final change (the line may have moved since the finding).

```
      9   import { getV3ApiErrorMessage } from "@/modules/api/lib/v3-client";
     10   import { Button } from "@/modules/ui/components/button";
     11 + import { DeleteDialog } from "@/modules/ui/components/delete-dialog";
     12   import { SettingsTable, type TSettingsTableColumn } from "@/modules/ui/components/settings-table";
     13   import { TagNameInput } from "@/modules/workspaces/settings/tags/components/tag-name-input";
     14   import { TagRowActions } from "@/modules/workspaces/settings/tags/components/tag-row-actions";
>>   15 + import { useDeleteUnusedTags } from "@/modules/workspaces/settings/tags/hooks/use-delete-unused-tags";
     16   import { useTags } from "@/modules/workspaces/settings/tags/hooks/use-tags";
     17   
     18   interface EditTagsWrapperProps {
```

## X088: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 17; code from the final change.

```
     11 + import { ROLES } from '@/lib/authorization';
     12 + 
     13   import { useUsers } from '../api/get-users';
     14   
     15   import { DeleteUser } from './delete-user';
     16   
>>   17 + type RoleFilter = 'ALL' | (typeof ROLES)[keyof typeof ROLES];
     18 + 
     19 + const roleOptions: { label: string; value: RoleFilter }[] = [
     20 +   { label: 'All', value: 'ALL' },
     21 +   { label: 'Admin', value: ROLES.ADMIN },
     22 +   { label: 'User', value: ROLES.USER },
     23 + ];
```

## X089: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 170; code from the final change.

```
(no code)
```

## X090: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 44; code from the final change.

```
     38 +           const role = form.watch('role');
     39 +           const search = form.watch('search');
     40 + 
     41 +           const filteredUsers = useMemo(() => {
     42 +             return users.filter((u) => {
     43 +               if (role && u.role !== role) return false;
>>   44 +               if (search) {
     45 +                 const lower = search.toLowerCase();
     46 +                 if (
     47 +                   !u.firstName.toLowerCase().includes(lower) &&
     48 +                   !u.lastName.toLowerCase().includes(lower) &&
     49 +                   !u.email.toLowerCase().includes(lower)
     50 +                 ) {
```

## X091: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 66; code from the agent's edit just before the finding (line numbers not known).

```
      cell: (tag) => tag.count,
    },
    {
      id: "createdAt",
      header: t("common.created_at"),
      headerClassName: "w-[20%]",
      align: "center",
      cellClassName: "whitespace-nowrap text-slate-900",
      skeletonWidth: "w-24",
      cell: (tag) => (
        <time dateTime={tag.createdAt}>
          {new Date(tag.createdAt).toLocaleDateString(locale, { dateStyle: "medium" })}
        </time>
      ),
    },
  ];
```

## X092: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 108; code from the final change.

```
    102 +   });
    103 + 
    104     return (
    105 +     <div className="space-y-4">
    106 +       <div className="flex items-center gap-4">
    107 +         <div className="relative flex-1">
>>  108 +           <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    109 +           <Input
    110 +             type="text"
    111 +             placeholder="Search by name or email"
    112 +             className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    113 +             value={search}
    114 +             onChange={(e) => setSearch(e.target.value)}
```

## X093: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 24; code from the final change.

```
(no code)
```

## X094: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 9; code from the final change.

```
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6 + import { ROLES } from '@/lib/authorization';
      7 + import { z } from 'zod';
      8   
>>    9 + export const getUsers = (params?: {
     10 +   role?: ROLES.ADMIN | ROLES.USER;
     11 +   search?: string;
     12 + }): Promise<{ data: User[] }> => {
     13 +   return api.get(`/users`, { params });
     14   };
     15   
```

## X095: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 10; code from the final change (the line may have moved since the finding).

```
      4 + import { formatDateForDisplay } from "@/lib/utils/datetime";
      5 + 
      6 + interface AccountActivityProps {
      7 +   createdAt: Date;
      8 +   lastLoginAt: Date | null;
      9 + }
>>   10 + 
     11 + export const AccountActivity = ({
     12 +   createdAt,
     13 +   lastLoginAt,
     14 + }: Readonly<AccountActivityProps>) => {
     15 +   const { t } = useTranslation();
     16 + 
```

## X096: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 55; code from the final change (the line may have moved since the finding).

```
     49 +     {
     50 +       id: "created",
     51 +       header: t("workspace.tags.created"),
     52 +       headerClassName: "w-[20%]",
     53 +       align: "right",
     54 +       cellClassName: "whitespace-nowrap text-slate-900",
>>   55 +       skeletonWidth: "w-20",
     56 +       cell: (tag) => formatDateForDisplay(new Date(tag.createdAt)),
     57 +     },
     58       {
     59         id: "count",
     60         header: t("workspace.tags.count"),
```

## X097: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import dayjs from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const HEADERS = ['Name', 'Email', 'Role', 'Date Joined'];
      6 + 
      7 + // Spreadsheet apps treat cells starting with these characters as formulas.
```

## X098: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 10; code from the final change (the line may have moved since the finding).

```
      4 + interface AccountActivityProps {
      5 +   createdAt: Date;
      6 +   lastLoginAt: Date | null;
      7 +   locale: string;
      8 + }
      9 + 
>>   10 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     11 +   const { t } = useTranslation();
     12 + 
     13 +   return (
     14 +     <div>
     15 +       <div className="mb-4 flex items-center gap-2">
     16 +         <span className="font-regular text-xs text-slate-700">{t("workspace.settings.profile.account_created")}:</span>
```

## X099: local/classnames-with-cn

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 62; code from the final change.

```
     56 +               {isPinned ? 'Unpin' : 'Pin'}
     57 +             </Button>
     58 +           </Authorization>
     59             <UpdateDiscussion discussionId={discussionId} />
     60           </div>
     61           <div>
```

## X100: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { usePinDiscussion } from '../api/pin-discussion';
      8 + 
      9 + type PinDiscussionProps = {
     10 +   discussionId: string;
```

## X101: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 12; code from the final change.

```
      6 +   users: User[],
      7 +   { role, search }: { role: RoleFilter; search: string },
      8 + ) => {
      9 +   const query = search.trim().toLowerCase();
     10 +   const selectedRoles: User['role'][] = role === 'ALL' ? [] : [role];
     11 + 
>>   12 +   return users.filter((user) => {
     13 +     if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) {
     14 +       return false;
     15 +     }
     16 +     if (!query) return true;
     17 + 
     18 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
```

## X102: local/no-non-null-assertion

`apps/react-vite/src/features/discussions/components/discussions-list.tsx` line 61; code from the final change.

```
     55 +               return <span>No comments yet</span>;
     56 +             }
     57 +             return (
     58 +               <span>
     59 +                 {commentCount} comment{commentCount !== 1 ? 's' : ''}
     60 +                 <br />
>>   61 +                 Last comment {lastCommentAt ? formatDate(lastCommentAt) : "Unknown"}
     62 +               </span>
     63 +             );
     64 +           },
     65 +         },
     66           {
     67             title: 'Created At',
```

## X103: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   changePasswordInputSchema,
      9 +   useChangePassword,
     10 + } from '../api/change-password';
     11 + 
```

## X104: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X105: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 169; code from the final change.

```
    163 + 
```

## X106: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + // Prefix cells that spreadsheets could read as formulas (CSV injection).
      6 + const escapeCell = (value: string) => {
      7 +   const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
```

## X107: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 63; code from the final change (the line may have moved since the finding).

```
     57 +             search: searchValue || undefined,
     58 +           },
     59 +         });
     60   
     61 +         if (usersQuery.isLoading) {
     62 +           return (
>>   63 +             <div className="flex h-48 w-full items-center justify-center">
     64 +               <Spinner size="lg" />
     65 +             </div>
     66 +           );
     67 +         }
     68   
     69 +         const users = usersQuery.data?.data;
```

## X108: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the final change.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X109: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { usePinDiscussion } from '../api/pin-discussion';
      8 + 
      9 + type PinDiscussionProps = {
     10 +   discussionId: string;
```

## X110: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X111: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-filters.tsx` line 50; code from the file as the agent wrote it.

```
     44 +             value={role}
     45 +             onChange={(event) =>
     46 +               onRoleChange(event.target.value as UserRoleFilter)
     47 +             }
     48 +           >
     49 +             <option value="ALL">All roles</option>
>>   50 +             <option value="ADMIN">Admin</option>
     51 +             <option value="USER">User</option>
     52 +           </select>
     53 +         </Label>
     54 +       </div>
     55 + 
     56 +       <Button variant="outline" onClick={onExport} disabled={!canExport}>
```

## X112: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 58; code from the final change (the line may have moved since the finding).

```
     52         cell: (tag) => (
     53           <TagNameInput tagId={tag.id} tagName={tag.name} workspaceId={workspaceId} isReadOnly={isReadOnly} />
     54         ),
     55       },
     56 +     {
     57 +       id: "createdAt",
>>   58 +       header: t("workspace.tags.created"),
     59 +       headerClassName: "w-[20%]",
     60 +       cellClassName: "whitespace-nowrap text-slate-900",
     61 +       skeletonWidth: "w-28",
     62 +       cell: (tag) => formatDateForDisplay(new Date(tag.createdAt), locale),
     63 +     },
     64       {
```

## X113: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 32; code from the final change.

```
     26 +   createdAt: number;
     27 +   id: string;
     28 + };
     29 + 
     30 + const ROLE_OPTIONS: RoleOption[] = [
     31 +   { label: 'All Roles', value: '' },
>>   32 +   { label: 'Admin', value: ROLES.ADMIN },
     33 +   { label: 'User', value: ROLES.USER },
     34 + ];
     35 + 
     36 + const exportUsersToCsv = (users: SearchableUser[]) => {
     37 +   const header = 'Name,Email,Role,Joined At';
     38 +   const rows = users.map((user) => {
```

## X114: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
     94 + 
```

## X115: local/schemas-in-api

`apps/react-vite/src/features/users/components/users-list.tsx` line 16; code from the final change (the line may have moved since the finding).

```
     10 + import { useUsers, filterUsersSchema } from '../api/get-users';
     11   
     12   import { DeleteUser } from './delete-user';
     13   
     14 + const roleOptions = [
     15 +   { label: 'All', value: 'ALL' },
>>   16 +   { label: 'Admin', value: ROLES.ADMIN },
     17 +   { label: 'User', value: ROLES.USER },
     18 + ];
     19 + 
     20 + const exportToCsv = (users: (typeof users)[0][]) => {
     21 +   const header = 'Name,Email,Role,Joined At\n';
     22 +   const rows = users
```

## X116: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 12; code from the final change.

```
      6 + interface IAccountActivityProps {
      7 +   createdAt: Date;
      8 +   lastLoginAt: Date | null;
      9 +   locale: string;
     10 + }
     11 + 
>>   12 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<IAccountActivityProps>) => {
     13 +   const { t } = useTranslation();
     14 + 
     15 +   return (
     16 +     <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
     17 +       <dt className="text-slate-500">{t("workspace.settings.profile.account_created")}</dt>
     18 +       <dd className="text-slate-900">{formatDateTimeForDisplay(createdAt, locale)}</dd>
```

## X117: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      2 + import { z } from 'zod';
      3   
      4   import { api } from '@/lib/api-client';
      5   import { QueryConfig } from '@/lib/react-query';
      6   import { User } from '@/types/api';
      7 + import { ROLES } from '@/lib/authorization';
>>    8   
      9 + export type GetUsersParams = {
     10 +   role?: ROLES.ADMIN | ROLES.USER;
     11 +   search?: string;
     12   };
     13   
     14 + export const getUsers = (
```

## X118: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/server-actions.ts` line 22; code from the final change.

```
(no code)
```

## X119: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 68; code from the final change.

```
     62 +     <div className="space-y-4">
     63 +       <div className="flex items-center gap-4">
     64 +         <Select
     65 +           label="Role"
     66 +           options={[
     67 +             { label: 'All Roles', value: '' },
>>   68 +             { label: 'Admin', value: ROLES.ADMIN },
     69 +             { label: 'User', value: ROLES.USER },
     70 +           ]}
     71 +           value={role}
     72 +           onChange={(value) => onRoleChange?.(value)}
     73 +           registration={{}}
     74 +           className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
```

## X120: local/readonly-props

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 136; code from the final change (the line may have moved since the finding).

```
    130       />
    131     );
    132   };
    133 + 
    134 + export const EditTagsWrapper = EditTagsWrapperInner;
    135 + 
>>  136 + /**
    137 +  * Button + confirmation dialog for bulk-deleting unused tags. Rendered as the `footer` of the
    138 +  * `SettingsCard` so the action is visible but doesn't compete with the per-row controls.
    139 +  */
    140 + const BulkDeleteUnusedTags = ({ workspaceId }: Readonly<{ workspaceId: string }>) => {
    141 +   const { t } = useTranslation();
    142 +   const [open, setOpen] = useState(false);
```

## X121: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 10; code from the agent's edit just before the finding (line numbers not known).

```
import { queryOptions, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { User } from '@/types/api';

export const usersFilterSchema = z.object({
  search: z.string(),
  role: z.enum(['ALL', 'ADMIN', 'USER']),
});

export type UsersFilters = z.infer<typeof usersFilterSchema>;

export const getUsers
```

## X122: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 21; code from the final change.

```
     15   
     16 + type UserRoleFilter = '' | ROLES.ADMIN | ROLES.USER;
     17 + 
     18 + const roleOptions = [
     19 +   { label: 'All', value: '' },
     20 +   { label: 'Admin', value: ROLES.ADMIN },
>>   21 +   { label: 'User', value: ROLES.USER },
     22 + ];
     23 + 
     24 + const exportUsersCsv = (users: { firstName: string; lastName: string; email: string; role: string; createdAt: number }[]) => {
     25 +   const header = 'Name,Email,Role,Joined\n';
     26 +   const rows = users
     27 +     .map((u) => {
```

## X123: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 10; code from the final change (the line may have moved since the finding).

```
      4 + import { TUser } from "@formbricks/types/user";
      5 + import { formatDateTimeForDisplay } from "@/lib/utils/datetime";
      6 + 
      7 + interface AccountActivityProps {
      8 +   user: TUser;
      9 + }
>>   10 + 
     11 + export const AccountActivity: React.FC<Readonly<AccountActivityProps>> = ({ user }) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   const formatDate = (date: Date | null): string => {
     15 +     if (!date) return t("common.not_available");
     16 +     return formatDateTimeForDisplay(date, user.locale);
```

## X124: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 29; code from the final change.

```
     23 +       value.toLowerCase().includes(query),
     24 +     );
     25 +   });
     26 + };
     27 + 
     28 + const exportUsers = (users: User[]) => {
>>   29 +   const rows = users.map((user) => [
     30 +     `${user.firstName} ${user.lastName}`,
     31 +     user.email,
     32 +     user.role,
     33 +     formatDate(user.createdAt),
     34 +   ]);
     35 + 
```

## X125: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { useDiscussion } from '../api/get-discussion';
      8 + import { usePinDiscussion } from '../api/pin-discussion';
      9 + 
     10 + type PinDiscussionProps = {
```

## X126: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 169; code from the final change.

```
(no code)
```

## X127: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + // Prefix cells that spreadsheets could interpret as formulas (CSV injection).
      6 + const escapeCell = (value: string) => {
      7 +   const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
```

## X128: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 9; code from the final change.

```
      3 + import { UsersFilter } from '../api/get-users';
      4 + 
      5 + export const filterUsers = (users: User[], { search, role }: UsersFilter) => {
      6 +   const query = search.trim().toLowerCase();
      7 + 
      8 +   return users.filter(
>>    9 +     ({ role: rowRole, firstName, lastName, email }) => {
     10 +       if (role !== 'ALL' && rowRole !== role) return false;
     11 +       if (!query) return true;
     12 + 
     13 +       const name = `${firstName} ${lastName}`.toLowerCase();
     14 +       return name.includes(query) || email.toLowerCase().includes(query);
     15 +     },
```

## X129: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/actions/download-my-data.ts` line 1; code from the final change.

```
(no code)
```

## X130: local/query-key-from-options

`apps/react-vite/src/features/comments/api/delete-comment.ts` line 31; code from the agent's edit just before the finding (line numbers not known).

```
      queryClient.invalidateQueries({
        queryKey: getInfiniteCommentsQueryOptions(discussionId).queryKey,
      });
      // The discussions list shows comment counts and the last comment time
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      onSuccess?.(...args);
```

## X131: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the final change.

```
      1 + import { Lock } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X132: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 60; code from the file as the agent wrote it.

```
     54 +                 })}
     55 +               />
     56 +               <Select
     57 +                 label="Role"
     58 +                 options={[
     59 +                   { label: 'All roles', value: 'ALL' },
>>   60 +                   { label: 'Admin', value: 'ADMIN' },
     61 +                   { label: 'User', value: 'USER' },
     62 +                 ]}
     63 +                 registration={register('role', {
     64 +                   onChange: (e) =>
     65 +                     setFilter((prev) => ({
     66 +                       ...prev,
```

## X133: local/notifications-in-mutation-hook

`apps/react-vite/src/features/auth/components/change-password.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X134: local/notifications-in-mutation-hook

`apps/react-vite/src/features/auth/components/change-password.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   updatePasswordInputSchema,
      8 +   useUpdatePassword,
      9 + } from '../api/update-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X135: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/update-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { Lock } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   updatePasswordInputSchema,
      9 +   useUpdatePassword,
     10 + } from '../api/update-password';
     11 + 
```

## X136: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 168; code from the final change.

```
    162     });
    163 + 
```

## X137: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 126; code from the final change.

```
(no code)
```

## X138: local/schemas-in-api

`apps/react-vite/src/features/users/components/users-list.tsx` line 36; code from the final change.

```
     30     return (
     31 +     <div className="space-y-4">
     32 +       <Form
     33 +         id="users-filters"
     34 +         onSubmit={() => {}}
     35 +         schema={getUsersQueryParamsSchema}
>>   36 +       >
     37 +         {(form) => {
     38 +           const role = form.watch('role');
     39 +           const search = form.watch('search');
     40 + 
     41 +           const filteredUsers = useMemo(() => {
     42 +             return users.filter((u) => {
```

## X139: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 16; code from the final change.

```
     10 +   role?: ROLES.ADMIN | ROLES.USER;
     11 +   search?: string;
     12 + }): Promise<{ data: User[] }> => {
     13 +   return api.get(`/users`, { params });
     14   };
     15   
>>   16 + export const getUsersQueryOptions = (params?: {
     17 +   role?: ROLES.ADMIN | ROLES.USER;
     18 +   search?: string;
     19 + }) => {
     20     return queryOptions({
     21 +     queryKey: params ? ['users', params] : ['users'],
     22 +     queryFn: () => getUsers(params),
```

## X140: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/workspace/tags/page.tsx` line 9; code from not recoverable.

```
(no code)
```

## X141: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from the final change.

```
(no code)
```

## X142: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 64; code from the file as the agent wrote it.

```
     58 +                 })}
     59 +               />
     60 +               <Select
     61 +                 label="Role"
     62 +                 options={[
     63 +                   { label: 'All roles', value: '' },
>>   64 +                   { label: 'Admin', value: 'ADMIN' },
     65 +                   { label: 'User', value: 'USER' },
     66 +                 ]}
     67 +                 registration={register('role', {
     68 +                   onChange: (e) =>
     69 +                     setFilter((prev) => ({ ...prev, role: e.target.value })),
     70 +                 })}
```

## X143: local/ui-button

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 58; code from the final change (the line may have moved since the finding).

```
     52 +           <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
     53 +             <Pin className="h-3 w-3" />
     54 +             Pinned
     55 +           </span>
     56 +         )}
     57 +       </div>
>>   58 +       {canPin && (
     59 +         <div className="mb-4 flex justify-end">
     60 +           <Button
     61 +             variant="outline"
     62 +             size="sm"
     63 +             onClick={() => togglePinMutation.mutate({ discussionId })}
     64 +             isLoading={togglePinMutation.isPending}
```

## X144: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 6; code from the final change (the line may have moved since the finding).

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4   import { MDPreview } from '@/components/ui/md-preview';
      5   import { Spinner } from '@/components/ui/spinner';
>>    6 + import { Authorization, ROLES } from '@/lib/authorization';
      7   import { formatDate } from '@/utils/format';
      8   
      9   import { useDiscussion } from '../api/get-discussion';
     10 + import { usePinDiscussion } from '../api/pin-discussion';
     11   import { UpdateDiscussion } from '../components/update-discussion';
     12   
```

## X145: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password-form.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { Lock } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePasswordForm = () => {
```

## X146: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 7; code from the final change (the line may have moved since the finding).

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Badge } from '@/components/ui/badge';
      4 + import { Button } from '@/components/ui/button';
      5   import { MDPreview } from '@/components/ui/md-preview';
      6   import { Spinner } from '@/components/ui/spinner';
>>    7 + import { Authorization, ROLES } from '@/lib/authorization';
      8   import { formatDate } from '@/utils/format';
      9   
     10   import { useDiscussion } from '../api/get-discussion';
     11   import { UpdateDiscussion } from '../components/update-discussion';
     12 + import { usePinDiscussion, useUnpinDiscussion } from '../api/pin-discussion';
     13   
```

## X147: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 54; code from the final change.

```
     48 +             onChange={(e) => setSearch(e.target.value || undefined)}
     49 +           />
     50 +         </div>
     51 +         <Select
     52 +           label=""
     53 +           options={[
>>   54 +             { label: 'All Roles', value: '' },
     55 +             { label: 'Admin', value: ROLES.ADMIN },
     56 +             { label: 'User', value: ROLES.USER },
     57 +           ]}
     58 +           defaultValue={role ?? ''}
     59 +           className="w-40"
     60 +           registration={{
```

## X148: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 61; code from the final change.

```
     55 +   if (!usersQuery.data?.data) return null;
     56   
     57 +   const hasFilters = role || search;
     58   
     59     return (
     60 +     <div className="space-y-4">
>>   61 +       <div className="flex items-center gap-3">
     62 +         <div className="relative flex-1">
     63 +           <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
     64 +           <Input
     65 +             type="text"
     66 +             placeholder="Search by name or email"
     67 +             value={search}
```

## X149: local/no-any

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 13; code from the final change (the line may have moved since the finding).

```
      7 + import { getDiscussionQueryOptions } from './get-discussion';
      8 + import { getDiscussionsQueryOptions } from './get-discussions';
      9 + 
     10 + export const pinDiscussion = ({
     11 +   discussionId,
     12 + }: {
>>   13 +   discussionId: string;
     14 + }): Promise<{ data: Discussion }> => {
     15 +   return api.patch(`/discussions/${discussionId}/pin`);
     16 + };
     17 + 
     18 + type UsePinDiscussionOptions = {
     19 +   mutationConfig?: MutationConfig<typeof pinDiscussion>;
```

## X150: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-filters.tsx` line 7; code from the file as the agent wrote it.

```
      1 + import { Input, Select } from '@/components/ui/form';
      2 + 
      3 + import { UserFilters, UserRoleFilter } from '../utils/filter-users';
      4 + 
      5 + const ROLE_OPTIONS = [
      6 +   { label: 'All roles', value: 'ALL' },
>>    7 +   { label: 'Admin', value: 'ADMIN' },
      8 +   { label: 'User', value: 'USER' },
      9 + ];
     10 + 
     11 + type UsersFiltersProps = {
     12 +   filters: UserFilters;
     13 +   onFiltersChange: (filters: Partial<UserFilters>) => void;
```

## X151: eslint

`apps/react-vite/src/testing/mocks/db.ts` line 143; code from the final change (the line may have moved since the finding).

```
    137 +       body: 'This is a welcome discussion for new team members.',
    138 +       authorId: user1.id,
    139 +       teamId: team1.id,
    140 +     });
    141 +     const discussion2 = db.discussion.create({
    142 +       title: 'Project roadmap Q4',
>>  143 +       body: 'Let us discuss the project roadmap for Q4.',
    144 +       authorId: user1.id,
    145 +       teamId: team1.id,
    146 +     });
    147 +     const discussion3 = db.discussion.create({
    148 +       title: 'Design system updates',
    149 +       body: 'Updates to our design system components.',
```

## X152: local/query-key-from-options

`apps/react-vite/src/features/users/api/get-users.ts` line 33; code from the final change (the line may have moved since the finding).

```
     27   type UseUsersOptions = {
     28     queryConfig?: QueryConfig<typeof getUsersQueryOptions>;
     29 +   params?: GetUsersParams;
     30   };
     31   
     32 + export const useUsers = ({ queryConfig, params }: UseUsersOptions = {}) => {
>>   33     return useQuery({
     34 +     ...getUsersQueryOptions(params),
     35       ...queryConfig,
     36     });
     37   };
     38 + 
     39 + export const usersFilterSchema = z.object({
```

## X153: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 52; code from the agent's edit just before the finding (line numbers not known).

```
      ]}
      />
    </div>
  );
```

## X154: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/DownloadMyData.tsx` line 22; code from the final change.

```
     16 +   userEmail: string;
     17 +   userLocale: string;
     18 +   notificationSettings: TUserNotificationSettings;
     19 +   organizationMemberships: TOrganizationMembership[];
     20 + }
     21 + 
>>   22 + export const DownloadMyData = ({
     23 +   userName,
     24 +   userEmail,
     25 +   userLocale,
     26 +   notificationSettings,
     27 +   organizationMemberships,
     28 + }: Readonly<DownloadMyDataProps>) => {
```

## X155: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      2   
      3 + import { ROLES } from '@/lib/authorization';
      4   import { api } from '@/lib/api-client';
      5   import { QueryConfig } from '@/lib/react-query';
      6   import { User } from '@/types/api';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: keyof typeof ROLES;
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (
     14 +   params?: GetUsersParams,
```

## X156: local/ui-button

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 66; code from the final change (the line may have moved since the finding).

```
     62             </div>
     63           </div>
     64         </div>
     65 +       <div className="mt-4 flex items-center gap-2">
>>   66 +         {canAdmin && (
     67 +           <Button
     68 +             variant="outline"
     69 +             size="sm"
     70 +             onClick={() => pinMutation.mutate({ discussionId })}
     71 +             isLoading={pinMutation.isPending}
     72 +             icon={discussion.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
```

## X157: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 17; code from the final change.

```
     11 +   users: User[],
     12 +   { role, search }: UserFilters,
     13 + ): User[] => {
     14 +   const query = search.trim().toLowerCase();
     15 + 
     16 +   return users.filter((user) => {
>>   17 +     if (role !== 'ALL' && user.role !== role) return false;
     18 +     if (!query) return true;
     19 + 
     20 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     21 +     return name.includes(query) || user.email.toLowerCase().includes(query);
     22 +   });
     23 + };
```

## X158: local/roles-from-enum

`apps/react-vite/src/features/users/utils/filter-users.ts` line 5; code from the file as the agent wrote it.

```
      1 + import { User } from '@/types/api';
      2 + 
      3 + export type RoleFilter = User['role'] | 'ALL';
      4 + 
>>    5 + type FilterUsersOptions = {
      6 +   search: string;
      7 +   role: RoleFilter;
      8 + };
      9 + 
     10 + export const filterUsers = (
     11 +   users: User[],
```

## X159: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X160: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the final change.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X161: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 44; code from the file as the agent wrote it.

```
     38 +         <div className="sm:w-40">
     39 +           <Select
     40 +             label="Role"
     41 +             defaultValue="ALL"
     42 +             options={[
     43 +               { label: 'All roles', value: 'ALL' },
>>   44 +               { label: 'Admin', value: 'ADMIN' },
     45 +               { label: 'User', value: 'USER' },
     46 +             ]}
     47 +             registration={{
     48 +               name: 'role',
     49 +               onChange: (event) => onRoleChange(event.target.value as RoleFilter),
     50 +             }}
```

## X162: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 169; code from the final change.

```
(no code)
```

## X163: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 49; code from the final change.

```
(no code)
```

## X164: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { useDiscussion } from '../api/get-discussion';
      8 + import { usePinDiscussion } from '../api/pin-discussion';
      9 + 
     10 + type PinDiscussionProps = {
```

## X165: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 78; code from the final change (the line may have moved since the finding).

```
     72 +           document.body.appendChild(link);
     73 +           link.click();
     74 +           document.body.removeChild(link);
     75 +         };
     76 + 
     77 +         if (usersQuery.isLoading) {
>>   78 +           return (
     79 +             <div className="flex h-48 w-full items-center justify-center">
     80 +               <Spinner size="lg" />
     81 +             </div>
     82 +           );
     83 +         }
     84 + 
```

## X166: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const FORMULA_PREFIX = /^[=+\-@\t\r]/;
      6 + 
      7 + const escapeCell = (value: string) => {
```

## X167: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 34; code from the final change.

```
     28 + 
     29 +   const { onSuccess, ...restConfig } = mutationConfig || {};
     30 + 
     31 +   return useMutation({
     32 +     onSuccess: (data, ...args) => {
     33 +       addNotification({
>>   34 +         type: 'success',
     35 +         title: 'Discussion Pinned',
     36 +       });
     37 +       queryClient.refetchQueries({
     38 +         queryKey: getDiscussionQueryOptions(data.id).queryKey,
     39 +       });
     40 +       queryClient.invalidateQueries({
```

## X168: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 99; code from the final change.

```
(no code)
```

## X169: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 75; code from the final change.

```
(no code)
```

## X170: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 12; code from the final change.

```
      6 +   users: User[],
      7 +   { search }: UsersFilterInput,
      8 + ) => {
      9 +   const query = search.trim().toLowerCase();
     10 + 
     11 +   return users.filter((user) => {
>>   12 +     if (!query) return true;
     13 + 
     14 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     15 +     return name.includes(query) || user.email.toLowerCase().includes(query);
     16 +   });
     17 + };
```

## X171: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 33; code from the final change (the line may have moved since the finding).

```
     27 +   onSearchChange,
     28 +   onExportClick,
     29 + }: UsersToolbarProps) => {
     30 +   const handleClearSearch = () => onSearchChange('');
     31 + 
     32 +   return (
>>   33 +     <div className="mb-4 flex items-center gap-3">
     34 +       <div className="relative flex-1">
     35 +         <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
     36 +         <Input
     37 +           type="text"
     38 +           placeholder="Search by name or email..."
     39 +           value={searchQuery}
```

## X172: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 73; code from the final change.

```
     67 +             { label: 'All Roles', value: '' },
     68 +             { label: 'Admin', value: ROLES.ADMIN },
     69 +             { label: 'User', value: ROLES.USER },
     70 +           ]}
     71 +           value={role}
     72 +           onChange={(value) => onRoleChange?.(value)}
>>   73 +           registration={{}}
     74 +           className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
     75 +         />
     76 +         <div className="relative flex-1">
     77 +           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
     78 +           <Input
     79 +             type="text"
```

## X173: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from not recoverable.

```
(no code)
```

## X174: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   changePasswordInputSchema,
      9 +   useChangePassword,
     10 + } from '../api/change-password';
     11 + 
```

## X175: local/schemas-in-api

`apps/react-vite/src/features/users/components/users-list.tsx` line 36; code from the final change.

```
     30     return (
     31 +     <div className="space-y-4">
     32 +       <Form
     33 +         id="users-filters"
     34 +         onSubmit={() => {}}
     35 +         schema={getUsersQueryParamsSchema}
>>   36 +       >
     37 +         {(form) => {
     38 +           const role = form.watch('role');
     39 +           const search = form.watch('search');
     40 + 
     41 +           const filteredUsers = useMemo(() => {
     42 +             return users.filter((u) => {
```

## X176: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 16; code from the final change (the line may have moved since the finding).

```
     10 +   locale: string | null;
     11 + }
     12 + 
     13 + const DATE_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
     14 +   year: "numeric",
     15 +   month: "short",
>>   16 +   day: "numeric",
     17 + };
     18 + 
     19 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     20 +   const { t } = useTranslation();
     21 + 
     22 +   const displayLocale = locale ?? "en-US";
```

## X177: local/ui-button

`apps/react-vite/src/features/users/components/users-list.tsx` line 114; code from the final change.

```
    108   
    109     return (
    110 +     <div className="space-y-4">
    111 +       <div className="flex items-center gap-3">
    112 +         <div className="relative flex-1">
    113 +           <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
>>  114 +           <Input
    115 +             type="text"
    116 +             placeholder="Search by name or email"
    117 +             label=""
    118 +             className="pr-9"
    119 +             {...searchRegistration}
    120 +           />
```

## X178: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 82; code from the final change.

```
(no code)
```

## X179: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 26; code from the final change.

```
     20     return queryOptions({
     21 +     queryKey: params ? ['users', params] : ['users'],
     22 +     queryFn: () => getUsers(params),
     23     });
     24   };
     25   
>>   26 + export const getUsersQueryParamsSchema = z.object({
     27 +   role: z.nativeEnum(ROLES).optional(),
     28 +   search: z.string().optional(),
     29 + });
     30 + 
     31 + export type GetUsersQueryParams = z.infer<typeof getUsersQueryParamsSchema>;
     32 + 
```

## X180: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 35; code from the final change.

```
     29   
     30 +   const query = search.trim().toLowerCase();
     31 +   const filteredUsers = users.filter(
     32 +     (user) =>
     33 +       !query ||
     34 +       `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
>>   35 +       user.email.toLowerCase().includes(query),
     36 +   );
     37 + 
     38 +   const exportCsv = () => {
     39 +     downloadCsv(
     40 +       'users.csv',
     41 +       toCsv(
```

## X181: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 9; code from the final change.

```
      3 + 
      4 + import { type UsersFilterValues } from '../api/get-users';
      5 + 
      6 + export const filterUsers = (users: User[], filters: UsersFilterValues) => {
      7 +   const search = filters.search.trim().toLowerCase();
      8 +   const allowedRoles: string[] =
>>    9 +     filters.role === 'ALL' ? Object.values(ROLES) : [filters.role];
     10 + 
     11 +   return users.filter((user) => {
     12 +     const matchesRole = allowedRoles.includes(user.role);
     13 + 
     14 +     if (!matchesRole) return false;
     15 + 
```

## X182: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 20; code from the file as the agent wrote it.

```
     14 +   onExport: () => void;
     15 +   canExport: boolean;
     16 + };
     17 + 
     18 + const roleOptions = [
     19 +   { label: 'All roles', value: 'ALL' },
>>   20 +   { label: 'Admin', value: 'ADMIN' },
     21 +   { label: 'User', value: 'USER' },
     22 + ];
     23 + 
     24 + export const UsersToolbar = ({
     25 +   search,
     26 +   onSearchChange,
```

## X183: local/shared-date-formatting

`apps/web/modules/integrations/webhooks/components/webhook-row-data.tsx` line 124; code from the agent's edit just before the finding (line numbers not known).

```
interface WebhookRowDataProps {
  webhook: Webhook;
  surveys: TSurvey[];
  surveyVisibilityEnabled: boolean;
  isReadOnly: boolean;
  isDuplicating: boolean;
  onOpen: (webhook: Webhook) => void;
  onDuplicate: (webhook: Webhook) => void;
}

export const WebhookRowData = ({
  webhook,
  surveys,
  surveyVisibilityEnabled,
  isReadOnly,
  isDuplicating,
  onOpen,
  onDuplicate,
}: Readonly<WebhookRowDataProps>) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage ?? i18n.language ?? "en-US";

  return (
    <div className="mt-2 grid grid-cols-12 items-center rounded-lg py-2 hover:bg-slate-100">
      {/* The duplicate button sits outside this button so the two interactive elements are not nested. */}
      <button type="button" onClick={() => onOpen(webhook)} className="col-span-11 grid grid-cols-11 text-left">
        <div className="col-span-3 flex items-center truncate pl-6 text-sm">
          <div className="flex items-center">
            <div className="text-left">
              {webhook.name ? (
                <div className="text-left">
                  <div className="font-medium text-slate-900">{webhook.name}</div>
                  <div className="text-xs text-slate-400">{webhook.url}</div>
                </div>
              ) : (
                <div className="font-medium text-slate-900">{webhook.url}</div>
              )}
            </div>
          </div>
        </div>
```

## X184: local/types-not-interfaces

`apps/react-vite/src/components/ui/badge/badge.tsx` line 22; code from the final change (the line may have moved since the finding).

```
     16 +     defaultVariants: {
     17 +       variant: 'default',
     18 +     },
     19 +   },
     20 + );
     21 + 
>>   22 + export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
     23 +   VariantProps<typeof badgeVariants>;
     24 + 
     25 + function Badge({ className, variant, ...props }: BadgeProps) {
     26 +   return (
     27 +     <div className={cn(badgeVariants({ variant }), className)} {...props} />
     28 +   );
```

## X185: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/update-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   updatePasswordInputSchema,
      9 +   useUpdatePassword,
     10 + } from '../api/update-password';
     11 + 
```

## X186: local/ui-button

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 41; code from the final change (the line may have moved since the finding).

```
     35 +         <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
     36 +         <Input
     37 +           type="text"
     38 +           placeholder="Search by name or email..."
     39 +           value={searchQuery}
     40 +           onChange={(e) => onSearchChange(e.target.value)}
>>   41 +           className="pl-9 pr-9"
     42 +           registration={{}}
     43 +         />
     44 +         {searchQuery && (
     45 +           <Button
     46 +             variant="ghost"
     47 +             size="icon"
```

## X187: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/workspace/integrations/webhooks/page.tsx` line 22; code from not recoverable.

```
(no code)
```

## X188: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 9; code from the final change.

```
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6 + import { ROLES } from '@/lib/authorization';
      7 + import { z } from 'zod';
      8   
>>    9 + export const getUsers = (params?: {
     10 +   role?: ROLES.ADMIN | ROLES.USER;
     11 +   search?: string;
     12 + }): Promise<{ data: User[] }> => {
     13 +   return api.get(`/users`, { params });
     14   };
     15   
```

## X189: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 85; code from the final change.

```
(no code)
```

## X190: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the final change.

```
>>    1 + import { User } from '@/types/api';
      2 + import { formatDate } from '@/utils/format';
      3 + 
      4 + const HEADERS = ['Name', 'Email', 'Role', 'Joined'];
      5 + 
      6 + const escapeCsvValue = (value: string) => {
      7 +   // Prefix values that spreadsheet apps would evaluate as formulas (CSV injection).
```

## X191: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 44; code from the file as the agent wrote it.

```
     38 +     link.remove();
     39 +     // Revoked on the next task: some browsers read the URL only after `click()` has returned.
     40 +     setTimeout(() => URL.revokeObjectURL(url), 0);
     41 +   }
     42 + };
     43 + 
>>   44 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: AccountActivityProps) => {
     45 +   const { t } = useTranslation();
     46 +   const [isDownloading, setIsDownloading] = useState(false);
     47 + 
     48 +   const formatActivityDate = (date: Date) => formatDateTimeForDisplay(date, locale, ACTIVITY_DATE_OPTIONS);
     49 + 
     50 +   const handleDownloadMyData = async () => {
```

## X192: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from not recoverable.

```
(no code)
```

## X193: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from the final change.

```
(no code)
```

## X194: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 170; code from the final change.

```
(no code)
```

## X195: local/schemas-in-api

`apps/react-vite/src/features/users/components/users-list.tsx` line 40; code from the final change (the line may have moved since the finding).

```
     34 +   const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
     35 +   const url = URL.createObjectURL(blob);
     36 +   const link = document.createElement('a');
     37 +   link.href = url;
     38 +   link.download = 'users.csv';
     39 +   link.click();
>>   40 +   URL.revokeObjectURL(url);
     41 + };
     42 + 
     43   export const UsersList = () => {
     44 +   return (
     45 +     <Form<FilterUsersInput, typeof filterUsersSchema>
     46 +       schema={filterUsersSchema}
```

## X196: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 123; code from the final change.

```
    117 +             label=""
    118 +             className="pr-9"
    119 +             {...searchRegistration}
    120 +           />
    121 +           {search && (
    122 +             <Button
>>  123 +               variant="ghost"
    124 +               size="icon"
    125 +               onClick={handleClearSearch}
    126 +               className="absolute right-1 top-1/2 size-6 -translate-y-1/2 text-muted-foreground hover:text-foreground"
    127 +             >
    128 +               <X className="size-4" />
    129 +             </Button>
```

## X197: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-list.tsx` line 2; code from the file as the agent wrote it.

```
      1 + import { useMemo } from 'react';
>>    2 + import { useForm } from 'react-hook-form';
      3 + 
      4 + import { Button } from '@/components/ui/button';
      5 + import { Input, Select } from '@/components/ui/form';
      6 + import { Spinner } from '@/components/ui/spinner';
      7 + import { Table } from '@/components/ui/table';
      8 + import { formatDate } from '@/utils/format';
```

## X198: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 11; code from the agent's edit just before the finding (line numbers not known).

```
export const usersFilterSchema = z.object({
  search: z.string(),
  role: z.enum(['ALL', 'ADMIN', 'USER']),
});

export type UsersFilter = z.infer<typeof usersFilterSchema>;

export const getUsers =
```

## X199: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 58; code from the final change (the line may have moved since the finding).

```
     52           <TagNameInput tagId={tag.id} tagName={tag.name} workspaceId={workspaceId} isReadOnly={isReadOnly} />
     53         ),
     54       },
     55 +     {
     56 +       id: "createdAt",
     57 +       header: t("workspace.tags.created"),
>>   58 +       headerClassName: "w-[20%]",
     59 +       cellClassName: "whitespace-nowrap text-slate-900",
     60 +       skeletonWidth: "w-20",
     61 +       cell: (tag) => formatDateForDisplay(new Date(tag.createdAt), locale),
     62 +     },
     63       {
     64         id: "count",
```

## X200: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the final change.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { Authorization, ROLES } from '@/lib/authorization';
      5 + 
      6 + import { usePinDiscussion } from '../api/pin-discussion';
      7 + 
      8 + type PinDiscussionProps = {
      9 +   discussionId: string;
     10 +   pinned: boolean;
```

## X201: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 14; code from the final change.

```
      8 + };
      9 + 
     10 + export const filterUsers = (users: User[], { search, role }: UserFilters) => {
     11 +   const query = search.trim().toLowerCase();
     12 + 
     13 +   return users.filter((user) => {
>>   14 +     if (role !== 'ALL' && user.role !== role) {
     15 +       return false;
     16 +     }
     17 + 
     18 +     if (!query) {
     19 +       return true;
     20 +     }
```

## X202: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/update-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   updatePasswordInputSchema,
      9 +   useUpdatePassword,
     10 + } from '../api/update-password';
     11 + 
```

## X203: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadMyDataButton.tsx` line 12; code from the final change.

```
      6 + import { Button } from "@/modules/ui/components/button";
      7 + 
      8 + interface DownloadMyDataButtonProps {
      9 +   data: TUserDataExport;
     10 + }
     11 + 
>>   12 + export const DownloadMyDataButton = ({ data }: Readonly<DownloadMyDataButtonProps>) => {
     13 +   const { t } = useTranslation();
     14 + 
     15 +   const handleDownload = () => {
     16 +     const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
     17 +     const url = URL.createObjectURL(blob);
     18 + 
```

## X204: local/query-key-from-options

`apps/react-vite/src/features/comments/api/create-comment.ts` line 44; code from the agent's edit just before the finding (line numbers not known).

```
      queryClient.invalidateQueries({
        queryKey: getInfiniteCommentsQueryOptions(discussionId).queryKey,
      });
      // The discussions list shows comment counts and the last comment time
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      onSuccess?.(...args);
```

## X205: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 17; code from the final change (the line may have moved since the finding).

```
     11 +   const { t } = useTranslation();
     12 + 
     13 +   return (
     14 +     <div className="space-y-3">
     15 +       <div>
     16 +         <Small color="muted">{t("workspace.settings.profile.account_created")}</Small>
>>   17 +         <p className="mt-1 text-sm text-slate-900">{formatDate(user.createdAt, user.locale)}</p>
     18 +       </div>
     19 +       <div>
     20 +         <Small color="muted">{t("workspace.settings.profile.last_login")}</Small>
     21 +         <p className="mt-1 text-sm text-slate-900">
     22 +           {user.lastLoginAt ? formatDate(user.lastLoginAt, user.locale) : t("common.not_available")}
     23 +         </p>
```

## X206: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X207: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/toggle-discussion-pinned.tsx` line 4; code from the final change (the line may have moved since the finding).

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { Authorization, ROLES } from '@/lib/authorization';
      5 + 
      6 + import { useToggleDiscussionPinned } from '../api/toggle-discussion-pinned';
      7 + 
      8 + type ToggleDiscussionPinnedProps = {
      9 +   discussionId: string;
     10 +   isPinned: boolean;
```

## X208: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 17; code from the file as the agent wrote it.

```
     11 + import { filterUsers, RoleFilter } from '../utils/filter-users';
     12 + 
     13 + import { DeleteUser } from './delete-user';
     14 + 
     15 + const ROLE_OPTIONS = [
     16 +   { label: 'All roles', value: 'ALL' },
>>   17 +   { label: 'Admin', value: 'ADMIN' },
     18 +   { label: 'User', value: 'USER' },
     19 + ];
     20 + 
     21 + export const UsersList = () => {
     22 +   const usersQuery = useUsers();
     23 +   const [role, setRole] = useState<RoleFilter>('ALL');
```

## X209: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/page.tsx` line 30; code from the agent's edit just before the finding (line numbers not known).

```
// Locale comes from the user's setting; the time zone is explicit (UTC) because no product-level
// time zone exists and the server's own zone must not leak into the output.
const formatActivityDate = (date: Date, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date);

const Page = async () => {
```

## X210: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   changePasswordInputSchema,
      9 +   useChangePassword,
     10 + } from '../api/change-password';
     11 + 
```

## X211: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 15; code from the final change (the line may have moved since the finding).

```
      9 + }
     10 + 
     11 + export const AccountActivity = ({ user }: Readonly<AccountActivityProps>) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   return (
>>   15 +     <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
     16 +       <div className="flex-1">
     17 +         <p className="text-sm text-slate-500">{t("workspace.settings.profile.account_created")}</p>
     18 +         <p className="mt-1 font-medium">
     19 +           {formatDateTimeForDisplay(user.createdAt, user.locale)}
     20 +         </p>
     21 +       </div>
```

## X212: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 169; code from the final change.

```
(no code)
```

## X213: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 17; code from the final change.

```
     11 +   `${user.firstName} ${user.lastName}`;
     12 + 
     13 + export const filterUsers = (users: User[], { search, role }: UserFilters) => {
     14 +   const query = search.trim().toLowerCase();
     15 + 
     16 +   return users.filter((user) => {
>>   17 +     if (role !== 'ALL' && user.role !== role) return false;
     18 +     if (!query) return true;
     19 + 
     20 +     return (
     21 +       getFullName(user).toLowerCase().includes(query) ||
     22 +       user.email.toLowerCase().includes(query)
     23 +     );
```

## X214: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 34; code from the final change.

```
     28 + 
     29 +   return useMutation({
     30 +     onSuccess: (data, ...args) => {
     31 +       queryClient.refetchQueries({
     32 +         queryKey: getDiscussionsQueryOptions().queryKey,
     33 +       });
>>   34 +       queryClient.refetchQueries({
     35 +         queryKey: getDiscussionQueryOptions(data.id).queryKey,
     36 +       });
     37 +       onSuccess?.(data, ...args);
     38 +     },
     39 +     ...restConfig,
     40 +     mutationFn: pinDiscussion,
```

## X215: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 17; code from the final change (the line may have moved since the finding).

```
     11   
     12 + import { ROLES } from '@/lib/authorization';
     13 + import { usersFilterSchema } from '@/features/users/api/get-users';
     14 + 
     15   import { useUsers } from '../api/get-users';
     16   
>>   17   import { DeleteUser } from './delete-user';
     18   
     19 + type RoleOption = {
     20 +   label: string;
     21 +   value: string;
     22 + };
     23 + 
```

## X216: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import dayjs from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + import { getFullName } from './filter-users';
      6 + 
      7 + const CSV_HEADERS = ['Name', 'Email', 'Role', 'Joined'];
```

## X217: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadMyDataButton.tsx` line 19; code from the file as the agent wrote it.

```
     13 + }
     14 + 
     15 + interface DownloadMyDataButtonProps {
     16 +   data: TUserDataExport;
     17 + }
     18 + 
>>   19 + export const DownloadMyDataButton = ({ data }: DownloadMyDataButtonProps) => {
     20 +   const { t } = useTranslation();
     21 + 
     22 +   const handleDownload = () => {
     23 +     const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
     24 +     const url = URL.createObjectURL(blob);
     25 +     const link = document.createElement("a");
```

## X218: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 10; code from the agent's edit just before the finding (line numbers not known).

```
export const usersFilterSchema = z.object({
  search: z.string(),
  role: z.enum(['', 'ADMIN', 'USER']),
});

export type UsersFilter = z.infer<typeof usersFilterSchema>;

export const getUsers =
```

## X219: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change.

```
      2   
      3 + import { ROLES } from '@/lib/authorization';
      4   import { api } from '@/lib/api-client';
      5   import { QueryConfig } from '@/lib/react-query';
      6   import { User } from '@/types/api';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: ROLES.ADMIN | ROLES.USER;
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (
     14 +   params?: GetUsersParams,
```

## X220: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import dayjs from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const CSV_HEADERS = ['Name', 'Email', 'Role', 'Joined'];
      6 + 
      7 + // Cells starting with these characters are interpreted as formulas by
```

## X221: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 12; code from the final change.

```
      6 +   return users.filter((user) => {
      7 +     if (!query) return true;
      8 + 
      9 +     const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
     10 +     const email = user.email.toLowerCase();
     11 + 
>>   12 +     return fullName.includes(query) || email.includes(query);
     13 +   });
     14 + };
```

## X222: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/server-actions.ts` line 14; code from the final change.

```
(no code)
```

## X223: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 24; code from the final change.

```
     18 +   value: string;
     19 + };
     20 + 
     21 + type SearchableUser = {
     22 +   firstName: string;
     23 +   lastName: string;
>>   24 +   email: string;
     25 +   role: ROLES.ADMIN | ROLES.USER;
     26 +   createdAt: number;
     27 +   id: string;
     28 + };
     29 + 
     30 + const ROLE_OPTIONS: RoleOption[] = [
```

## X224: local/readonly-props

`apps/web/modules/workspaces/settings/tags/page.tsx` line 137; code from the final change.

```
    131 +     </>
    132 +   );
    133 + };
    134 + 
    135 + interface DeleteUnusedTagsBarProps {
    136 +   workspaceId: string;
>>  137 +   tags: TV3Tag[];
    138 + }
    139 + 
    140 + const DeleteUnusedTagsBar = ({ workspaceId, tags }: Readonly<DeleteUnusedTagsBarProps>) => {
    141 +   const { t, i18n } = useTranslation();
    142 +   const locale = i18n.resolvedLanguage ?? i18n.language ?? "en-US";
    143 +   const [openDialog, setOpenDialog] = useState(false);
```

## X225: local/types-not-interfaces

`apps/react-vite/src/components/ui/badge/badge.tsx` line 26; code from the final change.

```
     20 +     defaultVariants: {
     21 +       variant: 'default',
     22 +     },
     23 +   },
     24 + );
     25 + 
>>   26 + export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
     27 +   VariantProps<typeof badgeVariants>;
     28 + 
     29 + const Badge = ({ className, variant, ...props }: BadgeProps) => {
     30 +   return (
     31 +     <div className={cn(badgeVariants({ variant }), className)} {...props} />
     32 +   );
```

## X226: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 14; code from the final change.

```
      8 +   return users.filter((user) => {
      9 +     const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
     10 +     return fullName.includes(query) || user.email.toLowerCase().includes(query);
     11 +   });
     12 + };
```

## X227: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 7; code from the final change.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Badge } from '@/components/ui/badge';
      4 + import { Button } from '@/components/ui/button';
      5   import { MDPreview } from '@/components/ui/md-preview';
      6   import { Spinner } from '@/components/ui/spinner';
>>    7 + import { Authorization, ROLES } from '@/lib/authorization';
      8   import { formatDate } from '@/utils/format';
      9   
     10   import { useDiscussion } from '../api/get-discussion';
     11 + import { usePinDiscussion } from '../api/pin-discussion';
     12   import { UpdateDiscussion } from '../components/update-discussion';
     13   
```

## X228: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 14; code from the final change.

```
      8 + };
      9 + 
     10 + export const filterUsers = (users: User[], { search, role }: UsersFilter) => {
     11 +   const query = search.trim().toLowerCase();
     12 + 
     13 +   return users.filter((user) => {
>>   14 +     if (role !== 'ALL' && user.role !== role) {
     15 +       return false;
     16 +     }
     17 + 
     18 +     if (!query) {
     19 +       return true;
     20 +     }
```

## X229: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadUserDataButton.tsx` line 11; code from the final change.

```
      5 + import { Button } from "@/modules/ui/components/button";
      6 + 
      7 + interface DownloadUserDataButtonProps {
      8 +   data: TUserDataExport;
      9 + }
     10 + 
>>   11 + export const DownloadUserDataButton = ({ data }: Readonly<DownloadUserDataButtonProps>) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   const handleDownload = () => {
     15 +     const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
     16 +     const url = URL.createObjectURL(blob);
     17 + 
```

## X230: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 169; code from the final change.

```
(no code)
```

## X231: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change.

```
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6 + import { ROLES } from '@/lib/authorization';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: ROLES.ADMIN | ROLES.USER;
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (
     14 +   params?: GetUsersParams,
```

## X232: local/no-any

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 13; code from the final change (the line may have moved since the finding).

```
      7 + 
      8 + import { getDiscussionsQueryOptions } from './get-discussions';
      9 + import { getDiscussionQueryOptions } from './get-discussion';
     10 + 
     11 + export const pinDiscussion = ({
     12 +   discussionId,
>>   13 + }: {
     14 +   discussionId: string;
     15 + }): Promise<Discussion> => {
     16 +   return api.post(`/discussions/${discussionId}/pin`);
     17 + };
     18 + 
     19 + export const unpinDiscussion = ({
```

## X233: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 18; code from the file as the agent wrote it.

```
     12 + import { downloadUsersCsv } from '../utils/export-users-csv';
     13 + 
     14 + import { DeleteUser } from './delete-user';
     15 + 
     16 + const ROLE_OPTIONS = [
     17 +   { label: 'All roles', value: 'ALL' },
>>   18 +   { label: 'Admin', value: 'ADMIN' },
     19 +   { label: 'User', value: 'USER' },
     20 + ];
     21 + 
     22 + export const UsersList = () => {
     23 +   const usersQuery = useUsers();
     24 +   const [search, setSearch] = React.useState('');
```

## X234: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 66; code from the final change.

```
     60 +     { label: 'User', value: ROLES.USER },
     61 +   ];
     62 + 
     63     return (
     64 +     <div className="space-y-4">
     65 +       <div className="flex items-center gap-4">
>>   66 +         <Select
     67 +           options={roleOptions}
     68 +           value={roleFilter}
     69 +           onChange={(e) => setRoleFilter(e.target.value as ROLES.ADMIN | ROLES.USER | '')}
     70 +           className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
     71 +           registration={{}}
     72 +         />
```

## X235: local/readonly-props

`apps/web/modules/integrations/webhooks/components/webhooks-query-client-provider.tsx` line 6; code from the file as the agent wrote it.

```
      1 + "use client";
      2 + 
      3 + import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
      4 + import { type ReactNode, useState } from "react";
      5 + 
>>    6 + export const WebhooksQueryClientProvider = ({ children }: { children: ReactNode }) => {
      7 +   const [queryClient] = useState(() => new QueryClient());
      8 + 
      9 +   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
     10 + };
     11 + 
```

## X236: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 48; code from the final change.

```
     42 + 
     43 +   return (
     44 +     <div>
     45 +       <div className="mb-4 flex items-center gap-8">
     46 +         <div>
     47 +           <H4 className="mb-1 font-medium tracking-normal">
>>   48 +             {t("workspace.settings.profile.account_created")}
     49 +           </H4>
     50 +           <Small color="muted">
     51 +             {formatDateForDisplay(user.createdAt, locale, {
     52 +               year: "numeric",
     53 +               month: "long",
     54 +               day: "numeric",
```

## X237: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/actions/download-my-data.ts` line 9; code from the final change.

```
(no code)
```

## X238: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6 + import { ROLES } from '@/lib/authorization';
      7 + import { z } from 'zod';
>>    8   
      9 + export type GetUsersParams = {
     10 +   role?: ROLES;
     11 +   search?: string;
     12   };
     13   
     14 + export const getUsers = (
```

## X239: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 29; code from the final change.

```
     23 +       `${user.firstName} ${user.lastName}`.toLowerCase().includes(term) ||
     24 +       user.email.toLowerCase().includes(term)
     25 +     );
     26 +   });
     27 + };
     28 + 
>>   29   export const UsersList = () => {
     30     const usersQuery = useUsers();
     31 +   const [search, setSearch] = React.useState('');
     32 + 
     33 +   const users = usersQuery.data?.data;
     34 + 
     35 +   const filteredUsers = React.useMemo(
```

## X240: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 10; code from the final change.

```
      4 + import { TUser } from "@formbricks/types/user";
      5 + import { formatDateTimeForDisplay } from "@/lib/utils/datetime";
      6 + 
      7 + interface AccountActivityProps {
      8 +   user: TUser;
      9 + }
>>   10 + 
     11 + export const AccountActivity = ({ user }: Readonly<AccountActivityProps>) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   const formatDate = (date: Date | null): string => {
     15 +     if (!date) return t("workspace.settings.profile.no_login_yet");
     16 +     return formatDateTimeForDisplay(new Date(date));
```

## X241: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      2 + import { z } from 'zod';
      3   
      4   import { api } from '@/lib/api-client';
      5   import { QueryConfig } from '@/lib/react-query';
      6 + import { ROLES } from '@/lib/authorization';
      7   import { User } from '@/types/api';
>>    8   
      9 + export const filterUsersSchema = z.object({
     10 +   role: z.nativeEnum(ROLES).optional(),
     11 +   search: z.string().optional(),
     12 + });
     13 + 
     14 + export type FilterUsersInput = z.infer<typeof filterUsersSchema>;
```

## X242: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 24; code from the final change.

```
     18   interface EditTagsWrapperProps {
     19     workspaceId: string;
```

## X243: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 11; code from the final change.

```
      5 + 
      6 + interface AccountActivityProps {
      7 +   createdAt: Date;
      8 +   lastLoginAt: Date | null;
      9 + }
     10 + 
>>   11 + export const AccountActivity = ({ createdAt, lastLoginAt }: Readonly<AccountActivityProps>) => {
     12 +   const { t, i18n } = useTranslation();
     13 + 
     14 +   return (
     15 +     <div className="flex flex-col gap-3">
     16 +       <div className="flex items-center justify-between text-sm">
     17 +         <span className="text-slate-600">{t("workspace.settings.profile.account_created")}</span>
```

## X244: local/readonly-props

`apps/web/modules/integrations/webhooks/components/webhooks-query-client-provider.tsx` line 6; code from the final change.

```
      1 + "use client";
      2 + 
      3 + import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
      4 + import { type ReactNode, useState } from "react";
      5 + 
>>    6 + export const WebhooksQueryClientProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
      7 +   const [queryClient] = useState(() => new QueryClient());
      8 + 
      9 +   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
     10 + };
```

## X245: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 73; code from the final change.

```
(no code)
```

## X246: local/readonly-props

`apps/web/modules/integrations/webhooks/components/webhook-query-client-provider.tsx` line 6; code from the final change.

```
      1 + "use client";
      2 + 
      3 + import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
      4 + import { type ReactNode, useState } from "react";
      5 + 
>>    6 + export const WebhookQueryClientProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
      7 +   const [queryClient] = useState(() => new QueryClient());
      8 + 
      9 +   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
     10 + };
```

## X247: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 62; code from the final change.

```
     56 +     link.download = 'users.csv';
     57 +     link.click();
     58 +     URL.revokeObjectURL(url);
     59 +   };
     60 + 
     61     return (
>>   62 +     <div className="space-y-4">
     63 +       <div className="flex items-center gap-4">
     64 +         <Select
     65 +           label="Role"
     66 +           options={[
     67 +             { label: 'All Roles', value: '' },
     68 +             { label: 'Admin', value: ROLES.ADMIN },
```

## X248: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 77; code from the final change (the line may have moved since the finding).

```
     71 +               <Spinner size="lg" />
     72 +             </div>
     73 +           );
     74 +         }
     75   
     76 +         const users = usersQuery.data?.data;
>>   77 + 
     78 +         if (!users) return null;
     79 + 
     80 +         return (
     81 +           <div className="space-y-4">
     82 +             <div className="flex items-center gap-4">
     83 +               <Select
```

## X249: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 15; code from the final change (the line may have moved since the finding).

```
      9 + }
     10 + 
     11 + export const AccountActivity = ({
     12 +   createdAt,
     13 +   lastLoginAt,
     14 + }: Readonly<AccountActivityProps>) => {
>>   15 +   const { t } = useTranslation();
     16 + 
     17 +   const formatDate = (date: Date | null) => {
     18 +     if (!date) return t("common.no_sign_in_recorded");
     19 +     return formatDateForDisplay(date);
     20 +   };
     21 + 
```

## X250: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   changePasswordInputSchema,
      9 +   useChangePassword,
     10 + } from '../api/change-password';
     11 + 
```

## X251: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 16; code from the final change.

```
     10 + const getFullName = (user: User) => `${user.firstName} ${user.lastName}`;
     11 + 
     12 + // Groups users by role without comparing `user.role` directly, keeping the original order.
     13 + const groupUsersByRole = (users: User[]) => {
     14 +   const groups = new Map<User['role'], User[]>();
     15 + 
>>   16 +   for (const user of users) {
     17 +     const group = groups.get(user.role);
     18 + 
     19 +     if (group) {
     20 +       group.push(user);
     21 +     } else {
     22 +       groups.set(user.role, [user]);
```

## X252: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 101; code from the final change.

```
(no code)
```

## X253: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 24; code from the final change.

```
     18 +   value: string;
     19 + };
     20 + 
     21 + type SearchableUser = {
     22 +   firstName: string;
     23 +   lastName: string;
>>   24 +   email: string;
     25 +   role: ROLES.ADMIN | ROLES.USER;
     26 +   createdAt: number;
     27 +   id: string;
     28 + };
     29 + 
     30 + const ROLE_OPTIONS: RoleOption[] = [
```

## X254: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6   
      7 + import { ROLES } from '@/lib/authorization';
>>    8 + 
      9 + export type GetUsersParams = {
     10 +   role?: ROLES.ADMIN | ROLES.USER;
     11 +   search?: string;
     12 + };
     13 + 
     14 + export const getUsers = (params?: GetUsersParams): Promise<{ data: User[] }> => {
```

## X255: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 17; code from the final change (the line may have moved since the finding).

```
     11 + import { GetUsersParams, useUsers } from '../api/get-users';
     12   
     13   import { DeleteUser } from './delete-user';
     14   
     15 + import { ROLES } from '@/lib/authorization';
     16 + 
>>   17 + const ROLE_OPTIONS = [
     18 +   { label: 'All Roles', value: '' },
     19 +   { label: 'Admin', value: ROLES.ADMIN },
     20 +   { label: 'User', value: ROLES.USER },
     21 + ];
     22 + 
     23   export const UsersList = () => {
```

## X256: local/shared-date-formatting

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 10; code from the final change.

```
      4 + interface AccountActivityProps {
      5 +   createdAt: Date;
      6 +   lastLoginAt: Date | null;
      7 +   locale: string;
      8 + }
      9 + 
>>   10 + const SHORT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
     11 + 
     12 + export const AccountActivity = async ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     13 +   const t = await getTranslate();
     14 + 
     15 +   return (
     16 +     <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
```

## X257: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 55; code from the final change.

```
     49 +           />
     50 +         </div>
     51 +         <Select
     52 +           label=""
     53 +           options={[
     54 +             { label: 'All Roles', value: '' },
>>   55 +             { label: 'Admin', value: ROLES.ADMIN },
     56 +             { label: 'User', value: ROLES.USER },
     57 +           ]}
     58 +           defaultValue={role ?? ''}
     59 +           className="w-40"
     60 +           registration={{
     61 +             onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
```

## X258: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 14; code from the final change.

```
      8 +   lastLoginAt: Date | null;
      9 + }
     10 + 
     11 + export const AccountActivity = ({ createdAt, lastLoginAt }: Readonly<AccountActivityProps>) => {
     12 +   const { t, i18n } = useTranslation();
     13 + 
>>   14 +   const formatDate = (date: Date) =>
     15 +     formatDateTimeForDisplay(date, i18n.language, { dateStyle: "medium", timeStyle: "short" });
     16 + 
     17 +   return (
     18 +     <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-3 text-sm">
     19 +       <dt className="font-medium text-slate-800">{t("workspace.settings.profile.account_created")}</dt>
     20 +       <dd className="text-slate-600">{formatDate(createdAt)}</dd>
```

## X259: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 19; code from the final change.

```
     13 + };
     14 + 
     15 + const groupUsersByRole = (users: User[]) => {
     16 +   const groups = new Map<string, User[]>();
     17 + 
     18 +   for (const user of users) {
>>   19 +     const group = groups.get(user.role) ?? [];
     20 +     group.push(user);
     21 +     groups.set(user.role, group);
     22 +   }
     23 + 
     24 +   return groups;
     25 + };
```

## X260: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 12; code from the final change.

```
      6 +   lastLoginAt: Date | null;
      7 +   locale: string;
      8 + }
      9 + 
     10 + const SHORT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };
     11 + 
>>   12 + export const AccountActivity = async ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     13 +   const t = await getTranslate();
     14 + 
     15 +   return (
     16 +     <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
     17 +       <dt className="text-slate-500">{t("workspace.settings.profile.account_created")}</dt>
     18 +       <dd className="text-slate-900">
```

## X261: local/notifications-in-mutation-hook

`apps/react-vite/src/features/auth/components/change-password-form.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { Lock } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   changePasswordInputSchema,
      8 +   useChangePassword,
      9 + } from '../api/change-password';
     10 + 
     11 + export const ChangePasswordForm = () => {
```

## X262: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/actions.ts` line 160; code from the final change.

```
(no code)
```

## X263: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X264: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadMyDataButton.tsx` line 14; code from the file as the agent wrote it.

```
      8 + const EXPORT_FILE_NAME = "formbricks-my-data.json";
      9 + 
     10 + interface DownloadMyDataButtonProps {
     11 +   data: TAccountDataExport;
     12 + }
     13 + 
>>   14 + export const DownloadMyDataButton = ({ data }: DownloadMyDataButtonProps) => {
     15 +   const { t } = useTranslation();
     16 + 
     17 +   const handleDownload = () => {
     18 +     const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
     19 +     const url = URL.createObjectURL(blob);
     20 + 
```

## X265: local/dates-through-format

`apps/react-vite/src/features/users/utils/export-users-csv.ts` line 1; code from the file as the agent wrote it.

```
>>    1 + import { default as dayjs } from 'dayjs';
      2 + 
      3 + import { User } from '@/types/api';
      4 + 
      5 + const CSV_HEADERS = ['Name', 'Email', 'Role', 'Joined'];
      6 + 
      7 + // Cells starting with these characters are interpreted as formulas by
```

## X266: local/no-any

`apps/react-vite/src/features/users/components/users-list.tsx` line 62; code from the final change (the line may have moved since the finding).

```
     56 +               { label: 'All', value: '' },
     57 +               { label: 'Admin', value: ROLES.ADMIN },
     58 +               { label: 'User', value: ROLES.USER },
     59 +             ]}
     60 +             defaultValue={roleFilter ?? ''}
     61 +             registration={{
>>   62 +               onChange: async (event: unknown) => {
     63 +                 const target = (event as { target: { value: string } }).target;
     64 +                 setRoleFilter(target.value as ROLES.ADMIN | ROLES.USER | undefined);
     65 +               },
     66 +             }}
     67 +             className="w-32"
     68 +           />
```

## X267: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 36; code from the final change.

```
     30 +   const term = search.trim().toLowerCase();
     31 +   const filteredUsers = users.filter((user) => {
     32 +     if (!term) return true;
     33 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     34 +     return name.includes(term) || user.email.toLowerCase().includes(term);
     35 +   });
>>   36 + 
     37     return (
     38 +     <div className="flex flex-col gap-4">
     39 +       <div className="flex flex-wrap items-end gap-4">
     40 +         <Input
     41 +           type="search"
     42 +           aria-label="Search users"
```

## X268: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from not recoverable.

```
(no code)
```

## X269: local/query-key-from-options

`apps/react-vite/src/features/users/api/get-users.ts` line 32; code from the final change (the line may have moved since the finding).

```
     26 +   queryConfig?: QueryConfig<typeof getUsers>;
     27 +   params?: GetUsersParams;
     28   };
     29   
     30 + export const useUsers = ({ queryConfig, params }: UseUsersOptions = {}) => {
     31     return useQuery({
>>   32 +     ...getUsersQueryOptions(params),
     33       ...queryConfig,
     34     });
     35   };
```

## X270: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 12; code from the final change.

```
      6 + export const filterUsers = (
      7 +   users: User[],
      8 +   { role, search }: UsersFilterInput,
      9 + ) => {
     10 +   const query = search.trim().toLowerCase();
     11 + 
>>   12 +   return users.filter((user) => {
     13 +     const matchesRole = role === 'ALL' || hasRole(user, role);
     14 +     const matchesSearch =
     15 +       !query ||
     16 +       `${user.firstName} ${user.lastName}`.toLowerCase().includes(query) ||
     17 +       user.email.toLowerCase().includes(query);
     18 + 
```

## X271: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/DownloadMyData.tsx` line 37; code from the final change.

```
     31 +       ? (settings.unsubscribedOrganizationIds as string[])
     32 +       : null;
     33 + 
     34 +   return { alert, unsubscribedOrganizationIds };
     35 + };
     36 + 
>>   37 + export const DownloadMyData = ({
     38 +   userName,
     39 +   userEmail,
     40 +   userLocale,
     41 +   notificationSettings,
     42 +   organizationMemberships,
     43 + }: Readonly<DownloadMyDataProps>) => {
```

## X272: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 12; code from the final change.

```
      6 +   if (!query) return users;
      7 + 
      8 +   return users.filter((user) => {
      9 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     10 +     return name.includes(query) || user.email.toLowerCase().includes(query);
     11 +   });
>>   12 + };
```

## X273: local/shared-date-formatting

`apps/web/modules/integrations/webhooks/components/webhook-row-data.tsx` line 109; code from the agent's edit just before the finding (line numbers not known).

```
      <div className="col-span-2 my-auto flex min-w-0 items-center justify-center gap-x-2 text-sm text-slate-800">
        {renderSelectedSurveysText(webhook, surveys)}
        {hasRestrictedAttachedSurvey(surveyVisibilityEnabled, webhook.surveyIds, surveys) && (
          <RestrictedSurveyHint kind="paused" />
        )}
      </div>
      <div className="col-span-2 my-auto text-center text-sm text-slate-800">
        {renderSelectedTriggersText(webhook, t)}
      </div>
      <div
        className="col-span-2 my-auto text-center text-sm whitespace-nowrap text-slate-500"
        title={new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
          new Date(webhook.createdAt)
        )}>
        {timeSince(webhook.createdAt.toString(), locale)}
      </div>
      <div className="col-span-2 my-auto text-center text-sm whitespace-nowrap text-slate-500">
        {timeSince(webhook.updatedAt.toString(), locale)}
      </div>
```

## X274: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5   import { User } from '@/types/api';
      6 + import { ROLES } from '@/lib/authorization';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: ROLES.ADMIN | ROLES.USER;
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (
     14 +   params?: GetUsersParams,
```

## X275: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 34; code from the final change.

```
     28 + 
     29   export const UsersList = () => {
     30 +   const [role, setRole] = useState<string>('');
     31 +   const [search, setSearch] = useState<string>('');
     32 + 
     33 +   const usersQuery = useUsers({ params: role || search ? { role, search } : undefined });
>>   34 + 
     35 +   const filteredUsers = usersQuery.data?.data
     36 +     ? usersQuery.data.data.filter((user) => {
     37 +         const matchesRole = !role || user.role === role;
     38 +         const matchesSearch =
     39 +           !search ||
     40 +           user.firstName.toLowerCase().includes(search.toLowerCase()) ||
```

## X276: eslint

`apps/web/locales/en-US.json` line 2920; code from the final change (the line may have moved since the finding).

```
   2916           "webhook_name_placeholder": "Optional: Label your webhook for easy identification",
   2917           "webhook_test_failed_due_to": "Webhook Test Failed due to",
   2918           "webhook_updated_successfully": "Webhook updated successfully",
   2919 +         "webhook_url_placeholder": "Paste the URL you want the event to trigger on",
>> 2920 +         "webhook_duplicated_successfully": "Webhook duplicated successfully"
   2921         },
   2922         "website_or_app_integration_description": "Integrate Formbricks into your Website or App",
   2923         "zapier_integration_description": "Integrate Formbricks with 5000+ apps via Zapier"
```

## X277: local/no-new-server-actions

`apps/web/modules/integrations/webhooks/actions.ts` line 169; code from the final change.

```
(no code)
```

## X278: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { usePinDiscussion } from '../api/pin-discussion';
      8 + 
      9 + type PinDiscussionProps = {
     10 +   discussionId: string;
```

## X279: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 9; code from the final change.

```
      3 + import { UsersFilters } from '../api/get-users';
      4 + 
      5 + export const filterUsers = (users: User[], { search, role }: UsersFilters) => {
      6 +   const term = search.trim().toLowerCase();
      7 + 
      8 +   return users.filter((user) => {
>>    9 +     if (role !== 'ALL' && user.role !== role) return false;
     10 +     if (!term) return true;
     11 + 
     12 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     13 +     return name.includes(term) || user.email.toLowerCase().includes(term);
     14 +   });
     15 + };
```

## X280: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 75; code from the final change.

```
     69   
     70 +   const filteredUsers = React.useMemo(() => {
     71 +     let result = users;
     72 + 
     73 +     if (roleFilter) {
     74 +       result = result.filter((user) => user.role === roleFilter);
>>   75 +     }
     76 + 
     77 +     if (searchQuery.trim()) {
     78 +       const query = searchQuery.toLowerCase();
     79 +       result = result.filter(
     80 +         (user) =>
     81 +           user.firstName.toLowerCase().includes(query) ||
```

## X281: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X282: local/roles-from-enum

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 18; code from the final change (the line may have moved since the finding).

```
     12 + import { usePinDiscussion } from '../api/pin-discussion';
     13 + import { UpdateDiscussion } from './update-discussion';
     14   
     15   export const DiscussionView = ({ discussionId }: { discussionId: string }) => {
     16     const discussionQuery = useDiscussion({
     17       discussionId,
>>   18     });
     19 +   const { checkAccess } = useAuthorization();
     20 +   const canAdmin = checkAccess({ allowedRoles: [ROLES.ADMIN] });
     21 + 
     22 +   const pinMutation = usePinDiscussion({
     23 +     mutationConfig: {
     24 +       onError: () => {
```

## X283: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 1; code from not recoverable.

```
(no code)
```

## X284: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/toggle-discussion-pinned.ts` line 31; code from the final change (the line may have moved since the finding).

```
     25 +   const queryClient = useQueryClient();
     26 + 
     27 +   const { onSuccess, ...restConfig } = mutationConfig || {};
     28 + 
     29 +   return useMutation({
     30 +     onSuccess: (data, variables, context) => {
>>   31 +       queryClient.invalidateQueries(getDiscussionsQueryOptions());
     32 +       queryClient.invalidateQueries(getDiscussionQueryOptions(data.id));
     33 +       const isPinned = data.isPinned;
     34 +       useNotifications.getState().addNotification({
     35 +         type: 'success',
     36 +         title: isPinned ? 'Discussion Pinned' : 'Discussion Unpinned',
     37 +       });
```

## X285: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 83; code from the final change (the line may have moved since the finding).

```
     77 +                 <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
     78 +                 <Input
     79 +                   placeholder="Search by name or email"
     80 +                   className="pl-9"
     81 +                   registration={register('search')}
     82 +                 />
>>   83 +               </div>
     84 +               <Select
     85 +                 options={[
     86 +                   { label: 'All Roles', value: '' },
     87 +                   { label: 'Admin', value: ROLES.ADMIN },
     88 +                   { label: 'User', value: ROLES.USER },
     89 +                 ]}
```

## X286: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 116; code from the final change.

```
    110 +             type="text"
    111 +             placeholder="Search by name or email"
    112 +             className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    113 +             value={search}
    114 +             onChange={(e) => setSearch(e.target.value)}
    115 +             registration={{} as React.ComponentProps<typeof Input>['registration']}
>>  116 +           />
    117 +         </div>
    118 +         <Select
    119 +           options={roleOptions}
    120 +           className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    121 +           defaultValue={role}
    122 +           registration={{
```

## X287: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the final change.

```
      1 + import { useEffect } from 'react';
      2 + import { Lock } from 'lucide-react';
      3 + 
      4 + import { Button } from '@/components/ui/button';
>>    5 + import { Form, FormDrawer, Input } from '@/components/ui/form';
      6 + import { useNotifications } from '@/components/ui/notifications';
      7 + 
      8 + import {
      9 +   changePasswordInputSchema,
     10 +   useChangePassword,
     11 + } from '../api/change-password';
```

## X288: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 10; code from the file as the agent wrote it.

```
      4 + import { getTranslate } from "@/lingodotdev/server";
      5 + 
      6 + interface AccountActivityProps {
      7 +   user: Pick<TUser, "createdAt" | "lastLoginAt" | "locale">;
      8 + }
      9 + 
>>   10 + export const AccountActivity = async ({ user }: AccountActivityProps) => {
     11 +   const t = await getTranslate();
     12 + 
     13 +   return (
     14 +     <div className="flex flex-col gap-4">
     15 +       <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
     16 +         <div>
```

## X289: local/no-new-server-actions

`apps/web/app/(app)/account/settings/profile/actions.ts` line 8; code from the final change.

```
(no code)
```

## X290: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 23; code from the final change.

```
     17   
     18 + type RoleOption = {
     19 +   label: string;
     20 +   value: string;
     21 + };
     22 + 
>>   23 + const roleOptions: RoleOption[] = [
     24 +   { label: 'All Roles', value: '' },
     25 +   { label: 'Admin', value: ROLES.ADMIN },
     26 +   { label: 'User', value: ROLES.USER },
     27 + ];
     28 + 
     29   export const UsersList = () => {
```

## X291: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 20; code from the file as the agent wrote it.

```
     14 + import { DeleteUser } from './delete-user';
     15 + 
     16 + type Filters = { search: string; role: RoleFilter };
     17 + 
     18 + const ROLE_OPTIONS = [
     19 +   { label: 'All roles', value: '' },
>>   20 +   { label: 'Admin', value: 'ADMIN' },
     21 +   { label: 'User', value: 'USER' },
     22 + ];
     23 + 
     24 + export const UsersList = () => {
     25 +   const usersQuery = useUsers();
     26 +   const { register, watch } = useForm<Filters>({
```

## X292: local/input-types-from-zod

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 10; code from the file as the agent wrote it.

```
      4 + import { MutationConfig } from '@/lib/react-query';
      5 + import { Discussion } from '@/types/api';
      6 + 
      7 + import { getDiscussionQueryOptions } from './get-discussion';
      8 + import { getDiscussionsQueryOptions } from './get-discussions';
      9 + 
>>   10 + export type PinDiscussionInput = {
     11 +   discussionId: string;
     12 +   pinned: boolean;
     13 + };
     14 + 
     15 + export const pinDiscussion = ({
     16 +   discussionId,
```

## X293: local/readonly-props

`apps/web/modules/integrations/webhooks/components/webhooks-query-client-provider.tsx` line 6; code from the final change.

```
      1 + "use client";
      2 + 
      3 + import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
      4 + import { type ReactNode, useState } from "react";
      5 + 
>>    6 + export const WebhooksQueryClientProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
      7 +   const [queryClient] = useState(() => new QueryClient());
      8 + 
      9 +   return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
     10 + };
```

## X294: local/icons-lucide

`apps/react-vite/src/features/users/components/users-toolbar.tsx` line 1; code from the file as the agent wrote it.

```
>>    1 + import { DownloadIcon } from '@radix-ui/react-icons';
      2 + import { type ChangeHandler } from 'react-hook-form';
      3 + 
      4 + import { Button } from '@/components/ui/button';
      5 + import { Input, Select } from '@/components/ui/form';
      6 + 
      7 + import { type UserRoleFilter } from '../utils/filter-users';
```

## X295: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 31; code from the final change.

```
     25 +   role: ROLES.ADMIN | ROLES.USER;
     26 +   createdAt: number;
     27 +   id: string;
     28 + };
     29 + 
     30 + const ROLE_OPTIONS: RoleOption[] = [
>>   31 +   { label: 'All Roles', value: '' },
     32 +   { label: 'Admin', value: ROLES.ADMIN },
     33 +   { label: 'User', value: ROLES.USER },
     34 + ];
     35 + 
     36 + const exportUsersToCsv = (users: SearchableUser[]) => {
     37 +   const header = 'Name,Email,Role,Joined At';
```

## X296: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/DownloadMyData.tsx` line 13; code from the final change.

```
      7 + import { parseV3ApiError } from "@/modules/api/lib/v3-client";
      8 + 
      9 + interface DownloadMyDataProps {
     10 +   user: TUser;
     11 + }
     12 + 
>>   13 + export const DownloadMyData = ({ user }: Readonly<DownloadMyDataProps>) => {
     14 +   const { t } = useTranslation();
     15 +   const [isDownloading, setIsDownloading] = useState(false);
     16 + 
     17 +   const handleDownload = async () => {
     18 +     setIsDownloading(true);
     19 +     try {
```

## X297: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-filters.tsx` line 14; code from the file as the agent wrote it.

```
      8 +   onSearchChange: (search: string) => void;
      9 +   onRoleChange: (role: RoleFilter) => void;
     10 + };
     11 + 
     12 + const roleOptions: { label: string; value: RoleFilter }[] = [
     13 +   { label: 'All roles', value: 'ALL' },
>>   14 +   { label: 'Admin', value: 'ADMIN' },
     15 +   { label: 'User', value: 'USER' },
     16 + ];
     17 + 
     18 + export const UsersFilters = ({
     19 +   search,
     20 +   role,
```

## X298: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-list.tsx` line 3; code from the final change (the line may have moved since the finding).

```
      1 + import { FileDown, Search } from 'lucide-react';
      2 + import * as React from 'react';
>>    3 + 
      4 + import { Button } from '@/components/ui/button';
      5 + import { Form } from '@/components/ui/form';
      6 + import { Input } from '@/components/ui/form';
      7 + import { Select } from '@/components/ui/form';
      8   import { Spinner } from '@/components/ui/spinner';
      9   import { Table } from '@/components/ui/table';
```

## X299: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 19; code from the final change.

```
     13   import { useUsers } from '../api/get-users';
     14 + import { downloadUsersCsv } from '../api/export-users';
     15   
     16   import { DeleteUser } from './delete-user';
     17   
     18 + const roleOptions = [
>>   19 +   { label: 'All', value: '' },
     20 +   { label: 'Admin', value: ROLES.ADMIN },
     21 +   { label: 'User', value: ROLES.USER },
     22 + ];
     23 + 
     24   export const UsersList = () => {
     25 +   const [roleFilter, setRoleFilter] = useState<string>('');
```

## X300: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-list.tsx` line 52; code from the final change (the line may have moved since the finding).

```
     46     return (
     47 +     <div className="space-y-4">
     48 +       <div className="flex items-center gap-4">
     49 +         <div className="flex items-center gap-2">
     50 +           <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
     51 +             Role:
>>   52 +           </label>
     53 +           <Select
     54 +             label=""
     55 +             options={[
     56 +               { label: 'All', value: '' },
     57 +               { label: 'Admin', value: ROLES.ADMIN },
     58 +               { label: 'User', value: ROLES.USER },
```

## X301: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 10; code from the final change.

```
      4 + 
      5 + export const filterUsers = (users: User[], { search, role }: UsersFilter) => {
      6 +   const term = search.trim().toLowerCase();
      7 +   const wantedRole: string = role;
      8 + 
      9 +   return users.filter(({ role: listedRole, ...user }) => {
>>   10 +     if (wantedRole && listedRole !== wantedRole) return false;
     11 +     if (!term) return true;
     12 + 
     13 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
     14 +     return name.includes(term) || user.email.toLowerCase().includes(term);
     15 +   });
     16 + };
```

## X302: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 20; code from the final change.

```
     14   import { DeleteUser } from './delete-user';
     15   
     16 + type UserRoleFilter = '' | ROLES.ADMIN | ROLES.USER;
     17 + 
     18 + const roleOptions = [
     19 +   { label: 'All', value: '' },
>>   20 +   { label: 'Admin', value: ROLES.ADMIN },
     21 +   { label: 'User', value: ROLES.USER },
     22 + ];
     23 + 
     24 + const exportUsersCsv = (users: { firstName: string; lastName: string; email: string; role: string; createdAt: number }[]) => {
     25 +   const header = 'Name,Email,Role,Joined\n';
     26 +   const rows = users
```

## X303: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 9; code from the final change.

```
      3 + 
      4 + import { type UsersFilterValues } from '../api/get-users';
      5 + 
      6 + export const filterUsers = (users: User[], filters: UsersFilterValues) => {
      7 +   const search = filters.search.trim().toLowerCase();
      8 +   const allowedRoles: string[] =
>>    9 +     filters.role === 'ALL' ? Object.values(ROLES) : [filters.role];
     10 + 
     11 +   return users.filter((user) => {
     12 +     const matchesRole = allowedRoles.includes(user.role);
     13 + 
     14 +     if (!matchesRole) return false;
     15 + 
```

## X304: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 33; code from the file as the agent wrote it.

```
     27 + 
     28 +   return useMutation({
     29 +     onSuccess: (...args) => {
     30 +       // The ['discussions'] prefix covers both the list and the detail queries,
     31 +       // and the list order depends on the pinned state.
     32 +       queryClient.invalidateQueries({
>>   33 +         queryKey: ['discussions'],
     34 +       });
     35 +       onSuccess?.(...args);
     36 +     },
     37 +     ...restConfig,
     38 +     mutationFn: pinDiscussion,
     39 +   });
```

## X305: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 14; code from the final change.

```
      8 + };
      9 + 
     10 + export const filterUsers = (users: User[], { role, search }: UserFilters) => {
     11 +   const query = search.trim().toLowerCase();
     12 + 
     13 +   return users.filter((user) => {
>>   14 +     if (role !== 'ALL' && user.role !== role) {
     15 +       return false;
     16 +     }
     17 + 
     18 +     if (!query) {
     19 +       return true;
     20 +     }
```

## X306: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 19; code from the final change (the line may have moved since the finding).

```
     13 + interface AccountActivityProps {
     14 +   createdAt: Date;
     15 +   lastLoginAt: Date | null;
     16 +   memberships: OrganizationMembership[];
     17 +   locale: string;
     18 + }
>>   19 + 
     20 + export const AccountActivity = ({ createdAt, lastLoginAt, memberships, locale }: Readonly<AccountActivityProps>) => {
     21 +   const { t } = useTranslation();
     22 + 
     23 +   return (
     24 +     <div className="space-y-4">
     25 +       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
```

## X307: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 13; code from the final change.

```
      7 + import { Small } from "@/modules/ui/components/typography";
      8 + 
      9 + interface AccountActivityProps {
     10 +   user: TUser;
     11 + }
     12 + 
>>   13 + export const AccountActivity = ({ user }: Readonly<AccountActivityProps>) => {
     14 +   const { t } = useTranslation();
     15 + 
     16 +   const createdDate = formatDateWithOrdinal(user.createdAt, user.locale);
     17 +   const lastLoginDate = user.lastLoginAt ? formatDateWithOrdinal(user.lastLoginAt, user.locale) : null;
     18 + 
     19 +   return (
```

## X308: eslint

`apps/web/modules/integrations/webhooks/actions.ts` line 166; code from not recoverable.

```
(no code)
```

## X309: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/components/edit-tags-wrapper.tsx` line 59; code from the final change.

```
     53 +     {
     54 +       id: "created",
     55 +       header: t("workspace.tags.created"),
     56 +       headerClassName: "w-[20%]",
     57 +       align: "left",
     58 +       cellClassName: "whitespace-nowrap text-slate-900",
>>   59 +       skeletonWidth: "w-24",
     60 +       cell: (tag) => formatDateForDisplay(new Date(tag.createdAt)),
     61 +     },
     62       {
     63         id: "count",
     64         header: t("workspace.tags.count"),
     65 +       headerClassName: "w-[12%]",
```

## X310: local/query-key-from-options

`apps/react-vite/src/features/comments/api/create-comment.ts` line 44; code from the agent's edit just before the finding (line numbers not known).

```
      queryClient.invalidateQueries({
        queryKey: getInfiniteCommentsQueryOptions(discussionId).queryKey,
      });
      // The discussions list shows comment counts and the last comment date
      queryClient.invalidateQueries({ queryKey: ['discussions'] });
      onSuccess?.(...args);
```

## X311: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 22; code from the final change.

```
     16   import { DeleteUser } from './delete-user';
     17   
     18 + type RoleOption = {
     19 +   label: string;
     20 +   value: string;
     21 + };
>>   22 + 
     23 + const roleOptions: RoleOption[] = [
     24 +   { label: 'All Roles', value: '' },
     25 +   { label: 'Admin', value: ROLES.ADMIN },
     26 +   { label: 'User', value: ROLES.USER },
     27 + ];
     28 + 
```

## X312: local/no-new-server-actions

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/actions/download-my-data.ts` line 15; code from the final change.

```
(no code)
```

## X313: local/shared-date-formatting

`apps/web/modules/integrations/webhooks/components/webhook-row-data.tsx` line 108; code from the agent's edit just before the finding (line numbers not known).

```
      <div className="col-span-2 my-auto flex min-w-0 items-center justify-center gap-x-2 text-sm text-slate-800">
        {renderSelectedSurveysText(webhook, surveys)}
        {hasRestrictedAttachedSurvey(surveyVisibilityEnabled, webhook.surveyIds, surveys) && (
          <RestrictedSurveyHint kind="paused" />
        )}
      </div>
      <div className="col-span-2 my-auto text-center text-sm text-slate-800">
        {renderSelectedTriggersText(webhook, t)}
      </div>
      <div className="col-span-2 my-auto text-center text-sm whitespace-nowrap text-slate-500">
        {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(webhook.createdAt))}
      </div>
```

## X314: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 18; code from the final change.

```
     12 + 
     13   import { useUsers } from '../api/get-users';
     14 + import { downloadUsersCsv } from '../api/export-users';
     15   
     16   import { DeleteUser } from './delete-user';
     17   
>>   18 + const roleOptions = [
     19 +   { label: 'All', value: '' },
     20 +   { label: 'Admin', value: ROLES.ADMIN },
     21 +   { label: 'User', value: ROLES.USER },
     22 + ];
     23 + 
     24   export const UsersList = () => {
```

## X315: local/ui-form-controls

`apps/react-vite/src/features/users/components/users-filters.tsx` line 42; code from the file as the agent wrote it.

```
     36 +         />
     37 +       </div>
     38 + 
     39 +       <div className="sm:w-48">
     40 +         <Label>
     41 +           Role
>>   42 +           <select
     43 +             className={selectClassName}
     44 +             value={role}
     45 +             onChange={(event) =>
     46 +               onRoleChange(event.target.value as UserRoleFilter)
     47 +             }
     48 +           >
```

## X316: local/shared-date-formatting

`apps/web/modules/account/components/AccountActivity/index.tsx` line 19; code from the file as the agent wrote it.

```
     13 +   lastLoginAt: Date | null;
     14 +   locale: string;
     15 + }
     16 + 
     17 + const formatTimestamp = (date: Date, locale: string): string =>
     18 +   // Pinned to UTC so the server and browser render the same moment; locale only controls the format.
>>   19 +   new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date) +
     20 +   " UTC";
     21 + 
     22 + const downloadJson = (data: unknown, filename: string) => {
     23 +   const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
     24 +   const url = URL.createObjectURL(blob);
     25 +   const link = document.createElement("a");
```

## X317: local/dates-through-format

`apps/react-vite/src/features/users/api/export-users.ts` line 10; code from the final change.

```
      4 + 
      5 + export const downloadUsersCsv = (users: User[]) => {
      6 +   const header = 'Name,Email,Role,Joined\n';
      7 +   const rows = users
      8 +     .map((user) => {
      9 +       const name = `"${user.firstName} ${user.lastName}"`;
>>   10 +       const email = `"${user.email}"`;
     11 +       const role = user.role;
     12 +       const joined = formatDate(user.createdAt);
     13 +       return `${name},${email},${role},${joined}`;
     14 +     })
     15 +     .join('\n');
     16 + 
```

## X318: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 13; code from the final change.

```
      7   import { Spinner } from '@/components/ui/spinner';
      8   import { Table } from '@/components/ui/table';
      9   import { formatDate } from '@/utils/format';
     10   
     11 + import { ROLES } from '@/lib/authorization';
     12 + 
>>   13   import { useUsers } from '../api/get-users';
     14   
     15   import { DeleteUser } from './delete-user';
     16   
     17 + type RoleFilter = 'ALL' | (typeof ROLES)[keyof typeof ROLES];
     18 + 
     19 + const roleOptions: { label: string; value: RoleFilter }[] = [
```

## X319: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/update-password.tsx` line 5; code from the final change (the line may have moved since the finding).

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + 
      6 + import {
      7 +   updatePasswordInputSchema,
      8 +   useUpdatePassword,
      9 + } from '../api/update-password';
     10 + 
     11 + export const ChangePassword = () => {
```

## X320: local/role-checks-through-authorization

`apps/react-vite/src/features/users/utils/filter-users.ts` line 17; code from the final change.

```
     11 + };
     12 + 
     13 + export const filterUsers = (
     14 +   users: User[],
     15 +   { search, role }: FilterUsersOptions,
     16 + ) => {
>>   17 +   const query = search.trim().toLowerCase();
     18 +   const allowedRoles: User['role'][] = role === 'ALL' ? ALL_ROLES : [role];
     19 + 
     20 +   return users.filter((user) => {
     21 +     if (!allowedRoles.includes(user.role)) return false;
     22 +     if (!query) return true;
     23 + 
```

## X321: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-list.tsx` line 3; code from the final change (the line may have moved since the finding).

```
      1 + import { Download } from 'lucide-react';
      2 + import * as React from 'react';
>>    3 + 
      4 + import { Button } from '@/components/ui/button';
      5 + import { Form, FormField } from '@/components/ui/form/form';
      6 + import { Input } from '@/components/ui/form/input';
      7 + import { Select } from '@/components/ui/form/select';
      8   import { Spinner } from '@/components/ui/spinner';
      9   import { Table } from '@/components/ui/table';
```

## X322: local/readonly-props

`apps/web/modules/workspaces/settings/tags/page.tsx` line 9; code from the final change (the line may have moved since the finding).

```
      4   import { PageHeader } from "@/modules/ui/components/page-header";
      5   import { getWorkspaceAuth } from "@/modules/workspaces/lib/utils";
      6   import { EditTagsWrapper } from "./components/edit-tags-wrapper";
      7 + import { DeleteUnusedTagsButton } from "./components/delete-unused-tags-button";
      8   
>>    9 + export const TagsPage = async ({ params }: Readonly<{ params: Promise<{ workspaceId: string }> }>) => {
     10 +   const { workspaceId } = await params;
     11     const t = await getTranslate();
     12   
     13     // The tags themselves are fetched client-side through `/api/v3/tags`, so this page only resolves the
     14     // permission that decides whether the actions column renders.
     15 +   const { isReadOnly } = await getWorkspaceAuth(workspaceId);
```

## X323: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 8; code from the final change (the line may have moved since the finding).

```
      2   
      3   import { api } from '@/lib/api-client';
      4   import { QueryConfig } from '@/lib/react-query';
      5 + import { ROLES } from '@/lib/authorization';
      6   import { User } from '@/types/api';
      7   
>>    8 + export type GetUsersParams = {
      9 +   role?: (typeof ROLES)[keyof typeof ROLES];
     10 +   search?: string;
     11   };
     12   
     13 + export const getUsers = (params?: GetUsersParams): Promise<{ data: User[] }> => {
     14 +   const queryParams = new URLSearchParams();
```

## X324: local/no-new-server-actions

`apps/web/modules/organization/settings/api-keys/actions.ts` line 100; code from the final change.

```
(no code)
```

## X325: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { useDiscussion } from '../api/get-discussion';
      8 + import { usePinDiscussion } from '../api/pin-discussion';
      9 + 
     10 + type PinDiscussionProps = {
```

## X326: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 10; code from the file as the agent wrote it.

```
      4 + import { DownloadMyData } from "./DownloadMyData";
      5 + 
      6 + interface AccountActivityProps {
      7 +   user: Pick<TUser, "createdAt" | "lastLoginAt" | "locale">;
      8 + }
      9 + 
>>   10 + export const AccountActivity = async ({ user }: AccountActivityProps) => {
     11 +   const t = await getTranslate();
     12 + 
     13 +   return (
     14 +     <div className="space-y-4">
     15 +       <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
     16 +         <div>
```

## X327: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 11; code from the final change.

```
      5 + import { formatDate } from "@/lib/time";
      6 + 
      7 + interface AccountActivityProps {
      8 +   user: TUser;
      9 + }
     10 + 
>>   11 + export const AccountActivity = ({ user }: Readonly<AccountActivityProps>) => {
     12 +   const { t } = useTranslation();
     13 + 
     14 +   return (
     15 +     <div className="space-y-4">
     16 +       <div className="flex items-center justify-between">
     17 +         <span className="text-sm text-slate-600">{t("workspace.settings.profile.account_created")}</span>
```

## X328: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 17; code from the agent's edit just before the finding (line numbers not known).

```
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/form';
import { Spinner } from '@/components/ui/spinner';
import { Table } from '@/components/ui/table';
import { formatDate } from '@/utils/format';

import { useUsers } from '../api/get-users';
import { downloadUsersCsv } from '../utils/export-users-csv';
import { filterUsers, RoleFilter } from '../utils/filter-users';

import { DeleteUser } from './delete-user';

const ROLE_OPTIONS = [
  { label: 'All roles', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'User', value: 'USER' },
];

export const UsersList = () => {
  const usersQuery = useUsers();
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');

  const allUsers = usersQuery.data?.data;
  const users = useMemo(
    () => (allUsers ? filterUsers(allUsers, { role, search }) : undefined),
    [allUsers, role, search],
  );

  if (usersQuery.isLoading) {
```

## X329: local/shared-date-formatting

`apps/web/modules/workspaces/settings/tags/page.tsx` line 58; code from the final change.

```
     52 +         <TagNameInput tagId={tag.id} tagName={tag.name} workspaceId={workspaceId} isReadOnly={isReadOnly} />
     53 +       ),
     54 +     },
     55 +     {
     56 +       id: "created",
     57 +       header: t("workspace.tags.created"),
>>   58 +       headerClassName: "w-[20%]",
     59 +       skeletonWidth: "w-16",
     60 +       cell: (tag) => formatDate(new Date(tag.createdAt), locale),
     61 +     },
     62 +     {
     63 +       id: "count",
     64 +       header: t("workspace.tags.count"),
```

## X330: local/notifications-in-mutation-hook

`apps/react-vite/src/features/users/components/change-password.tsx` line 5; code from the file as the agent wrote it.

```
      1 + import { KeyRound } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4 + import { Form, FormDrawer, Input } from '@/components/ui/form';
>>    5 + import { useNotifications } from '@/components/ui/notifications';
      6 + 
      7 + import {
      8 +   changePasswordInputSchema,
      9 +   useChangePassword,
     10 + } from '../api/change-password';
     11 + 
```

## X331: local/form-through-ui-form

`apps/react-vite/src/features/users/components/users-list.tsx` line 10; code from the final change (the line may have moved since the finding).

```
      4   import { Table } from '@/components/ui/table';
      5 + import { Button } from '@/components/ui/button';
      6 + import { Input, Select } from '@/components/ui/form';
      7   import { formatDate } from '@/utils/format';
      8 + import { ROLES } from '@/lib/authorization';
      9   
>>   10   import { useUsers } from '../api/get-users';
     11   
     12   import { DeleteUser } from './delete-user';
     13   
     14   export const UsersList = () => {
     15 +   const [roleFilter, setRoleFilter] = React.useState<ROLES.ADMIN | ROLES.USER | ''>('');
     16 +   const [search, setSearch] = React.useState('');
```

## X332: local/no-non-null-assertion

`apps/react-vite/src/features/discussions/components/discussions-list.tsx` line 60; code from the final change.

```
     54 +             if (commentsCount === 0) {
     55 +               return <span>No comments yet</span>;
     56 +             }
     57 +             return (
     58 +               <span>
     59 +                 {commentsCount} comment{commentsCount > 1 ? 's' : ''} (last:{' '}
>>   60 +                 lastCommentAt ? formatDate(lastCommentAt) : null)
     61 +               </span>
     62 +             );
     63 +           },
     64 +         },
     65           {
     66             title: 'Created At',
```

## X333: local/roles-from-enum

`apps/react-vite/src/features/users/components/users-list.tsx` line 16; code from the final change.

```
     10 + import { ROLES } from '@/lib/authorization';
     11 + 
     12   import { useUsers } from '../api/get-users';
     13   
     14   import { DeleteUser } from './delete-user';
     15   
>>   16 + type UserRoleFilter = '' | ROLES.ADMIN | ROLES.USER;
     17 + 
     18 + const roleOptions = [
     19 +   { label: 'All', value: '' },
     20 +   { label: 'Admin', value: ROLES.ADMIN },
     21 +   { label: 'User', value: ROLES.USER },
     22 + ];
```

## X334: local/roles-from-enum

`apps/react-vite/src/features/users/utils/filter-users.ts` line 8; code from the final change.

```
      2 + import { User } from '@/types/api';
      3 + 
      4 + export const ALL_ROLES = 'ALL';
      5 + 
      6 + export type RoleFilter = typeof ALL_ROLES | User['role'];
      7 + 
>>    8 + const roleValues: string[] = Object.values(ROLES);
      9 + 
     10 + export const isRoleFilter = (value: string): value is RoleFilter => {
     11 +   return value === ALL_ROLES || roleValues.includes(value);
     12 + };
     13 + 
     14 + type UserFilters = {
```

## X335: local/roles-from-enum

`apps/react-vite/src/features/users/api/get-users.ts` line 16; code from the final change.

```
     10 +   role?: ROLES.ADMIN | ROLES.USER;
     11 +   search?: string;
     12 + }): Promise<{ data: User[] }> => {
     13 +   return api.get(`/users`, { params });
     14   };
     15   
>>   16 + export const getUsersQueryOptions = (params?: {
     17 +   role?: ROLES.ADMIN | ROLES.USER;
     18 +   search?: string;
     19 + }) => {
     20     return queryOptions({
     21 +     queryKey: params ? ['users', params] : ['users'],
     22 +     queryFn: () => getUsers(params),
```

## X336: local/readonly-props

`apps/web/app/(app)/workspaces/[workspaceId]/settings/account/profile/components/AccountActivity.tsx` line 11; code from the final change.

```
      5 + import { TUser } from "@formbricks/types/user";
      6 + 
      7 + interface AccountActivityProps {
      8 +   user: TUser;
      9 + }
     10 + 
>>   11 + export const AccountActivity = ({ user }: Readonly<AccountActivityProps>) => {
     12 +   const { t } = useTranslation();
     13 +   const locale = user.locale ?? "en-US";
     14 + 
     15 +   return (
     16 +     <div className="flex flex-col gap-4">
     17 +       <div className="flex flex-col gap-1">
```

## X337: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/discussion-view.tsx` line 8; code from the final change (the line may have moved since the finding).

```
      2 + 
      3 + import { Button } from '@/components/ui/button';
      4   import { MDPreview } from '@/components/ui/md-preview';
      5   import { Spinner } from '@/components/ui/spinner';
      6   import { formatDate } from '@/utils/format';
      7 + import { Authorization, ROLES } from '@/lib/authorization';
>>    8   
      9   import { useDiscussion } from '../api/get-discussion';
     10   import { UpdateDiscussion } from '../components/update-discussion';
     11 + import { usePinDiscussion } from '../api/pin-discussion';
     12   
     13   export const DiscussionView = ({ discussionId }: { discussionId: string }) => {
     14     const discussionQuery = useDiscussion({
```

## X338: local/readonly-props

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 13; code from the final change.

```
      7 + interface AccountActivityProps {
      8 +   createdAt: Date;
      9 +   lastLoginAt: Date | null | undefined;
     10 +   locale: string;
     11 + }
     12 + 
>>   13 + export const AccountActivity = ({ createdAt, lastLoginAt, locale }: Readonly<AccountActivityProps>) => {
     14 +   const { t } = useTranslation();
     15 + 
     16 +   return (
     17 +     <SettingsCard
     18 +       title={t("workspace.settings.profile.account_activity")}
     19 +       description={t("workspace.settings.profile.account_activity_description")}>
```

## X339: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 32; code from the final change.

```
     26 +       return name.includes(term) || user.email.toLowerCase().includes(term);
     27 +     });
     28 +   }, [allUsers, search]);
     29   
     30     if (usersQuery.isLoading) {
     31       return (
     35       );
     36     }
     37   
     38 +   if (!allUsers) return null;
```

## X340: local/notifications-in-mutation-hook

`apps/react-vite/src/features/discussions/components/pin-discussion.tsx` line 4; code from the file as the agent wrote it.

```
      1 + import { Pin, PinOff } from 'lucide-react';
      2 + 
      3 + import { Button } from '@/components/ui/button';
>>    4 + import { useNotifications } from '@/components/ui/notifications';
      5 + import { Authorization, ROLES } from '@/lib/authorization';
      6 + 
      7 + import { usePinDiscussion } from '../api/pin-discussion';
      8 + 
      9 + type PinDiscussionProps = {
     10 +   discussionId: string;
```

## X341: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 35; code from the final change.

```
     29     if (!users) return null;
     30   
     31 +   const term = search.trim().toLowerCase();
     32 +   const filteredUsers = users.filter((user) => {
     33 +     if (!term) return true;
     34 +     const name = `${user.firstName} ${user.lastName}`.toLowerCase();
>>   35 +     return name.includes(term) || user.email.toLowerCase().includes(term);
     36 +   });
     37 + 
     38 +   const exportCsv = () => {
     39 +     downloadCsv('users.csv', [
     40 +       ['Name', 'Email', 'Role', 'Joined'],
     41 +       ...filteredUsers.map((user) => [
```

## X342: local/shared-date-formatting

`apps/web/app/(app)/account/settings/profile/components/AccountActivity.tsx` line 61; code from the final change.

```
     55 +             })}
     56 +           </Small>
     57 +         </div>
     58 +         <div>
     59 +           <H4 className="mb-1 font-medium tracking-normal">
     60 +             {t("workspace.settings.profile.last_login")}
>>   61 +           </H4>
     62 +           <Small color="muted">
     63 +             {user.lastLoginAt
     64 +               ? formatDateForDisplay(user.lastLoginAt, locale, {
     65 +                   year: "numeric",
     66 +                   month: "long",
     67 +                   day: "numeric",
```

## X343: local/query-key-from-options

`apps/react-vite/src/features/discussions/api/pin-discussion.ts` line 25; code from the final change (the line may have moved since the finding).

```
     19 + 
     20 + export const usePinDiscussion = ({
     21 +   mutationConfig,
     22 + }: UsePinDiscussionOptions = {}) => {
     23 +   const queryClient = useQueryClient();
     24 + 
>>   25 +   const { onSuccess, ...restConfig } = mutationConfig || {};
     26 + 
     27 +   return useMutation({
     28 +     onSuccess: (data, ...args) => {
     29 +       queryClient.invalidateQueries({
     30 +         queryKey: getDiscussionsQueryOptions().queryKey,
     31 +       });
```

## X344: local/role-checks-through-authorization

`apps/react-vite/src/features/users/components/users-list.tsx` line 49; code from the final change.

```
     43 + 
     44 +   const roleFilter = useWatch({ control: form.control, name: 'role' });
     45 +   const search = useWatch({ control: form.control, name: 'search' });
     46 + 
     47 +   const usersQuery = useUsers({
     48 +     queryConfig: {
>>   49 +       params: {
     50 +         role: roleFilter === 'ALL' ? undefined : roleFilter,
     51 +         search: search || undefined,
     52 +       },
     53 +     },
     54 +   });
     55 + 
```
