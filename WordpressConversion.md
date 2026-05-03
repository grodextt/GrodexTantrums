# Grodex Tantrums → WordPress Conversion Blueprint

> **Project context**: Grodex Tantrums is an advanced Manga/Manhwa/Manhua reading
> platform built as a modern successor to the
> [Madara WordPress theme](https://mangabooth.com/product/wp-manga-theme-madara/)
> and its [extension ecosystem](https://mangabooth.com/product-category/extensions/).
> Where Madara splits features across 16+ paid add-ons (Chapter Coin, Chapter
> Permissions, Chapter Protector, Member Upload, Watermark, etc.), Grodex Tantrums
> ships them as **one unified theme + a small set of focused plugins** — fewer
> moving parts, zero version-mismatch crashes, and a single admin experience.

This document is the end-to-end blueprint for converting the current
**React + Vite + Supabase SPA** into a self-hosted **WordPress theme +
companion plugins** stack.

**Target host**: Hostinger (Business plan or higher, PHP 8.2+, MySQL 8,
Redis object cache). Cloudflare in front for WAF + caching.

---

## 1. Theme vs Plugin — split rule

**Golden rule**: anything that must survive a theme switch goes in a plugin.
Anything that is purely visual goes in the theme.

| Layer | Goes in | Why |
|---|---|---|
| Markup, templates, Tailwind build, page layouts, menus, widgets | **Theme** (`grodextt-theme`) | Visual only |
| Custom Post Types, taxonomies, post meta, roles, settings | **Plugin** (`grodextt-core`) | Data must persist across theme changes |
| Coins, tokens, streaks, missions, subscriptions, paywall, payment gateways | **Plugin** (`grodextt-premium`) | Unified premium content system (see §1.1) |
| Discord webhook on chapter publish | **Plugin** (`grodextt-discord`) | Hooks into `save_post` |
| IP blocking, admin bypass, access gate | **Plugin** (`grodextt-security`) | Security boundary |
| Blogger image upload pipeline | **Plugin** (`grodextt-blogger-bridge`) | OAuth refresh + upload API |
| Notifications, bookmarks, reading history | **Plugin** (`grodextt-social`) | Custom tables + REST |
| Reader (image viewer, settings, shortcuts) | **Theme** (React island) | Pure UI |
| Admin panel pages (settings, premium, storage) | **Plugin** (`grodextt-core`) submenu | Data-bound, theme-independent |

### 1.1 Unified Premium Plugin (`grodextt-premium`)

The old plan split monetisation across three plugins (`mangaz-economy`,
`mangaz-paywall`, `mangaz-payments`). This caused tight cross-dependencies
(economy ↔ paywall ↔ payments) that made activation order fragile and
created white-screen risks when one was deactivated without the others.

**New approach**: merge all three into **`grodextt-premium`**. Internally it
uses namespaced modules:

```
grodextt-premium/
  src/
    Economy/          (coins, tokens, streaks, missions, multipliers)
    Paywall/          (chapter unlock, subscription gating, access gate)
    Payments/         (Stripe, PayPal, NOWPayments, Cryptomus, Razorpay)
    Admin/            (unified Premium Content admin page)
```

Each module has a master toggle in settings so features can be turned on/off
without deactivating the plugin. This mirrors the current React admin panel
where `enable_coins` and `enable_subscriptions` are independent toggles.

**Why this is safer for WordPress**:
- No cross-plugin `class_exists()` checks that fail silently.
- A single activation hook creates all tables in the correct order.
- Deactivating `grodextt-premium` cleanly disables all monetisation;
  reactivating restores it with no data loss.
- One Composer autoloader, one version number, one update cycle.

### 1.2 Google Setup — scrapped from Admin Panel

The old `Admin Panel > Google Setup` tab (SEO, Analytics, OAuth, Ads) is
removed. WordPress has mature, battle-tested plugins for each:

| Feature | Recommended Plugin |
|---|---|
| SEO, sitemap, robots | **Yoast SEO** or **Rank Math** |
| Google Analytics | **Site Kit by Google** or **MonsterInsights** |
| Google Ads | **Site Kit by Google** |
| Google OAuth login | **Nextend Social Login** |

The `grodextt-core` settings page will include a short "Recommended Plugins"
section linking to each, but no custom implementation. SEO meta for manga
pages (custom title, description, Open Graph) will be exposed via Yoast/Rank
Math's `wpseo_*` filters using data from manga post meta.

---

## 2. Repository layout

```
wp-content/
  themes/
    grodextt-theme/
      style.css                    (theme header, version, description)
      functions.php                (Vite manifest loader, nav, sidebars)
      header.php
      footer.php
      front-page.php               (hero, latest updates, trending, pinned)
      single-manga.php             (manga info page)
      single-chapter.php           (chapter reader mount)
      archive-manga.php            (series grid / browse)
      taxonomy-genre.php           (genre archive)
      search.php
      404.php
      page-templates/
        coin-shop.php
        earn-coins.php
        subscribe.php
        subscribe-checkout.php
        subscribe-success.php
        library.php
        latest.php
        user-settings.php
        dmca.php
        privacy-policy.php
        admin-panel.php            (gateway page, mounts admin React app)
      inc/
        enqueue.php                (Vite manifest loader, asset hashing)
        theme-setup.php            (menus, image sizes, theme supports)
        template-tags.php          (reusable template helpers)
        nav-walker.php             (custom walker for navbar)
        seo-filters.php            (Yoast/Rank Math integration hooks)
      src/
        islands/
          ChapterReader.tsx
          AdminPanel.tsx
          CommentSection.tsx
          UserMenu.tsx
          NotificationBell.tsx
          SearchModal.tsx
          HeroCarousel.tsx
          LatestUpdates.tsx
        styles/
          tailwind.css
          tokens.css               (design tokens: #0a0a0a base, etc.)
        main.ts                    (mounts islands by data-island attribute)
      vite.config.ts
      package.json
      tailwind.config.ts
      build/
  plugins/
    grodextt-core/                 (CPTs, taxonomies, settings, admin menu, roles)
    grodextt-premium/              (coins, tokens, paywall, subscriptions, payments)
    grodextt-discord/              (chapter publish → Discord webhook)
    grodextt-security/             (IP block, access gate, admin bypass banners)
    grodextt-blogger-bridge/       (OAuth refresh, image upload to Blogger CDN)
    grodextt-social/               (notifications, bookmarks, reading history)
```

### Plugin skeleton (each plugin follows this structure)

```
grodextt-<feature>/
  grodextt-<feature>.php           (plugin header + bootstrap)
  composer.json                    (PSR-4 autoload, vendor SDKs)
  src/
    Plugin.php                     (singleton, hook registration)
    Rest/                          (REST controllers)
    Domain/                        (entities, repositories)
    Admin/                         (admin pages, settings)
    Migrations/                    (dbDelta scripts)
  uninstall.php                    (opt-in data cleanup)
  readme.txt
```

---

## 3. Data model mapping (Supabase → WordPress)

### 3.1 Custom Post Types (registered by `grodextt-core`)

| CPT | Source table | Slug | Public | REST base |
|---|---|---|---|---|
| `gt_manga` | `manga` | `/manga/{slug}` | yes | `gt/v1/manga` |
| `gt_chapter` | `chapters` | `/manga/{slug}/chapter/{number}` | yes | `gt/v1/chapter` |
| `gt_announcement` | `announcements` | n/a | no | `gt/v1/announcements` |
| `gt_pinned` | `pinned_manga` | n/a | no | `gt/v1/pinned` |

Chapter → manga: `post_meta._gt_manga_id` (indexed). Avoid native
parent/child to keep permalink rewrite simple.

### 3.2 Taxonomies

- `gt_genre` (hierarchical)
- `gt_content_warning` (flat)
- `gt_manga_type` (flat: manga / manhwa / manhua)
- `gt_status` (flat: ongoing / completed / hiatus)

### 3.3 Post meta (all registered with `show_in_rest` + sanitisation)

**`gt_manga`**: `cover_url`, `banner_url`, `alt_titles[]`, `released_year`,
`rating`, `description_html`, `is_pinned`, `is_featured`, `view_count_24h`,
`view_count_total`, `author`, `artist`.

**`gt_chapter`**: `number`, `title`, `pages[] (json: url, width, height)`,
`premium`, `coin_price`, `is_subscription`, `free_release_at`,
`subscription_free_release_at`, `published_at`, `discord_notified`,
`blogger_post_id`.

### 3.4 Custom DB tables

All prefixed with `{$wpdb->prefix}gt_`. Created via `dbDelta` in each
plugin's `Migrations/`.

| Plugin | Table | Replaces (Supabase) |
|---|---|---|
| premium | `gt_coin_balances` | `coin_balance` column on profiles |
| premium | `gt_token_balances` | `token_balance` column on profiles |
| premium | `gt_coin_transactions` | `coin_transactions` |
| premium | `gt_mission_completions` | `daily_checkins`, `mission_log` |
| premium | `gt_streaks` | `comment_streaks` |
| premium | `gt_chapter_unlocks` | `chapter_unlocks` |
| premium | `gt_subscriptions` | `user_subscriptions` |
| premium | `gt_subscription_plans` | `subscription_plans` |
| premium | `gt_payment_orders` | `payment_orders` |
| premium | `gt_payment_webhook_log` | `webhook_events` |
| security | `gt_blocked_ips` | `blocked_ips` |
| social | `gt_notifications` | `notifications` |
| social | `gt_notification_subs` | `notification_subscriptions` |
| social | `gt_bookmarks` | `bookmarks` |
| social | `gt_reading_history` | `reading_history` |
| social | `gt_comments_meta` | comment likes / mentions extensions |
| core | `gt_views_log` | `manga_views` (24h trending) |

Comments use native `wp_comments` + `gt_comments_meta` extension table
for likes, mentions, and streak tracking.

### 3.5 User meta

`gt_avatar_url`, `gt_display_name_locked`, `gt_notification_prefs (json)`,
`gt_theme_preset`, `gt_reader_settings (json)`.

### 3.6 Roles and capabilities (registered by `grodextt-core`)

| Role | Caps added |
|---|---|
| `gt_reader` (default) | `read`, `gt_unlock_chapter`, `gt_comment` |
| `gt_moderator` | reader + `gt_moderate_comments`, `gt_bypass_paywall` |
| `gt_admin` | moderator + `gt_manage_economy`, `gt_manage_payments`, `gt_manage_chapters` |
| `administrator` | gets all `gt_*` caps |

### 3.7 Settings (`grodextt-core`)

All `site_settings` rows become `gt_settings` (autoloaded JSON) with
sub-keys: `coin_system`, `subscription_settings`, `premium_config`,
`theme_preset`, `payment_credentials`, `discord_webhook`, `storage`,
`upload`, `announcements`, `general`.

---

## 4. REST API (replaces Supabase Edge Functions)

All routes under `gt/v1/`. Capability checks via `permission_callback`.

| Edge Function | New REST Route | Module |
|---|---|---|
| `unlock-chapter` | `POST gt/v1/chapter/{id}/unlock` | premium/paywall |
| `secure-checkin` | `POST gt/v1/missions/checkin` | premium/economy |
| `admin-update-balance` | `POST gt/v1/admin/balance` | premium/economy |
| `stripe-checkout` | `POST gt/v1/pay/stripe/checkout` | premium/payments |
| `paypal-purchase` | `POST gt/v1/pay/paypal/order` | premium/payments |
| `capture-subscription-order` | `POST gt/v1/pay/paypal/capture` | premium/payments |
| `create-razorpay-order` | `POST gt/v1/pay/razorpay/order` | premium/payments |
| `capture-razorpay-order` | `POST gt/v1/pay/razorpay/capture` | premium/payments |
| `create-subscription-order` | `POST gt/v1/sub/create` | premium/paywall |
| `subscription-webhook` | `POST gt/v1/webhook/subscription` | premium/payments |
| `cryptomus-purchase` | `POST gt/v1/pay/cryptomus/order` | premium/payments |
| `cryptomus-webhook` | `POST gt/v1/webhook/cryptomus` | premium/payments |
| `nowpayments` | `POST gt/v1/pay/nowpayments/order` | premium/payments |
| `discord-notify` | internal `transition_post_status` hook | discord |
| `check-subscription-expiry` | `wp_cron` event `gt_check_sub_expiry` | premium/paywall |
| `storage-usage` | `GET gt/v1/admin/storage` | core |
| `project-stats` | `GET gt/v1/admin/stats` | core |
| `blogger-upload` | `POST gt/v1/admin/blogger-upload` | blogger-bridge |

Public read endpoints under `gt/v1/public/*` never expose page URLs for
premium chapters. Pages are streamed only via
`GET gt/v1/chapter/{id}/pages` after the access gate passes.

---

## 5. Frontend — Tailwind + React islands

PHP renders the page shell (SEO, OpenGraph, schema.org), then React islands
hydrate where interactivity is needed. This is **not** a SPA.

`functions.php` enqueues a Vite manifest loader. `main.ts` scans the DOM
for `[data-island]` elements and dynamically imports the matching component:

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
| `HeroCarousel`, `LatestUpdates`, `Trending`, `PinnedCarousel` | `front-page.php` |

Design tokens (`#0a0a0a` base, `#9b87f5` primary, Inter/Outfit fonts)
move into `theme/src/styles/tokens.css`.

**No client-side router.** WordPress handles URLs. Islands receive
IDs/slugs through `data-*` attributes only.

---

## 6. Chapter visibility logic

The current `chapterVisibility.ts` logic must be ported server-side into
`grodextt-premium`:

```php
// Pseudo-code for the access gate
function gt_is_chapter_accessible($chapter_id, $user_id) {
    $chapter = get_post_meta($chapter_id, ...);
    
    // 1. Free chapter → always accessible
    if (!$chapter['premium'] && !$chapter['is_subscription']) return true;
    
    // 2. Free release date passed → accessible
    if ($chapter['free_release_at'] && strtotime($chapter['free_release_at']) <= time()) return true;
    
    // 3. User has unlock row → accessible
    if (gt_user_has_unlock($user_id, $chapter_id)) return true;
    
    // 4. User has active subscription covering this chapter → accessible
    if (gt_user_has_active_subscription($user_id)) return true;
    
    // 5. User has gt_bypass_paywall capability → accessible (admin/mod bypass)
    if (current_user_can('gt_bypass_paywall')) return true;
    
    return false;
}
```

This filter is applied to:
- `the_content` filter on `gt_chapter` posts
- The `gt/v1/chapter/{id}/pages` REST endpoint
- Template rendering in `single-chapter.php`

---

## 7. Error prevention checklist

These are the specific measures to prevent white screens, crashes, and
WordPress-specific failures:

### 7.1 Plugin activation safety

```php
// In each plugin's main file
register_activation_hook(__FILE__, function() {
    // Check PHP version
    if (version_compare(PHP_VERSION, '8.2', '<')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('Grodex Tantrums requires PHP 8.2+');
    }
    
    // Check dependencies (e.g. grodextt-premium needs grodextt-core)
    if (!class_exists('Grodextt\\Core\\Plugin')) {
        deactivate_plugins(plugin_basename(__FILE__));
        wp_die('This plugin requires grodextt-core to be active.');
    }
    
    // Run dbDelta migrations
    self::run_migrations();
});
```

### 7.2 Graceful degradation

Every plugin checks for its dependencies at runtime without `wp_die`:

```php
add_action('admin_notices', function() {
    if (!class_exists('Grodextt\\Core\\Plugin')) {
        echo '<div class="notice notice-error"><p>
            <strong>Grodex Premium</strong> requires 
            <strong>Grodex Core</strong>. Please activate it.
        </p></div>';
    }
});
```

### 7.3 dbDelta safety

- Always use `$wpdb->prefix` — never hardcode `wp_`.
- Wrap all migrations in `dbDelta()` (idempotent by design).
- Use `$charset_collate = $wpdb->get_charset_collate()` on every
  `CREATE TABLE` statement.
- Never run `DROP TABLE` on activation; only on uninstall with explicit
  opt-in flag.

### 7.4 REST API safety

- Every endpoint has a `permission_callback` (never `__return_true` except
  for webhook routes that verify signatures internally).
- All webhook handlers validate signatures before processing.
- Use `sanitize_text_field()`, `absint()`, `wp_kses_post()` on all inputs.
- Return `WP_Error` objects, never raw `wp_die()`.

### 7.5 Memory limits

- Set `WP_MEMORY_LIMIT` to `512M` in `wp-config.php`.
- Paginate all admin queries (manga list, users list, transactions).
- Use `wp_defer_term_counting()` during bulk imports.
- Never load all chapters into memory; stream via cursor-based pagination.

---

## 8. Migration pipeline (Supabase → WordPress)

One-shot Node.js script in `tools/migrate/`:

1. Connect to Supabase with the service role key.
2. Stream `manga` rows → `POST /wp-json/wp/v2/gt_manga` with all meta.
3. Stream `chapters`, mapping `manga_id` via a translation map in
   `tools/migrate/state.json`.
4. Page URLs: keep Blogger CDN URLs as-is. For Supabase Storage URLs,
   either keep them or sideload through `POST /wp-json/wp/v2/media`.
5. Users: `wp user create` per row, write `gt_*` user meta.
6. Balances and unlocks: bulk `INSERT` into `gt_coin_balances`,
   `gt_chapter_unlocks` etc. over MySQL directly.
7. Subscriptions: rebuild `gt_subscriptions`; store original provider
   subscription ID so webhooks continue to flow.
8. Comments: import into `wp_comments` preserving threads; build
   `gt_comments_meta` for likes/mentions.
9. Verify: `tools/migrate/verify.ts` compares row counts and sampled diffs.

---

## 9. Hostinger deployment

- **Plan**: Business or Cloud Startup. PHP 8.2, OPcache, Redis.
- **wp-config.php**:
  ```php
  define('WP_MEMORY_LIMIT', '512M');
  define('DISALLOW_FILE_EDIT', true);
  define('FORCE_SSL_ADMIN', true);
  define('WP_AUTO_UPDATE_CORE', 'minor');
  define('WP_REDIS_HOST', '127.0.0.1');
  ```
- **Cron**: Replace `wp-cron.php` with real Hostinger cron hitting
  `wp-cron.php?doing_wp_cron` every minute, then
  `define('DISABLE_WP_CRON', true);`.
- **Cloudflare**: WAF, Bot Fight Mode. Cache rule bypasses for
  `/wp-admin/*`, `/wp-json/gt/v1/*`, and `?nocache`.
- **Backups**: Hostinger daily + UpdraftPlus to Backblaze B2 / Cloudflare R2.
- **Page cache**: LiteSpeed Cache (Hostinger uses LiteSpeed).
  Exclude logged-in users from page cache.
- **Search**: Relevanssi (matches alt-titles via custom field indexing).

---

## 10. Execution playbook

### Step 1 — Scaffold plugins and theme

> Create the directory tree from §2. For every plugin, generate the
> standard skeleton. For the theme, generate `style.css`, `functions.php`,
> Vite config, Tailwind config, and `main.ts` island mounter. Use
> design tokens from the current `src/index.css`.

### Step 2 — `grodextt-core`: CPTs, taxonomies, meta, settings, roles

> Register CPTs, taxonomies, post meta from §3. Implement
> `Grodextt\Core\Settings` backed by `gt_settings` option. Register
> roles from §3.6. Add wp-admin menu "Grodex Tantrums" with submenu
> pages mounting React admin islands.

### Step 3 — `grodextt-premium`: unified monetisation

> Create all tables from §3.4 (economy + paywall + payments). Implement:
> - **Economy module**: coin/token balances, transactions, daily check-in
>   (idempotent per UTC day), streaks, mission completions, multiplier
>   ladder `[1, 3, 7, 15, 32, 100]`, temporary 3-day token access rule.
> - **Paywall module**: chapter unlock logic, subscription plans, access
>   gate (§6), `free_release_at` scheduler, admin bypass banner.
> - **Payments module**: Stripe, PayPal, NOWPayments, Cryptomus, Razorpay
>   via Composer SDKs. All REST routes from §4. Webhook signature
>   verification. All charges in **USD**. Credentials in `gt_settings`,
>   never in `wp-config.php`.
> - Master toggles: `enable_coins`, `enable_subscriptions` (match current
>   `chapterVisibility.ts` behaviour).

### Step 4 — `grodextt-security`

> Implement `gt_blocked_ips` table. `init` hook that 403s any request
> whose `REMOTE_ADDR` (with Cloudflare `CF-Connecting-IP` fallback)
> matches a blocked row. Admin bypass banner template parts.

### Step 5 — `grodextt-discord`

> Hook `transition_post_status` for `gt_chapter`. On first publish,
> POST to configured webhook URL. Mark `discord_notified = 1`.

### Step 6 — `grodextt-blogger-bridge`

> Port `supabase/functions/blogger-upload`. Store OAuth credentials in
> `gt_settings` (encrypted via `AUTH_KEY`). REST route
> `gt/v1/admin/blogger-upload` returns Blogger CDN URLs.
> Capability gate: `gt_manage_chapters`.

### Step 7 — `grodextt-social`

> Notifications, bookmarks, reading history. Bell-icon island queries
> `gt/v1/notifications`. Hooks create notification rows on chapter
> publish, @mention, and comment reply.

### Step 8 — Theme templates

> Convert each React page to its matching PHP template. Keep Tailwind
> classes identical. Replace data hooks with `WP_Query` and
> `get_post_meta`. Mount React islands only where interactivity exists.

### Step 9 — Reader island

> Adapt `ChapterReader.tsx` to mount on `data-island="ChapterReader"`.
> Strip React Router. Replace Supabase calls with
> `fetch('/wp-json/gt/v1/chapter/'+id+'/pages')`. Keep localStorage
> reader settings, keyboard shortcuts, slide-in menu.

### Step 10 — Migration tools

> Create `tools/migrate/` per §8. Provide `migrate:dry-run`,
> `migrate:run`, `migrate:verify` npm scripts.

### Step 11 — Cron and webhooks

> Register `gt_check_sub_expiry` (hourly), `gt_recompute_trending`
> (every 5 minutes). Document the Hostinger cron command.

### Step 12 — Hardening pass

> Install Wordfence, configure rate limits for `/wp-json/gt/v1/*`.
> Cloudflare rules per §9. Security headers via `mu-plugin`.
> Verify Application Passwords disabled for non-admin roles.

### Step 13 — End-to-end test

> Activate in dependency order: `core` → `premium` → `security` →
> `discord` → `blogger-bridge` → `social`. Run migration. Walk through:
> register, buy coins (Stripe test mode), unlock premium chapter, post
> comment, receive notification, trigger Discord post, verify IP block.

---

## 11. Madara feature comparison

| Madara (16+ paid add-ons) | Grodex Tantrums (built-in) |
|---|---|
| WP Manga Chapter Coin ($29) | `grodextt-premium` Economy module |
| WP Manga Chapter Permissions ($19) | `grodextt-premium` Paywall module |
| WP Manga Chapter Protector ($15) | `grodextt-security` + Cloudflare |
| WP Manga Chapter Scheduler ($9) | `gt_chapter` post meta `free_release_at` |
| WP Manga Chapter Thumbnail ($9) | Built into `gt_chapter` `pages[]` meta |
| WP Manga Custom Fields ($9) | Handled via `gt_manga` extensible meta |
| WP Manga FTP/SFTP Storage ($19) | `grodextt-core` multi-storage (Supabase, ImgBB, R2, Blogger) |
| WP Manga Report Chapter ($9) | Comment system + moderation |
| WP Manga Watermark ($15) | Planned: image processing on upload |
| WP Manga Member Upload PRO ($29) | `gt_manage_chapters` capability for moderators |
| WP Manga Novel Reading Tools ($9) | `ChapterReader` island with full reader settings |
| Madara Data Export & Import ($29) | `tools/migrate/` scripts |
| **Total Madara cost: ~$220+** | **Included in Grodex Tantrums** |

---

## 12. Acceptance criteria

- Theme can be switched off and reactivated with no data loss.
- Each plugin can be deactivated independently; only its feature
  disappears (no fatal errors, no white screens).
- Every admin action in the React panel has a wp-admin equivalent.
- Public pages render without JavaScript for SEO; islands enhance.
- All money flows in **USD**; provider credentials in `gt_settings`,
  not in `wp-config.php`.
- Premium chapter pages (image URLs) never returned to a user who has
  not passed the access gate.
- Cron jobs run via Hostinger system cron, not `wp-cron.php` on request.
- Cloudflare WAF + page cache active; `/wp-json/gt/v1/*` bypasses cache.
- No `wp_die()` calls in production code paths (admin notices only).
- All DB tables created via `dbDelta()` with proper charset collation.
- Plugin activation fails gracefully with a clear message if
  dependencies are missing.

Once these criteria pass on staging, cut DNS over to Hostinger.