

## Plan: Floating Cover Rectangle for Editor's Choice

### What to change

Replace the current right-side cover (which is flush/integrated into the card container) with a **floating rounded rectangle** that overlaps or sits above the card, matching the reference image style.

### Changes to `src/components/EditorChoice.tsx` (lines 73-91):

1. **Remove `overflow-hidden`** from the outer container (line 29) so the floating cover can visually extend beyond boundaries.

2. **Replace the right-side cover div** with a floating rectangle:
   - Use `rounded-2xl overflow-hidden shadow-2xl` for the raised card look
   - Add negative margin or absolute positioning so it "floats" slightly above/outside the container
   - Remove the gradient overlays (no longer needed since the cover is a separate floating element)
   - Keep the "Start Reading" button positioned at the bottom-right of the floating cover
   - Set dimensions to roughly `md:w-[420px] h-[350px]` to match the reference proportions

3. **Adjust the outer container**: Change from `overflow-hidden` to `overflow-visible` and make the layout use relative positioning so the cover can float.

The result will be a distinct rounded card for the cover image that appears to float on the right side of the section, matching the reference design.

