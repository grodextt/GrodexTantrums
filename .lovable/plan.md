

# Hero Carousel Redesign — Card-Style Slider

## Overview
Replace the current banner-style hero with a **multi-card carousel** matching the reference: tall manga cover cards visible side-by-side, with type badges top-left, title + status (with blinking dot) + description at the bottom.

## Data Changes

**`src/data/mockManga.ts`** — Add `'Season End' | 'Cancelled'` to `MangaStatus` type so all 5 statuses are supported.

## Tailwind Config

**`tailwind.config.ts`** — Add a `blink` keyframe animation:
```
'blink': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } }
```
And animation: `'blink': 'blink 1.5s ease-in-out infinite'`

## HeroCarousel Redesign

**`src/components/HeroCarousel.tsx`** — Complete rewrite:

### Layout
- Use **all manga** (not just featured) or keep featured — show multiple cards at once
- Horizontal scrollable track with CSS `transform: translateX()` based on `current` index
- Show ~3 cards on desktop, ~2 on tablet, ~1 on mobile with partial peek of adjacent cards
- Left/right chevron buttons on the edges (circular, semi-transparent)

### Each Card
- **Tall portrait cover** (~350-450px height) with rounded corners, full-width image
- **Top-left badges**: TypeBadge showing manga type (e.g., "Manhwa", "Comic")
- **Bottom overlay** with gradient from transparent to dark:
  - Alt title (small, muted text) if available
  - **Title** (bold, white, line-clamp-1)
  - **Status badge**: colored dot (with `animate-blink`) + status text
    - Ongoing → light green (`#4ade80`)
    - Hiatus → dark yellow (`#eab308`)
    - Season End → sky blue (`#38bdf8`)
    - Completed → dark green (`#16a34a`)
    - Cancelled → light red (`#f87171`)
  - **Description** (small, muted, line-clamp-2)
- Entire card is a `Link` to `/manga/{slug}`

### Auto-advance
- Auto-slide every 5 seconds, pause on hover

### Responsive
- Cards: `w-[85vw] sm:w-[45vw] lg:w-[32%]` with gap
- Container is full-width (edge-to-edge within the page container)

## Files to Edit
1. **`src/data/mockManga.ts`** — expand `MangaStatus` union type
2. **`tailwind.config.ts`** — add `blink` keyframe + animation
3. **`src/components/HeroCarousel.tsx`** — full rewrite to card-based carousel

