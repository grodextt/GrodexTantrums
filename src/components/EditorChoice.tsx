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

      <div className="relative rounded-xl bg-card border border-border/40 overflow-visible">
        <div className="flex flex-col md:flex-row items-center">
          {/* Left - Info */}
          <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{manga.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-5 max-w-lg">{manga.description}</p>

            {/* Covers row with side arrows */}
            <div className="flex items-center gap-3 mb-5">
              <button onClick={prev} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex gap-2">
                {featured.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => setCurrent(i)}
                    className={`w-28 h-40 rounded-lg overflow-hidden border-2 transition-all ${
                      i === current ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={m.cover} alt={m.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <button onClick={next} className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-1.5">
              {featured.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`}
                />
              ))}
            </div>
          </div>

          {/* Right - Floating Cover */}
          <div className="relative w-full md:w-[300px] h-[350px] shrink-0 md:-my-8 md:mr-8">
            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-border/30">
              <img
                src={manga.cover}
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
        </div>
      </div>
    </section>
  );
}
