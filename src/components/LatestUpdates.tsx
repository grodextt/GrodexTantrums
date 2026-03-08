import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid3X3, Check, Crown } from 'lucide-react';
import { mockManga, Manga } from '@/data/mockManga';
import TypeBadge from './TypeBadge';

const FILTER_TABS = ['All Series', 'Manga', 'Manhwa', 'Manhua'] as const;

const TAB_ICONS: Record<string, React.ReactNode> = {
  'All Series': <Grid3X3 className="w-3.5 h-3.5" />,
  'Manga': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0">🇯🇵</span>,
  'Manhwa': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0">🇰🇷</span>,
  'Manhua': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0">🇨🇳</span>,
};

export default function LatestUpdates() {
  const [activeTab, setActiveTab] = useState<string>('All Series');

  const filtered = mockManga
    .filter(m => {
      if (activeTab === 'All Series') return true;
      return m.type === activeTab;
    })
    .sort((a, b) => b.chapters.length - a.chapters.length);

  return (
    <section>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-extrabold whitespace-nowrap">Latest Updates</h2>
          <div className="bg-secondary/60 rounded-full px-1 py-1 flex items-center gap-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {TAB_ICONS[tab]}
                <span>{tab}</span>
                {activeTab === tab && <Check className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            ))}
          </div>
        </div>
        <Link to="/latest" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0">
          View all &gt;
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(manga => (
          <LatestCard key={manga.id} manga={manga} />
        ))}
      </div>
    </section>
  );
}

function LatestCard({ manga }: { manga: Manga }) {
  const allChapters = manga.chapters.slice(0, 4);
  const premiumChapters = allChapters.slice(0, 2);
  const freeChapters = allChapters.slice(2, 4);

  return (
    <div className="flex gap-3 pr-3 rounded-lg border border-border/40 bg-card/60 hover:bg-card/80 transition-colors group overflow-hidden">
      <Link to={`/manga/${manga.slug}`} className="shrink-0">
        <div className="relative w-[120px] self-stretch overflow-hidden">
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
      <div className="flex-1 min-w-0 flex flex-col py-3">
        <Link to={`/manga/${manga.slug}`}>
          <h3 className="font-bold text-base text-foreground line-clamp-2 hover:text-primary transition-colors">
            {manga.title}
          </h3>
        </Link>

        {/* Premium chapters */}
        <div className="mt-2">
          {premiumChapters.map((ch, idx) => (
            <Link
              key={ch.id}
              to={`/manga/${manga.slug}/chapter/${ch.number}`}
              className={`flex items-center justify-between text-xs py-1.5 hover:text-primary transition-colors ${
                idx < premiumChapters.length - 1 || freeChapters.length > 0 ? 'border-b border-border/30' : ''
              }`}
            >
              <span className="flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                <Crown className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                Chapter {ch.number}
                {idx === 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold">NEW</span>
                )}
              </span>
              <span className="text-muted-foreground/50 text-[11px]">{ch.date}</span>
            </Link>
          ))}
        </div>

        {/* Free chapters */}
        <div>
          {freeChapters.map((ch, idx) => (
            <Link
              key={ch.id}
              to={`/manga/${manga.slug}/chapter/${ch.number}`}
              className={`flex items-center justify-between text-xs py-1.5 hover:text-primary transition-colors ${
                idx < freeChapters.length - 1 ? 'border-b border-border/30' : ''
              }`}
            >
              <span className="text-muted-foreground hover:text-primary">
                Chapter {ch.number}
              </span>
              <span className="text-muted-foreground/50 text-[11px]">{ch.date}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
