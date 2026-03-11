import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Home, List, ZoomIn, ZoomOut, RotateCcw,
  BookOpen, Share2, Flag, MessageSquare, Settings, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMangaBySlug, useMangaChapters } from '@/hooks/useMangaBySlug';
import CommentSection from '@/components/CommentSection';
import ChapterListModal from '@/components/ChapterListModal';
import { useToast } from '@/hooks/use-toast';
import { useRecordReading } from '@/hooks/useReadingHistory';
import { useAuth } from '@/contexts/AuthContext';

export default function ChapterReader() {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const navigate = useNavigate();
  const { data: manga, isLoading } = useMangaBySlug(slug || '');
  const { data: chapters = [] } = useMangaChapters(manga?.id);
  const chapterNum = parseInt(chapterId || '1');
  const [zoom, setZoom] = useState(100);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const { toast } = useToast();
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    like: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0,
  });
  const recordReading = useRecordReading();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterNum]);

  // Record reading history
  useEffect(() => {
    if (manga && user) {
      const currentChapter = chapters.find(c => c.number === chapterNum);
      if (currentChapter) {
        recordReading.mutate({ mangaId: manga.id, chapterId: currentChapter.id, chapterNumber: chapterNum });
      }
    }
  }, [manga?.id, chapterNum, user?.id, chapters]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Chapter Not Found</h1>
          <p className="text-muted-foreground mb-6">The chapter you're looking for doesn't exist.</p>
          <Button asChild><Link to="/">Return Home</Link></Button>
        </div>
      </div>
    );
  }

  const currentChapter = chapters.find(c => c.number === chapterNum);
  const maxChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) : 0;
  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < maxChapter;

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(50, Math.min(200, prev + delta)));
  };

  // Use actual chapter pages if available, otherwise show placeholder
  const pageUrls = currentChapter?.pages || [];
  const pages = pageUrls.length > 0 ? pageUrls : Array.from({ length: 8 }, (_, i) => null);

  const chapterListItems = chapters.map(ch => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
    date: new Date(ch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pages: ch.pages || undefined,
    premium: ch.premium || undefined,
  }));

  const reactions = [
    { key: 'like', emoji: '👍', label: 'Like' },
    { key: 'funny', emoji: '🤣', label: 'Funny' },
    { key: 'love', emoji: '😍', label: 'Love' },
    { key: 'surprised', emoji: '😮', label: 'Surprised' },
    { key: 'angry', emoji: '😠', label: 'Angry' },
    { key: 'sad', emoji: '😢', label: 'Sad' },
  ];

  const handleReaction = (key: string) => {
    if (selectedReaction === key) {
      setSelectedReaction(null);
      setReactionCounts(prev => ({ ...prev, [key]: prev[key] - 1 }));
    } else {
      if (selectedReaction) {
        setReactionCounts(prev => ({ ...prev, [selectedReaction]: prev[selectedReaction] - 1 }));
      }
      setSelectedReaction(key);
      setReactionCounts(prev => ({ ...prev, [key]: prev[key] + 1 }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${manga.title} - Chapter ${chapterNum}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Chapter link copied to clipboard.' });
    }
  };

  const handleReport = () => {
    toast({ title: 'Report submitted', description: 'Thanks for letting us know. We\'ll look into it.' });
    setShowOptions(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-3">
                <Link to="/">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChapterList(true)}
                className="text-xs sm:text-sm px-2 sm:px-3"
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Chapters</span>
              </Button>
            </div>

            <div className="text-center flex-1 px-2 max-w-xs sm:max-w-md">
              <h1 className="font-semibold text-foreground text-xs sm:text-base truncate">{manga.title}</h1>
              <p className="text-xs text-muted-foreground truncate">Ch {chapterNum}</p>
            </div>

            <div className="hidden sm:flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => adjustZoom(-10)} className="p-1 sm:p-2">
                <ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={() => adjustZoom(10)} className="p-1 sm:p-2">
                <ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="p-1 sm:p-2">
                <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-w-0">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
          {/* Pages */}
          <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
            {pages.map((page, i) => (
              <div key={i} className="flex justify-center">
                {typeof page === 'string' ? (
                  <img
                    src={page}
                    alt={`Page ${i + 1}`}
                    className="rounded-lg shadow-lg"
                    style={{ width: `${Math.min(zoom, 100)}%`, maxWidth: '100%' }}
                  />
                ) : (
                  <div
                    className="bg-secondary flex items-center justify-center rounded-lg shadow-lg"
                    style={{ width: `${Math.min(zoom, 100)}%`, aspectRatio: '2/3', maxWidth: '100%' }}
                  >
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg font-medium">Page {i + 1}</p>
                      <p className="text-xs">Chapter {chapterNum}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Chapter Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-card rounded-lg p-3 sm:p-4 border border-border shadow-sm gap-3 sm:gap-0">
            <Button
              variant="outline"
              disabled={!hasPrev}
              onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum - 1}`)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Previous
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowChapterList(true)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <List className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Chapters
            </Button>

            {hasNext ? (
              <Button
                onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum + 1}`)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Next
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full sm:w-auto text-xs sm:text-sm">
                <Link to={`/manga/${manga.slug}`}>
                  <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Manga Info
                </Link>
              </Button>
            )}
          </div>

          {/* After-reader section */}
          <div className="max-w-5xl mx-auto mt-8 space-y-6">
            {/* Reactions */}
            <div className="text-center space-y-4 py-4">
              <div>
                <h3 className="text-lg font-bold">What do you think?</h3>
                <p className="text-sm text-muted-foreground">
                  {Object.values(reactionCounts).reduce((a, b) => a + b, 0)} Reactions
                </p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-lg sm:max-w-2xl mx-auto">
                {reactions.map(r => (
                  <button
                    key={r.key}
                    onClick={() => handleReaction(r.key)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl w-full transition-colors border ${
                      selectedReaction === r.key
                        ? 'bg-primary/20 border-primary/50'
                        : 'bg-secondary/50 hover:bg-secondary/80 border-transparent'
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-xs font-medium">{reactionCounts[r.key]}</span>
                    <span className="text-[10px] text-muted-foreground">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="py-6">
              <CommentSection mangaId={manga?.id || ''} />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Options Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {showOptions && (
          <div className="absolute bottom-14 right-0 w-52 bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="p-2 space-y-1">
              <button onClick={handleShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <Share2 className="w-4 h-4 text-primary" /> Share Chapter
              </button>
              <button onClick={handleReport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <Flag className="w-4 h-4 text-destructive" /> Report Issue
              </button>
              <button onClick={() => { window.open('https://discord.gg', '_blank'); setShowOptions(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <MessageSquare className="w-4 h-4 text-[hsl(235,86%,65%)]" /> Join Discord
              </button>
              <button onClick={() => { setShowChapterList(true); setShowOptions(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <List className="w-4 h-4 text-muted-foreground" /> Chapter List
              </button>
              <button onClick={() => { adjustZoom(10); setShowOptions(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <ZoomIn className="w-4 h-4 text-muted-foreground" /> Zoom In
              </button>
              <button onClick={() => { adjustZoom(-10); setShowOptions(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <ZoomOut className="w-4 h-4 text-muted-foreground" /> Zoom Out
              </button>
              <button onClick={() => { setZoom(100); setShowOptions(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                <RotateCcw className="w-4 h-4 text-muted-foreground" /> Reset Zoom
              </button>
            </div>
          </div>
        )}

        <Button
          size="icon"
          onClick={() => setShowOptions(!showOptions)}
          className="h-12 w-12 rounded-full shadow-lg border border-border/50"
        >
          {showOptions ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </Button>
      </div>

      {showOptions && (
        <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
      )}

      {showChapterList && (
        <ChapterListModal
          isOpen={showChapterList}
          onClose={() => setShowChapterList(false)}
          chapters={chapterListItems}
          mangaSlug={manga.slug}
          mangaCover={manga.cover_url}
          currentChapterNumber={chapterNum}
        />
      )}
    </div>
  );
}
