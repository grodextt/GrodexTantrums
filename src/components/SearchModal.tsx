import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, X } from 'lucide-react';
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
    return allManga.filter(m => m.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  }, [query, allManga]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 bg-card border-border">
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search manga..."
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base h-14"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        {results.length > 0 && (
          <div className="p-2 max-h-80 overflow-y-auto">
            {results.map(manga => (
              <Link
                key={manga.id}
                to={`/manga/${manga.slug}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <img src={manga.cover_url} alt={manga.title} className="w-10 h-14 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{manga.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TypeBadge type={manga.type} />
                    <span className="text-xs text-muted-foreground capitalize">{manga.status}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        {query.trim() && results.length === 0 && (
          <div className="p-8 text-center text-muted-foreground text-sm">No results found</div>
        )}
      </DialogContent>
    </Dialog>
  );
}
