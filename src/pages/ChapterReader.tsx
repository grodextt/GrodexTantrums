import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Home, List, ZoomIn, ZoomOut, RotateCcw,
  BookOpen, Share2, Flag, MessageSquare, Settings, X, Lock, Coins, ShoppingCart,
  Ticket, Timer, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft('Available now!');
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const parts = [];
      if (d > 0) parts.push(`${String(d).padStart(2, '0')}`);
      parts.push(String(h).padStart(2, '0'));
      parts.push(String(m).padStart(2, '0'));
      parts.push(String(s).padStart(2, '0'));
      setTimeLeft(parts.join(':'));
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
  const [showOptions, setShowOptions] = useState(false);
  const { toast } = useToast();
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    like: 0, funny: 0, love: 0, surprised: 0, angry: 0, sad: 0,
  });
  const recordReading = useRecordReading();
  const { user } = useAuth();
  const { settings: premiumSettings } = usePremiumSettings();
  const currencyName = premiumSettings.coin_system.currency_name;
  const currencyIconUrl = premiumSettings.coin_system.currency_icon_url;
  const coinBalance = useUserCoinBalance();
  const tokenBalance = useUserTokenBalance();

  const currentChapter = chapters.find(c => c.number === chapterNum);
  const { isUnlocked, isLoading: unlockLoading, unlock, unlockWithToken } = useChapterUnlock(currentChapter?.id);

  // Fetch chapter pages securely via RPC
  const { data: securePages = [] } = useQuery({
    queryKey: ['chapter-pages', currentChapter?.id, isUnlocked],
    queryFn: async () => {
      if (!currentChapter?.id) return [];
      const { data, error } = await supabase.rpc('get_chapter_pages', {
        p_chapter_id: currentChapter.id,
      });
      if (error) return [];
      return (data as string[]) || [];
    },
    enabled: !!currentChapter?.id,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [chapterNum]);

  useEffect(() => {
    if (manga && user) {
      const ch = chapters.find(c => c.number === chapterNum);
      if (ch) {
        recordReading.mutate({ mangaId: manga.id, chapterId: ch.id, chapterNumber: chapterNum });
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

  const isPremiumChapter = !!currentChapter?.premium;
  const coinPrice = currentChapter?.coin_price ?? 100;
  const maxChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) : 0;
  const hasPrev = chapterNum > 1;
  const hasNext = chapterNum < maxChapter;
  const freeReleaseAt = currentChapter?.free_release_at;

  const adjustZoom = (delta: number) => {
    setZoom(prev => Math.max(50, Math.min(200, prev + delta)));
  };

  // Use secure pages from RPC, not from chapter record directly
  const pageUrls = securePages.filter(Boolean);
  const isLocked = isPremiumChapter && pageUrls.length === 0 && !isUnlocked;

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Coins className={className} />
    );

  const handleCoinUnlock = async () => {
    if (!user) {
      sonnerToast.error('Please sign in to unlock chapters');
      return;
    }
    if (coinBalance < coinPrice) {
      sonnerToast.error(`Not enough ${currencyName}.`);
      return;
    }
    try {
      await unlock.mutateAsync({ chapterId: currentChapter!.id });
      sonnerToast.success(`Chapter unlocked! ${coinPrice} ${currencyName} deducted.`);
      window.location.reload();
    } catch (err: any) {
      sonnerToast.error(err.message || 'Failed to unlock chapter');
    }
  };

  const handleTokenUnlock = async () => {
    if (!user) {
      sonnerToast.error('Please sign in to unlock chapters');
      return;
    }
    if (tokenBalance < 1) {
      sonnerToast.error('Not enough tickets.');
      return;
    }
    try {
      await unlockWithToken.mutateAsync({ chapterId: currentChapter!.id });
      sonnerToast.success('Chapter unlocked with ticket! (3-day access)');
      window.location.reload();
    } catch (err: any) {
      sonnerToast.error(err.message || 'Failed to unlock chapter');
    }
  };

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
      navigator.share({ title: `${manga.title} - Chapter ${chapterNum}`, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied!', description: 'Chapter link copied to clipboard.' });
    }
  };

  const handleReport = () => {
    toast({ title: 'Report submitted', description: 'Thanks for letting us know.' });
    setShowOptions(false);
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-3">
                <Link to="/"><Home className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Home</span></Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowChapterList(true)} className="text-xs sm:text-sm px-2 sm:px-3">
                <List className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /><span className="hidden sm:inline">Chapters</span>
              </Button>
            </div>
            <div className="text-center flex-1 px-2 max-w-xs sm:max-w-md">
              <h1 className="font-semibold text-foreground text-xs sm:text-base truncate">{manga.title}</h1>
              <p className="text-xs text-muted-foreground truncate">Ch {chapterNum}</p>
            </div>
            <div className="hidden sm:flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={() => adjustZoom(-10)} className="p-1 sm:p-2"><ZoomOut className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
              <span className="text-xs text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={() => adjustZoom(10)} className="p-1 sm:p-2"><ZoomIn className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setZoom(100)} className="p-1 sm:p-2"><RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" /></Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 min-w-0">
        <div className="w-full px-2 sm:px-4 py-4 sm:py-8">
          {/* Pages / Lock Screen */}
          <div className="space-y-2 sm:space-y-4 mb-6 sm:mb-8">
            {isLocked ? (
              /* ──── FULL LOCK PAGE ──── */
              <div className="max-w-2xl mx-auto">
                {/* Amber top border */}
                <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 rounded-t-xl" />
                <div className="bg-card border border-border border-t-0 rounded-b-xl p-6 sm:p-10 text-center space-y-6">
                  {/* Lock icon */}
                  <div className="w-20 h-20 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
                    <Lock className="w-10 h-10 text-amber-500" />
                  </div>

                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">Chapter {chapterNum} is Locked</h2>
                    <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                      This effort-filled chapter is currently premium.<br/>Support the team to read it now!
                    </p>
                  </div>

                  {/* Countdown timer if auto-free */}
                  {freeReleaseAt && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Free for everyone in</p>
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-muted/50 border border-border/50">
                        <Timer className="w-4 h-4 text-muted-foreground" />
                        <span className="text-lg font-mono font-bold text-foreground tracking-wider">
                          <CountdownTimer targetDate={freeReleaseAt} />
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Unlock options */}
                  {user ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                      {/* Coin unlock card */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 justify-center">
                          <CurrencyIcon className="w-6 h-6 text-amber-500" />
                          <div className="text-left">
                            <p className="text-xl font-bold leading-none">{coinPrice}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">{currencyName}</p>
                          </div>
                        </div>
                        {canAffordCoins ? (
                          <Button
                            onClick={handleCoinUnlock}
                            disabled={isUnlocking}
                            className="w-full rounded-xl gap-2 bg-amber-500 hover:bg-amber-600 text-white"
                          >
                            {unlock.isPending ? 'Unlocking...' : `Buy now for ${coinPrice}`}
                          </Button>
                        ) : (
                          <Button variant="outline" asChild className="w-full rounded-xl gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                            <Link to="/coin-shop">Not Enough {currencyName}</Link>
                          </Button>
                        )}
                      </div>

                      {/* Token unlock card */}
                      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                        <div className="flex items-center gap-2 justify-center">
                          <Ticket className="w-6 h-6 text-primary" />
                          <div className="text-left">
                            <p className="text-xl font-bold leading-none">1</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Chapter Ticket</p>
                          </div>
                        </div>
                        {canAffordTickets ? (
                          <Button
                            onClick={handleTokenUnlock}
                            disabled={isUnlocking}
                            variant="outline"
                            className="w-full rounded-xl gap-2"
                          >
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

                  {/* Insufficient balance warning */}
                  {user && !canAffordCoins && !canAffordTickets && (
                    <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <span>Insufficient balance to unlock</span>
                    </div>
                  )}

                  {/* Buy / Earn buttons */}
                  {user && (
                    <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                      <Button asChild className="flex-1 rounded-xl gap-2 h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white">
                        <Link to="/coin-shop">
                          <ShoppingCart className="w-4 h-4" /> Buy {currencyName}
                        </Link>
                      </Button>
                      <Button variant="outline" asChild className="flex-1 rounded-xl gap-2 h-12">
                        <Link to="/earn">
                          <Ticket className="w-4 h-4" /> Earn Tickets
                        </Link>
                      </Button>
                    </div>
                  )}

                  {/* Back link */}
                  <Link to={`/manga/${manga.slug}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block">
                    Back to Chapter List
                  </Link>
                </div>
              </div>
            ) : pageUrls.length > 0 ? (
              pageUrls.map((page, i) => (
                <div key={i} className="flex justify-center">
                  <img
                    src={page}
                    alt={`Page ${i + 1}`}
                    className="rounded-lg shadow-lg"
                    style={{ width: `${Math.min(zoom, 100)}%`, maxWidth: '100%' }}
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
                <CommentSection mangaId={manga?.id || ''} contextType="chapter" contextId={currentChapter?.id} />
              </div>
            </div>
          )}
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
        <Button size="icon" onClick={() => setShowOptions(!showOptions)} className="h-12 w-12 rounded-full shadow-lg border border-border/50">
          {showOptions ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </Button>
      </div>

      {showOptions && <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />}

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
