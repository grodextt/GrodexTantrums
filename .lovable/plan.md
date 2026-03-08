

## Plan: Make Editor's Choice Section Fully Responsive

### Current Issues
- **Header**: Fixed `text-4xl` and `h-[40px]` icon sizes don't scale for mobile
- **Thumbnails**: Fixed `w-28 h-40` sizes overflow on small screens
- **Main container**: `min-h-[350px]` is large for mobile
- **Padding**: Fixed padding doesn't adapt well
- **Mobile cover**: Fixed `h-[250px]` may not work on all sizes

### Changes to `src/components/EditorChoice.tsx`:

1. **Header Section (lines 24-27)**
   - Scale icon: `h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10`
   - Scale title: `text-2xl sm:text-3xl md:text-4xl`

2. **Main Container (line 30)**
   - Responsive min-height: `min-h-[auto] md:min-h-[350px]`

3. **Info Panel Padding (line 32)**
   - Graduated padding: `p-4 sm:p-6 md:p-8`

4. **Title & Description (lines 33-34)**
   - Title: `text-xl sm:text-2xl md:text-3xl`
   - Description: Keep `text-sm`, maybe adjust margins

5. **Thumbnail Covers (lines 37-49)**
   - Make thumbnails scrollable: `flex gap-2 overflow-x-auto scrollbar-hide`
   - Responsive sizes: `w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-40`
   - Add `shrink-0` to prevent squishing

6. **Arrow Buttons (lines 53-57)**
   - Responsive sizes: `w-8 h-8 sm:w-10 sm:h-10`
   - Responsive icons: `w-4 h-4 sm:w-5 sm:h-5`

7. **Mobile Cover (lines 92-102)**
   - Responsive height: `h-[200px] sm:h-[250px]`

