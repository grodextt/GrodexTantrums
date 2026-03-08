

## Plan: Full Admin Panel Functionality + Premium Section

This is a large feature set. The current app uses **mock data** (`mockManga` array) with no database tables for manga/chapters. To make the admin panel functional, we need to move manga and chapter data into Supabase.

### 1. Database Schema (Supabase Migrations)

Create three new tables:

**`manga`** — stores all series
- `id` uuid PK, `slug` text unique, `title` text, `alt_titles` text[], `cover_url` text, `banner_url` text, `description` text, `type` text (Manhwa/Manga/Manhua), `status` text, `genres` text[], `rating` numeric, `views` int default 0, `bookmarks` int default 0, `author` text, `artist` text, `released` int, `featured` boolean default false, `trending` boolean default false, `pinned` boolean default false, `premium` boolean default false, `created_at` timestamptz, `updated_at` timestamptz

**`chapters`** — stores chapters per manga
- `id` uuid PK, `manga_id` uuid FK -> manga, `number` int, `title` text, `premium` boolean default false, `pages` text[] (image URLs), `created_at` timestamptz
- Unique constraint on (manga_id, number)

**`site_settings`** — key/value store for admin settings
- `key` text PK, `value` text

**Storage bucket**: `manga-assets` (public) for cover images and chapter pages.

**RLS Policies**:
- `manga` & `chapters`: SELECT open to all; INSERT/UPDATE/DELETE restricted to admins via `has_role()`
- `site_settings`: SELECT open to all; INSERT/UPDATE/DELETE restricted to admins
- Storage: public read; admin-only upload

**Seed data**: Migrate existing `mockManga` into the new tables via a seed migration.

### 2. Admin Panel — Add/Edit Manga (New Modal/Form)

Create `src/components/admin/MangaFormModal.tsx`:
- Dialog with fields: title, slug (auto-generated from title), alt titles, type (select), status (select), genres (multi-select/tags), author, artist, released year, description, premium toggle, featured/trending/pinned toggles
- Cover image upload to `manga-assets` bucket
- On save: insert/update via Supabase, refresh list
- Zod validation for all fields

Update the Manga tab in `AdminPanel.tsx`:
- "Add Series" button opens the modal in create mode
- Edit button opens in edit mode with pre-filled data
- Delete button with confirmation dialog
- Fetch manga from Supabase instead of `mockManga`

### 3. Admin Panel — Chapter Management

Create `src/components/admin/ChapterManager.tsx`:
- Accessible by clicking on a manga row or an "Add Chapter" button
- Lists all chapters for a series with number, title, premium badge, date
- "Add Chapter" form: chapter number, title, premium toggle, page images upload (multi-file to storage bucket)
- Edit/delete chapters
- Bulk page reordering

### 4. Premium Section on Homepage

Create `src/components/PremiumSection.tsx`:
- New section on the Index page showing manga marked as `premium: true`
- Distinct styling: gold/amber accent, crown/lock icon, "Premium" badge
- Cards link to the manga info page
- Premium chapters on MangaInfo page show a lock icon; clicking shows a "premium required" toast (actual paywall logic deferred)

Update `src/pages/Index.tsx` to include the new `<PremiumSection />` component.

### 5. Migrate Frontend to Use Supabase Data

Update these files to fetch from Supabase instead of `mockManga`:
- `src/pages/Index.tsx` — trending, featured, pinned, premium queries
- `src/pages/MangaInfo.tsx` — fetch manga + chapters by slug
- `src/pages/ChapterReader.tsx` — fetch chapter pages
- `src/pages/Latest.tsx`, `src/pages/Series.tsx` — list queries
- `src/components/HeroCarousel.tsx`, `src/components/PinnedCarousel.tsx`, `src/components/LatestUpdates.tsx`, `src/components/EditorChoice.tsx`, `src/components/CompletedSeries.tsx`
- Create shared hooks: `useManga()`, `useMangaBySlug()`, `useChapters()` using React Query

Keep `mockManga.ts` as fallback/reference but the primary data source becomes Supabase.

### 6. Files Changed Summary

| Action | File |
|--------|------|
| New migration | `supabase/migrations/..._create_manga_chapters_settings.sql` |
| New migration | `supabase/migrations/..._seed_manga_data.sql` |
| New | `src/components/admin/MangaFormModal.tsx` |
| New | `src/components/admin/ChapterManager.tsx` |
| New | `src/components/PremiumSection.tsx` |
| New | `src/hooks/useManga.ts` |
| Edit | `src/pages/AdminPanel.tsx` — wire up CRUD, fetch from DB |
| Edit | `src/pages/Index.tsx` — add premium section, use DB data |
| Edit | `src/pages/MangaInfo.tsx` — fetch from DB |
| Edit | `src/pages/ChapterReader.tsx` — fetch from DB |
| Edit | `src/pages/Latest.tsx`, `Series.tsx` — fetch from DB |
| Edit | Multiple homepage components — use DB queries |

