import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useCollections, useCollectionSeries } from '@/hooks/useCollections';
import { useAllManga } from '@/hooks/useAllManga';
import { optimizedImageUrl, formatViews } from '@/lib/utils';
import TypeBadge from './TypeBadge';

function CollectionPopup({ collection, onClose }: { collection: any; onClose: () => void }) {
  const { data: series = [], isLoading } = useCollectionSeries(collection.genres);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl">{collection.icon}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate">{collection.title}</h3>
              <p className="text-xs text-muted-foreground">{series.length} series</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/series">
              <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5">
                View All
              </Button>
            </Link>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon icon="ph:x-bold" className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="px-5 py-3 text-sm text-muted-foreground border-b border-border/50">{collection.description}</p>
        )}

        {/* Series Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading series...</div>
          ) : series.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">No series found for these genres.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {series.map(m => (
                <Link key={m.id} to={`/manga/${m.slug}`} className="group block">
                  <div className="relative overflow-hidden rounded-xl aspect-[3/4] bg-secondary">
                    <img
                      src={optimizedImageUrl(m.cover_url, 200)}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <TypeBadge type={m.type} />
                    </div>
                  </div>
                  <p className="text-xs font-semibold mt-1.5 line-clamp-2 group-hover:text-primary transition-colors">{m.title}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionCard({ collection, allManga, onClick }: { collection: any; allManga: any[]; onClick: () => void }) {
  const matchingManga = allManga.filter(m =>
    m.genres?.some((g: string) => collection.genres.includes(g))
  );
  const totalViews = matchingManga.reduce((acc, m) => acc + (m.views || 0), 0);

  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[280px] sm:w-[300px] bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all text-left group"
    >
      {/* Card Header */}
      <div className="p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{collection.icon}</span>
          <h3 className="font-bold text-sm truncate">{collection.title}</h3>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{collection.description}</p>
        <div className="flex flex-wrap gap-1.5">
          {(collection.genres || []).slice(0, 2).map((g: string) => (
            <span key={g} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{g}</span>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex items-center gap-4 px-4 pb-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icon icon="ph:books-bold" className="w-3 h-3" /> {matchingManga.length}
        </span>
        <span className="flex items-center gap-1">
          <Icon icon="ph:eye-bold" className="w-3 h-3" /> {formatViews(totalViews)}
        </span>
      </div>

      {/* Cover Thumbnails Row */}
      <div className="flex gap-1 px-3 pb-3 overflow-hidden">
        {matchingManga.slice(0, 5).map(m => (
          <div key={m.id} className="w-14 h-20 rounded-lg overflow-hidden bg-muted shrink-0">
            <img
              src={optimizedImageUrl(m.cover_url, 100)}
              alt={m.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </button>
  );
}

export default function Collections() {
  const { data: collections = [], isLoading } = useCollections();
  const { data: allManga = [] } = useAllManga();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' });
  }, []);
  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' });
  }, []);

  if (isLoading || collections.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold flex items-center gap-2">
          <Icon icon="ph:folders-bold" className="w-6 h-6 text-primary" />
          Collections
        </h2>
        <Link to="/series" className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          View all <Icon icon="ph:caret-right-bold" className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="relative">
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {collections.map(c => (
            <CollectionCard
              key={c.id}
              collection={c}
              allManga={allManga}
              onClick={() => setSelectedCollection(c)}
            />
          ))}
        </div>

        {/* Scroll Arrows */}
        {collections.length > 3 && (
          <>
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 w-9 h-9 rounded-full bg-card/80 border border-border backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors z-10 shadow-lg"
            >
              <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-9 h-9 rounded-full bg-card/80 border border-border backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors z-10 shadow-lg"
            >
              <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* Popup Modal */}
      {selectedCollection && (
        <CollectionPopup collection={selectedCollection} onClose={() => setSelectedCollection(null)} />
      )}
    </section>
  );
}
