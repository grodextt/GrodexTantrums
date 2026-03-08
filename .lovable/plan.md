

## Plan: Match MangaInfo Page Visual Details to KaynScan Reference

Based on the comparison between the current implementation and the reference screenshots, here are all the visual differences to fix:

### 1. Tighten spacing throughout (MangaInfo.tsx)
- Reduce main `space-y-5` to `space-y-3`
- Reduce header gap from `gap-6` to `gap-5`
- Reduce description padding from `p-6` to `p-4`
- Action buttons height from `h-14` to `h-12`

### 2. Genre pills with colored emoji icons (MangaInfo.tsx)
- Map genres to specific colored emoji: Drama → 🎲, Romance → ❤️, Action → ⚔️, Fantasy → 🔮, Comedy → 😂, etc.
- Keep fallback 📖 for unmapped genres

### 3. Share button color — teal/green instead of purple (MangaInfo.tsx)
- Change share button from `bg-primary` to `bg-teal-500 hover:bg-teal-600`

### 4. Discord button with brand icon (MangaInfo.tsx)
- Add a Discord SVG icon inline next to the "Discord" text (lucide doesn't have Discord, so use an inline SVG path)

### 5. Sidebar "Completed" badge styling (MangaInfo.tsx)
- Change from `bg-blue-600` to `bg-red-600` to match the reference's red completed badge

### 6. Title size adjustment (MangaInfo.tsx)
- Reduce from `text-5xl sm:text-6xl` to `text-3xl sm:text-4xl` — the reference title is large but not as massive

### Files to edit
- `src/pages/MangaInfo.tsx` — all changes above

