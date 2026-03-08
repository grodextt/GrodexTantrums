
## Plan: Admin CRUD for Manga & Chapters

Since the database tables (`manga`, `chapters`) and the `manga-assets` storage bucket are already set up in Supabase, we can focus entirely on building the admin interface to manage this data. We will leave the public-facing frontend using mock data for now and tackle that in a later step.

### 1. Data Access Hooks
Create a set of React Query hooks in `src/hooks/useManga.ts` to interact with our Supabase tables safely:
- `useAdminManga()`: Fetches all manga for the admin table.
- `useCreateManga()`: Inserts a new series and handles cover image upload to the `manga-assets` bucket.
- `useUpdateManga()`: Updates an existing series and optionally replaces the cover image.
- `useDeleteManga()`: Deletes a series (and cleans up associated cover images).
- `useAdminChapters(mangaId)`: Fetches chapters for a specific series.
- `useCreateChapter()`: Inserts a new chapter and handles bulk uploading of page images.
- `useDeleteChapter()`: Removes a chapter and its associated page images.

### 2. Admin Components: Series Management
Create `src/components/admin/MangaFormModal.tsx`:
- A comprehensive dialog form using `react-hook-form` and `zod` for validation.
- Fields: Title, Slug (auto-generated), Type, Status, Author, Artist, Description, Rating, Release Year, Genres (comma-separated for now), and flags (Premium, Pinned, Featured, Trending).
- Cover Image Upload: A file input that previews the selected image before saving.
- On save, it triggers the appropriate hook (create or update) and closes the modal.

### 3. Admin Components: Chapter Management
Create `src/components/admin/ChapterManager.tsx`:
- A nested view/modal accessible from the manga list.
- Displays a table of existing chapters for a selected series.
- "Add Chapter" form: Fields for chapter number, title, premium toggle, and a multi-file input for uploading page images.
- Handles uploading multiple files to the `manga-assets` bucket under a specific folder structure (e.g., `chapters/{manga_id}/{chapter_number}/...`).

### 4. Admin Panel Integration
Refactor `src/pages/AdminPanel.tsx` to replace `mockManga` with real data in the **Manga** tab:
- Replace the mock data map with the `useAdminManga()` query.
- Wire up the "Add Series" button to open `MangaFormModal`.
- Wire up the "Edit" and "Delete" actions on the manga rows.
- Add a "Chapters" button to each row to open the `ChapterManager`.

By isolating these changes to the Admin Panel, we can fully test the data entry workflow before touching the main website.
