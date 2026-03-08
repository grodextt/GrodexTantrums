import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFeaturedManga } from '@/data/mockManga';

export default function EditorChoice() {
  const featured = getFeaturedManga();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((i) => (i + 1) % featured.length), [featured.length]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + featured.length) % featured.length), [featured.length]);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  if (!featured.length) return null;
  const manga = featured[current];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-primary h-[40px] w-[40px]" />
        <h2 className="font-bold text-4xl">Editor's Choice</h2>
      </div>

      <div className="relative rounded-xl bg-card border border-border/40 md:pr-[660px]">
        {/* Floating Cover */}
        <div className="hidden md:block absolute right-6 -top-8 w-[620px] h-[440px] rounded-2xl overflow-hidden border border-border/40 shadow-xl z-10">
          <img
            src={manga.banner || manga.cover}
            alt={manga.title}
            className="w-full h-full object-cover"
          />
          <Link
            to={`/manga/${manga.slug}`}
            className="absolute bottom-4 right-4">
            <Button size="sm" className="gap-2 rounded-full bg-background/80 backdrop-blur text-foreground hover:bg-background/90">
              <Play className="w-3.5 h-3.5 fill-current" />
              Start Reading
            </Button>
          </Link>
        </div>

        <div className="flex flex-col">
          {/* Mobile Cover */}
          <div className="relative w-full h-[250px] md:hidden">
            <img
              src={manga.banner || manga.cover}
              alt={manga.title}
              className="w-full h-full object-cover rounded-t-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            <Link
              to={`/manga/${manga.slug}`}
              className="absolute bottom-4 right-4">
              <Button size="sm" className="gap-2 rounded-full bg-background/80 backdrop-blur text-foreground hover:bg-background/90">
                <Play className="w-3.5 h-3.5 fill-current" />
                Start Reading
              </Button>
            </Link>
          </div>

          {/* Info */}
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 truncate">{manga.title}</h3>
            <p className="text-base md:text-lg text-muted-foreground line-clamp-3 mb-4 max-w-lg">{manga.description}</p>

            {/* Cover Slider */}
            <div className="relative group/slider mb-3">
              <button onClick={prev} className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border/60 flex items-center justify-center hover:bg-background transition-colors shadow-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="overflow-hidden rounded-xl mx-6">
                <div
                  className="flex gap-2 transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${current * 140}px)` }}>
                  {featured.map((m, i) =>
                  <button
                    key={m.id}
                    onClick={() => setCurrent(i)}
                    className={`shrink-0 w-[130px] h-[180px] rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                    i === current ? 'border-primary scale-105 shadow-lg shadow-primary/20' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                    <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                  </button>
                  )}
                </div>
              </div>
              <button onClick={next} className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 backdrop-blur border border-border/60 flex items-center justify-center hover:bg-background transition-colors shadow-lg">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5 bg-muted/50 rounded-full px-4 py-2 w-fit mx-auto">
              {featured.map((_, i) =>
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${i === current ? 'bg-primary scale-110' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
