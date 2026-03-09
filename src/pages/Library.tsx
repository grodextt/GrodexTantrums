import { Library as LibraryIcon, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import MangaCard from '@/components/MangaCard';
import { useAllManga } from '@/hooks/useAllManga';

export default function Library() {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const { data: allManga = [] } = useAllManga();

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-4">
        <LibraryIcon className="w-16 h-16 mx-auto text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Your Library</h1>
        <p className="text-muted-foreground">Sign in to save and track your favorite manga.</p>
        <Button className="gap-2" onClick={() => setShowLoginModal(true)}>
          <LogIn className="w-4 h-4" />
          Sign In
        </Button>
      </div>
    );
  }

  // Mock bookmarks: show first 3
  const bookmarked = allManga.slice(0, 3);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-2">
        <LibraryIcon className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Your Library</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {bookmarked.map(m => (
          <MangaCard key={m.id} manga={m} />
        ))}
      </div>
    </div>
  );
}
