# Fix Notes — Dependency & Script Issues

## What was broken and why

### 1. `npm install` failed — `next-themes` peer dependency

**Error:**
```
npm error peer react@"^16.8 || ^17 || ^18" from next-themes@0.3.0
```

**Root cause:** `next-themes@0.3.0` only declared peer support for React 16–18.
The project uses React 19.

**Fix applied:** Bumped `next-themes` to `^0.4.6` which adds React 19 peer support.
Also updated `@types/react` / `@types/react-dom` from `^18.x` → `^19.0.0` to match.

---

### 2. `npm run dev` failed — orval not found

**Error:**
```
> educrm-frontend@1.0.0 predev
> npm run generate:api
'orval' is not recognized as an internal or external command
```

**Root cause:** The original `package.json` used npm lifecycle hooks:
```json
"predev":   "npm run generate:api",
"prebuild": "npm run generate:api"
```

These run **automatically before `npm run dev` and `npm run build`**.
On a fresh clone, `npm install` must complete before any scripts can run —
but on the first install attempt the install itself was failing (issue #1 above),
so orval was never installed. Even after fixing issue #1, running `npm run dev`
on a machine with no backend running causes `generate:api` to fail because orval
tries to fetch `NEXT_PUBLIC_API_URL/api/v1/docs-json` and gets a connection error.

**Fix applied:**
- Removed `predev` and `prebuild` auto-hooks
- `npm run dev` now starts Next.js directly (safe, fast)
- `npm run build` now explicitly runs `generate:api` then `next build`
- Added `npm run dev:fresh` for when you want both steps: generate API types then dev

---

## Correct startup sequence (after these fixes)

```bash
# 1. Install dependencies (now works cleanly)
npm install

# 2a. If backend is running — generate types from live OpenAPI spec, then dev
npm run dev:fresh

# 2b. If backend is NOT running — dev with existing generated types (or fallback schema)
npm run dev

# 3. To regenerate types any time
npm run generate:api
```

---

## Files changed

| File | Change |
|------|--------|
| `package.json` | `next-themes` `^0.3.0` → `^0.4.6` |
| `package.json` | `@types/react` `^18.3.3` → `^19.0.0` |
| `package.json` | `@types/react-dom` `^18.3.0` → `^19.0.0` |
| `package.json` | Removed `predev` hook |
| `package.json` | Changed `prebuild` to inline `&&` in `build` script |
| `package.json` | Added `dev:fresh` script |
