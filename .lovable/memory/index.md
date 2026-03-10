Project memory for Kayn Scan manga reader platform

## Architecture
- Site settings stored in `site_settings` table (key-value with JSONB)
- Keys: `general`, `announcements`, `upload`, `storage`, `theme`
- `useSiteSettings` hook provides settings app-wide
- Footer text + tagline are dynamic from DB
- Navbar site name + logo are dynamic from DB
- Theme colors applied from settings on app load

## Auth
- Supports Discord, Google, and Email login
- Email signup sends confirmation link
- Profile auto-created via DB trigger

## Admin
- Manga displayed as card grid (not table)
- Alt titles supported (text[] column, one per line in form)
- Site settings with sub-tabs: General, Theme, Announcements, Upload, Storage
- Logo upload to manga-assets bucket
- Smart theme presets (Purple Night, Ocean Blue, Forest Green, Crimson, Amber Gold, Teal)
- Blogger CDN storage integration via edge function

## Notifications
- manga_subscriptions table tracks user notification preferences per manga
- notifications table stores chapter_update and comment_reply notifications
- DB trigger auto-creates notifications for subscribers on new chapter
- NotificationMenu component in Navbar with Free/Premium tags

## Comments
- Database-backed comments table with replies (parent_id), likes, pinning
- comment_likes table with trigger to update likes_count
- Admin users get "Admin" badge and can pin comments
- Sort by Popular or Recent

## Design
- Font: Outfit (body), Montserrat (sans var)
- Primary: purple HSL 258 89% 66% (light), 255 91% 76% (dark) - customizable via admin
- Uses semantic tokens throughout
