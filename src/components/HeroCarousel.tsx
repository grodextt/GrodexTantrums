import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useAllManga } from '@/hooks/useAllManga';
import TypeBadge from './TypeBadge';

const statusColors: Record<string, string> = {
  ongoing: 'bg-green-400',
  hiatus: 'bg-yellow-600',
  season_end: 'bg-sky-400',
  completed: 'bg-green-700',
  cancelled: 'bg-red-400',
};

const statusTextColors: Record<string, string> = {
  ongoing: 'text-green-400',
  hiatus: 'text-yellow-600',
  season_end: 'text-sky-400',
  completed: 'text-green-700',
  cancelled: 'text-red-400',
};

export default function HeroCarousel() {
  const { data: allManga = [] } = useAllManga();
  const items = allManga.filter(m => m.featured || m.pinned || m.trending).slice(0, 8);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    slidesToScroll: 1,
    dragFree: false,
  });

  const [autoplayPaused, setAutoplayPaused] = useState(false);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Autoplay
  useEffect(() => {
    if (!emblaApi) return;
    const timer = setInterval(() => {
      if (!autoplayPaused) emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(timer);
  }, [emblaApi, autoplayPaused]);

  if (!items.length) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setAutoplayPaused(true)}
      onMouseLeave={() => setAutoplayPaused(false)}
    >
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex">
          {items.map(manga => (
            <div
              key={manga.id}
              className="flex-[0_0_85%] sm:flex-[0_0_40%] lg:flex-[0_0_28%] min-w-0 px-2"
            >
              <Link
                to={`/manga/${manga.slug}`}
                className="relative block rounded-xl overflow-hidden group"
              >
                <div className="relative h-[500px] md:h-[550px]">
                  <img
                    src={manga.cover_url}
                    alt={manga.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Type Badge */}
                  <div className="absolute top-3 left-3 z-10">
                    <TypeBadge type={manga.type} />
                  </div>

                  {/* Bottom Gradient */}
                  <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                  {/* Bottom Content */}
                  <div className="absolute inset-x-0 bottom-0 p-4 space-y-1.5">
                    {manga.alt_titles?.[0] && (
                      <p className="text-[11px] text-white/50 truncate">{manga.alt_titles[0]}</p>
                    )}
                    <h3 className="text-lg font-bold text-white line-clamp-1">{manga.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full animate-[blink_1.5s_ease-in-out_infinite] ${statusColors[manga.status] || 'bg-gray-400'}`} />
                      <span className={`text-xs font-semibold capitalize ${statusTextColors[manga.status] || 'text-gray-400'}`}>
                        {manga.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">{manga.description}</p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Edge fading overlays */}
      <div className="absolute inset-y-0 left-0 w-24 sm:w-32 lg:w-44 bg-gradient-to-r from-background via-background/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 sm:w-32 lg:w-44 bg-gradient-to-l from-background via-background/60 to-transparent z-10 pointer-events-none" />

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/60 hover:bg-card backdrop-blur-sm flex items-center justify-center transition-colors z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/60 hover:bg-card backdrop-blur-sm flex items-center justify-center transition-colors z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
