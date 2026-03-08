

## Plan: Floating Cover Image for Editor's Choice

In the reference, the right-side cover image is displayed as a **floating rounded rectangle** that extends slightly beyond the card boundary (overlapping/protruding above), rather than being flush inside the card. The cover has rounded corners and a subtle border, sitting as an elevated element.

### Changes to `src/components/EditorChoice.tsx`:

1. **Remove `overflow-hidden`** from the main container so the cover can float outside the card bounds.

2. **Replace the full-bleed right cover area** with a floating rounded rectangle:
   - Use `absolute` or `relative` positioning with negative top offset to make the cover "pop out" above the card
   - Apply `rounded-xl` with a border and shadow for the floating card look
   - Remove the gradient overlays (not needed when cover is a separate floating element)
   - Keep the "Start Reading" button positioned at bottom-right of the floating cover

3. **Structural change**: Instead of the cover being inside the flex row, make the outer container `relative` with padding-right to reserve space, and position the cover absolutely on the right side, extending above the card boundary.

4. **Dimensions**: The floating cover should be approximately `w-[380px] h-[380px] md:w-[420px] md:h-[420px]` with `rounded-2xl`, `border border-border/40`, and a slight `shadow-xl`.

5. **Positioning**: Float it with `absolute right-4 -top-4 md:right-6 md:-top-6` so it protrudes above the card, matching the reference.

