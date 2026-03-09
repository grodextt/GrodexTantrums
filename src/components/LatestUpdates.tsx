import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Grid3X3, Check } from 'lucide-react';
import { useAllManga } from '@/hooks/useAllManga';
import LatestCard from './LatestCard';

const FILTER_TABS = ['All Series', 'manga', 'manhwa', 'manhua'] as const;

const TAB_ICONS: Record<string, React.ReactNode> = {
  'All Series': <Grid3X3 className="w-3.5 h-3.5" />,
  'manga': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0">🇯🇵</span>,
  'manhwa': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0">🇰🇷</span>,
  'manhua': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0">🇨🇳</span>,
};

const TAB_LABELS: Record<string, string> = {
  'All Series': 'All Series',
  'manga': 'Manga',
  'manhwa': 'Manhwa',
  'manhua': 'Manhua',
};

export default function LatestUpdates() {
  const { data: allManga = [], isLoading } = useAllManga();
  const [activeTab, setActiveTab] = useState<string>('All Series');

  const filtered = allManga
    .filter(m => {
      if (activeTab === 'All Series') return true;
      return m.type === activeTab;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <section>
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold whitespace-nowrap">Latest Updates</h2>
          <Link to="/latest" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground shrink-0">
            View all &gt;
          </Link>
        </div>
        <div className="bg-secondary/60 rounded-2xl px-1 py-1 grid grid-cols-2 sm:flex sm:items-center gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === tab
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {TAB_ICONS[tab]}
              <span>{TAB_LABELS[tab]}</span>
              {activeTab === tab && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.slice(0, 12).map(manga => (
            <LatestCard key={manga.id} manga={manga} />
          ))}
        </div>
      )}
    </section>
  );
}
