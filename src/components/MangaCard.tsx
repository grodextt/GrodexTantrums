import { Link } from 'react-router-dom';
import { Star, Eye } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { formatViews } from '@/lib/utils';
import TypeBadge from './TypeBadge';

type Manga = Tables<"manga">;
type Chapter = Tables<"chapters">;

export type MangaWithOptionalChapters = Manga & { 
  chapters?: Chapter[];
};

interface Props {
  manga: MangaWithOptionalChapters;
  rank?: number;
  showChapters?: boolean;
}

export default function MangaCard({ manga, rank, showChapters }: Props) {
  return (
    <Link to={`/manga/${manga.slug}`} className="group relative block">
      <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-secondary">
        <img
          src={manga.cover_url}
          alt={manga.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />

        {rank && (
          <div className="absolute top-2 left-2 w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">{rank}</span>
          </div>
        )}

        <div className="absolute top-2 right-2">
          <TypeBadge type={manga.type} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{manga.title}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <span>{manga.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{formatViews(manga.views)}</span>
            </div>
          </div>
          {showChapters && manga.chapters && manga.chapters.length > 0 && (
            <div className="mt-1.5 space-y-0.5">
              {manga.chapters.slice(0, 2).map(ch => (
                <div key={ch.id} className="flex justify-between text-[11px]">
                  <span className="text-muted-foreground">Ch. {ch.number}</span>
                  <span className="text-muted-foreground/60">
                    {new Date(ch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
