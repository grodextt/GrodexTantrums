import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useAllManga, MangaWithChapters } from '@/hooks/useAllManga';
import LatestCard from './LatestCard';

const FILTER_TABS = ['All Series', 'manga', 'manhwa', 'manhua'] as const;

const TAB_ICONS: Record<string, React.ReactNode> = {
  'All Series': <Icon icon="ph:squares-four-bold" className="w-4 h-4" />,
  'manga': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0 overflow-hidden"><Icon icon="emojione:flag-for-japan" className="w-3.5 h-3.5" /></span>,
  'manhwa': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0 overflow-hidden"><Icon icon="emojione:flag-for-south-korea" className="w-3.5 h-3.5" /></span>,
  'manhua': <span className="w-5 h-5 rounded-full bg-muted/50 flex items-center justify-center text-[10px] shrink-0 overflow-hidden"><Icon icon="emojione:flag-for-china" className="w-3.5 h-3.5" /></span>,
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
  const [sortMode, setSortMode] = useState<'recent' | 'number'>(() => {
    if (typeof window === 'undefined') return 'recent';
    return (localStorage.getItem('latest-updates-sort') as 'recent' | 'number') || 'recent';
  });

  useEffect(() => {
    try { localStorage.setItem('latest-updates-sort', sortMode); } catch {}
  }, [sortMode]);

  const getLatestChapterDate = (m: MangaWithChapters) => {
    const chapters = m.chapters || [];
    if (chapters.length === 0) return 0;
    return Math.max(...chapters.map(ch => new Date(ch.created_at).getTime()));
  };

  const filtered = allManga
    .filter(m => {
      if (activeTab === 'All Series') return true;
      return m.type === activeTab;
    })
    .sort((a, b) => getLatestChapterDate(b) - getLatestChapterDate(a));

  return (
    <section>
      <div className="mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold whitespace-nowrap">Latest Updates</h2>
          <div className="flex items-center gap-2 shrink-0">
            <div
              role="group"
              aria-label="Sort chapters"
              className="inline-flex items-center bg-secondary/60 rounded-lg p-0.5 border border-border/40"
            >
              <button
                type="button"
                onClick={() => setSortMode('recent')}
                aria-pressed={sortMode === 'recent'}
                title="Sort by upload time"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                  sortMode === 'recent'
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon="ph:clock-bold" className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSortMode('number')}
                aria-pressed={sortMode === 'number'}
                title="Sort by chapter number"
                className={`inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                  sortMode === 'number'
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon icon="ph:list-numbers-bold" className="w-4 h-4" />
              </button>
            </div>
            <Link to="/latest" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              View all &gt;
            </Link>
          </div>
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
              {activeTab === tab && <Icon icon="ph:check-bold" className="w-3.5 h-3.5 ml-0.5" />}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-secondary rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {filtered.slice(0, 16).map(manga => (
            <LatestCard key={manga.id} manga={manga} sortMode={sortMode} />
          ))}
        </div>
      )}
    </section>
  );
}
