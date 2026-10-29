# Daypack Design

Source of truth for all styling. Components use Panda tokens only; no hard-coded colors or sizes.

Look: cozy, modern Scandinavian. A cool lavender-grey base with a soft lilac, baby blue and rose glow behind the header, white cards, dusty pastel item colors and a warm yellow Reset button. Mobile-first, one-handed: primary action at the bottom.

## Layout (top to bottom)

- **Header glow:** three soft radial gradients behind the top ~330px of the screen.
- **Top bar:** logo left (outline backpack icon in brand color + lowercase wordmark "daypack"). Right side has an EN/SV segmented pill and a round theme button.
- **Date** (e.g. "Thursday 29 October"), then the **title on ONE line** (never wraps).
- **Counter row:** "2 of 7 packed" left, "29%" right in muted, then a 10px rounded progress bar.
- **List:** ONE white card (radius 24, 16px side margin) with rows separated by 1px dividers, no gaps between rows. Each row: round pastel icon tile (38px) → label → round checkbox (30px).
- **Category headings:** inside the list card, each group starts with a 15px / 700 muted heading (20px side padding, 16px above, 4px below); rows keep their dividers inside a group.
- **Reset:** fixed bottom, 16px side margins, 60px tall, radius 18 (not a pill), 34px + safe-area-inset-bottom below it, with a fade from the background behind it.

## Color tokens

| Token | Light | Dark |
|---|---|---|
| bg | #F8F5F8 | #16131F |
| surface (card) | #FFFFFF | #201C2D |
| text | #24213A | #F1EEF8 |
| textMuted | #5C5876 | #B3ADCB |
| brand (logo, active EN/SV) | #5B63D3 | #C3C6FF |
| onBrand | #FFFFFF | #18153A |
| divider | #F0ECF2 | #2C2739 |
| track (progress bg) | #E9E4EF | #302A40 |
| chip (pill/button bg) | rgba(255,255,255,.75) | rgba(255,255,255,.10) |
| accent (Reset bg) | gradient 180deg #FFE070 → #FFC43A | gradient 180deg #FFE27A → #FFCA48 |
| onAccent | #3A2A06 | #3A2A06 |
| progress fill | gradient 90deg #9FD0FF → #A68DF5 55% → #6A63E0 | gradient 90deg #6A63E0 → #B49CFF 55% → #A6D6FF |

### Header glow

- Light: radial lilac rgba(222,196,250,.7) at 16% 44%, baby blue rgba(170,212,255,.75) at 90% 8%, rose rgba(255,214,226,.45) at 60% 70%
- Dark: radial lilac rgba(176,140,255,.24) at 16% 44%, baby blue rgba(110,175,255,.26) at 90% 8%

## Item hues

Each item has a hue. Icon tile = tile color with icon in icon color. Checkbox uses the check color.

| Hue | Tile (light) | Icon (light) | Check (light) | Check (dark) |
|---|---|---|---|---|
| yellow | #FFE3A0 | #8A5A00 | #E3C27C | #EBCD8C |
| sky | #CDE4FA | #1F5A8F | #90B3DC | #A0C1E8 |
| pink | #FBD3E0 | #962E57 | #DA9DB5 | #E8B0C6 |
| mint | #C9F0DE | #1A7050 | #90C6AC | #A0D4BC |
| peach | #FFD6C2 | #933F1A | #E6AA8E | #F0B89D |
| lavender | #E3D7FA | #523896 | #AE9DDB | #BEAFE8 |
| sea | #C7EEEC | #16696A | #8BC3C1 | #9ACFCD |

Dark mode: tile = the light tile color at ~18% opacity, icon = the light tile color.

Checkbox states: unchecked = 2px border in the check color at 70% opacity, transparent fill. Checked = filled with the check color, white tick (dark mode: tick in the bg color). The checkbox itself never dims.

## Typography

Plus Jakarta Sans (Google Fonts, 400–800).

- Title 31px / 800 / letter-spacing -0.03em, single line
- Wordmark 20px / 700 / -0.02em
- Item label 17px / 600
- Date, counter 15px / 600–700
- EN/SV pill 13px / 700

## Shape, size, depth

- Radius: card 24, Reset 18, icon tiles, checkboxes, chips and pills fully round
- Every tap target at least 48×48px (rows 56px min, top-bar buttons 48px)
- Card shadow light: 0 1px 2px rgba(60,40,90,.05), 0 10px 30px -12px rgba(60,40,90,.2); dark: inset 0 1px 0 rgba(255,255,255,.05), 0 12px 30px -14px rgba(0,0,0,.5)
- Reset shadow light: 0 12px 24px -12px rgba(240,170,30,.75); dark: 0 12px 26px -14px rgba(255,200,72,.5)

## Motion (all off under prefers-reduced-motion)

- Tick pops in: 360ms, scale 0.2 → 1.15 → 1
- Icon and label fade to 45% opacity in 280ms when checked
- Progress bar width animates over 500ms
- Reset presses down slightly (translateY 1px, scale .99)
