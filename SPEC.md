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
- Hono on Cloudflare Workers; `GET /api/items?lang=en|sv` per the contract below (removed in MVP slice 1; see the MVP section).

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

(Slice 1 supersedes this: items are stored client-side.) Icons are chosen on the frontend by item id (hand-written inline SVGs); the API does not send icons.

localStorage keys: `daypack.checked` (JSON array of ids), `daypack.theme`, `daypack.lang`. All reads are wrapped in try/catch and validated.

## API contract

`GET /api/items?lang=en|sv`
- `200 application/json`: `{ "items": [{ "id": "diapers", "hue": "yellow", "label": "Diapers" }, ...] }`
- Order is fixed as in the seed table. Missing or unknown `lang` falls back to `en`.
- Stateless; data is static in the Worker.

## Hosting

One Cloudflare Worker (free plan). Root `wrangler.jsonc`: `main` → `backend/src/index.ts`, `assets.directory` → `frontend/dist`, `not_found_handling: "single-page-application"`, `run_worker_first: ["/api/*"]`. Hono serves only `/api`; everything else is static assets with SPA fallback. Local dev: Vite dev server proxies `/api` to `wrangler dev`.

Live: https://daypack.wadholm.workers.dev (workers.dev subdomain `wadholm`, Worker name `daypack`).

## Task checklist

- [x] 1. Root workspace (npm workspaces, TS base config, ESLint, Vitest)
- [x] 2. Backend: Hono `/api/items` + tests + `wrangler.jsonc`
- [x] 3. Frontend scaffold: Vite + Preact + TS + Panda, `/api` proxy
- [x] 4. Panda tokens, conditions and font from DESIGN.md
- [x] 5. Theme: inline script, store, switch
- [x] 6. i18n: typed dictionaries, language store, `<html lang>`
- [x] 7. Checked-state storage and progress logic
- [x] 8. UI: header, list, checkbox, progress, Reset, motion (tick-pop and reduced-motion behaviour not yet visually verified)
- [x] 9. Wire the UI to `/api/items`, keep state across language switches
- [x] 10. Single-Worker build and deploy
- [x] 11. Final gate: lint, typecheck, test, build

# Daypack MVP

Step 1 above is the shipped baseline. The MVP targets our own household (mom, dad, a grandparent), not a public launch. The Step 1 non-goals and the "stateless Worker" statements apply until MVP slice 4 lands; that slice adds persistent storage and replaces them.

## MVP decisions

- **Sharing:** invite link or code, no passwords. A device token in localStorage is the identity; anyone with the link can edit. The link is a bearer secret: long, unguessable, regenerable.
- **Daycare model:** each item has a `target` (wanted at daycare) and a `stock` (currently at daycare). To pack = `max(0, target - stock)`. Items flagged `daily` (pacifier, water bottle) are always packed.
- **Weather:** warm and cold starter templates added in one tap. No forecast lookup.
- **Extra info:** an optional free-text `note` per item. Photos are deferred.

## MVP slices (build in order, each shippable)

- [x] 1. Editable items, local first: item model gains `label`, `hue`, `icon`, `category`, `note`, `daily`, `target`, `stock`, `hidden`; add/edit/hide/delete UI; custom ids are generated slugs and custom labels are user text; replaces the hard-coded seed and `GET /api/items` (endpoint removed; items live in `daypack.items` in localStorage, built-in labels stay in the translation files, `daypack.checked` is unchanged)
- [x] 2. Categories and starter lists: list grouped by category (clothing, sleep, hygiene, feeding, comfort, weather, out and about, swim and bath, other; items with no category show under other; editable per item); a 45-entry catalogue (`state/catalogue.ts`) with six switchable starter lists in a Starter lists sheet: warm weather, cold weather, rain (rain gear, rubber boots, pushchair rain cover), overnight stay (sleep, toiletries, overnight clothes and feeding), out and about (pushchair, mosquito net, UV curtain, carrier) and swimming (kept separate from overnight). Labels are bilingual in the translation files. Each list owns its items and lists never overlap, so switching one off cannot hide what another needs; everyday items (diapers, socks, water bottle) are in no list. Switching a list on adds its missing items and unhides the rest; switching it off hides them (nothing is deleted, so notes and edits survive). A list is on when all its items are visible. Catalogue ids are reserved, so a custom item never takes one. Add item searches first: it lists hidden items and catalogue entries not on the list (ignoring case and diacritics) and adds or unhides on tap; only when nothing matches, or the typed name differs from every known item, does it offer to create a custom item. In Edit list each row has a one-tap hide button next to the edit chevron; hidden items stay recoverable from the Hidden items section or the Add item search. A fresh install starts with the five everyday items only (diapers, pacifier, cuddly toy, socks, water bottle), which can only be hidden; weather items such as rain gear and the sun hat arrive with their list; other built-ins can be deleted
- [ ] 3. Daycare view and derived packing list: Pack and At daycare views; editing stock or target recomputes the pack list
- [ ] 4. Shared household state: persistent store in the Worker (D1 recommended), household create/join, items, stock and checked state; client syncs on focus or by polling with localStorage as offline cache; last write wins per item; update this spec and CLAUDE.md to drop "stateless"
- [ ] 5. Multiple children or lists: a household has several lists, switcher in the top bar
- [ ] 6. PWA and offline: manifest, icons, service worker caching the shell and last list, queued offline writes replayed on reconnect
- [ ] 7. Morning reminder notification: Web Push (VAPID) with a Worker cron trigger, per-device opt-in and time; iOS needs the PWA installed (16.4+)

## Out of MVP

Photo upload, live weather forecast, real accounts or OAuth, native app, additional languages.

## Open questions

- Web Push on Workers needs VAPID signing; confirm WebCrypto is enough or ask before adding a dependency.
- D1 free-plan limits, and whether household data needs export or backup.
- "New day" semantics: whether packing an item adds to daycare stock. Decide in slice 3.
- Manual Reset stays; automatic morning reset is not in scope.
