import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useCollections, useCollectionSeries } from '@/hooks/useCollections';
import { useAllManga } from '@/hooks/useAllManga';
import { optimizedImageUrl } from '@/lib/utils';
import TypeBadge from './TypeBadge';

/* ─── Popup Modal ─────────────────────────────────────────────────── */
function CollectionPopup({ collection, onClose }: { collection: any; onClose: () => void }) {
  const { data: series = [], isLoading } = useCollectionSeries(collection.genres);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
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

        {collection.description && (
          <p className="px-5 py-3 text-sm text-muted-foreground border-b border-border/50">
            {collection.description}
          </p>
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
                <Link key={m.id} to={`/manga/${m.slug}`} className="group block" onClick={onClose}>
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
                  <p className="text-xs font-semibold mt-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                    {m.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Fan Cover Layout ────────────────────────────────────────────── */
// Positions for 5 covers in a fanned/spread diagonal layout
const FAN_POSITIONS = [
  { rotate: -14, translateX: -72, translateY: 24, zIndex: 1, scale: 0.82 },
  { rotate: -7,  translateX: -36, translateY: 10, zIndex: 2, scale: 0.90 },
  { rotate:  0,  translateX:   0, translateY:  0, zIndex: 3, scale: 1.00 },
  { rotate:  7,  translateX:  36, translateY: 10, zIndex: 2, scale: 0.90 },
  { rotate:  14, translateX:  72, translateY: 24, zIndex: 1, scale: 0.82 },
];

function CoverFan({ covers }: { covers: { id: string; cover_url: string; title: string }[] }) {
  const shown = covers.slice(0, 5);
  // If fewer than 5, center them
  const offset = Math.floor((5 - shown.length) / 2);

  return (
    <div className="relative h-[148px] w-full flex items-end justify-center overflow-visible mt-2">
      {shown.map((m, i) => {
        const pos = FAN_POSITIONS[i + offset] ?? FAN_POSITIONS[2];
        return (
          <div
            key={m.id}
            className="absolute bottom-0 w-[76px] h-[108px] rounded-xl overflow-hidden shadow-xl border border-white/10 transition-transform duration-300 hover:scale-105"
            style={{
              transform: `translateX(${pos.translateX}px) translateY(${pos.translateY}px) rotate(${pos.rotate}deg) scale(${pos.scale})`,
              zIndex: pos.zIndex,
            }}
          >
            <img
              src={optimizedImageUrl(m.cover_url, 160)}
              alt={m.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Collection Card ─────────────────────────────────────────────── */
function CollectionCard({
  collection,
  allManga,
  onClick,
}: {
  collection: any;
  allManga: any[];
  onClick: () => void;
}) {
  const matchingManga = allManga.filter(m =>
    m.genres?.some((g: string) => collection.genres.includes(g))
  );

  return (
    <button
      onClick={onClick}
      className="
        flex-shrink-0 w-[260px] sm:w-[280px] lg:w-[300px]
        bg-card border border-border/60 rounded-2xl
        overflow-visible
        hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1
        transition-all duration-300 text-left group
        flex flex-col
      "
      style={{ minHeight: 320 }}
    >
      {/* Top Info Section */}
      <div className="p-5 flex flex-col gap-2.5 flex-1">
        {/* Icon + Title */}
        <div className="flex items-center gap-2.5">
          <span className="text-xl leading-none shrink-0">{collection.icon}</span>
          <h3 className="font-extrabold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {collection.title}
          </h3>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Genre Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(collection.genres || []).slice(0, 3).map((g: string) => (
            <span
              key={g}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-secondary text-muted-foreground border border-border/60"
            >
              {g}
            </span>
          ))}
        </div>

        {/* Series Count */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold mt-auto pt-1">
          <Icon icon="ph:books-bold" className="w-3.5 h-3.5 text-primary/70" />
          <span>{matchingManga.length}</span>
        </div>
      </div>

      {/* Cover Fan */}
      <div className="px-4 pb-5 overflow-visible">
        <CoverFan covers={matchingManga.slice(0, 5)} />
      </div>
    </button>
  );
}

/* ─── Main Section ────────────────────────────────────────────────── */
export default function Collections() {
  const { data: collections = [], isLoading } = useCollections();
  const { data: allManga = [] } = useAllManga();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const SCROLL_AMT = 320;

  const scrollLeft = useCallback(() => {
    scrollRef.current?.scrollBy({ left: -SCROLL_AMT, behavior: 'smooth' });
  }, []);
  const scrollRight = useCallback(() => {
    scrollRef.current?.scrollBy({ left: SCROLL_AMT, behavior: 'smooth' });
  }, []);

  if (isLoading || collections.length === 0) return null;

  return (
    <section className="relative">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2">
          Collections
        </h2>
        <Link
          to="/series"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
        >
          View all <Icon icon="ph:caret-right-bold" className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Scroll Container with side arrows */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          aria-label="Scroll left"
          className="
            absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4
            z-20 w-9 h-9 rounded-full
            bg-card border border-border shadow-lg backdrop-blur-sm
            flex items-center justify-center
            hover:bg-primary hover:text-primary-foreground hover:border-primary
            transition-all duration-200
          "
        >
          <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          aria-label="Scroll right"
          className="
            absolute right-0 top-1/2 -translate-y-1/2 translate-x-4
            z-20 w-9 h-9 rounded-full
            bg-card border border-border shadow-lg backdrop-blur-sm
            flex items-center justify-center
            hover:bg-primary hover:text-primary-foreground hover:border-primary
            transition-all duration-200
          "
        >
          <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
        </button>

        {/* Cards Track */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {collections.map(c => (
            <div key={c.id} style={{ scrollSnapAlign: 'start' }}>
              <CollectionCard
                collection={c}
                allManga={allManga}
                onClick={() => setSelectedCollection(c)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Popup Modal */}
      {selectedCollection && (
        <CollectionPopup
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
        />
      )}
    </section>
  );
}
