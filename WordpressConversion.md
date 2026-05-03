# MangaZ → WordPress Theme Conversion

A complete blueprint for converting this React + Vite + Supabase SPA into a
self-hosted **WordPress theme + companion plugins** stack, written to be
executed end-to-end by **Google Antigravity** (or any agentic IDE).

Target host: **Hostinger** (Business plan or higher, PHP 8.2+, MySQL 8, Redis
object cache enabled). Cloudflare in front for WAF + caching.

---

## 1. Theme vs Plugin — split rule

The golden rule: **anything that should survive a theme switch goes in a
plugin. Anything that is purely presentation goes in the theme.**

| Layer | Goes in | Why |
|---|---|---|
| Markup, templates, Tailwind build, page layouts, menus, widgets | **Theme** (`mangaz-theme`) | Visual only |
| Custom Post Types, taxonomies, post meta registration | **Plugin** (`mangaz-core`) | Data must persist when theme changes |
| Coin / token / streak / mission economy | **Plugin** (`mangaz-economy`) | Business logic, REST endpoints, DB tables |
| Premium / subscription gating, unlock logic | **Plugin** (`mangaz-paywall`) | Security-critical, must not depend on theme |
| Stripe / PayPal / NOWPayments / Cryptomus / Razorpay | **Plugin** (`mangaz-payments`) | Provider SDKs + webhooks |
| Discord webhook on chapter publish | **Plugin** (`mangaz-discord`) | Hooks into `save_post` |
| IP blocking, admin bypass, access gate | **Plugin** (`mangaz-security`) | Security boundary |
| Blogger image upload pipeline | **Plugin** (`mangaz-blogger-bridge`) | OAuth refresh + upload API |
| Notifications (bell icon), comment streaks | **Plugin** (`mangaz-social`) | Custom tables + REST |
| Reader (image viewer, settings, shortcuts) | **Theme** (single React island) | Pure UI |
| Admin panel pages (settings, premium, storage) | **Plugin** (`mangaz-core`) submenu | Data-bound, theme-independent |

Plugins are designed so that uninstalling the theme leaves all data, paid
chapters, balances, and subscriptions intact. Uninstalling a plugin removes
only that feature's data (with an opt-in clean-up flag).

---

## 2. Final repository layout

```
wp-content/
  themes/
    mangaz-theme/
      style.css
      functions.php
      header.php
      footer.php
      front-page.php
      single-manga.php
      single-chapter.php
      archive-manga.php
      taxonomy-genre.php
      search.php
      page-templates/
        coin-shop.php
        earn-coins.php
        subscribe.php
        subscribe-checkout.php
        subscribe-success.php
        library.php
        latest.php
        user-settings.php
        admin-panel.php          (gateway page that mounts admin React app)
      inc/
        enqueue.php              (Vite manifest loader, asset hashing)
        theme-setup.php
        template-tags.php
        nav-walker.php
      src/                       (Tailwind + React islands source)
        islands/
          ChapterReader.tsx
          AdminPanel.tsx
          CommentSection.tsx
          UserMenu.tsx
          NotificationBell.tsx
          SearchModal.tsx
        styles/
          tailwind.css
        main.ts                  (mounts islands by data-island attribute)
      vite.config.ts
      package.json
      tailwind.config.ts
      build/                     (compiled output, committed or built on deploy)
  plugins/
    mangaz-core/                 (CPTs, taxonomies, settings, admin menu)
    mangaz-economy/              (coins, tokens, missions, streaks)
    mangaz-paywall/              (premium + subscription gating, unlock)
    mangaz-payments/             (Stripe, PayPal, NOWPayments, Cryptomus, Razorpay)
    mangaz-discord/              (chapter publish → Discord webhook)
    mangaz-security/             (IP block, access gate, admin bypass banners)
    mangaz-blogger-bridge/       (OAuth refresh, image upload to Blogger)
    mangaz-social/               (notifications, comment streaks, mentions)
```

Each plugin has the same skeleton:

```
mangaz-<feature>/
  mangaz-<feature>.php          (plugin header + bootstrap)
  composer.json                 (PSR-4 autoload, vendor SDKs)
  src/
    Plugin.php                  (singleton, hook registration)
    Rest/                       (REST controllers)
    Domain/                     (entities, repositories)
    Admin/                      (admin pages, settings)
    Migrations/                 (dbDelta scripts)
  uninstall.php
  readme.txt
```

---

## 3. Data model mapping (Supabase → WordPress)

### 3.1 Custom Post Types (registered by `mangaz-core`)

| CPT | Source table | Slug | Public | REST base |
|---|---|---|---|---|
| `mz_manga` | `manga` | `/manga/{slug}` | yes | `mz/v1/manga` |
| `mz_chapter` | `chapters` | `/manga/{slug}/chapter/{number}` | yes | `mz/v1/chapter` |
| `mz_announcement` | `announcements` | n/a | no | `mz/v1/announcements` |
| `mz_pinned` | `pinned_manga` | n/a | no | `mz/v1/pinned` |

Chapter → manga relationship: `post_meta._mz_manga_id` (indexed) plus a
`p2p`-style join row for fast queries. Avoid native parent/child to keep
permalink rewrite simple.

### 3.2 Taxonomies

- `mz_genre` (hierarchical)
- `mz_content_warning` (flat)
- `mz_manga_type` (flat: manga / manhwa / manhua)
- `mz_status` (flat: ongoing / completed / hiatus)

### 3.3 Post meta (registered with `show_in_rest` + sanitisation)

`mz_manga`:
`cover_url`, `banner_url`, `alt_titles[]`, `released_year`, `rating`,
`description_html`, `seo_title`, `seo_description`, `is_pinned`,
`is_featured`, `view_count_24h`, `view_count_total`.

`mz_chapter`:
`number`, `title`, `pages[] (json: url, width, height)`, `premium`,
`coin_price`, `is_subscription`, `free_release_at`,
`subscription_free_release_at`, `published_at`, `discord_notified`,
`blogger_post_id`.

### 3.4 Custom DB tables

Created via `dbDelta` in each plugin's `Migrations/`. All prefixed with
`{$wpdb->prefix}mz_`.

| Plugin | Table | Replaces |
|---|---|---|
| economy | `mz_coin_balances` | `coin_balance` column |
| economy | `mz_token_balances` | `token_balance` column |
| economy | `mz_coin_transactions` | `coin_transactions` |
| economy | `mz_mission_completions` | `daily_checkins`, `mission_log` |
| economy | `mz_streaks` | `comment_streaks` |
| paywall | `mz_chapter_unlocks` | `chapter_unlocks` |
| paywall | `mz_subscriptions` | `user_subscriptions` |
| paywall | `mz_subscription_plans` | `subscription_plans` |
| payments | `mz_payment_orders` | `payment_orders` |
| payments | `mz_payment_webhook_log` | `webhook_events` |
| security | `mz_blocked_ips` | `blocked_ips` |
| social | `mz_notifications` | `notifications` |
| social | `mz_notification_subs` | `notification_subscriptions` |
| social | `mz_bookmarks` | `bookmarks` |
| social | `mz_reading_history` | `reading_history` |
| social | `mz_comments_meta` | comment likes / mentions extensions |
| core | `mz_views_log` | `view_events` (24h trending) |

Comments themselves use native `wp_comments` + extension table for likes,
mentions, and streak tracking. This gives moderation tools, threading, and
plugin compatibility for free.

### 3.5 User meta

- `mz_avatar_url`, `mz_display_name_locked`, `mz_notification_prefs (json)`,
  `mz_theme_preset`, `mz_reader_settings (json)`.

### 3.6 Roles and capabilities (registered by `mangaz-core` on activation)

| Role | Caps added |
|---|---|
| `mz_reader` (default for new users) | `read`, `mz_unlock_chapter`, `mz_comment` |
| `mz_moderator` | reader + `mz_moderate_comments`, `mz_bypass_paywall` |
| `mz_admin` | moderator + `mz_manage_economy`, `mz_manage_payments`, `mz_manage_chapters` |
| `administrator` | gets all `mz_*` caps |

Never store roles on user meta. Use WP's `wp_usermeta` capabilities row,
which is already cached and security-audited.

### 3.7 Settings (`mangaz-core`)

All current `site_settings` rows become a single option: `mz_settings`
(autoloaded JSON) with sub-keys mirroring today's structure
(`coin_system`, `subscription_settings`, `premium_config`, `theme_preset`,
`payment_credentials`, `discord_webhook`, etc.). Edited via the React admin
panel mounted in `wp-admin`.

---

## 4. REST API surface (replaces edge functions)

All routes namespaced under `mz/v1/`. Capability checks via
`permission_callback`. Webhooks use `__return_true` and verify signatures
inside the handler.

| Edge function | New REST route | Plugin |
|---|---|---|
| `unlock-chapter` | `POST mz/v1/chapter/{id}/unlock` | paywall |
| `secure-checkin` | `POST mz/v1/missions/checkin` | economy |
| `admin-update-balance` | `POST mz/v1/admin/balance` | economy |
| `stripe-checkout` | `POST mz/v1/pay/stripe/checkout` | payments |
| `paypal-purchase` | `POST mz/v1/pay/paypal/order` | payments |
| `capture-subscription-order` | `POST mz/v1/pay/paypal/capture` | payments |
| `create-razorpay-order` | `POST mz/v1/pay/razorpay/order` | payments |
| `capture-razorpay-order` | `POST mz/v1/pay/razorpay/capture` | payments |
| `create-subscription-order` | `POST mz/v1/sub/create` | paywall |
| `subscription-webhook` | `POST mz/v1/webhook/subscription` | payments |
| `cryptomus-purchase` | `POST mz/v1/pay/cryptomus/order` | payments |
| `cryptomus-webhook` | `POST mz/v1/webhook/cryptomus` | payments |
| `nowpayments` | `POST mz/v1/pay/nowpayments/order` | payments |
| `discord-notify` | internal hook on `transition_post_status` | discord |
| `check-subscription-expiry` | `wp_cron` event `mz_check_sub_expiry` | paywall |
| `storage-usage` | `GET mz/v1/admin/storage` | core |
| `blogger-upload` | `POST mz/v1/admin/blogger-upload` | blogger-bridge |

Public read endpoints (replacing the `chapters_public` / `profiles_public`
Supabase views) are exposed under `mz/v1/public/*` and never include
page URLs for premium chapters — pages are streamed only by
`GET mz/v1/chapter/{id}/pages` after the access gate passes.

---

## 5. Frontend strategy — Tailwind in the theme + React islands

The current React app stays in the theme as a set of **mounted islands**,
not a SPA. PHP renders the page shell (SEO, OpenGraph, schema.org), then
islands hydrate where interactivity is needed.

`functions.php` enqueues a single Vite manifest loader. `main.ts` scans the
DOM for `[data-island]` elements and dynamically imports the matching React
component:

```html
<div data-island="ChapterReader" data-chapter-id="<?php echo $chapter_id; ?>"></div>
```

| Island | Mounted on |
|---|---|
| `ChapterReader` | `single-chapter.php` |
| `AdminPanel` | gateway page in `wp-admin` (capability gated) |
| `CommentSection` | `single-chapter.php`, `single-manga.php` |
| `UserMenu` + `NotificationBell` | `header.php` |
| `SearchModal` | `header.php` |
| `HeroCarousel`, `LatestUpdates`, `Trending`, `EditorChoice`, `PinnedCarousel` | `front-page.php` |

Tailwind builds against `theme/src/**` and `theme/**/*.php`. The CSS
variable design tokens (Obsidian dark, `#0a0a0a` base, etc.) move into
`theme/src/styles/tokens.css`.

Routing: WP handles the URL. Islands receive ids/slugs through
`data-*` attributes only. No client-side router.

---

## 6. Migration pipeline (Supabase → WordPress)

One-shot Node.js script in `tools/migrate/`:

1. Connect to Supabase with the service role key.
2. Stream `manga` rows → `POST /wp-json/wp/v2/mz_manga` (Application
   Password auth) with all meta in one request via `meta` field.
3. Stream `chapters` rows in the same way, mapping `manga_id` to the new
   WP post id via a translation map kept in `tools/migrate/state.json`.
4. Page URLs: keep Blogger CDN URLs as-is. For Supabase Storage URLs
   either (a) keep the Supabase URL (cheapest) or (b) sideload through
   `POST /wp-json/wp/v2/media`.
5. Users: `wp user create` per row, then write `mz_*` user meta.
6. Balances and unlocks: bulk `INSERT` into `mz_coin_balances`,
   `mz_token_balances`, `mz_chapter_unlocks` over MySQL directly (faster
   than REST for >100k rows).
7. Subscriptions: rebuild `mz_subscriptions` rows; for active Stripe/PayPal
   subs, store the original provider subscription id so webhooks continue
   to flow without user action.
8. Comments: import into `wp_comments` preserving thread ids; build
   `mz_comments_meta` for likes/mentions.
9. Sanity-check: run `tools/migrate/verify.ts` which compares row counts
   and a sampled diff per CPT.

---

## 7. Hostinger deployment notes

- Plan: Business or Cloud Startup. Enable PHP 8.2, OPcache, Redis object
  cache (`object-cache.php` drop-in from Redis Object Cache plugin).
- `wp-config.php`:
  ```php
  define('WP_MEMORY_LIMIT', '512M');
  define('DISALLOW_FILE_EDIT', true);
  define('FORCE_SSL_ADMIN', true);
  define('WP_AUTO_UPDATE_CORE', 'minor');
  define('WP_REDIS_HOST', '127.0.0.1');
  ```
- Cron: replace `wp-cron.php` with a real Hostinger cron job hitting
  `wp-cron.php?doing_wp_cron` every minute, then add
  `define('DISABLE_WP_CRON', true);`.
- Cloudflare in front: WAF, Bot Fight Mode, cache rule that bypasses cache
  for `/wp-admin/*`, `/wp-json/mz/v1/*`, and any URL with `?nocache`.
- Backups: Hostinger daily + UpdraftPlus to Backblaze B2 / Cloudflare R2.
- Page cache: LiteSpeed Cache (Hostinger uses LiteSpeed) or W3 Total Cache.
  Exclude logged-in users from the page cache.
- Search: Relevanssi (matches alt-titles via custom field indexing).

---

## 8. Antigravity execution playbook

Run these prompts in order. Each prompt is self-contained and produces
a working artefact. Antigravity should commit after each step.

### Step 1 — Scaffold all plugins and theme

> Create the directory tree shown in section 2 of `WordpressConversion.md`.
> For every plugin, generate the standard skeleton (plugin header, PSR-4
> autoload via Composer, `Plugin::instance()` singleton, `register_activation_hook`
> stub, `uninstall.php`). For the theme, generate `style.css`, `functions.php`,
> Vite config, Tailwind config, and a `main.ts` island mounter. Use the
> design tokens from `src/index.css` of the current React project.

### Step 2 — `mangaz-core`: CPTs, taxonomies, meta, settings

> Read `src/integrations/supabase/types.ts`. In `mangaz-core`, register the
> CPTs, taxonomies, and post meta listed in section 3. Implement
> `Mz\Core\Settings` backed by the `mz_settings` option. Add a top-level
> `wp-admin` menu "MangaZ" with placeholder submenu pages for each tab in
> the current React Admin Panel (Premium Content, Subscription System,
> Storage, etc.). Each submenu renders `<div data-island="AdminPanel"
> data-tab="..."></div>` so the React island handles the UI.

### Step 3 — `mangaz-economy`

> Implement `mz_coin_balances`, `mz_token_balances`, `mz_coin_transactions`,
> `mz_mission_completions`, `mz_streaks` tables. Mirror the current coin
> multipliers `[1, 3, 7, 15, 32, 100]` and the temporary 3-day token access
> rule. Expose REST endpoints `mz/v1/balance`, `mz/v1/missions/checkin`
> (transactional, idempotent per UTC day), and `mz/v1/streak`.

### Step 4 — `mangaz-paywall`

> Implement `mz_chapter_unlocks`, `mz_subscriptions`, `mz_subscription_plans`.
> Add a server-side access gate: filter `the_content` and the
> `mz/v1/chapter/{id}/pages` REST route to deny unless one of:
> chapter is free, free_release_at has passed, user has an active
> unlock row, user is on a subscription that covers this chapter, or
> user has the `mz_bypass_paywall` capability (mirrors today's admin
> bypass banner). Render the bypass banner via a theme template part.

### Step 5 — `mangaz-payments`

> For each provider (Stripe, PayPal, NOWPayments, Cryptomus, Razorpay),
> wire the official PHP SDK via Composer. Implement the REST routes from
> section 4. Store credentials in `mz_settings.payment_credentials` (never
> in `wp-config.php`). Process every charge in **USD** regardless of the
> visitor's locale (matches current rule). Webhook routes verify
> signatures and write to `mz_payment_webhook_log` for audit.

### Step 6 — `mangaz-security`

> Implement `mz_blocked_ips` table and an `init` hook that 403s any
> request whose `REMOTE_ADDR` (with Cloudflare `CF-Connecting-IP`
> fallback) matches a blocked row. Add helpers `mz_can_bypass_paywall()`
> and template parts for the "Admin Bypass Active" banners (early
> access + premium variants).

### Step 7 — `mangaz-discord`

> Hook `transition_post_status` for `mz_chapter`. When a chapter goes to
> `publish` for the first time, POST to the configured webhook URL using
> the same templated message format as `supabase/functions/discord-notify`.
> Mark the chapter with `discord_notified = 1` to prevent duplicates.

### Step 8 — `mangaz-blogger-bridge`

> Port `supabase/functions/blogger-upload`. Store
> `GOOGLE_OAUTH_CLIENT_ID/SECRET/REFRESH_TOKEN` in `mz_settings`
> (encrypted with a key derived from `AUTH_KEY`). Implement automatic
> token refresh and a REST route `mz/v1/admin/blogger-upload` that
> accepts page images and returns Blogger CDN URLs. Capability gate to
> `mz_manage_chapters`.

### Step 9 — `mangaz-social`

> Notifications: `mz_notifications` + `mz_notification_subs`. Bell-icon
> island queries `mz/v1/notifications`. Add hooks that create rows on
> chapter publish (for subscribers of that manga), on @mention in a
> comment (parse hyphenated handles), and on reply to one of the user's
> comments. Implement bookmarks and reading history with the same shape
> as today.

### Step 10 — Theme templates

> Convert each React page in `src/pages/` to its matching PHP template
> from section 2. Keep markup and Tailwind classes identical. Replace
> data hooks with `WP_Query` and `get_post_meta`. Mount React islands
> only where interactivity exists today (reader, comments, admin,
> search, header widgets, homepage carousels).

### Step 11 — Reader island

> Take `src/pages/ChapterReader.tsx` and adapt it to mount on
> `<div data-island="ChapterReader" data-chapter-id="...">`. Strip
> React Router; read the id from the data attribute. Replace Supabase
> calls with `fetch('/wp-json/mz/v1/chapter/'+id)` and
> `/wp-json/mz/v1/chapter/'+id+'/pages'`. Keep the localStorage reader
> settings, keyboard shortcuts, and slide-in menu untouched.

### Step 12 — Migration tools

> Create `tools/migrate/` per section 6. Provide `migrate:dry-run`,
> `migrate:run`, and `migrate:verify` npm scripts. Log progress to
> `tools/migrate/state.json` so the run is resumable.

### Step 13 — Cron and webhooks

> Register `mz_check_sub_expiry` (hourly) and `mz_recompute_trending`
> (every 5 minutes, replaces the 24-hour deduplicated views logic).
> Document the Hostinger cron job command in `README.md`.

### Step 14 — Hardening pass

> Run `wp plugin install wordfence` and configure rate limits for
> `/wp-json/mz/v1/*`. Set Cloudflare rules per section 7. Add
> `Permissions-Policy`, `Content-Security-Policy`, and `Referrer-Policy`
> headers via a `mu-plugin`. Verify Application Passwords are disabled
> for non-admin roles.

### Step 15 — End-to-end test

> Spin up a fresh WordPress on Hostinger staging. Activate the theme and
> all plugins in dependency order (`core` → `economy` → `paywall` →
> `payments` → `security` → `discord` → `blogger-bridge` → `social`).
> Run `migrate:run`, then walk through: register, buy coins via Stripe
> test mode, unlock a premium chapter, post a comment, receive a
> notification, trigger a Discord post on a new chapter, and confirm
> the IP block list works. Capture a checklist in
> `tools/migrate/post-launch.md`.

---

## 9. Acceptance criteria

- Theme can be switched off and reactivated with no data loss.
- Each plugin can be deactivated independently; only its feature
  disappears (no fatal errors elsewhere).
- Every current admin action in the React panel has an equivalent in
  `wp-admin` (via the React island gateway pages).
- Public pages render without JavaScript for SEO; islands enhance.
- All money flows in **USD**; provider credentials live in
  `mz_settings`, not in `wp-config.php`.
- Premium chapter pages (image URLs) are never returned to a user who
  has not passed the access gate.
- Cron jobs run via Hostinger's system cron, not `wp-cron.php` on
  request.
- Cloudflare WAF + page cache active; `/wp-json/mz/v1/*` is bypassed
  from the cache.

Once these criteria pass on staging, cut DNS over to Hostinger.