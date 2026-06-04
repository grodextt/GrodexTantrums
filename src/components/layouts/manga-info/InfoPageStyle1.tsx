"use client";
import { Link } from "react-router-dom";
import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import TypeFlag from '@/components/TypeFlag';
import CommentSection from '@/components/CommentSection';
import { ContentWarningDialog } from '@/components/ContentWarningDialog';
import { toast } from 'sonner';

// Import Chapter List Switcher
import ChapterListStyle1 from '@/components/layouts/chapters/ChapterListStyle1';
import ChapterListStyle2 from '@/components/layouts/chapters/ChapterListStyle2';

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

export default function InfoPageStyle1({
  manga,
  chapters,
  trending,
  settings,
  premiumSettings,
  isAuthenticated,
  isBookmarked,
  isSubscribed,
  isSubscriber,
  getUnlockStatus,
  toggleBookmark,
  toggleSubscription,
  setShowLoginModal,
  showWarning,
  handleWarningClose,
  visibleChapters,
  sortedChapters,
  searchedChapters,
  chapterSearch,
  setChapterSearch,
  sortDesc,
  setSortDesc,
  expanded,
  setExpanded,
  maxChapter,
  latestDate,
  siteName,
  discordUrl,
  donationUrl,
  donationName,
  donationIconUrl
}: any) {
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(
    Object.fromEntries(REACTIONS.map(r => [r.label, 0]))
  );

  const chapterListStyle = settings.layouts?.chapter_list_style || 'style-1';

  const badgeProps = {
    bg_color: premiumSettings.coin_system.badge_bg_color || '#E8D47E',
    text_color: premiumSettings.coin_system.badge_text_color || '#A57C1B',
    padding_x: premiumSettings.coin_system.badge_padding_x || 12,
    padding_y: premiumSettings.coin_system.badge_padding_y || 3,
    icon_size: premiumSettings.coin_system.badge_icon_size || 14,
    font_size: premiumSettings.coin_system.badge_font_size || 13,
    font_weight: premiumSettings.coin_system.badge_font_weight || 900,
  };

  const renderChapterList = () => {
    switch (chapterListStyle) {
      case 'style-2':
        return (
          <ChapterListStyle2 
            manga={manga} 
            visibleChapters={visibleChapters} 
            premiumSettings={premiumSettings}
            badgeProps={badgeProps}
            getUnlockStatus={getUnlockStatus}
            isSubscriber={isSubscriber}
          />
        );
      case 'style-1':
      default:
        return (
          <ChapterListStyle1 
            manga={manga} 
            visibleChapters={visibleChapters} 
            premiumSettings={premiumSettings}
            badgeProps={badgeProps}
            getUnlockStatus={getUnlockStatus}
            isSubscriber={isSubscriber}
          />
        );
    }
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
                {manga.genres?.slice(0, 4).map((g: string) => (
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
              {/* Report Card */}
              <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">Facing an Issue?</p>
                  <p className="text-xs text-muted-foreground">Let us know, and we'll help ASAP</p>
                </div>
                <Button size="sm" variant="destructive" className="text-sm rounded-lg gap-1.5 h-9 px-4" onClick={handleReport}>
                  <Icon icon="ph:warning-circle-bold" className="w-4 h-4" /> Report
                </Button>
              </div>
              {/* Donate Card */}
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

          {/* Chapters List */}
          <div className="space-y-4">
            {/* Header row — varies by style */}
            {chapterListStyle === 'style-2' ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 shrink-0">
                  <h2 className="text-lg font-bold">{chapters.length} Chapters</h2>
                  <button
                    onClick={() => setSortDesc(!sortDesc)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-muted/60 border border-border/40 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={sortDesc ? 'Descending' : 'Ascending'}
                  >
                    <Icon icon={sortDesc ? 'streamline:descending-number-order' : 'streamline:ascending-number-order'} className="w-[18px] h-[18px]" />
                  </button>
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                  <Icon icon="ph:magnifying-glass-bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search chapter by number."
                    value={chapterSearch}
                    onChange={e => setChapterSearch(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-2xl bg-muted/60 border border-border/40 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            ) : (
              <div className="relative flex items-center">
                <Icon icon="ph:magnifying-glass-bold" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search chapter by number."
                  value={chapterSearch}
                  onChange={e => setChapterSearch(e.target.value)}
                  className="w-full h-12 pl-12 pr-14 rounded-2xl bg-muted/60 border border-border/40 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={() => setSortDesc(!sortDesc)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl bg-background border border-border/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shadow-sm"
                  title={sortDesc ? 'Descending' : 'Ascending'}
                >
                  <Icon icon={sortDesc ? 'streamline:descending-number-order' : 'streamline:ascending-number-order'} className="w-[18px] h-[18px]" />
                </button>
              </div>
            )}

            <div className="relative">
              {renderChapterList()}

              {!expanded && searchedChapters.length > 9 && (
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
            {trending.map((m: any, i: number) => (
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
