

# Implementation Plan

This is a large request with 7 major items. Here is the structured plan.

---

## 1. Fix "Bucket not found" Error

**Problem**: The `manga-assets` storage bucket doesn't exist in Supabase. The `useManga.ts` upload helpers reference it.

**Solution**: Create the bucket via SQL migration:
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('manga-assets', 'manga-assets', true);
-- RLS policies for storage.objects to allow admin upload/delete and public read
```

---

## 2. Notification System

### Database Changes
Create new tables:
- **`manga_subscriptions`** — tracks which manga a user has notifications enabled for (user_id, manga_id, unique constraint)
- **`notifications`** — stores notification records (id, user_id, type enum ['chapter_update','comment_reply','comment_mention'], manga_id, chapter_id, comment_id, title, message, is_read, is_premium, created_at)

### New Components
- **`src/components/NotificationMenu.tsx`** — floating dropdown from the Bell button in Navbar. Shows:
  - Chapter update notifications with manga cover thumbnail, title, chapter number, "Free" or "Premium" tag, time ago, "Read" button
  - Comment reply notifications with replier avatar, "replied to your comment" text, comment preview
  - "Mark all as read" button at top
  - Unread dot indicator on each notification
- **`src/hooks/useNotifications.ts`** — fetches notifications for current user, mark as read mutations

### Manga Info Page Changes
- Make the Bell button on MangaInfo functional: toggle subscription to manga_subscriptions table
- Show filled/outlined bell based on subscription status

### Chapter Creation Integration
- When a new chapter is created (in `useCreateChapter`), insert notifications for all users subscribed to that manga via a DB trigger or edge function

---

## 3. Comment System (Database-backed)

### Database Changes
Create **`comments`** table:
- id, manga_id, chapter_id (nullable), user_id, parent_id (nullable, for replies), text, likes_count, is_pinned, created_at

Create **`comment_likes`** table:
- id, comment_id, user_id (unique per comment+user)

### Rewrite `CommentSection.tsx`
- Remove all mock/local state. Fetch from `comments` table filtered by manga_id.
- Support replies (parent_id) with nested display
- Like/unlike toggles via comment_likes table
- Sort by "Popular" (likes_count desc) and "Recent" (created_at desc)
- Admin features: "Admin" badge next to admin usernames, pin button visible only to admins, pinned comments shown at top

### Hooks
- **`src/hooks/useComments.ts`** — CRUD for comments, likes, pin/unpin

### Notification Integration
- When replying to someone's comment, insert a notification of type `comment_reply` for the parent comment's author

---

## 4. Admin Comment Features

Handled within the comment system above:
- Check `has_role` for admin status
- Show "Admin" tag badge next to admin user names
- Pin/unpin button for admins
- Pinned comments display at top of list

---

## 5. Improved Search Modal

Redesign `SearchModal.tsx` to match the reference image:
- Larger modal with cover image cards in a horizontal grid (not a list)
- Each result shows cover image prominently, type badges ("New", "Manhwa", etc.), title truncated, genres below
- "View all results" button at bottom linking to `/series?q=...`
- Search also matches alt_titles

---

## 6. Blogger Storage Integration

### Admin Panel — New "Storage" Tab
Add a new tab in admin settings for storage configuration:
- Toggle between "Supabase Storage" and "Blogger" as the active storage provider
- Blogger configuration fields: Blog ID, API Key
- Store config in `site_settings` table under key `storage`

### How Blogger Storage Works
- Admin creates a Blogger blog dedicated to image hosting
- When uploading chapter images, the system posts images to Blogger via their API, then extracts the hosted image URLs (Blogger uses Google's CDN — `blogspot.com` URLs are free and unlimited)
- Create an edge function **`blogger-upload`** that:
  1. Receives base64 image data
  2. Creates a Blogger post with the image embedded
  3. Extracts the Google CDN URL from the response
  4. Returns the CDN URL

### Modify Upload Flow
- In `useManga.ts`, check the storage setting. If "blogger", call the edge function instead of Supabase Storage.

---

## 7. Site Settings Improvements

### Logo Upload
- Add file input for logo in admin settings
- Upload to `manga-assets` bucket under `site/logo` path
- Save URL in `site_settings` general.logo_url
- Display current logo preview

### Smart Color Theme
- Add a "Theme" section in settings with preset color palettes (e.g., "Purple Night", "Ocean Blue", "Forest Green", "Crimson", "Amber Gold")
- Each preset defines primary HSL, accent colors
- Store selected theme in `site_settings` under key `theme`
- Apply via CSS custom properties on `:root`
- Also allow custom HSL input for advanced users

### Announcement Bar
- The announcement message currently has no display component on the homepage
- Add announcement bar to `Index.tsx` that reads from settings
- Support optional button text + URL (add `button_text` and `button_url` fields to announcements settings)
- Show/hide based on whether message is non-empty

---

## Files Summary

| Area | Files to Create/Modify |
|------|----------------------|
| Storage bucket | SQL migration |
| Notifications | SQL migration, `NotificationMenu.tsx`, `useNotifications.ts`, `Navbar.tsx`, `MangaInfo.tsx`, modify `useCreateChapter` |
| Comments | SQL migration, rewrite `CommentSection.tsx`, `useComments.ts`, update `types/manga.ts` |
| Search | Rewrite `SearchModal.tsx` |
| Blogger storage | Edge function `blogger-upload`, new settings tab in `AdminPanel.tsx`, modify `useManga.ts` upload helpers |
| Site settings | `AdminPanel.tsx` (logo upload, theme presets, announcement buttons), `Index.tsx` (announcement display), `src/index.css` (dynamic theme vars) |

### Database Tables to Create
- `manga_subscriptions` (user_id, manga_id)
- `notifications` (user_id, type, manga_id, chapter_id, comment_id, title, message, is_read, is_premium, created_at)
- `comments` (manga_id, chapter_id, user_id, parent_id, text, likes_count, is_pinned, created_at)
- `comment_likes` (comment_id, user_id)

### Storage
- Create `manga-assets` bucket (public, with admin-only write RLS)

