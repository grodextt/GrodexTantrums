import { useState, useMemo } from 'react';
import { BookOpen, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MangaCard from '@/components/MangaCard';
import { useAllManga } from '@/hooks/useAllManga';

const allGenres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Isekai',
  'Magic', 'Martial Arts', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Thriller', 'Cyberpunk'
];

const allTypes = ['manga', 'manhwa', 'manhua'] as const;
const statuses = ['ongoing', 'completed', 'hiatus'] as const;

type MangaType = typeof allTypes[number];
type MangaStatus = typeof statuses[number];

export default function Series() {
  const { data: allManga = [] } = useAllManga();
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<MangaType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<MangaStatus | ''>('');

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const filtered = useMemo(() => {
    return allManga.filter(m => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedType && m.type !== selectedType) return false;
      if (selectedStatus && m.status !== selectedStatus) return false;
      if (selectedGenres.length > 0 && !selectedGenres.some(g => m.genres?.includes(g))) return false;
      return true;
    });
  }, [search, selectedType, selectedStatus, selectedGenres, allManga]);

  const hasFilters = search || selectedType || selectedStatus || selectedGenres.length > 0;

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Series</h1>
      </div>

      {/* Filters */}
      <div className="space-y-4 p-4 rounded-xl bg-card border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search series..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Type</p>
          <div className="flex gap-2 flex-wrap">
            {allTypes.map(t => (
              <Button
                key={t}
                size="sm"
                variant={selectedType === t ? 'default' : 'secondary'}
                onClick={() => setSelectedType(selectedType === t ? '' : t)}
                className="text-xs h-7 capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Status</p>
          <div className="flex gap-2 flex-wrap">
            {statuses.map(s => (
              <Button
                key={s}
                size="sm"
                variant={selectedStatus === s ? 'default' : 'secondary'}
                onClick={() => setSelectedStatus(selectedStatus === s ? '' : s)}
                className="text-xs h-7 capitalize"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Genres</p>
          <div className="flex gap-2 flex-wrap">
            {allGenres.map(g => (
              <Button
                key={g}
                size="sm"
                variant={selectedGenres.includes(g) ? 'default' : 'secondary'}
                onClick={() => toggleGenre(g)}
                className="text-xs h-7"
              >
                {g}
              </Button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 h-7 text-xs"
            onClick={() => {
              setSearch('');
              setSelectedGenres([]);
              setSelectedType('');
              setSelectedStatus('');
            }}
          >
            <X className="w-3 h-3" /> Clear Filters
          </Button>
        )}
      </div>

      {/* Results */}
      <div>
        <p className="text-sm text-muted-foreground mb-4">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filtered.map(m => (
            <MangaCard key={m.id} manga={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
