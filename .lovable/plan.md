

## Plan: Scale Up MangaInfo Text, Badges, Buttons & Layout

Comparing the uploaded reference image against the current code, these elements are undersized:

### Changes to `src/pages/MangaInfo.tsx`

1. **Title**: Increase from `text-4xl sm:text-5xl` to `text-5xl sm:text-6xl` for the bold headline effect
2. **Alternative titles**: Increase from `text-sm` / `text-xs` to `text-base italic` / `text-sm` 
3. **Status badge**: Increase from `text-xs px-3 py-1` to `text-sm px-4 py-1.5 rounded-md` with proper colors (green for Ongoing, red for Completed matching the reference)
4. **Genre/metadata row**: Increase icon+text from `text-xs` to `text-sm`, increase gap from `gap-2.5` to `gap-3`
5. **Genre tags row**: Remove this duplicate row (the reference only shows genres inline in the metadata row, not as separate pill tags)
6. **Description box**: Increase from `text-sm` to `text-base`, increase padding from `p-5` to `p-6`
7. **Action buttons**: Increase height from `h-12` to `h-14`, text from `text-sm` to `text-base`
8. **Share card**: Increase text from `text-sm`/`text-xs` to `text-base`/`text-sm`, share button from `h-9 w-9` to `h-11 w-11`
9. **Report/Discord cards**: Increase text from `text-xs`/`text-[10px]` to `text-sm`/`text-xs`, button sizes from `h-8` to `h-9`
10. **Cover image**: Increase from `w-56 h-[320px]` to `w-64 h-[360px]`

