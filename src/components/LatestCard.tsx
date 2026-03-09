import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import TypeBadge from './TypeBadge';

type Manga = Tables<"manga">;

interface LatestCardProps {
  manga: Manga;
}

function isNewChapter(dateStr: string): boolean {
  const chapterDate = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - chapterDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 3;
}

function NewBadge() {
  return (
    <span className="shrink-0 w-4 h-4 rounded-full bg-muted-foreground/40 flex items-center justify-center pulse">
      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
    </span>
  );
}

export default function LatestCard({ manga }: LatestCardProps) {
  // For now, show static chapter info since we don't have chapter data joined
  const formattedDate = new Date(manga.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className="flex gap-3 pr-3 rounded-lg border border-border/40 bg-card/60 hover:bg-card/80 transition-colors group overflow-hidden">
      <Link to={`/manga/${manga.slug}`} className="shrink-0 self-stretch">
        <div className="relative w-[140px] h-full overflow-hidden">
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
          <h3 className="font-bold text-base text-foreground line-clamp-2 hover:text-primary transition-colors">
            {manga.title}
          </h3>
        </Link>

        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between text-xs py-2">
            <span className="flex items-center gap-1.5 text-muted-foreground hover:text-primary truncate">
              <span className="truncate capitalize">{manga.status}</span>
              {isNewChapter(manga.updated_at) && <NewBadge />}
            </span>
            <span className="text-muted-foreground/50 text-[11px] shrink-0 ml-2">{formattedDate}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{manga.description}</p>
        </div>
      </div>
    </div>
  );
}
