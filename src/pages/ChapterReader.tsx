import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid, Minus, Plus, ArrowDown, ArrowUp, Share2, Flag, MessageSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMangaBySlug } from '@/data/mockManga';
import CommentSection from '@/components/CommentSection';

export default function ChapterReader() {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const navigate = useNavigate();
  const manga = getMangaBySlug(slug || '');
  const chapterNum = parseInt(chapterId || '1');
  const [zoom, setZoom] = useState(40);
  const [sortAsc, setSortAsc] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    like: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0,
  });

  if (!manga) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Manga not found</h1>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Go Home</Link>
      </div>
    );
  }

  const maxChapter = manga.chapters.length > 0 ? Math.max(...manga.chapters.map(c => c.number)) : 0;
  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < maxChapter;

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.min(100, Math.max(20, prev + delta)));
  };

  const sortedChapters = [...manga.chapters].sort((a, b) =>
    sortAsc ? a.number - b.number : b.number - a.number
  );

  // Placeholder reader pages
  const pages = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-background">
      {/* Title bar */}
      <div className="text-center py-3 border-b border-border/50">
        <p className="text-sm text-muted-foreground">
          {manga.title} — <span className="text-foreground font-medium">Chapter {chapterNum}</span>
        </p>
      </div>

      {/* Reader area */}
      <div className="flex flex-col items-center py-4 pb-28">
        {pages.map(i => (
          <div
            key={i}
            className="bg-secondary flex items-center justify-center"
            style={{ width: `${zoom}%`, aspectRatio: '2/3' }}
          >
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Page {i + 1}</p>
              <p className="text-xs">Chapter {chapterNum}</p>
            </div>
          </div>
        ))}
      </div>

      {/* After reader section */}
      <div className="max-w-5xl mx-auto px-4 pb-10 space-y-6">
        {/* Next Chapter or Series Page */}
        <div className="text-center space-y-3 pt-4">
          <h3 className="text-lg font-bold">{hasNext ? 'Next Chapter' : 'Series'}</h3>
          {hasNext ? (
            <button
              onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum + 1}`)}
              className="inline-flex items-center gap-3 p-3 pr-6 rounded-xl bg-secondary/60 border border-border/30 hover:bg-secondary transition-colors mx-auto"
            >
              <img src={manga.cover} alt="" className="w-16 h-[80px] object-cover rounded-lg" />
              <div className="text-left">
                <p className="text-sm font-semibold">Chapter {chapterNum + 1}</p>
                <p className="text-xs text-muted-foreground">
                  {manga.chapters.find(c => c.number === chapterNum + 1)?.date || ''}
                </p>
              </div>
            </button>
          ) : (
            <Link
              to={`/manga/${manga.slug}`}
              className="inline-flex items-center gap-3 p-3 pr-6 rounded-xl bg-secondary/60 border border-border/30 hover:bg-secondary transition-colors mx-auto"
            >
              <img src={manga.cover} alt="" className="w-16 h-[80px] object-cover rounded-lg" />
              <div className="text-left">
                <p className="text-sm font-semibold">{manga.title}</p>
                <p className="text-xs text-muted-foreground">View Series Page</p>
              </div>
            </Link>
          )}
          <div>
            <Button variant="outline" size="sm" className="rounded-full gap-1.5 mt-2">
              <Settings className="w-3.5 h-3.5" /> Options
            </Button>
          </div>
        </div>

        {/* Share row */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border-l-2 border-primary">
          <div>
            <p className="text-sm font-semibold">Share MangaRead</p>
            <p className="text-xs text-muted-foreground">to your friends</p>
          </div>
          <Button variant="default" size="icon" className="rounded-full h-9 w-9">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Report & Discord row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border-l-2 border-destructive">
            <div>
              <p className="text-sm font-semibold">Facing an Issue?</p>
              <p className="text-xs text-muted-foreground">Let us know, and we'll help ASAP</p>
            </div>
            <Button variant="destructive" size="sm" className="rounded-full gap-1.5 shrink-0">
              <Flag className="w-3.5 h-3.5" /> Report
            </Button>
          </div>
          <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/40 border-l-2 border-[hsl(235,86%,65%)]">
            <div>
              <p className="text-sm font-semibold">Join Our Socials</p>
              <p className="text-xs text-muted-foreground">to explore more</p>
            </div>
            <Button size="sm" className="rounded-full gap-1.5 shrink-0 bg-[hsl(235,86%,65%)] hover:bg-[hsl(235,86%,55%)]">
              <MessageSquare className="w-3.5 h-3.5" /> Discord
            </Button>
          </div>
        </div>

        {/* Reactions */}
        <div className="text-center space-y-4 py-4">
          <div>
            <h3 className="text-lg font-bold">What do you think?</h3>
            <p className="text-sm text-muted-foreground">
              {Object.values(reactionCounts).reduce((a, b) => a + b, 0)} Reactions
            </p>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-lg sm:max-w-2xl mx-auto">
            {[
              { key: 'like', emoji: '👍', label: 'Like' },
              { key: 'funny', emoji: '🤣', label: 'Funny' },
              { key: 'love', emoji: '😍', label: 'Love' },
              { key: 'surprised', emoji: '😮', label: 'Surprised' },
              { key: 'angry', emoji: '😠', label: 'Angry' },
              { key: 'sad', emoji: '😢', label: 'Sad' },
            ].map(r => (
              <button
                key={r.key}
                onClick={() => {
                  if (selectedReaction === r.key) {
                    setSelectedReaction(null);
                    setReactionCounts(prev => ({ ...prev, [r.key]: prev[r.key] - 1 }));
                  } else {
                    if (selectedReaction) {
                      setReactionCounts(prev => ({ ...prev, [selectedReaction]: prev[selectedReaction] - 1 }));
                    }
                    setSelectedReaction(r.key);
                    setReactionCounts(prev => ({ ...prev, [r.key]: prev[r.key] + 1 }));
                  }
                }}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl w-full transition-colors ${
                  selectedReaction === r.key
                    ? 'bg-primary/20 border border-primary/50'
                    : 'bg-secondary/50 hover:bg-secondary/80'
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
        <CommentSection comments={manga.comments} title="Chapter Comments" />
      </div>

      {/* Chapter list floating panel */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div
            className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <h3 className="text-lg font-bold">{manga.chapters.length} Chapters</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSortAsc(!sortAsc)}
                className="h-9 w-9 rounded-lg"
              >
                <div className="flex flex-col items-center leading-none">
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="text-[9px] font-bold leading-none">
                    {sortAsc ? <>9<br/>1</> : <>1<br/>9</>}
                  </span>
                </div>
              </Button>
            </div>

            {/* Chapter grid */}
            <ScrollArea className="h-[50vh]">
              <div className="grid grid-cols-2 gap-2.5 px-5 pb-5">
                {sortedChapters.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(`/manga/${slug}/chapter/${ch.number}`);
                    }}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors text-left ${
                      ch.number === chapterNum
                        ? 'bg-primary/10 border border-primary/40'
                        : 'bg-secondary/50 hover:bg-secondary/80'
                    }`}
                  >
                    <img
                      src={manga.cover}
                      alt=""
                      className="w-14 h-[72px] object-cover rounded-lg shrink-0 bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">Chapter {ch.number}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ch.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Fixed bottom navigation bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {/* Prev button */}
        <Button
          variant="secondary"
          size="icon"
          disabled={!hasPrev}
          onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum - 1}`)}
          className="rounded-full h-10 w-10 bg-secondary/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Chapter list trigger */}
        <Button
          variant="secondary"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="rounded-full h-10 px-4 bg-secondary/90 backdrop-blur-sm border border-border/50 shadow-lg gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="text-sm">Chapters</span>
        </Button>

        {/* Zoom controls */}
        <div className="flex items-center gap-0 rounded-full bg-secondary/90 backdrop-blur-sm border border-border/50 shadow-lg h-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustZoom(-10)}
            className="rounded-full h-10 w-10"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium min-w-[40px] text-center">{zoom}%</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => adjustZoom(10)}
            className="rounded-full h-10 w-10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Next button */}
        <Button
          variant="secondary"
          size="icon"
          disabled={!hasNext}
          onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum + 1}`)}
          className="rounded-full h-10 w-10 bg-secondary/90 backdrop-blur-sm border border-border/50 shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
