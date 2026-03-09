import { useState } from 'react';
import { Clock, Grid3X3, Check } from 'lucide-react';
import { useAllManga, MangaWithChapters } from '@/hooks/useAllManga';
import LatestCard from '@/components/LatestCard';

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

export default function Latest() {
  const { data: allManga = [] } = useAllManga();
  const [activeTab, setActiveTab] = useState<string>('All Series');

  const filtered = allManga
    .filter(m => {
      if (activeTab === 'All Series') return true;
      return m.type === activeTab;
    })
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Latest Updates</h1>
        </div>
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
              <span>{TAB_LABELS[tab]}</span>
              {activeTab === tab && <Check className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(manga => (
          <LatestCard key={manga.id} manga={manga} />
        ))}
      </div>
    </div>
  );
}
