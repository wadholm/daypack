# Daypack Spec (Step 1)

## Goal

A mobile-first utility for parents packing a toddler's nursery bag in the hallway, one-handed. Show a daily packing list, tick items off, and reset it for the next morning. Styling follows [DESIGN.md](DESIGN.md).

## Step 1 features and acceptance criteria

### 1. Packing list
- Title "Today's packing list" / "Dagens packlista" on one line, never wrapping at 320px width.
- Each item row shows pastel icon tile, label and a large round checkbox; the whole row is tappable (min 56px tall).
- Checking dims icon and label to 45% and strikes the label through; the checkbox does not dim.
- Counter shows "N of 7 packed" and a percentage; the progress bar reflects it.
- Checked state persists across reloads in localStorage, keyed by stable item id.

### 2. Reset
- Button "Reset for tomorrow" / "Nollställ till imorgon" fixed at the bottom with safe-area padding.
- Pressing it unchecks all items and clears persisted state. List content is never hidden behind it.

### 3. Theme switch
- Options System / Light / Dark; default System (prefers-color-scheme); choice persists.
- Implemented via a Panda condition on `data-theme` on `<html>`, set by a tiny inline script in `index.html` before first paint (no flash).
- System mode follows OS changes live.

### 4. Language switch
- English / Swedish; default from `navigator.language` (`sv*` → Swedish, else English); choice persists; `<html lang>` updates.
- No i18n library: typed dictionaries `i18n/en.ts` and `i18n/sv.ts`; `sv` must have exactly the same keys as `en`, enforced by TypeScript.
- Switching language never loses checked state.

### 5. Backend
- Hono on Cloudflare Workers; `GET /api/items?lang=en|sv` per the contract below.

## Non-goals (Step 1)

Accounts or auth, server-side persistence, custom/editable items, multiple children or lists, notifications, PWA/offline support, additional languages, an i18n library, analytics.

## Data model

```ts
type Lang = 'en' | 'sv';
type Hue = 'yellow' | 'sky' | 'pink' | 'mint' | 'peach' | 'lavender' | 'sea';
type ThemePref = 'system' | 'light' | 'dark';
interface Item { id: string; hue: Hue; label: string } // id is a stable English slug
```

Seed (id → hue → en / sv):

| id | hue | en | sv |
|---|---|---|---|
| diapers | yellow | Diapers | Blöjor |
| pacifier | sky | Pacifier | Napp |
| cuddly-toy | pink | Cuddly toy | Gosedjur |
| spare-clothes | mint | Spare clothes | Extrakläder |
| rain-gear | lavender | Rain gear | Regnkläder |
| water-bottle | sea | Water bottle | Vattenflaska |
| sun-hat | peach | Sun hat | Solhatt |

Icons are chosen on the frontend by item id (hand-written inline SVGs); the API does not send icons.

localStorage keys: `daypack.checked` (JSON array of ids), `daypack.theme`, `daypack.lang`. All reads are wrapped in try/catch and validated.

## API contract

`GET /api/items?lang=en|sv`
- `200 application/json`: `{ "items": [{ "id": "diapers", "hue": "yellow", "label": "Diapers" }, ...] }`
- Order is fixed as in the seed table. Missing or unknown `lang` falls back to `en`.
- Stateless; data is static in the Worker.

## Hosting

One Cloudflare Worker (free plan). Root `wrangler.jsonc`: `main` → `backend/src/index.ts`, `assets.directory` → `frontend/dist`, `not_found_handling: "single-page-application"`, `run_worker_first: ["/api/*"]`. Hono serves only `/api`; everything else is static assets with SPA fallback. Local dev: Vite dev server proxies `/api` to `wrangler dev`.

## Task checklist

- [ ] 1. Root workspace (npm workspaces, TS base config, ESLint, Vitest)
- [ ] 2. Backend: Hono `/api/items` + tests + `wrangler.jsonc`
- [ ] 3. Frontend scaffold: Vite + Preact + TS + Panda, `/api` proxy
- [ ] 4. Panda tokens, conditions and font from DESIGN.md
- [ ] 5. Theme: inline script, store, switch
- [ ] 6. i18n: typed dictionaries, language store, `<html lang>`
- [ ] 7. Checked-state storage and progress logic
- [ ] 8. UI: header, list, checkbox, progress, Reset, motion
- [ ] 9. Wire the UI to `/api/items`, keep state across language switches
- [ ] 10. Single-Worker build and deploy
- [ ] 11. Final gate: lint, typecheck, test, build
