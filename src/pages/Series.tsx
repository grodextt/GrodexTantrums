import { useState, useMemo } from 'react';
import { BookOpen, Search, X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import MangaCard from '@/components/MangaCard';
import { useAllManga } from '@/hooks/useAllManga';

const allGenres = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Isekai',
  'Magic', 'Martial Arts', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Thriller', 'Cyberpunk'
];

const allTypes = ['manga', 'manhwa', 'manhua'] as const;
const statuses = ['ongoing', 'completed', 'hiatus', 'season_end', 'cancelled'] as const;

const statusLabels: Record<string, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'Hiatus',
  season_end: 'Season End',
  cancelled: 'Cancelled',
};

type MangaType = typeof allTypes[number];
type MangaStatus = typeof statuses[number];
type SortOption = 'a-z' | 'z-a' | 'latest' | 'views';

export default function Series() {
  const { data: allManga = [] } = useAllManga();
  const [search, setSearch] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<MangaType | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<MangaStatus | ''>('');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [genresExpanded, setGenresExpanded] = useState(false);

  const toggleGenre = (g: string) => {
    setSelectedGenres(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const filtered = useMemo(() => {
    let results = allManga.filter(m => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedType && m.type !== selectedType) return false;
      if (selectedStatus && m.status !== selectedStatus) return false;
      if (selectedGenres.length > 0 && !selectedGenres.some(g => m.genres?.includes(g))) return false;
      return true;
    });

    results.sort((a, b) => {
      switch (sortBy) {
        case 'a-z': return a.title.localeCompare(b.title);
        case 'z-a': return b.title.localeCompare(a.title);
        case 'views': return (b.views ?? 0) - (a.views ?? 0);
        case 'latest':
        default: return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return results;
  }, [search, selectedType, selectedStatus, selectedGenres, allManga, sortBy]);

  const hasFilters = search || selectedType || selectedStatus || selectedGenres.length > 0;

  const activeFilters: { label: string; clear: () => void }[] = [];
  if (selectedType) activeFilters.push({ label: `Type: ${selectedType}`, clear: () => setSelectedType('') });
  if (selectedStatus) activeFilters.push({ label: `Status: ${statusLabels[selectedStatus]}`, clear: () => setSelectedStatus('') });
  selectedGenres.forEach(g => activeFilters.push({ label: g, clear: () => toggleGenre(g) }));

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
                {statusLabels[s]}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <button
            onClick={() => setGenresExpanded(!genresExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold hover:text-foreground transition-colors"
          >
            Genres {selectedGenres.length > 0 && `(${selectedGenres.length})`}
            {genresExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {genresExpanded && (
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
          )}
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

      {/* Sort + Active Filters + Results */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            {activeFilters.map((f, i) => (
              <Badge key={i} variant="secondary" className="gap-1 text-xs cursor-pointer hover:bg-destructive/20" onClick={f.clear}>
                {f.label} <X className="w-3 h-3" />
              </Badge>
            ))}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest Update</SelectItem>
              <SelectItem value="a-z">A → Z</SelectItem>
              <SelectItem value="z-a">Z → A</SelectItem>
              <SelectItem value="views">Most Views</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(m => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No series found</h3>
            <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your filters or search term.</p>
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 gap-2"
                onClick={() => { setSearch(''); setSelectedGenres([]); setSelectedType(''); setSelectedStatus(''); }}
              >
                <X className="w-3 h-3" /> Clear all filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
