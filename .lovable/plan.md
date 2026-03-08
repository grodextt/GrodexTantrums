

# Redesign LatestUpdates Cards to Match Reference

## Changes

### 1. `src/data/mockManga.ts`
- Add `premium?: boolean` field to the `Chapter` interface
- Mark the first 2 chapters of each manga as `premium: true` in the chapter generation arrays

### 2. `src/components/LatestUpdates.tsx`
**Grid layout:**
- Change from `xl:grid-cols-3` to `xl:grid-cols-5` (5 cards per row on desktop), `md:grid-cols-3`, `sm:grid-cols-2`
- Remove the row-grouping logic — just render a flat grid of all filtered manga

**Card redesign (`LatestCard`):**
- **Cover**: Increase to `w-[100px] h-[140px]` (taller), keep rounded corners and TypeBadge overlay
- **Title**: Bolder — `text-base font-bold` instead of `text-sm font-semibold`
- **Card container**: Add `rounded-lg border border-border/40 bg-card/30 p-3` for defined card boundaries (matching reference)
- **4 chapters** instead of 3: `manga.chapters.slice(0, 4)`
  - First 2 chapters (premium): show a gold/yellow crown icon (lucide `Crown`) to the left of "Chapter N", plus "NEW" badge on the latest
  - Then a thin `border-t border-border/30` divider
  - Last 2 chapters (free): no icon, just chapter number and date
- **Chapter rows**: `flex items-center justify-between` with chapter name left, date right
- Remove the "NEW" green badge style — replace with a small solid pill: `bg-primary text-primary-foreground px-1.5 py-0.5 rounded text-[10px] font-semibold`

### 3. No changes to `src/pages/Index.tsx`

## Files to Edit
1. `src/data/mockManga.ts` — add `premium` to Chapter interface + mark first 2 chapters premium
2. `src/components/LatestUpdates.tsx` — 5-col grid, taller covers, bolder titles, 4 chapters with premium/free split and crown icon

