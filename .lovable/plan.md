

# Latest Updates Header Redesign

## What Changes
Redesign the header bar: title and filter buttons on the same row, grouped buttons with a shared darker background container, new categories (All Series, Manga, Manhwa, Manhua) with flag icons, tick mark on the right of the active tab, and "View all" pushed to the far right.

## Changes

### `src/components/LatestUpdates.tsx`

1. **Update `FILTER_TABS`** to `['All Series', 'Manga', 'Manhwa', 'Manhua']`

2. **Update filter logic** — filter by `m.type` instead of `m.genres` for Manga/Manhwa/Manhua tabs

3. **Redesign the header row layout:**
   - Single row with `flex items-center justify-between`
   - Title `h2` and button group side by side (no wrapping to column on mobile)
   - Button group wrapped in a container div with `bg-secondary/60 rounded-full px-1 py-1 flex items-center gap-1` to create the grouped pill background
   - Each button: `px-4 py-2 rounded-full text-sm font-medium` — active gets no special background color (transparent within the group), inactive is also transparent but dimmer text
   - Active tab shows a `✓` check icon **to the right** of the label (not left)
   - "View all >" link stays at far right, outside the button group

4. **Add icons to the left of each button label:**
   - All Series: `Grid3X3` (9-dot grid) from lucide-react
   - Manga: 🇯🇵 emoji in a small circle
   - Manhwa: 🇰🇷 emoji in a small circle  
   - Manhua: 🇨🇳 emoji in a small circle

   Use small inline `<span>` with `w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px]` for flag circles, and `Grid3X3` icon (size 14) for All Series.

5. **Button text styling:** All buttons same text color (`text-muted-foreground`), active one gets `text-foreground` with the check mark appended to the right.

### Files to Edit
- `src/components/LatestUpdates.tsx` — header layout, tabs, icons, filter logic

