import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useMangaBySlug, useMangaChapters } from '@/hooks/useMangaBySlug';
import { useAllManga } from '@/hooks/useAllManga';
import { useMangaSubscription } from '@/hooks/useNotifications';
import { useMangaBookmark } from '@/hooks/useBookmarks';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useTrendingManga } from '@/hooks/useTrendingManga';
import { useHasActiveSubscription } from '@/hooks/useSubscription';
import TypeBadge from '@/components/TypeBadge';
import TypeFlag from '@/components/TypeFlag';
import CommentSection from '@/components/CommentSection';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTrackView } from '@/hooks/useTrackView';
import { formatDistanceToNow } from 'date-fns';

const GENRE_EMOJI: Record<string, string> = {
  Action: '⚔️', Fantasy: '🔮', Adventure: '🧭', Drama: '🎲', Romance: '❤️',
  Comedy: '😂', Horror: '👻', Thriller: '🔪', Mystery: '🕵️', 'Sci-Fi': '🚀',
  'Slice of Life': '🌸', Magic: '✨', 'Martial Arts': '🥊', Sports: '🏆',
  Isekai: '🌀', Cyberpunk: '🤖',
};

const REACTIONS = [
  { emoji: '👍', label: 'Like' },
  { emoji: '🤣', label: 'Funny' },
  { emoji: '😍', label: 'Love' },
  { emoji: '😮', label: 'Surprised' },
  { emoji: '😠', label: 'Angry' },
  { emoji: '😢', label: 'Sad' },
];

export default function MangaInfo() {
  const { slug } = useParams<{ slug: string }>();
  const { data: manga, isLoading } = useMangaBySlug(slug || '');
  const { data: chapters = [] } = useMangaChapters(manga?.id);
  const { isAuthenticated, user, setShowLoginModal } = useAuth();
  useTrackView(manga?.id);
  const { isSubscribed, toggleSubscription } = useMangaSubscription(manga?.id);
  const { isBookmarked, toggleBookmark } = useMangaBookmark(manga?.id);
  const { settings } = useSiteSettings();
  const { settings: premiumSettings } = usePremiumSettings();
  const {
    currency_name: currencyName,
    currency_icon_url: currencyIconUrl,
    badge_bg_color = '#E8D47E',
    badge_text_color = '#A57C1B',
    badge_padding_x = 12,
    badge_padding_y = 3,
    badge_icon_size = 14,
    badge_font_size = 13,
    badge_font_weight = 900,
  } = premiumSettings.coin_system;
  const { data: allManga = [] } = useAllManga();
  const { data: trending = [] } = useTrendingManga(8);
  const { isSubscriber } = useHasActiveSubscription();

  // Fetch user's chapter unlocks for this manga
  const { data: userUnlocks = [] } = useQuery({
    queryKey: ['user-chapter-unlocks', manga?.id, user?.id],
    queryFn: async () => {
      if (!user || !manga) return [];
      const { data } = await supabase
        .from('chapter_unlocks')
        .select('chapter_id, unlock_type, expires_at')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user && !!manga,
  });

  const getUnlockStatus = (chapterId: string) => {
    const unlock = userUnlocks.find(u => u.chapter_id === chapterId);
    if (!unlock) return null;
    if (unlock.expires_at && new Date(unlock.expires_at) <= new Date()) return null;
    return unlock;
  };

  const CurrencyIcon = ({ className, size, style }: { className?: string; size?: number; style?: React.CSSProperties }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
    ) : (
      <Icon icon="ph:coins-bold" className={className} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
    );
  const [expanded, setExpanded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(
    Object.fromEntries(REACTIONS.map(r => [r.label, 0]))
  );
  const [sortDesc, setSortDesc] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  // Social links from settings
  const discordUrl = (settings.general as any)?.discord_url || 'https://discord.gg';
  const donationUrl = (settings.general as any)?.donation_url || '';
  const donationName = (settings.general as any)?.donation_name || 'Patreon';
  const donationIconUrl = (settings.general as any)?.donation_icon_url || '';
  const siteName = settings.general.site_name;

  useEffect(() => {
    if (manga && manga.content_warnings && manga.content_warnings.length > 0 && !warningAcknowledged) {
      setShowWarning(true);
    }
  }, [manga, warningAcknowledged]);

  if (isLoading) {
    return (
      <div className="container py-20 text-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Manga not found</h1>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Go Home</Link>
      </div>
    );
  }

  const sortedChapters = [...chapters].sort((a, b) =>
    sortDesc ? b.number - a.number : a.number - b.number
  );
  const visibleChapters = expanded ? sortedChapters : sortedChapters.slice(0, 9);
  const maxChapter = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) : 0;
  const latestDate = chapters.length > 0 
    ? new Date(chapters[0].created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'N/A';

  const handleWarningClose = (open: boolean) => {
    if (!open) setWarningAcknowledged(true);
    setShowWarning(open);
  };

  const handleShare = () => {
    const shareData = {
      title: `${manga.title} - ${siteName}`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleReport = () => {
    toast.success('Report submitted! We\'ll look into it.');
  };

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-6">
      {manga.content_warnings && manga.content_warnings.length > 0 && (
        <ContentWarningDialog
          open={showWarning}
          onOpenChange={handleWarningClose}
          warnings={manga.content_warnings}
          mangaTitle={manga.title}
        />
      )}
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header: Cover + Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={manga.cover_url}
              alt={manga.title}
              className="w-64 h-[360px] object-cover rounded-xl shrink-0 mx-auto sm:mx-0 shadow-lg"
            />
            <div className="flex-1 min-w-0 space-y-3.5">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{manga.title}</h1>

              {manga.alt_titles && manga.alt_titles.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Alternative titles</p>
                  <p className="text-sm text-muted-foreground/70">{manga.alt_titles.join(' · ')}</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap overflow-hidden">
                <span className={`px-3.5 py-1.5 rounded-lg text-sm font-bold capitalize ${manga.status === 'ongoing' ? 'bg-green-600 text-white' : manga.status === 'completed' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
                  {manga.status}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-sm text-foreground font-medium capitalize">
                  <TypeFlag type={manga.type} /> {manga.type}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-sm text-foreground font-medium">
                  🕐 {latestDate}
                </span>
                {manga.genres?.slice(0, 4).map(g => (
                  <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-sm text-foreground font-medium">
                    <span className="text-sm">{GENRE_EMOJI[g] || '📖'}</span> {g}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-secondary/60 rounded-lg p-4 text-base leading-relaxed text-foreground border border-border/50 break-words relative">
                <div className={`${!isDescExpanded ? 'line-clamp-4' : ''}`}>
                  {manga.description}
                </div>
                {!isDescExpanded && (manga.description?.length || 0) > 200 && (
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-secondary via-secondary/80 to-transparent flex items-end justify-center pb-2 rounded-b-lg pointer-events-none">
                    <button
                      onClick={() => setIsDescExpanded(true)}
                      className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-background border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon icon="ph:caret-down-bold" className="w-3.5 h-3.5" /> Expand
                    </button>
                  </div>
                )}
                {isDescExpanded && (
                  <div className="flex justify-center mt-3">
                    <button
                      onClick={() => setIsDescExpanded(false)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-background border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon icon="ph:caret-up-bold" className="w-3.5 h-3.5" /> Collapse
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                {chapters.length > 0 && (
                  <Link to={`/manga/${manga.slug}/chapter/1`}>
                    <Button variant="secondary" className="gap-2 rounded-lg bg-muted/60 border border-border/40 hover:bg-muted h-11 px-5 text-sm font-semibold text-foreground">
                      <Icon icon="ph:play-bold" className="w-4 h-4" /> Start Reading
                    </Button>
                  </Link>
                )}
                {maxChapter > 0 && (
                  <Link to={`/manga/${manga.slug}/chapter/${maxChapter}`}>
                    <Button variant="secondary" className="gap-2 rounded-lg bg-muted/60 border border-border/40 hover:bg-muted h-11 px-5 text-sm font-semibold text-foreground">
                      <Icon icon="ph:play-bold" className="w-4 h-4" /> New Chapter
                    </Button>
                  </Link>
                )}
                <Button
                  variant="secondary"
                  className={`gap-2 rounded-lg border border-border/40 hover:bg-muted h-11 px-5 text-sm font-semibold ${isBookmarked ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/60 text-foreground'}`}
                  onClick={() => {
                    if (!isAuthenticated) { setShowLoginModal(true); return; }
                    toggleBookmark.mutate();
                    toast.success(isBookmarked ? 'Removed from library' : 'Added to library');
                  }}
                >
                  {isBookmarked ? <Icon icon="ph:check-bold" className="w-4 h-4" /> : <Icon icon="ph:plus-bold" className="w-4 h-4" />}
                  {isBookmarked ? 'In Library' : 'Add to Library'}
                </Button>
                <Button
                  variant="secondary"
                  className={`rounded-lg border border-border/40 hover:bg-muted px-3.5 h-11 ${isSubscribed ? 'bg-primary/15 text-primary border-primary/30' : 'bg-muted/60 text-foreground'}`}
                  onClick={() => {
                    if (!isAuthenticated) { setShowLoginModal(true); return; }
                    toggleSubscription.mutate();
                    toast.success(isSubscribed ? 'Notifications disabled' : 'Notifications enabled');
                  }}
                >
                  {isSubscribed ? <Icon icon="ph:bell-slash-bold" className="w-4 h-4" /> : <Icon icon="ph:bell-bold" className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Share / Report / Discord Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/60 border border-border/50">
              <div>
                <p className="text-base font-semibold">Share {siteName}</p>
                <p className="text-sm text-muted-foreground">to your friends</p>
              </div>
              <Button size="icon" className="rounded-full bg-teal-500 hover:bg-teal-600 h-11 w-11 shadow-md" onClick={handleShare}>
                <Icon icon="ph:share-network-bold" className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {/* Report Card - always visible */}
              <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">Facing an Issue?</p>
                  <p className="text-xs text-muted-foreground">Let us know, and we'll help ASAP</p>
                </div>
                <Button size="sm" variant="destructive" className="text-sm rounded-lg gap-1.5 h-9 px-4" onClick={handleReport}>
                  <Icon icon="ph:warning-circle-bold" className="w-4 h-4" /> Report
                </Button>
              </div>
              {/* Donate Card - visible when donation URL is set */}
              {donationUrl && (
                <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-border/50">
                  <div>
                    <p className="text-sm font-semibold">Support Us</p>
                    <p className="text-xs text-muted-foreground">on {donationName}</p>
                  </div>
                  <Button size="sm" className="text-sm rounded-lg gap-1.5 h-9 px-4 bg-amber-500 hover:bg-amber-600 text-white" onClick={() => window.open(donationUrl, '_blank')}>
                    {donationIconUrl.includes('http') ? (
                      <img src={donationIconUrl} alt={donationName} className="w-4 h-4 object-contain" />
                    ) : (
                      <Icon icon={donationIconUrl || 'ph:heart-bold'} className="w-4 h-4" />
                    )}
                    {donationName}
                  </Button>
                </div>
              )}
              <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">Join Our Socials</p>
                  <p className="text-xs text-muted-foreground">to explore more</p>
                </div>
                <Button
                  size="sm"
                  className="text-sm rounded-lg gap-1.5 h-9 px-4 bg-[#5865F2] hover:bg-[#4752C4]"
                  onClick={() => window.open(discordUrl, '_blank')}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  Discord
                </Button>
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{chapters.length} Chapters</h2>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="ph:sort-descending-bold" className="w-4 h-4" />
                {sortDesc ? '9→1' : '1→9'}
              </button>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {visibleChapters.map((ch, idx) => {
                  const chDate = formatDistanceToNow(new Date(ch.created_at), { addSuffix: true });
                  const isFreeRelease = ch.free_release_at ? new Date(ch.free_release_at).getTime() <= Date.now() : false;
                  const isSubFreeRelease = ch.subscription_free_release_at ? new Date(ch.subscription_free_release_at).getTime() <= Date.now() : false;
                  const isPremium = !!ch.premium && !isFreeRelease && premiumSettings.premium_config.enable_coins;
                  const isSub = !!ch.is_subscription && !isSubFreeRelease;
                  const unlockRecord = getUnlockStatus(ch.id);
                  const isChapterUnlocked = !!unlockRecord;
                  const isNew = (Date.now() - new Date(ch.created_at).getTime()) < 24 * 60 * 60 * 1000;
                  const subBadgeLabel = premiumSettings.subscription_settings?.badge_label || 'Early Access';
                    return (
                      <Link
                        key={ch.id}
                        to={`/manga/${manga.slug}/chapter/${ch.number}`}
                        className="group flex items-center gap-4 p-3 rounded-[20px] bg-card border border-border/40 hover:bg-secondary hover:border-primary/30 hover:shadow-md transition-all h-[104px]"
                      >
                        {/* Thumbnail */}
                        <div className="relative shrink-0 h-full aspect-[4/3]">
                          <img
                            src={manga.cover_url}
                            alt=""
                            className={`w-full h-full object-cover rounded-xl shadow-sm transition-all duration-300 ${(isPremium && !isChapterUnlocked) || (isSub && !isSubscriber) ? 'opacity-40 grayscale-[0.5]' : 'group-hover:scale-105'}`}
                          />
                          {((isPremium && !isChapterUnlocked) || (isSub && !isSubscriber)) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl backdrop-blur-[1px]">
                              <Icon icon="ph:lock-key-fill" className="w-6 h-6 text-white drop-shadow-md" />
                            </div>
                          )}
                          {((isPremium && isChapterUnlocked) || (isSub && isSubscriber)) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-xl">
                              <Icon icon="ph:lock-key-open-fill" className="w-5 h-5 text-emerald-500 drop-shadow-lg" />
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex flex-col flex-1 min-w-0 justify-center gap-0.5">
                          {/* Row 1: Title & New Badge */}
                          <div className="flex items-center gap-2">
                            <h3 className="text-[15px] font-bold truncate group-hover:text-primary transition-colors">
                              Chapter {ch.number}
                            </h3>
                            {isNew && !isSub && (
                              <span className="px-1.5 py-0.5 rounded-[6px] bg-zinc-500/20 text-zinc-400 dark:bg-zinc-600 dark:text-zinc-200 text-[10px] font-bold uppercase tracking-wider animate-[pulse_2s_ease-in-out_infinite]">
                                New
                              </span>
                            )}
                          </div>

                          {/* Row 2: Release Time */}
                          <p className="text-[13px] font-medium text-muted-foreground/70 mb-1">
                            {isSub && ch.subscription_free_release_at && new Date(ch.subscription_free_release_at).getTime() > Date.now() ? (
                              <span className="text-amber-500 font-bold flex items-center gap-1" title={new Date(ch.subscription_free_release_at).toLocaleString()}>
                                <Icon icon="ph:timer-bold" /> Unlocks in {formatDistanceToNow(new Date(ch.subscription_free_release_at))}
                              </span>
                            ) : (
                              chDate
                            )}
                          </p>

                          {/* Row 3: Pricing */}
                          {(isPremium && !isChapterUnlocked) || (isSub && !isSubscriber) ? (
                            <div className="flex shrink-0">
                              <div
                                className="flex items-center gap-1.5 shadow-sm transition-transform group-hover:scale-105 w-fit rounded-[10px]"
                                style={{
                                  backgroundColor: badge_bg_color,
                                  padding: `${badge_padding_y}px ${badge_padding_x}px`
                                }}
                              >
                                {isSub ? (
                                  <Icon icon="mdi:latest" style={{ width: badge_icon_size, height: badge_icon_size, color: badge_text_color }} />
                                ) : (
                                  <CurrencyIcon size={badge_icon_size} className="text-current" style={{ color: badge_text_color }} />
                                )}
                                <span style={{ color: badge_text_color, fontSize: `${badge_font_size}px`, fontWeight: badge_font_weight, letterSpacing: '-0.025em' }}>
                                  {isSub ? subBadgeLabel : (ch.coin_price ?? 100)}
                                </span>
                              </div>
                            </div>
                          ) : (isPremium && isChapterUnlocked) || (isSub && isSubscriber) ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-bold uppercase tracking-wider w-fit bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              <Icon icon="ph:check-circle-fill" className="w-3.5 h-3.5" />
                              <span>Unlocked</span>
                            </div>
                          ) : (
                            <div className="flex shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center justify-center w-8 h-6 rounded-lg bg-primary/10 text-primary">
                                <Icon icon="ph:arrow-right-bold" className="w-4 h-4" />
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                })}
              </div>

              {!expanded && sortedChapters.length > 9 && (
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-3 pointer-events-none">
                  <button
                    onClick={() => setExpanded(true)}
                    className="pointer-events-auto flex items-center gap-1.5 px-5 py-2 rounded-lg bg-secondary border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <Icon icon="ph:caret-down-bold" className="w-4 h-4" /> Expand
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Reactions */}
          <div className="rounded-xl bg-secondary/60 border border-border/50 p-8 text-center space-y-5">
            <div>
              <p className="font-bold text-lg">What do you think?</p>
              <p className="text-sm text-muted-foreground">{Object.values(reactions).reduce((a, b) => a + b, 0)} Reactions</p>
            </div>
            <div className="flex justify-center flex-wrap gap-x-8 gap-y-4">
              {REACTIONS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setReactions(prev => ({ ...prev, [r.label]: prev[r.label] + 1 }))}
                  className="flex flex-col items-center gap-1.5 hover:scale-110 transition-transform"
                >
                  <span className="text-3xl">{r.emoji}</span>
                  <span className="text-sm font-medium text-muted-foreground">{reactions[r.label]}</span>
                  <span className="text-xs font-medium text-muted-foreground">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <CommentSection mangaId={manga.id} contextType="manga" contextId={manga.id} />
        </div>

        {/* Trending Sidebar */}
        <aside className="hidden xl:block w-full xl:w-[380px] shrink-0 space-y-4">
          <div className="flex items-center gap-2 px-1 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon icon="ph:fire-simple-fill" className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold tracking-tight">Trending</h3>
          </div>
          <div className="space-y-3">
            {trending.map((m, i) => (
              <Link
                key={m.id}
                to={`/manga/${m.slug}`}
                className="flex items-center gap-4 p-3 rounded-2xl transition-all group bg-card border border-border/50 hover:bg-secondary/80 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className="relative shrink-0">
                  <img src={m.cover_url} alt="" className="w-16 h-[88px] object-cover rounded-xl shadow-sm group-hover:shadow-md transition-shadow" />
                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center text-sm font-bold shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors">
                    {i + 1}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-bold leading-tight line-clamp-2 group-hover:text-primary transition-colors italic">{m.title}</p>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-muted-foreground/80">
                    <span className="flex items-center gap-1"><Icon icon="ph:book-open-bold" className="w-3 h-3" /> {m.type}</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1 text-primary"><Icon icon="ph:tag-bold" className="w-3 h-3" /> {m.genres?.[0] || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${m.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {m.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
