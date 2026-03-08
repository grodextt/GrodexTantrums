

## Fixes Plan

### 1. Scroll to Top on Chapter Navigation
**Problem:** When navigating to next/previous chapter via `navigate()`, React Router doesn't scroll to top by default — the scroll position persists from the previous chapter.

**Fix in `src/pages/ChapterReader.tsx`:** Add a `useEffect` that scrolls to top whenever `chapterNum` changes:
```tsx
useEffect(() => {
  window.scrollTo(0, 0);
}, [chapterNum]);
```

### 2. Chapter Thumbnails in MangaInfo
**Problem:** All chapter cards in the chapter list use `manga.cover` as their thumbnail. The request is to use the 2nd page image of the respective chapter.

**Reality:** The mock data has no `pages` array on chapters. There are only 8 cover images available (`/manga/cover1.jpg` through `cover8.jpg`).

**Fix in `src/pages/MangaInfo.tsx`:** Use a deterministic cover image per chapter by cycling through the available covers based on chapter number:
```tsx
src={`/manga/cover${(ch.number % 8) + 1}.jpg`}
```
This gives each chapter a visually distinct thumbnail instead of all sharing the same cover image.

### Files to Edit
- `src/pages/ChapterReader.tsx` — add `useEffect` for scroll-to-top
- `src/pages/MangaInfo.tsx` — use per-chapter thumbnail in chapter grid

