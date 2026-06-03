# API Type Generation — Orval Guide

## Overview

EduCRM uses [Orval](https://orval.dev) to generate type-safe API code from the
backend's OpenAPI 3.x specification. This eliminates an entire class of bugs:
frontend–backend contract mismatches.

**What gets generated** (all in `src/generated/`, never edit manually):

| Output | Location | Contents |
|---|---|---|
| React Query hooks | `src/generated/api/` | `useGetStudents()`, `useCreatePayment()`, etc. |
| TypeScript interfaces | `src/generated/models/` | `StudentDto`, `CreateStudentDto`, `PaymentDto`, etc. |
| Zod schemas | `src/generated/zod/` | `studentDtoSchema`, `createPaymentDtoSchema`, etc. |

---

## Orval Configuration

The full configuration lives in `orval.config.ts` at the project root:

```ts
import { defineConfig } from 'orval';

export default defineConfig({
  educrm: {
    input: {
      // Primary: fetch live schema from backend
      target: process.env.OPENAPI_SCHEMA_URL
        ?? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/docs-json`,
      // Fallback: use committed schema.json when backend unavailable
      ...(process.env.CI || !process.env.NEXT_PUBLIC_API_URL
        ? { target: './openapi/schema.json' }
        : {}),
    },
    output: {
      mode: 'tags-split',              // one file per OpenAPI tag
      target: 'src/generated/api',
      schemas: 'src/generated/models',
      client: 'react-query',
      httpClient: 'axios',
      baseUrl: process.env.NEXT_PUBLIC_API_URL ?? '',
      override: {
        mutator: {
          path: './src/services/api/client.ts',
          name: 'apiClient',           // use our axios instance with interceptors
        },
        query: {
          useQuery: true,
          useInfiniteQuery: true,      // for paginated endpoints
          useSuspenseQuery: false,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write src/generated',
    },
  },

  // Also generate Zod schemas for runtime validation
  educrmZod: {
    input: './openapi/schema.json',
    output: {
      mode: 'tags-split',
      target: 'src/generated/zod',
      client: 'zod',
    },
  },
});
```

### Key configuration choices

**`mode: 'tags-split'`** — Each OpenAPI tag (students, teachers, payments…) gets
its own file. This keeps imports clean and avoids one giant barrel file.

**`mutator: apiClient`** — Orval uses our custom Axios instance (not a plain
fetch) so every generated request automatically gets the auth header, base URL,
and the 401 → token-refresh interceptor.

**Zod schemas** — The second `educrmZod` config generates Zod schemas matching
every DTO. These are used in React Hook Form resolvers for server-validated forms.

---

## Running the Generator

```bash
# Standard run (fetches from backend or falls back to schema.json)
npm run generate:api

# Force offline — always read from committed schema.json
OPENAPI_SCHEMA_URL=./openapi/schema.json npm run generate:api

# Watch mode — reruns whenever openapi/schema.json changes on disk
npm run generate:api:watch
```

The `prebuild` npm script ensures types are always fresh before any build:

```json
{
  "scripts": {
    "prebuild": "npm run generate:api",
    "build": "next build"
  }
}
```

---

## Offline Fallback — schema.json

`openapi/schema.json` is committed to the repository. It serves two purposes:

1. **Offline / CI builds** — developers and CI can build without a running backend
2. **Schema versioning** — git history shows exactly when a DTO changed

### Keeping it in sync

When the backend changes its OpenAPI spec, the developer must:

```bash
# 1. Pull the new schema from the backend
curl https://api.yourschool.uz/api/v1/docs-json > openapi/schema.json

# 2. Regenerate types
npm run generate:api

# 3. Fix any TypeScript errors the DTO change introduced
npm run type-check

# 4. Commit everything together
git add openapi/schema.json src/generated/
git commit -m "chore: sync OpenAPI schema + regenerate types"
```

This keeps the schema and the generated code always consistent in every commit.

---

## Using Generated Hooks in Components

### Query (read)

```tsx
import { useGetStudents } from '@/generated/api/students';

export function StudentList() {
  const { data, isLoading, error } = useGetStudents({
    page: 1,
    pageSize: 20,
    status: 'active',
  });

  if (isLoading) return <SkeletonLoader variant="table-row" count={5} />;
  if (error) return <ErrorState error={error} />;

  return <DataTable data={data?.items ?? []} columns={columns} />;
}
```

### Mutation (write)

```tsx
import { useCreateStudent } from '@/generated/api/students';
import { useQueryClient } from '@tanstack/react-query';

export function CreateStudentForm() {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useCreateStudent({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
        addToast({ type: 'success', message: t('students.created') });
      },
      onError: (error) => {
        mapApiErrorsToForm(parseApiError(error).fieldErrors, setError);
      },
    },
  });

  // ...
}
```

### Infinite query (paginated mobile list)

```tsx
import { useGetStudentsInfinite } from '@/generated/api/students';

export function StudentCardList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useGetStudentsInfinite(
      { pageSize: 10 },
      {
        getNextPageParam: (last) =>
          last.meta.hasNextPage ? last.meta.page + 1 : undefined,
      }
    );

  const students = data?.pages.flatMap((p) => p.items) ?? [];
  // ...
}
```

---

## Handling Breaking Changes in Backend DTOs

When the backend renames, removes, or restructures a field, the generator will
produce new types that break the existing frontend code. TypeScript will surface
every affected location.

### Step-by-step recovery

```bash
# 1. Update schema
curl https://api.yourschool.uz/api/v1/docs-json > openapi/schema.json

# 2. Regenerate (new types appear, old references break)
npm run generate:api

# 3. See all broken locations
npm run type-check 2>&1 | head -50

# 4. Fix each location:
#    - Update mapper (e.g. student.mapper.ts) if field was renamed
#    - Update form schema (Zod) if field was removed
#    - Update display code if field shape changed

# 5. Verify
npm run type-check   # must be 0 errors
npm test -- --run    # must pass
```

### Common patterns

**Field renamed** (`firstName` → `givenName`):
```ts
// student.mapper.ts — before
firstName: dto.firstName

// student.mapper.ts — after
firstName: dto.givenName
```

**Field moved to nested object** (`phone` → `contact.phone`):
```ts
// before
phone: dto.phone

// after
phone: dto.contact?.phone ?? ''
```

**Field type changed** (`status: string` → `status: 'active' | 'inactive'`):
The generated Zod schema and TS type already reflect this — no mapper change needed.
Just ensure any hardcoded string comparisons use the new literals.

**Endpoint removed**:
Find all components importing the deleted hook:
```bash
grep -r "useGetOldEndpoint" src/
```
Replace with the new hook or remove the feature.

---

## Mapper Pattern — Why It Exists

Generated DTOs are optimized for API transport, not for React forms. Mappers
bridge the gap:

```
Backend DTO                     FormValues
──────────────────────────────  ──────────────────────────────
{ firstName: 'Aziz',            { firstName: 'Aziz',
  lastName: 'Karimov',            lastName: 'Karimov',
  dateOfBirth: '2000-05-15T…',    dateOfBirth: '2000-05-15',
  address: {                      street: '12 Amir Temur',
    street: '12 Amir Temur',      city: 'Tashkent',
    city: 'Tashkent' },           region: 'Tashkent',
  groupIds: ['g-1', 'g-2'],       country: 'UZ',
  createdAt: '2024-…',            groupIds: ['g-1', 'g-2'],
  updatedAt: '2024-…' }           notes: '' }
```

Transformations mappers handle:
- Flattening nested objects → flat form fields (and reversing)
- ISO timestamp strings → date-only strings (`YYYY-MM-DD`)
- `null` / `undefined` → sensible defaults (`''`, `[]`, `0`)
- Omitting empty optional fields on the way back to DTO
- Computing display-only fields (`isOverdue`, `dueDateDisplay`)

Mappers are pure functions — easy to unit-test and reason about in isolation.

---

## CI Integration

The CI pipeline validates that generated code is always in sync with the
committed schema:

```yaml
# .github/workflows/ci.yml (relevant steps)

- name: Generate API types
  run: npm run generate:api
  env:
    OPENAPI_SCHEMA_URL: ./openapi/schema.json   # use committed schema

- name: Check for uncommitted generated changes
  run: |
    if [ -n "$(git status src/generated --short)" ]; then
      echo "ERROR: src/generated/ is out of sync with openapi/schema.json"
      echo "Run 'npm run generate:api' and commit the result."
      git diff src/generated/
      exit 1
    fi

- name: TypeScript
  run: npm run type-check

- name: Lint
  run: npm run lint
```

This ensures that if someone updates `schema.json` without regenerating, CI
fails loudly before anything ships.

---

## Troubleshooting

### `Cannot find module '@/generated/api/students'`

The generated files don't exist yet. Run:
```bash
npm run generate:api
```

### Orval fails with `ECONNREFUSED`

The backend isn't reachable. Force offline mode:
```bash
OPENAPI_SCHEMA_URL=./openapi/schema.json npm run generate:api
```

### `Type 'string' is not assignable to type 'active' | 'inactive'`

A DTO field was narrowed to a union type. Update the mapper to use the correct
literal or cast via `as const`.

### Generated hook returns `any` instead of typed data

The OpenAPI spec for that endpoint is missing a `schema` on the response object.
Ask the backend team to add `$ref` to the DTO in the spec, then regenerate.

### `orval: Cannot read property 'components'`

`openapi/schema.json` is malformed or empty. Re-fetch from the backend:
```bash
curl -f https://api.yourschool.uz/api/v1/docs-json > openapi/schema.json
```
