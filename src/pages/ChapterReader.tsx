import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useMangaBySlug, useMangaChapters } from '@/hooks/useMangaBySlug';
import CommentSection from '@/components/CommentSection';
import { useToast } from '@/hooks/use-toast';
import { useRecordReading } from '@/hooks/useReadingHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useChapterUnlock, useUserCoinBalance, useUserTokenBalance } from '@/hooks/useChapterUnlock';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useHasActiveSubscription } from '@/hooks/useSubscription';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useTrackView } from '@/hooks/useTrackView';
import { useReaderSettings } from '@/hooks/useReaderSettings';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsMobile } from '@/hooks/use-mobile';

// Reader Components
import ReaderHeader from '@/components/reader/ReaderHeader';
import ReaderMenuPanel from '@/components/reader/ReaderMenuPanel';

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
        if (!expired) { 
          setExpired(true); 
          onExpired?.(); 
        }
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

function DetailedCountdown({ targetDate, onExpired }: { targetDate: string; onExpired?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    let expired = false;
    const update = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;
      if (diff <= 0) {
        setTimeLeft(null);
        if (!expired) { 
          expired = true; 
          onExpired?.(); 
        }
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000)
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) return <span className="text-xl font-bold text-gray-400">Available now!</span>;

  let totalHours = timeLeft.d * 24 + timeLeft.h;

  return (
    <div className="flex items-center gap-4 sm:gap-6 justify-center">
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(totalHours).padStart(2, '0')}</span>
        <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 sm:mt-2">Hours</span>
      </div>
      <span className="text-2xl sm:text-4xl font-black text-purple-500/30 mb-5 sm:mb-6">:</span>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(timeLeft.m).padStart(2, '0')}</span>
        <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 sm:mt-2">Min</span>
      </div>
      <span className="text-2xl sm:text-4xl font-black text-purple-500/30 mb-5 sm:mb-6">:</span>
      <div className="flex flex-col items-center min-w-[50px]">
        <span className="text-4xl sm:text-5xl font-black text-white tracking-tighter" style={{ fontVariantNumeric: 'tabular-nums' }}>{String(timeLeft.s).padStart(2, '0')}</span>
        <span className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1 sm:mt-2">Sec</span>
      </div>
    </div>
  );
}

export default function ChapterReader() {
  const { slug, chapterId } = useParams<{ slug: string; chapterId: string }>();
  const navigate = useNavigate();
  const { data: manga, isLoading: mangaLoading } = useMangaBySlug(slug || '');
  const { data: chapters = [] } = useMangaChapters(manga?.id);
  const chapterNum = parseInt(chapterId || '1');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const lastScrollY = useRef(0);
  
  const { toast } = useToast();
  const recordReading = useRecordReading();
  const { user, setShowLoginModal } = useAuth();
  const { isAdmin, isMod } = useUserRole();
  useTrackView(manga?.id);
  
  const readerSettings = useReaderSettings();
  const { settings } = readerSettings;
  const { settings: premiumSettings } = usePremiumSettings();
  const currencyName = premiumSettings?.coin_system?.currency_name || 'Coins';
  const currencyIconUrl = premiumSettings?.coin_system?.currency_icon_url;
  const coinBalance = useUserCoinBalance();
  const tokenBalance = useUserTokenBalance();
  const { isSubscriber } = useHasActiveSubscription();

  const { settings: siteSettings } = useSiteSettings();
  const discordUrl = siteSettings?.general?.discord_url || 'https://discord.gg';
  const donationName = siteSettings?.general?.donation_name || 'Patreon';
  const donationUrl = siteSettings?.general?.donation_url || '';
  const donationIconUrl = siteSettings?.general?.donation_icon_url || 'cib:patreon';

  const handleShare = () => {
    const shareData = {
      title: `${manga?.title || ''} - Chapter ${chapterNum}`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      sonnerToast.success('Link copied to clipboard!');
    }
  };

  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
  const currentChapterIndex = sortedChapters.findIndex(c => c.number === chapterNum);
  const currentChapter = sortedChapters[currentChapterIndex];
  
  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < sortedChapters.length - 1 ? sortedChapters[currentChapterIndex + 1] : null;

  const hasPrev = !!prevChapter;
  const hasNext = !!nextChapter;

  const { isUnlocked, unlock, unlockWithToken } = useChapterUnlock(currentChapter?.id);

  const { data: securePages = [], isLoading: pagesLoading, isError: pagesError } = useQuery({
    queryKey: ['chapter-pages', currentChapter?.id, isUnlocked],
    queryFn: async () => {
      if (!currentChapter?.id) return [];
      const { data, error } = await supabase.rpc('get_chapter_pages', { p_chapter_id: currentChapter.id });
      if (error) {
        console.error('Error fetching pages:', error);
        throw error;
      }
      return (data as string[]) || [];
    },
    enabled: !!currentChapter?.id,
  });

  const pageUrls = (Array.isArray(securePages) ? securePages : []).filter(Boolean);
  const totalPages = pageUrls.length;

  useEffect(() => { window.scrollTo(0, 0); setCurrentPage(0); }, [chapterNum]);

  useEffect(() => {
    if (manga && user && currentChapter) {
      recordReading.mutate({ mangaId: manga.id, chapterId: currentChapter.id, chapterNumber: chapterNum });
    }
  }, [manga?.id, chapterNum, user?.id, chapters, currentChapter]);

  // Scroll visibility & progress
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      // Use 100vh offset for progress to feel more natural and accommodate bottom UI
      const adjustedProgress = docHeight > 100 ? (currentScrollY / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, adjustedProgress)));

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Run once to init progress
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrev && settings.readingDirection === 'ltr') navigate(`/manga/${slug}/chapter/${prevChapter.number}`);
      if (e.key === 'ArrowRight' && hasNext && settings.readingDirection === 'ltr') navigate(`/manga/${slug}/chapter/${nextChapter.number}`);
      if (e.key === 'h' || e.key === 'H') settings.headerMode === 'sticky' ? readerSettings.update('headerMode', 'hidden') : readerSettings.update('headerMode', 'sticky');
      if (e.key === 'm' || e.key === 'M') setIsMenuOpen(!isMenuOpen);
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chapterNum, slug, hasPrev, hasNext, settings, readerSettings, isMenuOpen]);

  if (mangaLoading) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <Icon icon="ph:spinner-bold" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!manga || !currentChapter) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <Icon icon="ph:warning-bold" className="w-16 h-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-white">Chapter Not Found</h1>
          <p className="text-gray-400">The chapter you are looking for might have been moved or deleted.</p>
          <Button asChild className="rounded-xl px-8"><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }


  const isFreeRelease = currentChapter.free_release_at && new Date(currentChapter.free_release_at).getTime() <= Date.now();
  const isSubFreeRelease = currentChapter.subscription_free_release_at && new Date(currentChapter.subscription_free_release_at).getTime() <= Date.now();
  const isLocked = !!currentChapter.premium && !isFreeRelease && pageUrls.length === 0 && !isUnlocked && (premiumSettings?.premium_config?.enable_coins ?? true);
  const isSubLocked = !!currentChapter.is_subscription && !isSubFreeRelease && !isSubscriber && pageUrls.length === 0;
  const showAdminBypassBanner = !!currentChapter.is_subscription && !isSubFreeRelease && !isSubscriber && pageUrls.length > 0 && (isAdmin || isMod);
  
  const coinPrice = currentChapter.coin_price ?? 100;
  const subName = premiumSettings?.subscription_settings?.subscription_name || 'Subscription';
  const subBadge = premiumSettings?.subscription_settings?.badge_label || 'Early Access';

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Icon icon="ph:coins-bold" className={className} />
    );

  const handleCoinUnlock = async () => {
    if (!user) { sonnerToast.error('Please sign in to unlock'); return; }
    if (coinBalance < coinPrice) { sonnerToast.error(`Insufficient ${currencyName}`); return; }
    try {
      await unlock.mutateAsync({ chapterId: currentChapter.id });
      sonnerToast.success('Unlocked!');
      window.location.reload();
    } catch (err: any) { sonnerToast.error(err.message || 'Unlock failed'); }
  };

  const handleTokenUnlock = async () => {
    if (!user) { sonnerToast.error('Please sign in to unlock'); return; }
    if (tokenBalance < 1) { sonnerToast.error('Insufficient tickets'); return; }
    try {
      await unlockWithToken.mutateAsync({ chapterId: currentChapter.id });
      sonnerToast.success('Unlocked with ticket!');
      window.location.reload();
    } catch (err: any) { sonnerToast.error(err.message || 'Unlock failed'); }
  };

  const isMobile = useIsMobile();

  const getImageFitClass = () => {
    switch (settings.imageSettings.fitMode) {
      case 'width': return 'w-full h-auto';
      case 'height': return 'max-h-[85vh] sm:max-h-[92vh] w-auto';
      case 'none': return 'max-w-none w-auto h-auto';
      default: return 'max-w-full h-auto';
    }
  };

  const prevPage = () => {
    if (settings.displayMode === 'double') {
      setCurrentPage(p => Math.max(0, p - 2));
    } else {
      setCurrentPage(p => Math.max(0, p - 1));
    }
  };

  const nextPage = () => {
    if (settings.displayMode === 'double') {
      setCurrentPage(p => Math.min(totalPages - 1, p + 2));
    } else {
      setCurrentPage(p => Math.min(totalPages - 1, p + 1));
    }
  };

  return (
    <div className={`min-h-screen bg-[#0f1117] text-gray-100 selection:bg-primary/30 ${settings.imageSettings.greyscale ? 'grayscale' : ''} ${settings.imageSettings.dim ? 'brightness-75' : ''}`}>
      {/* Header Integration */}
      <ReaderHeader
        mangaTitle={manga.title}
        mangaSlug={manga.slug}
        mangaCover={manga.cover_url}
        chapterNum={chapterNum}
        chapterTitle={currentChapter.title}
        headerMode={settings.headerMode}
        onMenuOpen={() => setIsMenuOpen(true)}
        isHeaderVisible={isHeaderVisible}
      />

      {/* Progress Bar */}
      {settings.progressPosition !== 'none' && (
        <div className={`fixed z-[60] bg-primary transition-all duration-300 ${
          settings.progressPosition === 'bottom' ? 'bottom-0 left-0 h-1' : 'top-0 left-0 w-1 h-full'
        }`} style={{ [settings.progressPosition === 'bottom' ? 'width' : 'height']: `${scrollProgress}%` }} />
      )}

      {/* Main Content Area */}
      <main className="w-full">
        {showAdminBypassBanner && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 text-center py-2 px-4 shadow-sm animate-in slide-in-from-top fade-in relative z-40">
            <p className="text-amber-500 text-sm font-semibold flex items-center justify-center gap-2">
              <Icon icon="ph:shield-warning-bold" className="w-4 h-4" />
              Admin Bypass Active: This chapter is Early Access and locked for normal users, but you have access because you are an admin.
            </p>
          </div>
        )}

        {isSubLocked ? (
          <div className="max-w-xl mx-auto py-12 px-6">
            <div className="bg-[#101217] border border-white/5 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="flex gap-5 sm:gap-6 items-start">
                <img src={manga.cover_url} alt="" className="w-20 sm:w-24 h-28 sm:h-32 object-cover rounded-xl shadow-lg shrink-0" />
                <div className="flex flex-col gap-2 pt-1 min-w-0">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 w-fit border border-purple-500/20 shrink-0">
                    <Icon icon="ph:lock-key-fill" className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{subBadge}</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold text-white leading-tight line-clamp-2">{manga.title}</h1>
                  <p className="text-sm font-medium text-purple-400 truncate">
                    Chapter {chapterNum} <span className="text-gray-600 mx-1">·</span> <span className="text-gray-400">"{currentChapter.title}"</span>
                  </p>
                </div>
              </div>
              
              <div className="mt-8 space-y-6">
                <p className="text-sm text-gray-300 leading-relaxed font-medium">
                  This chapter is available early for {subName} members. It will become free for all readers soon.
                </p>

                {currentChapter.subscription_free_release_at && (
                  <div className="bg-[#16181d] rounded-2xl p-6 flex flex-col items-center border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-16 -mt-16" />
                    <p className="text-xs text-gray-400 font-medium tracking-wide mb-5">Becomes free for everyone in</p>
                    <DetailedCountdown targetDate={currentChapter.subscription_free_release_at} onExpired={() => window.location.reload()} />
                  </div>
                )}

                <div className="space-y-3">
                  {user ? (
                    <button
                      onClick={() => navigate('/subscribe')}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-amber-950 font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Icon icon="ph:star-fill" className="w-5 h-5" />
                      Upgrade to {subName}
                    </button>
                  ) : (
                    <Button onClick={() => setShowLoginModal(true)} variant="outline" className="w-full h-14 rounded-2xl text-base font-bold bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20 hover:text-purple-300 transition-all flex justify-center items-center gap-2">
                      <Icon icon="ph:sign-in-bold" className="w-5 h-5" />
                      Sign in to Upgrade
                    </Button>
                  )}
                </div>
                
                <div className="pt-2 text-center">
                  <Link to={`/manga/${manga.slug}`} className="text-xs text-gray-500 hover:text-white transition-colors font-medium">Back to Chapter List</Link>
                </div>
              </div>
            </div>
          </div>
        ) : isLocked ? (
          <div className="max-w-2xl mx-auto py-20 px-6">
            <div className="bg-[#1a1d26] border border-white/5 rounded-3xl p-8 sm:p-12 text-center shadow-2xl space-y-8">
              <div className="w-24 h-24 rounded-3xl bg-amber-500/10 flex items-center justify-center mx-auto ring-1 ring-amber-500/20">
                <Icon icon="ph:lock-key-bold" className="w-12 h-12 text-amber-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">This chapter is Locked</h2>
                <p className="text-gray-400">Unlock to read this premium chapter and support the creator!</p>
              </div>

              {currentChapter.free_release_at && (
                <div className="py-4 px-6 rounded-2xl bg-white/5 border border-white/5 inline-block">
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black mb-1">Free for everyone in</p>
                  <p className="text-xl font-mono font-bold text-primary tracking-wider">
                    <CountdownTimer targetDate={currentChapter.free_release_at} onExpired={() => window.location.reload()} />
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleCoinUnlock} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all group">
                   <div className="flex items-center gap-2">
                    <CurrencyIcon className="w-6 h-6 text-amber-500" />
                    <span className="text-2xl font-black text-white">{coinPrice}</span>
                   </div>
                   <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Unlock with {currencyName}</span>
                </button>
                <button onClick={handleTokenUnlock} className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all">
                   <div className="flex items-center gap-2">
                    <Icon icon="ph:ticket-bold" className="w-6 h-6 text-primary" />
                    <span className="text-2xl font-black text-white">1</span>
                   </div>
                   <span className="text-xs font-bold text-primary uppercase tracking-widest">Use Chapter Ticket</span>
                </button>
              </div>

              {user ? (
                <div className="flex justify-center gap-6 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5"><CurrencyIcon className="w-3.5 h-3.5" /> Balance: {coinBalance}</span>
                  <span className="flex items-center gap-1.5"><Icon icon="ph:ticket-bold" className="w-3.5 h-3.5" /> Tickets: {tokenBalance}</span>
                </div>
              ) : (
                <Button onClick={() => setShowLoginModal(true)} className="w-full h-14 rounded-2xl text-base font-bold">Sign in to Unlock</Button>
              )}
              
              <Link to={`/manga/${manga.slug}`} className="block text-sm text-gray-500 hover:text-white transition-colors">Back to Chapter List</Link>
            </div>
          </div>
        ) : pagesLoading ? (
          <div className="flex justify-center items-center py-32">
             <Icon icon="ph:spinner-bold" className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className={`mx-auto flex flex-col items-center max-w-full overflow-x-hidden ${settings.displayMode === 'longstrip' ? '' : 'min-h-[80vh] justify-center'}`}
               style={{ gap: `${settings.stripMargin}px` }}>
            
            {pageUrls.length === 0 ? (
              <div className="py-20 text-center text-muted-foreground">
                <p>No pages found for this chapter.</p>
                {pagesError && <p className="text-red-400 mt-2">There was an error loading the pages.</p>}
              </div>
            ) : settings.displayMode === 'longstrip' ? (
              <div className="flex flex-col items-center w-full" style={{ gap: `${settings.stripMargin}px` }}>
                {pageUrls.map((url, i) => (
                  <div key={i} className="w-full relative flex justify-center">
                    <img
                      src={url}
                      alt={`Page ${i + 1}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className={`${getImageFitClass()} shadow-2xl transition-all duration-300`}
                      style={{ 
                        maxWidth: (settings.imageSettings.fitMode === 'width' || !settings.imageSettings.limitMaxWidth) ? 'none' : '800px',
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative group flex flex-col items-center gap-10 py-10 w-full">
                {settings.displayMode === 'single' ? (
                  <img
                    src={pageUrls[currentPage]}
                    alt={`Page ${currentPage + 1}`}
                    referrerPolicy="no-referrer"
                    className={`${getImageFitClass()} shadow-2xl rounded-lg object-contain`}
                    onClick={nextPage}
                  />
                ) : (
                  <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 md:gap-1 justify-center max-w-full px-4`}>
                    <img
                      src={pageUrls[currentPage]}
                      alt={`Page ${currentPage + 1}`}
                      referrerPolicy="no-referrer"
                      className={`${isMobile ? 'max-h-none w-full' : getImageFitClass()} shadow-2xl rounded-lg md:rounded-l-lg object-contain`}
                      onClick={nextPage}
                    />
                    {currentPage + 1 < totalPages && (
                      <img
                        src={pageUrls[currentPage + 1]}
                        alt={`Page ${currentPage + 2}`}
                        referrerPolicy="no-referrer"
                        className={`${isMobile ? 'max-h-none w-full' : getImageFitClass()} shadow-2xl rounded-lg md:rounded-r-lg object-contain`}
                        onClick={nextPage}
                      />
                    )}
                  </div>
                )}

                {/* Navigation Controls Overlay */}
                <div className="mt-4 flex items-center justify-center gap-6 px-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={prevPage} 
                    disabled={currentPage === 0}
                    className="rounded-full w-14 h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  >
                    <Icon icon="ph:caret-left-bold" className="w-6 h-6" />
                  </Button>
                  
                  <div className="px-6 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                    <span className="text-white font-bold tracking-widest text-sm">
                      {settings.displayMode === 'double' 
                        ? `${currentPage + 1}${currentPage + 1 < totalPages ? `-${currentPage + 2}` : ''} / ${totalPages}`
                        : `${currentPage + 1} / ${totalPages}`
                      }
                    </span>
                  </div>

                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={nextPage} 
                    disabled={currentPage >= totalPages - 1}
                    className="rounded-full w-14 h-14 bg-white/5 border-white/10 hover:bg-white/10 text-white shadow-lg shadow-primary/20"
                  >
                    <Icon icon="ph:caret-right-bold" className="w-6 h-6" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isLocked && !isSubLocked && (
          <div className="max-w-4xl mx-auto py-16 px-4 space-y-12">
            {/* Bottom chapter nav */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 shadow-2xl backdrop-blur-sm gap-4">
              <Button 
                variant="secondary" 
                disabled={!hasPrev} 
                onClick={() => navigate(`/manga/${slug}/chapter/${prevChapter?.number}`)} 
                className="flex-1 sm:flex-none gap-2 bg-white/10 hover:bg-white/15 text-white border-0 h-12 px-6 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icon icon="ph:arrow-left-bold" className="shrink-0" /> 
                <span className="hidden sm:inline">Previous Chapter</span>
                <span className="inline sm:hidden">Prev</span>
              </Button>
              
              <div className="hidden lg:flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/30 mb-0.5">You are reading</span>
                <span className="text-sm font-bold text-white/90">Chapter {chapterNum}</span>
              </div>

              <Button 
                variant="secondary" 
                disabled={!hasNext} 
                onClick={() => navigate(`/manga/${slug}/chapter/${nextChapter?.number}`)} 
                className="flex-1 sm:flex-none gap-2 bg-primary hover:bg-primary/90 text-primary-foreground border-0 h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Next Chapter</span>
                <span className="inline sm:hidden">Next</span>
                <Icon icon="ph:arrow-right-bold" className="shrink-0" />
              </Button>
            </div>

            {/* Support Heart */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-white/5 border border-white/5 overflow-hidden shadow-xl relative backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-8 -mb-8 pointer-events-none" />
              
              <div className="flex items-center gap-4 relative z-10 w-full md:w-auto">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                  <Icon icon="ph:star-fill" className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white mb-0.5">Please support us!</p>
                  <p className="text-sm text-white/40 font-medium">Liked the chapter? Help us keep going ❤️</p>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto relative z-10 sm:justify-center md:justify-end">
                {donationUrl && (
                  <Button 
                    variant="outline" 
                    className="gap-2 h-11 px-5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500 whitespace-nowrap bg-transparent rounded-xl" 
                    onClick={() => window.open(donationUrl, '_blank')}
                  >
                    {donationIconUrl.includes('http') ? (
                      <img src={donationIconUrl} alt={donationName} className="w-4 h-4 object-contain" />
                    ) : (
                      <Icon icon={donationIconUrl || 'ph:coffee-bold'} className="w-4 h-4" />
                    )}
                    {donationName}
                  </Button>
                )}
                <Button 
                  onClick={() => window.open(discordUrl, '_blank')} 
                  className="gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white h-11 px-6 border-0 rounded-xl"
                >
                  <Icon icon="ic:baseline-discord" className="w-5 h-5" />
                  Join Discord
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-11 w-11 shrink-0 bg-white/10 hover:bg-white/15 text-white border-0 rounded-xl" 
                  onClick={handleShare}
                >
                  <Icon icon="ph:share-network-bold" className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <CommentSection mangaId={manga.id} contextType="chapter" contextId={currentChapter.id} />
          </div>
        )}
      </main>

      {/* Reader Menu Panel */}
      <ReaderMenuPanel
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        mangaTitle={manga.title}
        mangaSlug={manga.slug}
        mangaId={manga.id}
        chapters={chapters}
        currentChapterNum={chapterNum}
        totalPages={totalPages}
        currentPage={currentPage}
        hasPrev={hasPrev}
        hasNext={hasNext}
        readerSettings={readerSettings}
        onPageSelect={setCurrentPage}
      />
    </div>
  );
}
