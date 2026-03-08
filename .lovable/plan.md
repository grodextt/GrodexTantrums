

# Chapter Reader Redesign

## What Changes

Redesign `ChapterReader.tsx` to match the KaynScan reference with these key elements:

### 1. Remove Top Sticky Nav Bar
Replace the current sticky top navigation with a simple centered title bar showing `"{Manga Title} - Chapter {N}"` below the navbar.

### 2. Fixed Bottom Navigation Bar
Add a fixed bottom bar with 4 sections:
- **← (Prev chapter)** button — rounded pill style
- **Chapters** button with grid icon — opens a chapter list panel/drawer
- **Zoom controls** — minus, percentage display, plus buttons
- **→ (Next chapter)** button — rounded pill style

All in dark rounded pill containers, centered at the bottom of the screen.

### 3. Chapter List Drawer
When "Chapters" is clicked, show a full-screen overlay/drawer with:
- Header showing chapter count + sort toggle
- 2-column grid of chapter items, each with thumbnail, chapter name, and date
- Scrollable content

### 4. Zoom Functionality
- State for zoom percentage (default ~40% or similar)
- `+` / `-` buttons adjust image width
- Display current percentage between buttons

### 5. Image Reader Area
- Full-width vertical scroll of chapter page images (placeholders)
- No borders/rounded corners — images stack seamlessly
- Images respect zoom level (width percentage of container)

### 6. After Images Section
Keep existing: Next Chapter link, Share/Report/Discord cards, Reactions, Comments — similar to what's already on the MangaInfo page.

## Files to Edit

- **`src/pages/ChapterReader.tsx`** — Complete rewrite with new layout, bottom bar, zoom state, chapter drawer
- No new files needed; reuse existing UI components (Button, Sheet/Drawer for chapter list)

## Technical Details

- Use `useState` for zoom level (30-100%, step 10)
- Use Vaul drawer or Radix sheet for chapter list overlay
- Bottom bar: `fixed bottom-4 left-1/2 -translate-x-1/2 z-50` with flex layout
- Chapter title centered below navbar as static text
- Page images use `style={{ width: `${zoom}%` }}` centered with `mx-auto`

