"use client";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import { formatDistanceToNow } from 'date-fns';

interface ChapterListStyle1Props {
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

export default function ChapterListStyle1({
  manga,
  visibleChapters,
  premiumSettings,
  badgeProps,
  getUnlockStatus,
  isSubscriber
}: ChapterListStyle1Props) {
  const {
    bg_color,
    padding_y,
    padding_x,
    icon_size,
    text_color,
    font_size,
    font_weight,
  } = badgeProps;
  
  const currencyIconUrl = premiumSettings?.coin_system?.currency_icon_url;
  const currencyName = premiumSettings?.coin_system?.currency_name;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {visibleChapters.map((ch) => {
        const chDate = formatDistanceToNow(new Date(ch.created_at), { addSuffix: true });
        const isFreeRelease = ch.free_release_at ? new Date(ch.free_release_at).getTime() <= Date.now() : false;
        const isSubFreeRelease = ch.subscription_free_release_at ? new Date(ch.subscription_free_release_at).getTime() <= Date.now() : false;
        const isPremium = !!ch.premium && !isFreeRelease && premiumSettings.premium_config.enable_coins;
        const isSub = !!ch.is_subscription && !isSubFreeRelease;
        const unlockRecord = getUnlockStatus(ch.id);
        const isChapterUnlocked = !!unlockRecord;
        const isNew = (Date.now() - new Date(ch.created_at).getTime()) < 24 * 60 * 60 * 1000;
        const subBadgeLabel = premiumSettings.subscription_settings?.badge_label || 'Early Access';
        return (
          <Link
            key={ch.id}
            to={`/manga/${manga.slug}/chapter/${ch.number}`}
            className="group flex items-center gap-4 p-3 rounded-[20px] bg-card border border-border/40 hover:bg-secondary hover:border-primary/30 hover:shadow-md transition-all h-[104px]"
          >
            {/* Thumbnail */}
            <div className="relative shrink-0 h-full aspect-[4/3]">
              <img
                src={manga.cover_url}
                alt=""
                className={`w-full h-full object-cover rounded-xl shadow-sm transition-all duration-300 ${(isPremium && !isChapterUnlocked) || (isSub && !isSubscriber) ? 'opacity-40 grayscale-[0.5]' : 'group-hover:scale-105'}`}
              />
              {((isPremium && !isChapterUnlocked) || (isSub && !isSubscriber)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[1px]">
                  <Icon icon="ph:lock-key-fill" className="w-6 h-6 text-white drop-shadow-md" />
                </div>
              )}
              {((isPremium && isChapterUnlocked) || (isSub && isSubscriber)) && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-xl">
                  <Icon icon="ph:lock-key-open-fill" className="w-5 h-5 text-emerald-500 drop-shadow-lg" />
                </div>
              )}
            </div>
            {/* Details */}
            <div className="flex flex-col flex-1 min-w-0 justify-center gap-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-bold truncate group-hover:text-primary transition-colors">
                  Chapter {ch.number}
                </h3>
                {isNew && !isSub && (
                  <span className="px-1.5 py-0.5 rounded-[6px] bg-zinc-500/20 text-zinc-400 dark:bg-zinc-600 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider animate-[pulse_2s_ease-in-out_infinite]">
                    New
                  </span>
                )}
              </div>
              <p className="text-[13px] font-medium text-muted-foreground/70 mb-1">
                {isSub && ch.subscription_free_release_at && new Date(ch.subscription_free_release_at).getTime() > Date.now() ? (
                  <span className="text-amber-500 font-bold flex items-center gap-1" title={new Date(ch.subscription_free_release_at).toLocaleString()}>
                    <Icon icon="ph:timer-bold" /> Unlocks in {formatDistanceToNow(new Date(ch.subscription_free_release_at))}
                  </span>
                ) : (
                  chDate
                )}
              </p>
              {(isPremium && !isChapterUnlocked) || (isSub && !isSubscriber) ? (
                <div className="flex shrink-0">
                  <div
                    className="flex items-center gap-1.5 shadow-sm transition-transform group-hover:scale-105 w-fit rounded-[10px]"
                    style={{ backgroundColor: bg_color, padding: `${padding_y}px ${padding_x}px` }}
                  >
                    {isSub ? (
                      <Icon icon="mdi:latest" style={{ width: icon_size, height: icon_size, color: text_color }} />
                    ) : (
                      <CurrencyIcon size={icon_size} className="text-current" style={{ color: text_color }} url={currencyIconUrl} name={currencyName} />
                    )}
                    <span style={{ color: text_color, fontSize: `${font_size}px`, fontWeight: font_weight, letterSpacing: '-0.025em' }}>
                      {isSub ? subBadgeLabel : (ch.coin_price ?? 100)}
                    </span>
                  </div>
                </div>
              ) : (isPremium && isChapterUnlocked) || (isSub && isSubscriber) ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold uppercase tracking-wider w-fit bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  <Icon icon="ph:check-circle-fill" className="w-3.5 h-3.5" />
                  <span>Unlocked</span>
                </div>
              ) : (
                <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-center w-8 h-6 rounded-lg bg-primary/10 text-primary">
                    <Icon icon="ph:arrow-right-bold" className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
