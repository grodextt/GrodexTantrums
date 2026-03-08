import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { mockManga, Manga } from '@/data/mockManga';
import TypeBadge from './TypeBadge';

const FILTER_TABS = ['All Series', 'Free Series', 'Action', 'Romance'] as const;

export default function LatestUpdates() {
  const [activeTab, setActiveTab] = useState<string>('All Series');

  const filtered = mockManga
    .filter(m => {
      if (activeTab === 'All Series' || activeTab === 'Free Series') return true;
      return m.genres.includes(activeTab);
    })
    .sort((a, b) => b.chapters.length - a.chapters.length);

  // Create a 3-column grid of manga with chapter lists
  const rows: Manga[][] = [];
  for (let i = 0; i < filtered.length; i += 3) {
    rows.push(filtered.slice(i, i + 3));
  }

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Latest Updates</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              }`}
            >
              {tab === 'All Series' && '✓ '}{tab}
            </button>
          ))}
          <Link to="/latest" className="flex items-center gap-1 text-sm text-primary hover:underline ml-2">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="space-y-0">
        {rows.map((row, ri) => (
          <div key={ri} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 border-t border-border/40">
            {row.map(manga => (
              <LatestCard key={manga.id} manga={manga} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function LatestCard({ manga }: { manga: Manga }) {
  const recentChapters = manga.chapters.slice(0, 3);

  return (
    <div className="flex gap-3 p-3 border-b border-r border-border/30 hover:bg-card/60 transition-colors group">
      <Link to={`/manga/${manga.slug}`} className="shrink-0">
        <div className="relative w-[70px] h-[95px] rounded-md overflow-hidden">
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
      <div className="flex-1 min-w-0">
        <Link to={`/manga/${manga.slug}`}>
          <h3 className="font-semibold text-sm text-foreground line-clamp-1 hover:text-primary transition-colors">
            {manga.title}
          </h3>
        </Link>
        <div className="mt-1.5 space-y-1">
          {recentChapters.map(ch => (
            <Link
              key={ch.id}
              to={`/manga/${manga.slug}/chapter/${ch.number}`}
              className="flex items-center justify-between text-xs hover:text-primary transition-colors"
            >
              <span className="text-muted-foreground hover:text-primary">
                Chapter {ch.number}
                {ch.number === manga.chapters[0]?.number && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] font-medium">NEW</span>
                )}
              </span>
              <span className="text-muted-foreground/50 text-[11px]">{ch.date}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
