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

      <div className="relative rounded-xl bg-card border border-border/40 md:pr-[460px]">
        {/* Floating Cover */}
        <div className="hidden md:block absolute right-6 -top-6 w-[420px] h-[400px] rounded-2xl overflow-hidden border border-border/40 shadow-xl z-10">
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
            <p className="text-base md:text-lg text-muted-foreground line-clamp-4 mb-4 max-w-lg">{manga.description}</p>

            {/* Thumbnails with flanking arrows */}
            <div className="flex items-center gap-3 mb-3">
              <button onClick={prev} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex gap-3">
                {featured.map((m, i) =>
                <button
                  key={m.id}
                  onClick={() => setCurrent(i)}
                  className={`w-28 h-44 rounded-lg overflow-hidden border-2 transition-all ${
                  i === current ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`
                  }>
                    <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                  </button>
                )}
              </div>
              <button onClick={next} className="w-11 h-11 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2">
              {featured.map((_, i) =>
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'bg-primary w-5' : 'bg-muted-foreground/30 w-2'}`} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
