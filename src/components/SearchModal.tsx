import { useState, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAllManga } from '@/hooks/useAllManga';
import TypeBadge from './TypeBadge';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: Props) {
  const { data: allManga = [] } = useAllManga();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allManga.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.alt_titles && m.alt_titles.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 8);
  }, [query, allManga]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-card border-border rounded-2xl overflow-hidden [&>button:last-child]:hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Icon icon="ph:magnifying-glass-bold" className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search manga, manhwa, manhua..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-14"
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {/* Results grid */}
        {results.length > 0 && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {results.map(manga => (
                <Link
                  key={manga.id}
                  to={`/manga/${manga.slug}`}
                  onClick={onClose}
                  className="group rounded-xl overflow-hidden bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={manga.cover_url}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 flex gap-1 flex-wrap">
                      <TypeBadge type={manga.type} />
                      {manga.status === 'completed' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/90 text-white">END</span>
                      )}
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-semibold truncate">{manga.title}</p>
                    {manga.genres && manga.genres.length > 0 && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {manga.genres.slice(0, 2).join(' · ')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {/* View all */}
            <Link
              to={`/series?q=${encodeURIComponent(query)}`}
              onClick={onClose}
              className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors py-2"
            >
              View all results <Icon icon="ph:arrow-right-bold" className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No results found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
