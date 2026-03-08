

# Redesign End-of-Chapter Section

Based on the reference image, the after-reader section needs to be made **full-width** (no `max-w-3xl` container constraint) and add a **Reactions section** between the action cards and comments.

## Changes to `src/pages/ChapterReader.tsx`

### 1. Widen the container
- Change `container max-w-3xl` to a wider layout (e.g., `max-w-5xl mx-auto px-4` or remove max-width) so the Share/Report/Discord rows span more width like the reference.

### 2. Add "Options" button
- Add a centered "Options" button below the Next Chapter card (outlined style).

### 3. Add Reactions Section
- Add a new section between the Report/Discord row and Comments with:
  - "What do you think?" heading + "0 Reactions" subtitle
  - Row of 6 emoji reaction buttons: 👍 Like, 🤣 Funny, 😍 Love, 😮 Surprised, 😠 Angry, 😢 Sad
  - Each with a count and label below
  - Use emoji characters or a simple icon approach
  - State to track reaction counts and user's selected reaction

### 4. Styling adjustments
- Share row, Report/Discord row should be full-width within the wider container
- Cards use darker `bg-secondary/40` backgrounds matching the reference

## Files to Edit
- **`src/pages/ChapterReader.tsx`** — widen container, add Options button, add Reactions component inline

