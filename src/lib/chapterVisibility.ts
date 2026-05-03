/**
 * Site-wide visibility filter for chapters based on which monetization
 * features are currently enabled in admin settings.
 *
 * - When `enable_coins` is OFF, premium (coin-locked) chapters are hidden
 *   from listings UNTIL their free-release timestamp has passed.
 * - When `enable_subscriptions` is OFF, subscription/early-access chapters
 *   are hidden from listings UNTIL their free-release timestamp has passed.
 *
 * Free chapters are always visible.
 */
export interface ChapterVisibilityFlags {
  premium?: boolean | null;
  free_release_at?: string | null;
  is_subscription?: boolean | null;
  subscription_free_release_at?: string | null;
}

export interface PremiumConfigLike {
  enable_coins?: boolean;
  enable_subscriptions?: boolean;
}

export function isChapterVisible<T extends ChapterVisibilityFlags>(
  ch: T,
  config: PremiumConfigLike | undefined,
): boolean {
  const enableCoins = config?.enable_coins ?? true;
  const enableSubs = config?.enable_subscriptions ?? true;
  const now = Date.now();

  const subActive =
    !!ch.is_subscription &&
    (!ch.subscription_free_release_at ||
      new Date(ch.subscription_free_release_at).getTime() > now);
  const premActive =
    !subActive &&
    !!ch.premium &&
    (!ch.free_release_at || new Date(ch.free_release_at).getTime() > now);

  if (subActive && !enableSubs) return false;
  if (premActive && !enableCoins) return false;
  return true;
}

export function filterVisibleChapters<T extends ChapterVisibilityFlags>(
  chapters: T[] | undefined | null,
  config: PremiumConfigLike | undefined,
): T[] {
  if (!chapters) return [];
  return chapters.filter((c) => isChapterVisible(c, config));
}
