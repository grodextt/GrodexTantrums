import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeaturedManga } from '@/hooks/useFeaturedManga';

export default function EditorChoice() {
  const { data: featured = [], isLoading } = useFeaturedManga();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((i) => (i + 1) % Math.max(featured.length, 1)), [featured.length]);
  const prev = useCallback(() => setCurrent((i) => (i - 1 + Math.max(featured.length, 1)) % Math.max(featured.length, 1)), [featured.length]);

  useEffect(() => {
    if (featured.length > 0) {
      const t = setInterval(next, 7000);
      return () => clearInterval(t);
    }
  }, [next, featured.length]);

  if (isLoading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Award className="text-primary h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
          <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl">Editor's Choice</h2>
        </div>
        <div className="relative rounded-xl bg-card border border-border/40 overflow-hidden min-h-[350px] animate-pulse" />
      </section>
    );
  }

  if (!featured.length) return null;
  
  const manga = featured[current];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Award className="text-primary h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
        <h2 className="font-bold text-2xl sm:text-3xl md:text-4xl">Editor's Choice</h2>
      </div>

      <div className="relative rounded-xl bg-card border border-border/40 overflow-visible">
        <div className="flex flex-col md:flex-row md:min-h-[350px]">
          {/* Left - Info */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 flex flex-col justify-center min-w-0">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3">{manga.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 sm:mb-5 max-w-lg">{manga.description}</p>

            {/* Covers row */}
            <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto scrollbar-hide pb-1">
              {featured.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setCurrent(i)}
                  className={`w-20 h-28 sm:w-24 sm:h-32 md:w-28 md:h-40 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    i === current ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Arrows + Dots row */}
            <div className="flex items-center gap-3">
              <button onClick={prev} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button onClick={next} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-1.5 ml-2">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-muted-foreground/30 w-1.5'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right - Floating Cover */}
          <div className="hidden md:block relative md:w-[45%] shrink-0 self-stretch">
            <div className="absolute -top-10 -right-2 -bottom-4 -left-2 rounded-2xl overflow-hidden shadow-2xl border border-border/30">
              <img
                src={manga.cover_url}
                alt={manga.title}
                className="w-full h-full object-cover"
              />
              <Link
                to={`/manga/${manga.slug}`}
                className="absolute bottom-4 right-4"
              >
                <Button size="sm" className="gap-2 rounded-lg">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Reading
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Cover */}
          <div className="md:hidden relative w-full h-[200px] sm:h-[250px]">
            <div className="relative w-full h-full rounded-b-xl overflow-hidden">
              <img src={manga.cover_url} alt={manga.title} className="w-full h-full object-cover" />
              <Link to={`/manga/${manga.slug}`} className="absolute bottom-4 right-4">
                <Button size="sm" className="gap-2 rounded-lg">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Start Reading
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
