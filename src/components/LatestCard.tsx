import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { MangaWithChapters } from '@/hooks/useAllManga';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import TypeBadge from './TypeBadge';
import { formatDistanceToNow } from 'date-fns';

interface LatestCardProps {
  manga: MangaWithChapters;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isNewChapter(dateStr: string): boolean {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return diffMs / 86400000 <= 3;
}

function NewBadge() {
  return (
    <span className="shrink-0 inline-flex items-center rounded-sm bg-primary/20 text-primary text-[9px] font-bold px-1 py-0.5 animate-blink">
      New
    </span>
  );
}

function CurrencyIcon({ iconUrl, className }: { iconUrl: string; className?: string }) {
  return iconUrl ? (
    <img src={iconUrl} alt="" className={`${className} object-contain`} />
  ) : (
    <Icon icon="ph:coins-bold" className={className} />
  );
}

type ChapterEntry = { 
  id: string; 
  number: number; 
  premium: boolean | null; 
  free_release_at?: string | null;
  is_subscription?: boolean | null; 
  subscription_free_release_at?: string | null; 
  created_at: string 
};

function ChapterRow({ ch, slug, currencyIconUrl, subBadgeLabel }: { ch: ChapterEntry; slug: string; currencyIconUrl: string; subBadgeLabel?: string }) {
  return (
    <Link
      key={ch.id}
      to={`/manga/${slug}/chapter/${ch.number}`}
      className="flex items-center justify-between text-xs py-1.5 hover:bg-muted/40 rounded-lg px-2 transition-colors"
    >
      <span className="flex items-center gap-1 text-muted-foreground hover:text-foreground truncate">
        <span className="truncate font-medium">Chapter {ch.number}</span>
        {(() => {
          const isSubActive = !!ch.is_subscription && (!ch.subscription_free_release_at || new Date(ch.subscription_free_release_at).getTime() > Date.now());
          const isPremActive = !isSubActive && !!ch.premium && (!ch.free_release_at || new Date(ch.free_release_at).getTime() > Date.now());
          
          if (isSubActive) return <Icon icon="mdi:latest" className="w-4 h-4 text-amber-400 shrink-0 ml-0.5" />;
          if (isPremActive) return <CurrencyIcon iconUrl={currencyIconUrl} className="w-4 h-4 text-amber-400 shrink-0 ml-0.5" />;
          return null;
        })()}
        {isNewChapter(ch.created_at) && !ch.is_subscription && <NewBadge />}
      </span>
      <span className="text-muted-foreground/50 text-[11px] shrink-0 ml-2 text-right">
        {ch.is_subscription && ch.subscription_free_release_at && new Date(ch.subscription_free_release_at).getTime() > Date.now() ? (
          <span className="text-amber-500 font-medium" title={new Date(ch.subscription_free_release_at).toLocaleString()}>
            {formatDistanceToNow(new Date(ch.subscription_free_release_at))}
          </span>
        ) : (
          formatRelativeDate(ch.created_at)
        )}
      </span>
    </Link>
  );
}

/** Dotted divider between chapters of the same type */
function DottedDivider() {
  return <div className="border-t border-dashed border-border/50 mx-2" />;
}

/** Bold solid divider between free and premium sections */
function SectionDivider() {
  return <div className="border-t-2 border-border/70 my-1" />;
}

export default function LatestCard({ manga }: LatestCardProps) {
  const { settings } = usePremiumSettings();
  const chapters = manga.chapters || [];
  const sortByDate = (a: ChapterEntry, b: ChapterEntry) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

  const now = Date.now();
  const allPremium = chapters.filter(ch => {
    // A chapter is effectively subscription-only if is_subscription is true AND (count-down not set OR count-down in future)
    const isSubActive = !!ch.is_subscription && (!ch.subscription_free_release_at || new Date(ch.subscription_free_release_at).getTime() > now);
    // A chapter is effectively coin-only if premium is true AND is_subscription is false AND (count-down not set OR count-down in future)
    // We prioritize subscription-only status if both are true (though they usually aren't)
    const isPremActive = !isSubActive && !!ch.premium && (!ch.free_release_at || new Date(ch.free_release_at).getTime() > now);
    
    return isSubActive || isPremActive;
  }).sort(sortByDate);

  const allFree = chapters.filter(ch => {
    const isSubExpired = !!ch.is_subscription && !!ch.subscription_free_release_at && new Date(ch.subscription_free_release_at).getTime() <= now;
    const isPremExpired = !!ch.premium && !!ch.free_release_at && new Date(ch.free_release_at).getTime() <= now;
    const isFreeBase = !ch.premium && !ch.is_subscription;
    
    return isFreeBase || isSubExpired || isPremExpired;
  }).sort(sortByDate);

  let premiumChapters: ChapterEntry[];
  let freeChapters: ChapterEntry[];

  if (allPremium.length === 0) {
    premiumChapters = [];
    freeChapters = allFree.slice(0, 4);
  } else if (allPremium.length === 1) {
    premiumChapters = allPremium.slice(0, 1);
    freeChapters = allFree.slice(0, 3);
  } else {
    premiumChapters = allPremium.slice(0, 2);
    freeChapters = allFree.slice(0, 2);
  }

  const hasPremiumAndFree = premiumChapters.length > 0 && freeChapters.length > 0;
  const iconUrl = settings?.coin_system?.currency_icon_url;
  const subBadgeLabel = settings?.subscription_settings?.badge_label || 'Early Access';

  return (
    <div className="flex gap-3 pr-3 rounded-lg border border-border/40 bg-card/60 hover:bg-card/80 transition-colors group overflow-hidden">
      <Link to={`/manga/${manga.slug}`} className="shrink-0 self-stretch">
        <div className="relative w-[140px] h-full min-h-[170px] overflow-hidden">
          <img
            src={manga.cover_url}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-1 left-1">
            <TypeBadge type={manga.type} />
          </div>
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col py-3 overflow-hidden">
        <Link to={`/manga/${manga.slug}`}>
          <h3 className="font-bold text-sm text-foreground line-clamp-2 hover:text-primary transition-colors leading-snug">
            {manga.title}
          </h3>
        </Link>

        <div className="mt-2 flex flex-col gap-0">
          {chapters.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No chapters yet</span>
          )}

          {/* Premium chapters */}
          {premiumChapters.map((ch, idx) => (
            <div key={ch.id}>
              {idx > 0 && <DottedDivider />}
              <ChapterRow ch={ch} slug={manga.slug} currencyIconUrl={iconUrl} />
            </div>
          ))}

          {/* Bold divider between premium and free */}
          {hasPremiumAndFree && <SectionDivider />}

          {/* Free chapters */}
          {freeChapters.map((ch, idx) => (
            <div key={ch.id}>
              {idx > 0 && <DottedDivider />}
              <ChapterRow ch={ch} slug={manga.slug} currencyIconUrl={iconUrl} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
