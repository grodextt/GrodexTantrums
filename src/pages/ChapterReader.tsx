import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Home, List, ZoomIn, ZoomOut, RotateCcw,
  BookOpen, Share2, Flag, MessageSquare, Settings, X, Lock, Coins, ShoppingCart,
  Ticket, Timer, AlertCircle, Bookmark, ArrowLeft, ArrowRight, Maximize, Rows3,
  FileText, Keyboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMangaBySlug, useMangaChapters } from '@/hooks/useMangaBySlug';
import CommentSection from '@/components/CommentSection';
import ChapterListModal from '@/components/ChapterListModal';
import { useToast } from '@/hooks/use-toast';
import { useRecordReading } from '@/hooks/useReadingHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useChapterUnlock, useUserCoinBalance, useUserTokenBalance } from '@/hooks/useChapterUnlock';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useTrackView } from '@/hooks/useTrackView';

function CountdownTimer({ targetDate, onExpired }: { targetDate: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Available now!');
        if (!expired) { setExpired(true); onExpired?.(); }
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0
        ? `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
        : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return <span>{timeLeft}</span>;
}

export default function ChapterReader() {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const navigate = useNavigate();
  const { data: manga, isLoading } = useMangaBySlug(slug || '');
  const { data: chapters = [] } = useMangaChapters(manga?.id);
  const chapterNum = parseInt(chapterId || '1');
  const [zoom, setZoom] = useState(100);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stickyHeader, setStickyHeader] = useState(true);
  const [fitWidth, setFitWidth] = useState(true);
  const [readingMode, setReadingMode] = useState<'strip' | 'page'>('strip');
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { toast } = useToast();
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    like: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0,
  });
  const recordReading = useRecordReading();
  const { user } = useAuth();
  useTrackView(manga?.id);
  const { settings: premiumSettings } = usePremiumSettings();
  const currencyName = premiumSettings.coin_system.currency_name;
  const currencyIconUrl = premiumSettings.coin_system.currency_icon_url;
  const coinBalance = useUserCoinBalance();
  const tokenBalance = useUserTokenBalance();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const currentChapter = chapters.find(c => c.number === chapterNum);
  const { isUnlocked, isLoading: unlockLoading, unlock, unlockWithToken } = useChapterUnlock(currentChapter?.id);

  const { data: securePages = [] } = useQuery({
    queryKey: ['chapter-pages', currentChapter?.id, isUnlocked],
    queryFn: async () => {
      if (!currentChapter?.id) return [];
      const { data, error } = await supabase.rpc('get_chapter_pages', { p_chapter_id: currentChapter.id });
      if (error) return [];
      return (data as string[]) || [];
    },
    enabled: !!currentChapter?.id,
  });

  useEffect(() => { supabase.rpc('handle_auto_free_chapters').then(() => {}); }, []);
  useEffect(() => { window.scrollTo(0, 0); setCurrentPage(0); }, [chapterNum]);

  useEffect(() => {
    if (manga && user) {
      const ch = chapters.find(c => c.number === chapterNum);
      if (ch) recordReading.mutate({ mangaId: manga.id, chapterId: ch.id, chapterNumber: chapterNum });
    }
  }, [manga?.id, chapterNum, user?.id, chapters]);

  // Scroll progress tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev) navigate(`/manga/${slug}/chapter/${chapterNum - 1}`);
      if (e.key === 'ArrowRight' && hasNext) navigate(`/manga/${slug}/chapter/${chapterNum + 1}`);
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapterNum, slug]);

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

  const isPremiumChapter = !!currentChapter?.premium;
  const coinPrice = currentChapter?.coin_price ?? 100;
  const maxChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) : 0;
  const totalChapters = chapters.length;
  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < maxChapter;
  const freeReleaseAt = currentChapter?.free_release_at;

  const adjustZoom = (delta: number) => setZoom(prev => Math.max(50, Math.min(200, prev + delta)));

  const pageUrls = securePages.filter(Boolean);
  const isLocked = isPremiumChapter && pageUrls.length === 0 && !isUnlocked;
  const totalPages = pageUrls.length;

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Coins className={className} />
    );

  const handleCoinUnlock = async () => {
    if (!user) { sonnerToast.error('Please sign in to unlock chapters'); return; }
    if (coinBalance < coinPrice) { sonnerToast.error(`Not enough ${currencyName}.`); return; }
    try {
      await unlock.mutateAsync({ chapterId: currentChapter!.id });
      sonnerToast.success(`Chapter unlocked! ${coinPrice} ${currencyName} deducted.`);
      window.location.reload();
    } catch (err: any) { sonnerToast.error(err.message || 'Failed to unlock chapter'); }
  };

  const handleTokenUnlock = async () => {
    if (!user) { sonnerToast.error('Please sign in to unlock chapters'); return; }
    if (tokenBalance < 1) { sonnerToast.error('Not enough tickets.'); return; }
    try {
      await unlockWithToken.mutateAsync({ chapterId: currentChapter!.id });
      sonnerToast.success('Chapter unlocked with ticket! (3-day access)');
      window.location.reload();
    } catch (err: any) { sonnerToast.error(err.message || 'Failed to unlock chapter'); }
  };

  const chapterListItems = chapters.map(ch => ({
    id: ch.id, number: ch.number, title: ch.title,
    date: new Date(ch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    pages: ch.pages || undefined, premium: ch.premium || undefined, coin_price: ch.coin_price,
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
      if (selectedReaction) setReactionCounts(prev => ({ ...prev, [selectedReaction]: prev[selectedReaction] - 1 }));
      setSelectedReaction(key);
      setReactionCounts(prev => ({ ...prev, [key]: prev[key] + 1 }));
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${manga.title} - Chapter ${chapterNum}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Chapter link copied to clipboard.' });
    }
  };

  const handleReport = () => {
    toast({ title: 'Report submitted', description: 'Thanks for letting us know.' });
  };

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Chapter Not Available</h1>
          <p className="text-muted-foreground">This chapter doesn't exist or hasn't been uploaded yet.</p>
          <Button asChild><Link to={`/manga/${manga.slug}`}>Back to Manga</Link></Button>
        </div>
      </div>
    );
  }

  const canAffordCoins = coinBalance >= coinPrice;
  const canAffordTickets = tokenBalance >= 1;
  const isUnlocking = unlock.isPending || unlockWithToken.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className={`${stickyHeader ? 'sticky top-0' : ''} z-50 bg-background/95 backdrop-blur-sm border-b border-border`}>
        <div className="w-full px-2 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-14">
            {/* Left: Nav */}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" asChild className="text-xs px-2">
                <Link to="/"><Home className="w-3.5 h-3.5" /></Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-xs px-2">
                <Link to={`/manga/${manga.slug}`}><BookOpen className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>

            {/* Center: Chapter selector */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasPrev}
                onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum - 1}`)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Select
                value={String(chapterNum)}
                onValueChange={(v) => navigate(`/manga/${slug}/chapter/${v}`)}
              >
                <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs border-border/50">
                  <SelectValue>Ch. {chapterNum}{totalChapters > 0 ? ` / ${totalChapters}` : ''}</SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {chapters.sort((a, b) => a.number - b.number).map(ch => (
                    <SelectItem key={ch.id} value={String(ch.number)} className="text-xs">
                      Chapter {ch.number}{ch.title ? ` — ${ch.title}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!hasNext}
                onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum + 1}`)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Right: Settings + Page info */}
            <div className="flex items-center gap-1">
              {totalPages > 0 && (
                <span className="text-[10px] text-muted-foreground hidden sm:inline">
                  {totalPages} pg
                </span>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-1">
        <div className="h-full bg-primary/80 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
          {/* Pages / Lock Screen */}
          <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
            {isLocked ? (
              <div className="max-w-2xl mx-auto">
                <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-t-xl" />
                <div className="bg-card border border-border border-t-0 rounded-b-xl p-6 sm:p-10 text-center space-y-6">
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
                    <Lock className="w-10 h-10 text-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Chapter {chapterNum} is Locked</h2>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                      This effort-filled chapter is currently premium.<br/>Support the team to read it now!
                    </p>
                  </div>
                  {freeReleaseAt && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Free for everyone in</p>
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted/50 border border-border/50">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg font-mono font-bold text-foreground tracking-wider">
                          <CountdownTimer targetDate={freeReleaseAt} onExpired={() => window.location.reload()} />
                        </span>
                      </div>
                    </div>
                  )}
                  {user ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 justify-center">
                          <CurrencyIcon className="w-6 h-6 text-amber-500" />
                          <div className="text-left">
                            <p className="text-xl font-bold leading-none">{coinPrice}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{currencyName}</p>
                          </div>
                        </div>
                        {canAffordCoins ? (
                          <Button onClick={handleCoinUnlock} disabled={isUnlocking} className="w-full rounded-xl gap-2 bg-amber-500 hover:bg-amber-600 text-white">
                            {unlock.isPending ? 'Unlocking...' : `Buy now for ${coinPrice}`}
                          </Button>
                        ) : (
                          <Button variant="outline" asChild className="w-full rounded-xl gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                            <Link to="/coin-shop">Not Enough {currencyName}</Link>
                          </Button>
                        )}
                      </div>
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 justify-center">
                          <Ticket className="w-6 h-6 text-primary" />
                          <div className="text-left">
                            <p className="text-xl font-bold leading-none">1</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Chapter Ticket</p>
                          </div>
                        </div>
                        {canAffordTickets ? (
                          <Button onClick={handleTokenUnlock} disabled={isUnlocking} variant="outline" className="w-full rounded-xl gap-2">
                            {unlockWithToken.isPending ? 'Unlocking...' : 'Use 1 Ticket'}
                          </Button>
                        ) : (
                          <Button variant="outline" asChild className="w-full rounded-xl gap-2">
                            <Link to="/earn">Not Enough Tickets</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button onClick={() => navigate('/login')} className="rounded-xl gap-2 h-12 px-8">
                      <Lock className="w-4 h-4" /> Please login to unlock
                    </Button>
                  )}
                  {user && !canAffordCoins && !canAffordTickets && (
                    <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" /><span>Insufficient balance to unlock</span>
                    </div>
                  )}
                  {user && (
                    <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                      <Button asChild className="flex-1 rounded-xl gap-2 h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                        <Link to="/coin-shop"><ShoppingCart className="w-4 h-4" /> Buy {currencyName}</Link>
                      </Button>
                      <Button variant="outline" asChild className="flex-1 rounded-xl gap-2 h-12">
                        <Link to="/earn"><Ticket className="w-4 h-4" /> Earn Tickets</Link>
                      </Button>
                    </div>
                  )}
                  <Link to={`/manga/${manga.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block">
                    Back to Chapter List
                  </Link>
                </div>
              </div>
            ) : readingMode === 'page' && pageUrls.length > 0 ? (
              /* Page-by-page mode */
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center w-full">
                  <img
                    src={pageUrls[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    className="rounded-lg shadow-lg"
                    style={{ width: fitWidth ? '100%' : `${zoom}%`, maxWidth: fitWidth ? '900px' : '100%' }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" disabled={currentPage === 0}
                    onClick={() => setCurrentPage(p => p - 1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium min-w-[80px] text-center">
                    Page {currentPage + 1} / {totalPages}
                  </span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(p => p + 1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : pageUrls.length > 0 ? (
              /* Long strip mode */
              pageUrls.map((page, i) => (
                <div key={i} className="flex justify-center" ref={el => { pageRefs.current[i] = el; }}>
                  <img
                    src={page}
                    alt={`Page ${i + 1}`}
                    className="rounded-lg shadow-lg"
                    style={{ width: fitWidth ? '100%' : `${zoom}%`, maxWidth: fitWidth ? '900px' : '100%' }}
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center space-y-3">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40" />
                  <p className="text-lg font-medium text-muted-foreground">No pages available</p>
                  <p className="text-sm text-muted-foreground/60">This chapter hasn't been uploaded yet.</p>
                </div>
              </div>
            )}
          </div>

          {/* Chapter Navigation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-card rounded-lg p-3 sm:p-4 border border-border shadow-sm gap-3 sm:gap-0">
            <Button variant="outline" disabled={!hasPrev} onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum - 1}`)} className="w-full sm:w-auto text-xs sm:text-sm">
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Previous
            </Button>
            <Button variant="outline" onClick={() => setShowChapterList(true)} className="w-full sm:w-auto text-xs sm:text-sm">
              <List className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Chapters
            </Button>
            {hasNext ? (
              <Button onClick={() => navigate(`/manga/${slug}/chapter/${chapterNum + 1}`)} className="w-full sm:w-auto text-xs sm:text-sm">
                Next <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              </Button>
            ) : (
              <Button variant="outline" asChild className="w-full sm:w-auto text-xs sm:text-sm">
                <Link to={`/manga/${manga.slug}`}><BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Manga Info</Link>
              </Button>
            )}
          </div>

          {/* After-reader section */}
          {!isLocked && (
            <div className="max-w-5xl mx-auto mt-8 space-y-6">
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
              <div className="py-6">
                <CommentSection mangaId={manga?.id || ''} contextType="chapter" contextId={currentChapter?.id} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Settings Sidebar */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="right" className="w-[300px] sm:w-[340px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-base">Reader Settings</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 mt-6">
            {/* Chapter Navigation */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Chapter</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={!hasPrev}
                  onClick={() => { navigate(`/manga/${slug}/chapter/${chapterNum - 1}`); setShowSettings(false); }}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Select value={String(chapterNum)} onValueChange={(v) => { navigate(`/manga/${slug}/chapter/${v}`); setShowSettings(false); }}>
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue>Chapter {chapterNum}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {chapters.sort((a, b) => a.number - b.number).map(ch => (
                      <SelectItem key={ch.id} value={String(ch.number)} className="text-xs">
                        Ch. {ch.number}{ch.title ? ` — ${ch.title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled={!hasNext}
                  onClick={() => { navigate(`/manga/${slug}/chapter/${chapterNum + 1}`); setShowSettings(false); }}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Page info */}
            {totalPages > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pages</span>
                <span className="font-medium">{totalPages}</span>
              </div>
            )}

            {/* Reading mode */}
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reading Mode</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant={readingMode === 'strip' ? 'default' : 'outline'}
                  onClick={() => setReadingMode('strip')} className="text-xs gap-1.5 h-8">
                  <Rows3 className="w-3.5 h-3.5" /> Long Strip
                </Button>
                <Button size="sm" variant={readingMode === 'page' ? 'default' : 'outline'}
                  onClick={() => setReadingMode('page')} className="text-xs gap-1.5 h-8">
                  <FileText className="w-3.5 h-3.5" /> Page
                </Button>
              </div>
            </div>

            {/* Settings toggles */}
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Display</p>
              <div className="flex items-center justify-between">
                <span className="text-sm">Sticky Header</span>
                <Switch checked={stickyHeader} onCheckedChange={setStickyHeader} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Fit Width</span>
                <Switch checked={fitWidth} onCheckedChange={setFitWidth} />
              </div>
              {!fitWidth && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Zoom</span>
                    <span className="text-xs text-muted-foreground">{zoom}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustZoom(-10)}>
                      <ZoomOut className="w-3 h-3" />
                    </Button>
                    <Progress value={zoom} max={200} className="flex-1 h-2" />
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => adjustZoom(10)}>
                      <ZoomIn className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(100)}>
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Actions</p>
              <div className="space-y-1">
                <button onClick={handleShare} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                  <Share2 className="w-4 h-4 text-primary" /> Share Chapter
                </button>
                <button onClick={() => { navigate(`/manga/${manga.slug}`); setShowSettings(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                  <BookOpen className="w-4 h-4 text-primary" /> Manga Details
                </button>
                <button onClick={handleReport} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-secondary/80 transition-colors">
                  <Flag className="w-4 h-4 text-destructive" /> Report Issue
                </button>
              </div>
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Keyboard className="w-3 h-3" /> Keyboard Shortcuts
              </div>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-muted-foreground">
                <span><kbd className="px-1 py-0.5 rounded bg-background border text-[10px]">←</kbd> Prev Chapter</span>
                <span><kbd className="px-1 py-0.5 rounded bg-background border text-[10px]">→</kbd> Next Chapter</span>
                <span><kbd className="px-1 py-0.5 rounded bg-background border text-[10px]">Esc</kbd> Close Panel</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {showChapterList && (
        <ChapterListModal
          isOpen={showChapterList}
          onClose={() => setShowChapterList(false)}
          chapters={chapterListItems}
          mangaSlug={manga.slug}
          mangaCover={manga.cover_url}
        />
      )}
    </div>
  );
}
