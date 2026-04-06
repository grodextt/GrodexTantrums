import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import MangaCard from '@/components/MangaCard';
import TypeBadge from '@/components/TypeBadge';

export default function Library() {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const { bookmarks, isLoading: bookmarksLoading } = useBookmarks();
  const { history, isLoading: historyLoading } = useReadingHistory();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <Icon icon="ph:books-bold" className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Your Library</h1>
        <p className="text-muted-foreground">Sign in to save and track your favorite manga.</p>
        <Button className="gap-2" onClick={() => setShowLoginModal(true)}>
          <Icon icon="ph:sign-in-bold" className="w-4 h-4" />
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      {/* Bookmarks */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="ph:books-bold" className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Your Library</h1>
        </div>
        {bookmarksLoading ? (
          <div className="text-muted-foreground text-sm">Loading bookmarks...</div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border/50">
            <Icon icon="ph:book-open-bold" className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">No bookmarks yet. Add manga to your library from their info pages.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {bookmarks.map((b: any) => b.manga && (
              <MangaCard key={b.id} manga={b.manga} />
            ))}
          </div>
        )}
      </section>

      {/* Reading History */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="ph:history-bold" className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-bold">Reading History</h2>
        </div>
        {historyLoading ? (
          <div className="text-muted-foreground text-sm">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 bg-secondary/30 rounded-xl border border-border/50">
            <Icon icon="ph:history-bold" className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-muted-foreground text-sm">No reading history yet. Start reading to track your progress.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {history.map((h: any) => h.manga && (
              <Link
                key={h.id}
                to={`/manga/${h.manga.slug}/chapter/${h.chapter_number}`}
                className="flex-shrink-0 w-36 group"
              >
                <div className="relative overflow-hidden rounded-lg aspect-[3/4] bg-secondary">
                  <img
                    src={h.manga.cover_url}
                    alt={h.manga.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 left-1.5">
                    <TypeBadge type={h.manga.type} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-2">
                    <span className="text-[10px] font-semibold text-primary">Ch. {h.chapter_number}</span>
                  </div>
                </div>
                <p className="text-xs font-semibold truncate mt-1.5">{h.manga.title}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
