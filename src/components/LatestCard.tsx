import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { Manga } from '@/data/mockManga';
import TypeBadge from './TypeBadge';

export default function LatestCard({ manga }: { manga: Manga }) {
  const allChapters = manga.chapters.slice(0, 4);
  const premiumChapters = allChapters.slice(0, 2);
  const freeChapters = allChapters.slice(2, 4);

  return (
    <div className="flex gap-3 pr-3 rounded-lg border border-border/40 bg-card/60 hover:bg-card/80 transition-colors group overflow-hidden">
      <Link to={`/manga/${manga.slug}`} className="shrink-0 self-stretch">
        <div className="relative w-[140px] h-full overflow-hidden">
          <img
            src={manga.cover}
            alt={manga.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-1 left-1">
            <TypeBadge type={manga.type} />
          </div>
        </div>
      </Link>
      <div className="flex-1 min-w-0 flex flex-col py-3 overflow-hidden">
        <Link to={`/manga/${manga.slug}`}>
          <h3 className="font-bold text-base text-foreground line-clamp-2 hover:text-primary transition-colors">
            {manga.title}
          </h3>
        </Link>

        <div className="mt-2">
          {premiumChapters.map((ch, idx) => (
            <Link
              key={ch.id}
              to={`/manga/${manga.slug}/chapter/${ch.number}`}
              className={`flex items-center justify-between text-xs py-2 hover:text-primary transition-colors ${
                idx < premiumChapters.length - 1 ? 'border-b border-border/30' : ''
              }`}
            >
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-primary truncate">
                <span className="truncate">Ch. {ch.number}</span>
                <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                {idx === 0 && (
                  <span className="shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                  </span>
                )}
              </span>
              <span className="text-muted-foreground/50 text-[11px] shrink-0 ml-2">{ch.date}</span>
            </Link>
          ))}
        </div>

        {freeChapters.length > 0 && (
          <div className="border-t border-muted-foreground/30 my-0.5" />
        )}

        <div>
          {freeChapters.map((ch, idx) => (
            <Link
              key={ch.id}
              to={`/manga/${manga.slug}/chapter/${ch.number}`}
              className={`flex items-center justify-between text-xs py-2 hover:text-primary transition-colors ${
                idx < freeChapters.length - 1 ? 'border-b border-border/30' : ''
              }`}
            >
              <span className="text-muted-foreground hover:text-primary truncate">
                Chapter {ch.number}
              </span>
              <span className="text-muted-foreground/50 text-[11px] shrink-0 ml-2">{ch.date}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
