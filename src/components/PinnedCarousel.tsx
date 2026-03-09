import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pin, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { formatViews } from '@/lib/utils';
import { usePinnedManga } from '@/hooks/usePinnedManga';
import TypeBadge from './TypeBadge';

export default function PinnedCarousel() {
  const { data: pinned = [], isLoading } = usePinnedManga();
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.6;
    scrollRef.current.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Pinned Series</h2>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="shrink-0 w-[200px] aspect-[3/4] bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!pinned.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Pin className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Pinned Series</h2>
        </div>
      </div>

      <div className="relative group/carousel">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover/carousel:opacity-100">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors opacity-0 group-hover/carousel:opacity-100">
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {[...pinned, ...pinned].map((manga, i) => (
            <Link
              key={`${manga.id}-${i}`}
              to={`/manga/${manga.slug}`}
              className="shrink-0 w-[200px] group">
              <div className="relative rounded-lg overflow-hidden aspect-[3/4] bg-secondary">
                <img
                  src={manga.cover_url}
                  alt={manga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                <div className="absolute top-2 left-2">
                  <TypeBadge type={manga.type as any} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{manga.title}</h3>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {manga.rating || 0}
                    </span>
                    <span>{formatViews(manga.views || 0)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
