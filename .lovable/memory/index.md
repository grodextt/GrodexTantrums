Project memory for MangaHub v1 manga reader platform

## Architecture
- Site settings stored in `site_settings` table (key-value with JSONB)
- Keys: `general`, `announcements`, `upload`, `storage`, `theme`
- `useSiteSettings` hook provides settings app-wide
- Footer text + tagline are dynamic from DB
- Navbar site name + logo are dynamic from DB
- Theme presets applied via ThemeContext from settings (full CSS variable override)
- Default theme preset: Obsidian

## Auth
- Supports Discord, Google, and Email login
- Email signup sends confirmation link
- Profile auto-created via DB trigger

## Admin
- Manga displayed as card grid (not table)
- Alt titles supported (text[] column, one per line in form)
- Site settings with sub-tabs: General, Theme, Announcements, Upload, Storage
- Logo upload to manga-assets bucket
- Full theme preset system (Default, Glacier, Harvest, Lavender, Brutalist, Obsidian, Orchid, Solar, Tide, Sakura)
- Each theme controls all CSS variables for light and dark modes
- Blogger CDN storage integration via edge function
- Manga toggles: Pinned, Editor's Choice (featured), Featured Slider (trending)
- Social links (Discord, Patreon) configurable in general settings

## Notifications
- manga_subscriptions table tracks user notification preferences per manga
- notifications table stores chapter_update and comment_reply notifications
- DB trigger auto-creates notifications for subscribers on new chapter
- NotificationMenu component in Navbar with Free/Premium tags
- Comment @mentions trigger comment_reply notifications

## Comments
- Database-backed comments table with replies (parent_id), likes, pinning
- comment_likes table with trigger to update likes_count
- Admin users get "Admin" badge and can pin/edit/delete any comment
- Users can edit/delete own comments
- @mentions use hyphenated format (@First-Name) for multi-word usernames
- Nested replies supported (reply to reply uses top-level parent_id)
- Sort by Popular or Recent

## Library & Reading History
- bookmarks table tracks user library (manga_id, user_id)
- reading_history table tracks chapters read (manga_id, chapter_id, chapter_number)
- Library page shows bookmarked manga + reading history section
- MangaInfo "Add to Library" button wired to bookmarks

## Homepage
- Trending section: automatic, composite score of views + recent chapter recency
- Editor's Choice: manga with featured=true
- Featured Slider (Hero Carousel): manga with trending=true, featured=true, or pinned=true
- Latest Updates: 16 manga, 2 cols on tablet, 4 on desktop

## Design
- Font: Outfit (body), Montserrat (sans var)
- Theme presets control all colors via CSS variables
- Uses semantic tokens throughout
- Premium chapters show lock icon + coin cost in chapter list
- ScrollToTop button at bottom-left
- ScrollToTopOnNavigate resets scroll on route change

## Deployment
- Canonical published URL: scan-zen-studio.lovable.app
- Auth redirect URLs must match canonical domain
- CSS defaults match Obsidian theme to prevent flash on load
- App shows loading gate (dark div) until site settings fetch completes
- index.html body has inline dark background style to prevent white flash before JS loads
