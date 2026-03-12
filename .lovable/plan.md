
Root cause (what is actually happening)

1) This is not caused by `.lovable/memory/index.md`.
- I verified it is not imported anywhere in runtime code.
- It only affects AI context, not what users load in browser.

2) Most “old code” you’re seeing is historical, not executed.
- Remaining “Kayn Scan” references are in an old migration seed file (`supabase/migrations/20260309081704...sql`) and memory file.
- They do not run on each page load unless DB is recreated/reset.

3) Your users are hitting a stale/deprecated deployment path/domain cache.
- Current project published URL is `https://scan-zen-studio.lovable.app`.
- You’re testing `https://manga-hub-v1.lovable.app`.
- I fetched both and reproduced inconsistent behavior on `manga-hub-v1` (dark/placeholder stale shell), while cache-busted URL (`?v=...`) loads the latest Sakura-styled build.
- That strongly indicates cached old HTML/app shell on that domain edge path.

4) Login makes it worse because auth stays on the same stale origin.
- Auth logs show requests referred from `https://manga-hub-v1.lovable.app`.
- So users who log in there continue seeing that cached/outdated variant.

5) “Mock images in public” are not the runtime cause.
- I searched usage; those `public/manga/cover*.jpg` files are currently unused by app code.

Implementation plan (next execution)

A) Force one canonical domain
- Redirect all traffic from `manga-hub-v1.lovable.app` to `scan-zen-studio.lovable.app` (or whichever domain you choose as canonical).
- Also set auth/site URL and redirect URLs to the same canonical domain.

B) Kill stale shell behavior
- Republish frontend (Update publish dialog).
- Add stronger cache-busting strategy for HTML/app shell (short/no-cache for HTML; hashed static assets keep long cache).
- Keep query-based bust fallback for debugging.

C) Remove confusing legacy artifacts
- Update `.lovable/memory/index.md` title/content to MangaHub branding.
- Update old migration seed values from Kayn Scan to MangaHub for future resets.
- Delete unused `public/manga/cover*.jpg` mock assets (optional cleanup, not functional fix).

D) Validate live environment explicitly
- Because Test and Live are separate, verify Live `site_settings` rows are correct (name/theme/announcements).
- If Live still has old values, run SQL in Live to set `general.site_name='MangaHub v1'` and `theme.preset='Sakura'`.

E) Verification checklist after fix
- Guest refresh test on canonical URL (multiple hard refreshes).
- New user signup/login flow, confirm no domain switch and no theme rollback.
- Confirm no visible “Kayn” text in rendered UI and metadata.

Technical notes
- No service worker is registered, so this is not a SW cache bug.
- The codebase already contains many of your recent fixes (trending logic, featured slider toggle, no fake chapter pages, mention/reply improvements, etc.), which supports that the main issue is deployment domain/cache/environment consistency rather than missing local code changes.
