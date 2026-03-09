import { Link } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { MangaWithChapters } from '@/hooks/useAllManga';
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

function ChapterRow({ ch, slug }: { ch: { id: string; number: number; premium: boolean | null; created_at: string }; slug: string }) {
  return (
    <Link
      key={ch.id}
      to={`/manga/${slug}/chapter/${ch.number}`}
      className="flex items-center justify-between text-xs py-1 hover:bg-muted/30 rounded px-1 -mx-1 transition-colors"
    >
      <span className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground truncate">
        <span className="truncate">Chapter {ch.number}</span>
        {ch.premium && <Coins className="w-3 h-3 text-amber-400 shrink-0" />}
        {isNewChapter(ch.created_at) && <NewBadge />}
      </span>
      <span className="text-muted-foreground/50 text-[11px] shrink-0 ml-2">
        {formatRelativeDate(ch.created_at)}
      </span>
    </Link>
  );
}

export default function LatestCard({ manga }: LatestCardProps) {
  const chapters = manga.chapters || [];
  const premiumChapters = chapters.filter(ch => ch.premium === true).slice(0, 2);
  const freeChapters = chapters.filter(ch => !ch.premium).slice(0, 2);
  const hasBoth = premiumChapters.length > 0 && freeChapters.length > 0;

  return (
    <div className="flex gap-3 pr-3 rounded-lg border border-border/40 bg-card/60 hover:bg-card/80 transition-colors group overflow-hidden">
      <Link to={`/manga/${manga.slug}`} className="shrink-0 self-stretch">
        <div className="relative w-[110px] h-full min-h-[140px] overflow-hidden">
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

        <div className="mt-2 flex flex-col gap-1">
          {chapters.length === 0 && (
            <span className="text-xs text-muted-foreground italic">No chapters yet</span>
          )}

          {premiumChapters.map(ch => (
            <ChapterRow key={ch.id} ch={ch} slug={manga.slug} />
          ))}

          {hasBoth && (
            <div className="border-t border-border/40 my-1" />
          )}

          {freeChapters.map(ch => (
            <ChapterRow key={ch.id} ch={ch} slug={manga.slug} />
          ))}
        </div>
      </div>
    </div>
  );
}
