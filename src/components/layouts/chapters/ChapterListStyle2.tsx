"use client";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';

interface ChapterListStyle2Props {
  manga: any;
  visibleChapters: any[];
  premiumSettings: any;
  badgeProps: any;
  getUnlockStatus: (chapterId: string) => any;
  isSubscriber: boolean;
}

const CurrencyIcon = ({ className, size, style, url, name }: any) =>
  url ? (
    <img src={url} alt={name} className={`${className} object-contain`} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
  ) : (
    <Icon icon="ph:coins-bold" className={className} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
  );

export default function ChapterListStyle2({
  manga,
  visibleChapters,
  premiumSettings,
  badgeProps,
  getUnlockStatus,
  isSubscriber
}: ChapterListStyle2Props) {
  const {
    bg_color,
    text_color,
  } = badgeProps;
  
  const currencyIconUrl = premiumSettings?.coin_system?.currency_icon_url;
  const currencyName = premiumSettings?.coin_system?.currency_name;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {visibleChapters.map((ch) => {
        const chDate = formatDistanceToNow(new Date(ch.created_at), { addSuffix: true });
        const isFreeRelease = ch.free_release_at ? new Date(ch.free_release_at).getTime() <= Date.now() : false;
        const isSubFreeRelease = ch.subscription_free_release_at ? new Date(ch.subscription_free_release_at).getTime() <= Date.now() : false;
        const isPremium = !!ch.premium && !isFreeRelease && premiumSettings.premium_config.enable_coins;
        const isSub = !!ch.is_subscription && !isSubFreeRelease;
        const unlockRecord = getUnlockStatus(ch.id);
        const isChapterUnlocked = !!unlockRecord;
        const isNew = (Date.now() - new Date(ch.created_at).getTime()) < 24 * 60 * 60 * 1000;
        const isLocked = (isPremium && !isChapterUnlocked) || (isSub && !isSubscriber);
        
        return (
          <Link
            key={ch.id}
            to={`/manga/${manga.slug}/chapter/${ch.number}`}
            className="group block bg-[#1a1a2e] rounded-2xl p-2.5 shadow-sm border border-border/10 transition-colors hover:border-primary/30"
          >
            {/* Portrait cover (aspect-square) */}
            <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-secondary/20">
              <img
                src={manga.cover_url}
                alt=""
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  isLocked ? 'brightness-75 grayscale-[0.25]' : ''
                }`}
              />
              {/* Locked / Unlocked Badges (Center) */}
              {isLocked ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 bg-black/70 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-sm">
                    <Icon icon="ph:lock-key-fill" className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : ((isPremium && isChapterUnlocked) || (isSub && isSubscriber)) ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 bg-emerald-500/80 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-sm">
                    <Icon icon="ph:lock-key-open-fill" className="w-5 h-5 text-white" />
                  </div>
                </div>
              ) : null}

              {/* Coin / Sub badge (Bottom Left) */}
              {isLocked && (
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg shadow-md px-2 py-1" style={{ backgroundColor: bg_color || '#1e293b' }}>
                  {isSub ? (
                    <Icon icon="mdi:latest" style={{ width: 12, height: 12, color: text_color || '#fff' }} />
                  ) : (
                    <CurrencyIcon size={12} className="text-current" style={{ color: text_color || '#fff' }} url={currencyIconUrl} name={currencyName} />
                  )}
                  <span style={{ color: text_color || '#fff', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.025em' }}>
                    {isSub ? (premiumSettings.subscription_settings?.badge_label || 'Early') : (ch.coin_price ?? 100)}
                  </span>
                </div>
              )}
            </div>
            {/* Text below cover */}
            <div className="px-0.5 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[14px] font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                  Chapter {ch.number}
                </h3>
                {isNew && !isSub && (
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-500/20 text-zinc-400 dark:bg-zinc-600 dark:text-zinc-200">
                    NEW
                  </span>
                )}
              </div>
              <p className="text-[12px] font-medium text-muted-foreground/80">
                {new Date(ch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
