import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutGrid, Minus, Plus, ArrowUp, ArrowDown, X, Share2, Flag, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
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
      <div className="container max-w-3xl pb-10 space-y-8">
        {/* Next chapter card */}
        {hasNext && (
          <button
            onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum + 1}`)}
            className="w-full p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between hover:bg-primary/20 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Next Chapter</p>
              <p className="font-semibold">Chapter {chapterNum + 1}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary" />
          </button>
        )}

        {/* Action cards */}
        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary transition-colors">
            <Share2 className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Share</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary transition-colors">
            <Flag className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Report</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/30 hover:bg-secondary transition-colors">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Discord</span>
          </button>
        </div>

        {/* Comments */}
        <CommentSection comments={manga.comments} title="Chapter Comments" />
      </div>

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
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              className="rounded-full h-10 px-4 bg-secondary/90 backdrop-blur-sm border border-border/50 shadow-lg gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-sm">Chapters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl p-0 max-w-lg mx-auto [&>button.absolute]:hidden">
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/50">
              <div className="flex items-center justify-between gap-3">
                <SheetTitle className="text-base">
                  {manga.chapters.length} Chapters
                </SheetTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortAsc(!sortAsc)}
                    className="gap-1.5 text-xs rounded-full"
                  >
                    {sortAsc ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
                    {sortAsc ? 'Ascending' : 'Descending'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDrawerOpen(false)}
                    className="h-8 w-8 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SheetHeader>
            <ScrollArea className="h-[calc(60vh-60px)]">
              <div className="grid grid-cols-2 gap-2 p-4">
                {sortedChapters.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setDrawerOpen(false);
                      navigate(`/manga/${slug}/chapter/${ch.number}`);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors text-left ${
                      ch.number === chapterNum
                        ? 'bg-primary/10 border-primary/40'
                        : 'bg-secondary/40 border-border/30 hover:bg-secondary/70'
                    }`}
                  >
                    <img
                      src={manga.cover}
                      alt=""
                      className="w-10 h-14 object-cover rounded shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">Chapter {ch.number}</p>
                      <p className="text-xs text-muted-foreground">{ch.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

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
