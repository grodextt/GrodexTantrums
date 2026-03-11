

# Implementation Plan

This covers 10 items: 3 features and 7 bug fixes.

---

## 1. Comment Edit and Delete (Feature)

**Changes**: `src/components/CommentSection.tsx`, `src/hooks/useComments.ts`

- Add `editComment` and `deleteComment` mutations to `useComments.ts`
- In `CommentItem`, add Edit (pencil) and Delete (trash) buttons visible only to the comment author (`comment.user_id === user?.id`)
- Edit mode: replace text with a textarea + Save/Cancel buttons
- Delete: confirm via small inline prompt, then remove from DB
- RLS already allows users to update/delete own comments

---

## 2. Reading History in Library Page (Feature)

**Database**: Create `reading_history` table (id, user_id, manga_id, chapter_id, chapter_number, read_at) with RLS for users to manage own records and a unique constraint on (user_id, manga_id, chapter_id).

**Changes**:
- Create `src/hooks/useReadingHistory.ts` — upsert on chapter view, fetch history
- `src/pages/ChapterReader.tsx` — record reading history on chapter load
- `src/pages/Library.tsx` — add "Reading History" section below bookmarks, displayed as horizontal row of manga covers with last-read chapter info

---

## 3. Scroll-to-Top Button (Feature)

**Changes**: Create `src/components/ScrollToTop.tsx`

- Floating button at bottom-left corner, appears after scrolling 300px
- Smooth scroll to top on click
- Add to `AppLayout` in `src/App.tsx` (outside chapter reader/admin)

---

## 4. Search Modal Double Close Button (Bug Fix)

**Problem**: `DialogContent` from `ui/dialog.tsx` already renders a built-in X close button (line 45). `SearchModal.tsx` adds another X button manually (line 40-42).

**Fix**: Remove the manual X button from `SearchModal.tsx` (lines 40-42) since DialogContent already provides one. Alternatively, hide the DialogContent's default close button for this specific modal. The cleaner approach: remove the manual one and keep the built-in one from DialogContent.

---

## 5. User Settings Functionality (Bug Fix)

**Problems**:
- Avatar uploads to `avatars` bucket which doesn't exist — change to `manga-assets` bucket under `avatars/` path
- Notification preferences are local state only, not persisted
- Profile doesn't refresh in AuthContext after save

**Fix**:
- Change storage bucket from `avatars` to `manga-assets` with path `avatars/{user_id}/avatar.{ext}`
- Store notification preferences in `profiles` table (add columns via migration) or in a new `user_preferences` table. Simpler: use a `user_preferences` table (user_id, preferences JSONB).
- After successful profile save, re-fetch profile in AuthContext by calling `fetchProfile`

**Database**: Create `user_preferences` table with user_id (PK, references auth.users) and preferences (jsonb, default '{}'), with RLS for own-row access. Or add a `bio` column to profiles.

---

## 6. Library Button on MangaInfo + Library Page (Bug Fix)

**Problem**: "Add to Library" button on MangaInfo does nothing. Library page shows mock data (`allManga.slice(0, 3)`).

**Database**: Create `bookmarks` table (id, user_id, manga_id, created_at) with unique (user_id, manga_id) and RLS for own-row management.

**Changes**:
- Create `src/hooks/useBookmarks.ts` — toggle bookmark, fetch user bookmarks
- `MangaInfo.tsx` — wire "Add to Library" button to toggle bookmark, show filled icon if bookmarked
- `Library.tsx` — fetch from `bookmarks` table joined with manga data instead of mock slice

---

## 7. Page Scroll Position Reset (Bug Fix)

**Problem**: Navigating between pages doesn't scroll to top.

**Fix**: Add a `ScrollToTopOnNavigate` component in `App.tsx` that uses `useLocation` and `useEffect` to call `window.scrollTo(0, 0)` on pathname change.

---

## 8. Trending vs Editor's Choice Mixup (Bug Fix)

**Problem**: The `trending` toggle in the manga form actually controls Editor's Choice display. Real trending should be automatic (top 6 by views).

**Changes**:
- `MangaFormModal.tsx` — rename the "Trending" toggle label to "Editor's Choice" and map it to the `featured` field. Remove the current separate `featured` toggle (or repurpose it). Actually the cleanest fix: rename the `trending` field label to "Editor's Choice" in the form, and have it write to the `featured` column. Remove the current `featured` toggle.
- `EditorChoice.tsx` — currently uses `useFeaturedManga` which queries `featured=true`. Change to query `trending=true` OR keep `featured` and just fix the admin toggle mapping.
- **Simplest approach**: In the form, swap labels — "Featured" becomes "Editor's Choice" (writes to `featured`), remove the separate "Trending" toggle. In `Index.tsx`, change trending section to sort by `views` desc and take top 6, ignoring the `trending` column.

**Detailed mapping**:
- Admin form: keep `pinned` and `featured` (relabel to "Editor's Choice"). Remove `trending` toggle.
- Homepage Trending: `allManga.sort((a,b) => (b.views||0) - (a.views||0)).slice(0, 6)`
- Editor's Choice: already uses `featured=true` via `useFeaturedManga` — no change needed
- MangaInfo sidebar: also change from `trending` filter to views-based sort

---

## 9. Comment Mentions + Mention Notifications (Feature)

**Changes**:
- `CommentSection.tsx` — detect `@username` in comment text. On submit, look up mentioned usernames from profiles, create `comment_reply` notifications for each mentioned user
- `useComments.ts` — add mention detection logic. When posting, query profiles for matching display_names, insert notifications with type `comment_reply`
- `NotificationMenu.tsx` — for `comment_reply` notifications, make them clickable to navigate to the manga page (using manga_id -> slug lookup). Already partially supported.
- Add simple `@` autocomplete: when user types `@`, show a dropdown of usernames fetched from profiles of commenters on that manga

---

## 10. Homepage Buttons — Share, Donate, Discord (Bug Fix)

**Problem**: Share button says "Kayn Scan" hardcoded. Donate and Discord buttons have no links.

**Changes**:
- `MangaInfo.tsx` — use site name from settings for Share card title. Wire Share button to `navigator.share()` or copy URL. Wire "Join Our Socials" button to discord link from settings. Add "Donate" card linking to patreon URL from settings.
- `AdminPanel.tsx` settings — add fields for `patreon_url` and `discord_url` in the General settings sub-tab
- `useSiteSettings.ts` — include new fields in the general settings type
- Update `handleSaveSettings` to persist these new fields

---

## Files Summary

| Item | Files |
|------|-------|
| Comment Edit/Delete | `CommentSection.tsx`, `useComments.ts` |
| Reading History | Migration, `useReadingHistory.ts`, `ChapterReader.tsx`, `Library.tsx` |
| Scroll-to-Top | `ScrollToTop.tsx`, `App.tsx` |
| Search Double X | `SearchModal.tsx` |
| User Settings | Migration, `UserSettings.tsx`, `AuthContext.tsx` |
| Library/Bookmarks | Migration, `useBookmarks.ts`, `MangaInfo.tsx`, `Library.tsx` |
| Scroll Reset | `App.tsx` |
| Trending/Editor's | `MangaFormModal.tsx`, `Index.tsx`, `MangaInfo.tsx` |
| Mentions | `CommentSection.tsx`, `useComments.ts`, `NotificationMenu.tsx` |
| Homepage Buttons | `MangaInfo.tsx`, `AdminPanel.tsx`, `useSiteSettings.ts` |

### New Database Tables
- `reading_history` (user_id, manga_id, chapter_id, chapter_number, read_at)
- `bookmarks` (user_id, manga_id, created_at)
- `user_preferences` (user_id, preferences jsonb)

