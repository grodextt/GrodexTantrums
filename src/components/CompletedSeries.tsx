import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { formatViews, optimizedImageUrl } from '@/lib/utils';
import { useCompletedManga } from '@/hooks/useCompletedManga';
import TypeBadge from './TypeBadge';

export default function CompletedSeries() {
  const { data: completed = [], isLoading } = useCompletedManga();

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Icon icon="ph:check-circle-bold" className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold">Completed Series</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!completed.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="ph:check-circle-bold" className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Completed Series</h2>
        </div>
        <Link to="/series" className="flex items-center gap-1 text-sm text-primary hover:underline">
          View all <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {completed.map(manga => (
          <Link key={manga.id} to={`/manga/${manga.slug}`} className="group relative block">
            <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-secondary">
              <img
                src={optimizedImageUrl(manga.cover_url, 300)}
                alt={manga.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <TypeBadge type={manga.type as any} />
                <span className="px-1.5 py-0.5 rounded bg-green-600/90 text-[10px] font-semibold text-white">Completed</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{manga.title}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon icon="ph:star-fill" className="w-3 h-3 text-yellow-500" />
                    {manga.rating || 0}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground/60">
                  {manga.genres?.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
