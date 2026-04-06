import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { MangaWithChapters } from '@/hooks/useAllManga';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import TypeBadge from './TypeBadge';

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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function ChapterRow({ ch, slug, currencyIconUrl }: { ch: { id: string; number: number; premium: boolean | null; created_at: string }; slug: string; currencyIconUrl: string }) {
  return (
    <Link
      key={ch.id}
      to={`/manga/${slug}/chapter/${ch.number}`}
      className="flex items-center justify-between text-xs py-1.5 hover:bg-muted/40 rounded-lg px-2 transition-colors"
    >
      <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground truncate">
        <span className="truncate font-medium">Chapter {ch.number}</span>
        {ch.premium && <CurrencyIcon iconUrl={currencyIconUrl} className="w-3 h-3 text-amber-400 shrink-0" />}
        {isNewChapter(ch.created_at) && <NewBadge />}
      </span>
      <span className="text-muted-foreground/50 text-[11px] shrink-0 ml-2">
        {formatRelativeDate(ch.created_at)}
      </span>
    </Link>
  );
}

export default function LatestCard({ manga }: LatestCardProps) {
  const { settings } = usePremiumSettings();
  const chapters = manga.chapters || [];
  const sortByDate = (a: typeof chapters[0], b: typeof chapters[0]) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  const premiumChapters = chapters.filter(ch => ch.premium === true).sort(sortByDate).slice(0, 2);
  const freeChapters = chapters.filter(ch => ch.premium === false || ch.premium === null).sort(sortByDate).slice(0, 2);
  const hasBoth = premiumChapters.length > 0 && freeChapters.length > 0;

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
          <h3 className="font-bold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
            {manga.title}
          </h3>
        </Link>

        <div className="mt-2 flex flex-col gap-0.5">
          {chapters.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No chapters yet</span>
          )}

          {premiumChapters.map(ch => (
            <ChapterRow key={ch.id} ch={ch} slug={manga.slug} currencyIconUrl={settings.coin_system.currency_icon_url} />
          ))}

          {hasBoth && (
            <div className="border-t border-border/40 my-1" />
          )}

          {freeChapters.map(ch => (
            <ChapterRow key={ch.id} ch={ch} slug={manga.slug} currencyIconUrl={settings.coin_system.currency_icon_url} />
          ))}
        </div>
      </div>
    </div>
  );
}
