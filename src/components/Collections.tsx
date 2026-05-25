import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useCollections, useCollectionSeries } from '@/hooks/useCollections';
import { useAllManga } from '@/hooks/useAllManga';
import { optimizedImageUrl } from '@/lib/utils';
import TypeBadge from './TypeBadge';

/* ─── Popup Modal ────────────────────────────────────────────────── */
function CollectionPopup({ collection, onClose }: { collection: any; onClose: () => void }) {
  const { data: series = [], isLoading } = useCollectionSeries(collection.genres);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
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
              <Button variant="outline" size="sm" className="rounded-lg text-xs gap-1.5">View All</Button>
            </Link>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <Icon icon="ph:x-bold" className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
        {collection.description && (
          <p className="px-5 py-3 text-sm text-muted-foreground border-b border-border/50">{collection.description}</p>
        )}
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
                    <img src={optimizedImageUrl(m.cover_url, 200)} alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                    <div className="absolute top-1.5 left-1.5"><TypeBadge type={m.type} /></div>
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

/* ─── Fan Cover Spread ───────────────────────────────────────────── */
// 5 slots: fan spreads from left-leaning to right-leaning
// Mimics the Kayn Scan diagonal book-spread look
const FAN = [
  { deg: -18, tx: -84, ty: 28, z: 1, s: 0.80 },
  { deg:  -9, tx: -42, ty: 12, z: 2, s: 0.90 },
  { deg:   0, tx:   0, ty:  0, z: 5, s: 1.00 },  // center – front
  { deg:   9, tx:  42, ty: 12, z: 2, s: 0.90 },
  { deg:  18, tx:  84, ty: 28, z: 1, s: 0.80 },
];

function CoverFan({ covers }: { covers: { id: string; cover_url: string; title: string }[] }) {
  const shown = covers.slice(0, 5);
  const startSlot = Math.floor((5 - shown.length) / 2);

  return (
    /* Container: tall enough so rotated corners don't clip, overflow visible */
    <div
      className="relative w-full"
      style={{ height: 160 }}
    >
      {shown.map((m, i) => {
        const slot = FAN[startSlot + i] ?? FAN[2];
        return (
          <div
            key={m.id}
            className="absolute rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl"
            style={{
              width:  88,
              height: 124,
              bottom: 0,
              left:   '50%',
              marginLeft: -44,          // half of width → centre pivot
              transform: `translateX(${slot.tx}px) translateY(${slot.ty}px) rotate(${slot.deg}deg) scale(${slot.s})`,
              transformOrigin: 'bottom center',
              zIndex: slot.z,
            }}
          >
            <img
              src={optimizedImageUrl(m.cover_url, 180)}
              alt={m.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          </div>
        );
      })}
    </div>
  );
}

/* ─── Collection Card ────────────────────────────────────────────── */
function CollectionCard({
  collection,
  allManga,
  onClick,
}: {
  collection: any;
  allManga: any[];
  onClick: () => void;
}) {
  const matchingManga = allManga
    .filter(m => m.genres?.some((g: string) => collection.genres.includes(g)));

  return (
    <button
      onClick={onClick}
      className="
        flex-shrink-0
        flex flex-col
        bg-card border border-border/50
        rounded-2xl overflow-hidden
        hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1
        transition-all duration-300 text-left group
        cursor-pointer
      "
      /* Fixed width: show ~5 on a 1440p screen, ~4 on 1080p */
      style={{ width: 260 }}
    >
      {/* ── Top: Info ─────────────────────── */}
      <div className="flex flex-col gap-2 px-4 pt-4 pb-2">
        {/* Icon + Title */}
        <div className="flex items-center gap-2">
          <span className="text-base leading-none shrink-0">{collection.icon}</span>
          <h3 className="font-extrabold text-[15px] leading-snug line-clamp-1 group-hover:text-primary transition-colors">
            {collection.title}
          </h3>
        </div>

        {/* Description */}
        {collection.description && (
          <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
            {collection.description}
          </p>
        )}

        {/* Genre tags */}
        <div className="flex flex-wrap gap-1">
          {(collection.genres ?? []).slice(0, 3).map((g: string) => (
            <span key={g}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border/50">
              {g}
            </span>
          ))}
        </div>

        {/* Series count */}
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
          <Icon icon="ph:books-bold" className="w-3 h-3 text-primary/70" />
          <span>{matchingManga.length}</span>
        </div>
      </div>

      {/* ── Bottom: Cover Fan ─────────────── */}
      <div className="px-3 pb-4 mt-auto overflow-visible">
        <CoverFan covers={matchingManga} />
      </div>
    </button>
  );
}

/* ─── Main Section ───────────────────────────────────────────────── */
export default function Collections() {
  const { data: collections = [], isLoading } = useCollections();
  const { data: allManga = [] } = useAllManga();
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = useCallback((dir: 1 | -1) => {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: 'smooth' });
  }, []);

  if (isLoading || collections.length === 0) return null;

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">Collections</h2>
        <Link to="/series"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
          View all <Icon icon="ph:caret-right-bold" className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Scroll track + arrows */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          aria-label="Scroll left"
          className="
            absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5
            z-20 w-9 h-9 rounded-full
            bg-card border border-border shadow-lg
            flex items-center justify-center
            hover:bg-primary hover:text-primary-foreground hover:border-primary
            transition-all duration-200
          "
        >
          <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          aria-label="Scroll right"
          className="
            absolute right-0 top-1/2 -translate-y-1/2 translate-x-5
            z-20 w-9 h-9 rounded-full
            bg-card border border-border shadow-lg
            flex items-center justify-center
            hover:bg-primary hover:text-primary-foreground hover:border-primary
            transition-all duration-200
          "
        >
          <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
        </button>

        {/* Cards */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide"
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

      {selectedCollection && (
        <CollectionPopup collection={selectedCollection} onClose={() => setSelectedCollection(null)} />
      )}
    </section>
  );
}
