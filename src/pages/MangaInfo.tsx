"use client";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState, useEffect } from 'react';

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
import { filterVisibleChapters } from '@/lib/chapterVisibility';
import InfoPageStyle1 from '@/components/layouts/manga-info/InfoPageStyle1';

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
  const [chapterSearch, setChapterSearch] = useState('');

  // Social links from settings
  const discordUrl = (settings.general as any)?.discord_url || 'https://discord.gg';
  const donationUrl = (settings?.general as any)?.donation_url || '';
  const donationName = (settings?.general as any)?.donation_name || 'Patreon';
  const donationIconUrl = (settings?.general as any)?.donation_icon_url || '';
  const siteName = settings?.general?.site_name || 'MangaHub';

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

  const filteredChapters = filterVisibleChapters(chapters, premiumSettings?.premium_config);
  const sortedChapters = [...filteredChapters].sort((a, b) =>
    sortDesc ? b.number - a.number : a.number - b.number
  );
  const searchedChapters = chapterSearch.trim()
    ? sortedChapters.filter(ch => ch.number.toString().includes(chapterSearch.trim()))
    : sortedChapters;
  const visibleChapters = expanded ? searchedChapters : searchedChapters.slice(0, 9);
  const chapterListStyle = settings.layouts?.chapter_list_style || 'style-1';
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

  const infoPageStyle = settings.layouts?.manga_info_style || 'style-1';

  switch (infoPageStyle) {
    case 'style-1':
    default:
      return (
        <InfoPageStyle1
          manga={manga}
          chapters={chapters}
          trending={trending}
          settings={settings}
          premiumSettings={premiumSettings}
          isAuthenticated={isAuthenticated}
          isBookmarked={isBookmarked}
          isSubscribed={isSubscribed}
          isSubscriber={isSubscriber}
          getUnlockStatus={getUnlockStatus}
          toggleBookmark={toggleBookmark}
          toggleSubscription={toggleSubscription}
          setShowLoginModal={setShowLoginModal}
          showWarning={showWarning}
          handleWarningClose={handleWarningClose}
          visibleChapters={visibleChapters}
          sortedChapters={sortedChapters}
          searchedChapters={searchedChapters}
          chapterSearch={chapterSearch}
          setChapterSearch={setChapterSearch}
          sortDesc={sortDesc}
          setSortDesc={setSortDesc}
          expanded={expanded}
          setExpanded={setExpanded}
          maxChapter={maxChapter}
          latestDate={latestDate}
          siteName={siteName}
          discordUrl={discordUrl}
          donationUrl={donationUrl}
          donationName={donationName}
          donationIconUrl={donationIconUrl}
        />
      );
  }
}
