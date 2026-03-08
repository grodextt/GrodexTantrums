import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Award, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFeaturedManga } from '@/data/mockManga';

export default function EditorChoice() {
  const featured = getFeaturedManga();
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(i => (i + 1) % featured.length), [featured.length]);
  const prev = useCallback(() => setCurrent(i => (i - 1 + featured.length) % featured.length), [featured.length]);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  if (!featured.length) return null;
  const manga = featured[current];

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold">Editor's Choice</h2>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-card border border-border/40">
        <div className="flex flex-col md:flex-row">
          {/* Left - Info */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{manga.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-5 max-w-lg">{manga.description}</p>

            {/* Small covers row */}
            <div className="flex gap-2 mb-5">
              {featured.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setCurrent(i)}
                  className={`w-12 h-16 rounded overflow-hidden border-2 transition-all ${
                    i === current ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={prev} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={next} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots */}
              <div className="flex gap-1.5 ml-2">
                {featured.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right - Cover */}
          <div className="relative w-full md:w-[340px] h-[250px] md:h-auto shrink-0">
            <img
              src={manga.banner || manga.cover}
              alt={manga.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/30 to-transparent hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent md:hidden" />
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
      </div>
    </section>
  );
}
