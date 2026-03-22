import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Home, List, ZoomIn, ZoomOut, RotateCcw,
  BookOpen, Share2, Flag, MessageSquare, Settings, X, Lock, Coins, ShoppingCart,
  Ticket, Timer, AlertCircle, Bookmark, Globe, RefreshCw, Info, Search,
  LayoutGrid, ChevronDown, ChevronUp, Play, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMangaBySlug, useMangaChapters } from '@/hooks/useMangaBySlug';
import { useMangaBookmark } from '@/hooks/useBookmarks';
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

// ─── Types ──────────────────────────────────────────────────
interface ReaderSettings {
  stickyHeader: boolean;
  readingMode: 'strip' | 'page';
  fitHeight: boolean;
  progressBar: 'bottom' | 'top' | 'left' | 'right' | 'none';
  pageDisplayStyle: 'single' | 'double' | 'strip';
  stripMargin: number;
  readingDirection: 'ltr' | 'rtl';
  containWidth: boolean;
  containHeight: boolean;
  stretchSmall: boolean;
  limitMaxWidth: boolean;
  limitMaxHeight: boolean;
  greyscale: boolean;
  dimPages: boolean;
  showTips: boolean;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  stickyHeader: true,
  readingMode: 'strip',
  fitHeight: false,
  progressBar: 'bottom',
  pageDisplayStyle: 'strip',
  stripMargin: 0,
  readingDirection: 'ltr',
  containWidth: true,
  containHeight: false,
  stretchSmall: false,
  limitMaxWidth: false,
  limitMaxHeight: false,
  greyscale: false,
  dimPages: false,
  showTips: true,
};

function loadSettings(): ReaderSettings {
  try {
    const raw = localStorage.getItem('reader-settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: ReaderSettings) {
  localStorage.setItem('reader-settings', JSON.stringify(s));
}

// ─── CountdownTimer ─────────────────────────────────────────
function CountdownTimer({ targetDate, onExpired }: { targetDate: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const update = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Available now!'); if (!expired) { setExpired(true); onExpired?.(); } return; }
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000),
        m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
        : `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [targetDate]);
  return <span>{timeLeft}</span>;
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function ChapterReader() {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const navigate = useNavigate();
  const { data: manga, isLoading } = useMangaBySlug(slug || '');
  const { data: chapters = [] } = useMangaChapters(manga?.id);
  const chapterNum = parseInt(chapterId || '1');
  const { toast } = useToast();
  const { user } = useAuth();
  const recordReading = useRecordReading();
  useTrackView(manga?.id);
  const { settings: premiumSettings } = usePremiumSettings();
  const currencyName = premiumSettings.coin_system.currency_name;
  const currencyIconUrl = premiumSettings.coin_system.currency_icon_url;
  const coinBalance = useUserCoinBalance();
  const tokenBalance = useUserTokenBalance();
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // ─── Settings state ───────────────────────────────────────
  const [settings, setSettings] = useState<ReaderSettings>(loadSettings);
  const updateSetting = useCallback(<K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => {
    setSettings(prev => { const next = { ...prev, [key]: value }; saveSettings(next); return next; });
  }, []);

  // ─── UI state ─────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<'layout' | 'image' | 'shortcuts'>('layout');
  const [panelView, setPanelView] = useState<'settings' | 'chapters' | 'pages'>('settings');
  const [chapterSearch, setChapterSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    like: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0,
  });

  const currentChapter = chapters.find(c => c.number === chapterNum);
  const { isUnlocked, isLoading: unlockLoading, unlock, unlockWithToken } = useChapterUnlock(currentChapter?.id);
  const { isBookmarked, toggleBookmark } = useMangaBookmark(manga?.id);

  const { data: securePages = [] } = useQuery({
    queryKey: ['chapter-pages', currentChapter?.id, isUnlocked],
    queryFn: async () => {
      if (!currentChapter?.id) return [];
      const { data } = await supabase.rpc('get_chapter_pages', { p_chapter_id: currentChapter.id });
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

  // Scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sortedChapters = useMemo(() => [...chapters].sort((a, b) => a.number - b.number), [chapters]);
  const maxChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) : 0;
  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < maxChapter;
  const pageUrls = securePages.filter(Boolean);
  const isPremiumChapter = !!currentChapter?.premium;
  const coinPrice = currentChapter?.coin_price ?? 100;
  const isLocked = isPremiumChapter && pageUrls.length === 0 && !isUnlocked;
  const totalPages = pageUrls.length;
  const freeReleaseAt = currentChapter?.free_release_at;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (key === 'h') setHeaderVisible(p => !p);
      if (key === 'm') setMenuOpen(p => !p);
      if (key === 'n' && hasNext) navigate(`/manga/${slug}/chapter/${chapterNum + 1}`);
      if (key === 'b' && hasPrev) navigate(`/manga/${slug}/chapter/${chapterNum - 1}`);
      if (key === 'escape') setMenuOpen(false);
      if (settings.readingMode === 'page') {
        const fwd = settings.readingDirection === 'ltr' ? 'arrowright' : 'arrowleft';
        const bwd = settings.readingDirection === 'ltr' ? 'arrowleft' : 'arrowright';
        if (key === fwd && currentPage < totalPages - 1) setCurrentPage(p => p + 1);
        if (key === bwd && currentPage > 0) setCurrentPage(p => p - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapterNum, slug, hasNext, hasPrev, settings.readingMode, settings.readingDirection, currentPage, totalPages]);

  // ─── Helpers ──────────────────────────────────────────────
  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
      : <Coins className={className} />;

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: `${manga?.title} - Chapter ${chapterNum}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Chapter link copied to clipboard.' });
    }
  };

  const handleReport = () => {
    setReportOpen(false); setReportText('');
    toast({ title: 'Report submitted', description: 'Thanks for letting us know.' });
  };

  const shareToSocial = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${manga?.title} - Chapter ${chapterNum}`);
    const links: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      discord: `https://discord.com/channels/@me`,
      reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
    };
    window.open(links[platform], '_blank');
  };

  const scrollToPage = (pageIndex: number) => {
    if (settings.readingMode === 'page') {
      setCurrentPage(pageIndex);
    } else {
      pageRefs.current[pageIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setPanelView('settings');
  };

  const goToChapter = (num: number) => {
    navigate(`/manga/${slug}/chapter/${num}`);
    setPanelView('settings');
    setMenuOpen(false);
  };

  const adjustZoom = (delta: number) => setZoom(prev => Math.max(50, Math.min(200, prev + delta)));

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

  const canAffordCoins = coinBalance >= coinPrice;
  const canAffordTickets = tokenBalance >= 1;
  const isUnlocking = unlock.isPending || unlockWithToken.isPending;

  // Image style based on settings
  const getImageStyle = (): React.CSSProperties => {
    const s: React.CSSProperties = {};
    if (settings.containWidth || settings.fitHeight === false) {
      s.width = '100%';
      s.maxWidth = '900px';
    }
    if (settings.fitHeight) {
      s.maxHeight = '100vh';
      s.width = 'auto';
      s.maxWidth = '100%';
    }
    if (!settings.containWidth && !settings.fitHeight) {
      s.width = `${zoom}%`;
      s.maxWidth = '100%';
    }
    if (settings.greyscale) s.filter = (s.filter || '') + ' grayscale(1)';
    if (settings.dimPages) s.filter = (s.filter || '') + ' brightness(0.7)';
    return s;
  };

  // ─── Loading / Not Found states ───────────────────────────
  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>;
  }
  if (!manga) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Chapter Not Found</h1>
        <p className="text-muted-foreground mb-6">The chapter you're looking for doesn't exist.</p>
        <Button asChild><Link to="/">Return Home</Link></Button>
      </div>
    </div>;
  }
  if (!currentChapter) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Chapter Not Available</h1>
        <p className="text-muted-foreground">This chapter doesn't exist or hasn't been uploaded yet.</p>
        <Button asChild><Link to={`/manga/${manga.slug}`}>Back to Manga</Link></Button>
      </div>
    </div>;
  }

  // ─── Filtered chapters for panel search ───────────────────
  const filteredChapters = chapterSearch
    ? sortedChapters.filter(ch => String(ch.number).includes(chapterSearch) || ch.title?.toLowerCase().includes(chapterSearch.toLowerCase()))
    : sortedChapters;

  // ═════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-background">
      {/* ─── HEADER ─────────────────────────────────────────── */}
      {headerVisible && (
        <header className={`${settings.stickyHeader ? 'sticky top-0' : ''} z-50 bg-background/95 backdrop-blur-sm border-b border-border`}>
          <div className="w-full px-2 sm:px-4">
            <div className="flex items-center justify-between h-14 sm:h-16">
              {/* Left: Home + Cover + Title */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={() => navigate('/')}
                  className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-secondary/80 flex items-center justify-center hover:bg-secondary transition-colors"
                >
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                </button>
                <Link to={`/manga/${manga.slug}`} className="shrink-0">
                  <img
                    src={manga.cover_url}
                    alt={manga.title}
                    className="w-[36px] h-[46px] sm:w-[40px] sm:h-[52px] rounded-md object-cover border border-border/50"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-medium text-foreground truncate leading-tight">
                    {manga.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate leading-tight">
                    Chapter {chapterNum}{currentChapter.title ? ` — ${currentChapter.title}` : ''}
                  </p>
                </div>
              </div>

              {/* Right: MENU button */}
              <button
                onClick={() => { setMenuOpen(true); setPanelView('settings'); }}
                className="shrink-0 flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg bg-secondary/80 hover:bg-secondary transition-colors ml-2"
              >
                <LayoutGrid className="w-4 h-4 text-foreground" />
                <span className="text-sm font-bold text-foreground hidden sm:inline">MENU</span>
              </button>
            </div>
          </div>
        </header>
      )}

      {/* ─── Floating MENU button when header hidden or not sticky ─── */}
      {(!headerVisible || !settings.stickyHeader) && (
        <button
          onClick={() => { setMenuOpen(true); setPanelView('settings'); }}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-secondary/90 backdrop-blur-sm border border-border shadow-lg flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5 text-foreground" />
        </button>
      )}

      {/* ─── Progress bar ─────────────────────────────────────── */}
      {settings.progressBar === 'bottom' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 h-1">
          <div className="h-full bg-primary/80 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}
      {settings.progressBar === 'top' && (
        <div className="fixed top-0 left-0 right-0 z-[60] h-1">
          <div className="h-full bg-primary/80 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
        </div>
      )}
      {settings.progressBar === 'left' && (
        <div className="fixed top-0 left-0 bottom-0 z-40 w-1">
          <div className="w-full bg-primary/80 transition-all duration-150" style={{ height: `${scrollProgress}%` }} />
        </div>
      )}
      {settings.progressBar === 'right' && (
        <div className="fixed top-0 right-0 bottom-0 z-40 w-1">
          <div className="w-full bg-primary/80 transition-all duration-150" style={{ height: `${scrollProgress}%` }} />
        </div>
      )}

      {/* ─── READING AREA ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
          <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8" style={{ gap: settings.readingMode === 'strip' ? `${settings.stripMargin}px` : undefined }}>
            {isLocked ? (
              /* ─── Lock Screen ─── */
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
            ) : settings.readingMode === 'page' && pageUrls.length > 0 ? (
              /* ─── Page-by-page mode ─── */
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center w-full">
                  <img
                    src={pageUrls[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    className="rounded-lg shadow-lg"
                    style={getImageStyle()}
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
              /* ─── Long strip mode ─── */
              pageUrls.map((page, i) => (
                <div key={i} className="flex justify-center" ref={el => { pageRefs.current[i] = el; }}>
                  <img src={page} alt={`Page ${i + 1}`} className="rounded-lg shadow-lg" style={getImageStyle()} />
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
                    <button key={r.key} onClick={() => handleReaction(r.key)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl w-full transition-colors border ${
                        selectedReaction === r.key ? 'bg-primary/20 border-primary/50' : 'bg-secondary/50 hover:bg-secondary/80 border-transparent'
                      }`}>
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

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MENU PANEL (sliding from right)                        */}
      {/* ═══════════════════════════════════════════════════════ */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>
      )}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[280px] sm:w-[300px] bg-background border-l border-border shadow-2xl overflow-y-auto transition-transform duration-200 ease-in-out ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-sm font-bold text-foreground truncate flex-1">{manga?.title}</h2>
          <button onClick={() => setMenuOpen(false)} className="shrink-0 w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/80 transition-colors ml-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 space-y-4">
          {panelView === 'settings' && (
            <>
              {/* Reading mode label */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">you are reading</p>
                <button
                  onClick={() => updateSetting('readingMode', settings.readingMode === 'strip' ? 'page' : 'strip')}
                  className="flex items-center gap-2 mt-1 text-sm text-foreground hover:text-primary transition-colors"
                >
                  <span>by {settings.readingMode === 'strip' ? 'chapter' : 'page'}</span>
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              {/* Language row */}
              <div className="flex items-center justify-between py-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span>Language</span>
                </div>
                <span className="text-sm text-muted-foreground">English</span>
              </div>

              {/* Chapter selector */}
              <div className="flex items-center gap-1 py-1">
                <button disabled={!hasPrev} onClick={() => goToChapter(chapterNum - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setPanelView('chapters'); setChapterSearch(''); }}
                  className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/60 hover:bg-secondary/80 text-sm transition-colors"
                >
                  <span>Chapter {chapterNum}</span>
                  <div className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-0.5" /><ChevronDown className="w-3 h-3 -mt-0.5" /></div>
                </button>
                <button disabled={!hasNext} onClick={() => goToChapter(chapterNum + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Page selector */}
              {totalPages > 0 && (
                <div className="flex items-center gap-1 py-1">
                  <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPanelView('pages')}
                    className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-md bg-secondary/60 hover:bg-secondary/80 text-sm transition-colors"
                  >
                    <span>Page {currentPage + 1}</span>
                    <div className="flex flex-col"><ChevronUp className="w-3 h-3 -mb-0.5" /><ChevronDown className="w-3 h-3 -mt-0.5" /></div>
                  </button>
                  <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-secondary/80 disabled:opacity-30 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-border/50" />

              {/* Action rows */}
              <div className="space-y-0.5">
                <button onClick={() => toggleBookmark.mutate()}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm hover:bg-secondary/80 transition-colors">
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                  <span>{isBookmarked ? 'In Library' : 'Library'}</span>
                </button>
                <button onClick={() => { navigate(`/manga/${manga.slug}`); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm hover:bg-secondary/80 transition-colors">
                  <Info className="w-4 h-4 text-muted-foreground" />
                  <span>Manga Detail</span>
                </button>
                <button onClick={() => setReportOpen(true)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm hover:bg-secondary/80 transition-colors">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  <span>Report Error</span>
                </button>
              </div>

              {/* Divider */}
              <div className="border-t border-border/50" />

              {/* Settings toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Header Sticky</span>
                  <Switch checked={settings.stickyHeader} onCheckedChange={v => updateSetting('stickyHeader', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Long Strip</span>
                  <Switch checked={settings.readingMode === 'strip'} onCheckedChange={v => updateSetting('readingMode', v ? 'strip' : 'page')} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fit Height</span>
                  <Switch checked={settings.fitHeight} onCheckedChange={v => updateSetting('fitHeight', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bottom Progress</span>
                  <Switch checked={settings.progressBar !== 'none'} onCheckedChange={v => updateSetting('progressBar', v ? 'bottom' : 'none')} />
                </div>
              </div>

              {/* Advanced Settings */}
              <button
                onClick={() => { setShowAdvanced(true); setAdvancedTab('layout'); }}
                className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm hover:bg-secondary/80 transition-colors border border-border/50"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Advanced Settings</span>
              </button>

              {/* Share section */}
              <div className="border-t border-border/50 pt-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Share to your friends</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => shareToSocial('facebook')} className="w-9 h-9 rounded-lg bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition-opacity">
                    <span className="text-white text-xs font-bold">f</span>
                  </button>
                  <button onClick={() => shareToSocial('twitter')} className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center hover:opacity-80 transition-opacity">
                    <span className="text-background text-xs font-bold">𝕏</span>
                  </button>
                  <button onClick={() => shareToSocial('discord')} className="w-9 h-9 rounded-lg bg-[#5865F2] flex items-center justify-center hover:opacity-80 transition-opacity">
                    <span className="text-white text-xs font-bold">D</span>
                  </button>
                  <button onClick={() => shareToSocial('reddit')} className="w-9 h-9 rounded-lg bg-[#FF4500] flex items-center justify-center hover:opacity-80 transition-opacity">
                    <span className="text-white text-xs font-bold">R</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─── CHAPTERS SUB-VIEW ─── */}
          {panelView === 'chapters' && (
            <div className="space-y-3">
              <button onClick={() => setPanelView('settings')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Find number..."
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  className="pl-9 h-9 text-sm bg-secondary/60 border-border/50"
                />
              </div>
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto -mx-1 px-1">
                {filteredChapters.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => goToChapter(ch.number)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      ch.number === chapterNum ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/80 text-foreground'
                    }`}
                  >
                    {ch.number === chapterNum && <Play className="w-3 h-3 fill-current shrink-0" />}
                    <span className="truncate">Chapter {ch.number}{ch.title ? ` — ${ch.title}` : ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── PAGES SUB-VIEW ─── */}
          {panelView === 'pages' && (
            <div className="space-y-3">
              <button onClick={() => setPanelView('settings')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <div className="space-y-0.5 max-h-[60vh] overflow-y-auto -mx-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollToPage(i)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                      i === currentPage ? 'bg-primary/20 text-primary' : 'hover:bg-secondary/80 text-foreground'
                    }`}
                  >
                    {i === currentPage && <Play className="w-3 h-3 fill-current shrink-0" />}
                    <span>Page {i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* ADVANCED SETTINGS MODAL                                */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Dialog open={showAdvanced} onOpenChange={setShowAdvanced}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Settings</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-secondary/50 rounded-lg">
            {(['layout', 'image', 'shortcuts'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setAdvancedTab(tab)}
                className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold uppercase tracking-wider transition-colors ${
                  advancedTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'layout' ? 'Page Layout' : tab === 'image' ? 'Image' : 'Shortcuts'}
              </button>
            ))}
          </div>

          {/* TAB: PAGE LAYOUT */}
          {advancedTab === 'layout' && (
            <div className="space-y-5 mt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page Display Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['single', 'double', 'strip'] as const).map(style => (
                    <button key={style} onClick={() => {
                      updateSetting('pageDisplayStyle', style);
                      if (style === 'strip') updateSetting('readingMode', 'strip');
                      else updateSetting('readingMode', 'page');
                    }}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors border ${
                        settings.pageDisplayStyle === style ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {style === 'single' ? 'Single Page' : style === 'double' ? 'Double Page' : 'Long Strip'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Strip Margin</label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    value={settings.stripMargin}
                    onChange={e => updateSetting('stripMargin', parseInt(e.target.value) || 0)}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => updateSetting('stripMargin', 0)}>
                    Reset
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reading Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ltr', 'rtl'] as const).map(dir => (
                    <button key={dir} onClick={() => updateSetting('readingDirection', dir)}
                      className={`px-3 py-2 rounded-md text-xs font-medium transition-colors border ${
                        settings.readingDirection === dir ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {dir === 'ltr' ? 'Left To Right' : 'Right To Left'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Progress Bar Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['top', 'bottom', 'left', 'right', 'none'] as const).map(pos => (
                    <button key={pos} onClick={() => updateSetting('progressBar', pos)}
                      className={`px-3 py-2 rounded-md text-xs font-medium capitalize transition-colors border ${
                        settings.progressBar === pos ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary/50 border-border/50 text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Show tips when header and sidebar are hidden</span>
                <Switch checked={settings.showTips} onCheckedChange={v => updateSetting('showTips', v)} />
              </div>
            </div>
          )}

          {/* TAB: IMAGE */}
          {advancedTab === 'image' && (
            <div className="space-y-5 mt-2">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Sizing</label>
                {[
                  { key: 'containWidth' as const, label: 'Contain to width' },
                  { key: 'containHeight' as const, label: 'Contain to height' },
                  { key: 'stretchSmall' as const, label: 'Stretch small pages' },
                  { key: 'limitMaxWidth' as const, label: 'Limit max width' },
                  { key: 'limitMaxHeight' as const, label: 'Limit max height' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <span className="text-sm">{item.label}</span>
                    <Switch checked={settings[item.key]} onCheckedChange={v => updateSetting(item.key, v)} />
                  </div>
                ))}
              </div>
              <div className="border-t border-border/50" />
              <div className="space-y-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Image Coloring</label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Greyscale pages</span>
                  <Switch checked={settings.greyscale} onCheckedChange={v => updateSetting('greyscale', v)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dim pages</span>
                  <Switch checked={settings.dimPages} onCheckedChange={v => updateSetting('dimPages', v)} />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SHORTCUTS */}
          {advancedTab === 'shortcuts' && (
            <div className="space-y-3 mt-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Keyboard Shortcuts</label>
              <ul className="space-y-2 text-sm">
                {[
                  { key: 'H', desc: 'Toggle show/hide header' },
                  { key: 'M', desc: 'Toggle show/hide menu' },
                  { key: 'N', desc: 'Skip forward a chapter' },
                  { key: 'B', desc: 'Skip backward a chapter' },
                  { key: '→', desc: 'Skip a page forward (LTR) or backward (RTL)' },
                  { key: '←', desc: 'Skip a page backward (LTR) or forward (RTL)' },
                ].map(s => (
                  <li key={s.key} className="flex items-start gap-3">
                    <kbd className="shrink-0 px-2 py-0.5 rounded bg-secondary border border-border text-xs font-mono min-w-[28px] text-center">{s.key}</kbd>
                    <span className="text-muted-foreground">{s.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Report Error Dialog ─── */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Report Error</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleReport}>Submit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
