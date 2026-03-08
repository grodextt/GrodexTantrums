import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Plus, Bell, Share2, AlertCircle, ChevronDown, ArrowDownNarrowWide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMangaBySlug, getTrendingManga } from '@/data/mockManga';
import TypeBadge from '@/components/TypeBadge';
import TypeFlag from '@/components/TypeFlag';
import CommentSection from '@/components/CommentSection';

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
  const manga = getMangaBySlug(slug || '');
  const trending = getTrendingManga().slice(0, 8);
  const [expanded, setExpanded] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>(
    Object.fromEntries(REACTIONS.map(r => [r.label, 0]))
  );
  const [sortDesc, setSortDesc] = useState(true);

  if (!manga) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold">Manga not found</h1>
        <Link to="/" className="text-primary hover:underline mt-2 inline-block">Go Home</Link>
      </div>
    );
  }

  const sortedChapters = [...manga.chapters].sort((a, b) =>
    sortDesc ? b.number - a.number : a.number - b.number
  );
  const visibleChapters = expanded ? sortedChapters : sortedChapters.slice(0, 9);
  const maxChapter = manga.chapters.length > 0 ? Math.max(...manga.chapters.map(c => c.number)) : 0;

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-6">
      <div className="flex flex-col xl:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Header: Cover + Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={manga.cover}
              alt={manga.title}
              className="w-64 h-[360px] object-cover rounded-xl shrink-0 mx-auto sm:mx-0 shadow-lg"
            />
            <div className="flex-1 min-w-0 space-y-3.5">
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{manga.title}</h1>

              {manga.altTitles && manga.altTitles.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Alternative titles</p>
                  <p className="text-sm text-muted-foreground/70">{manga.altTitles.join(' · ')}</p>
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap overflow-hidden">
                <span className={`px-3.5 py-1.5 rounded-lg text-sm font-bold ${manga.status === 'Ongoing' ? 'bg-green-600 text-white' : manga.status === 'Completed' ? 'bg-red-600 text-white' : 'bg-yellow-600 text-white'}`}>
                  {manga.status}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-sm text-foreground font-medium">
                  <TypeFlag type={manga.type} /> {manga.type}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-sm text-foreground font-medium">
                  🕐 {manga.chapters[0]?.date || '4 days ago'}
                </span>
                {manga.genres.slice(0, 4).map(g => (
                  <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/60 border border-border/40 text-sm text-foreground font-medium">
                    <span className="text-sm">{GENRE_EMOJI[g] || '📖'}</span> {g}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-secondary/60 rounded-lg p-4 text-base leading-relaxed text-foreground border border-border/50 break-words">
                {manga.description}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                <Link to={`/manga/${manga.slug}/chapter/1`}>
                  <Button variant="secondary" className="gap-2 rounded-lg bg-muted/60 border border-border/40 hover:bg-muted h-11 px-5 text-sm font-semibold text-foreground">
                    <Play className="w-4 h-4" /> Start Reading
                  </Button>
                </Link>
                <Link to={`/manga/${manga.slug}/chapter/${maxChapter}`}>
                  <Button variant="secondary" className="gap-2 rounded-lg bg-muted/60 border border-border/40 hover:bg-muted h-11 px-5 text-sm font-semibold text-foreground">
                    <Play className="w-4 h-4" /> New Chapter
                  </Button>
                </Link>
                <Button variant="secondary" className="gap-2 rounded-lg bg-muted/60 border border-border/40 hover:bg-muted h-11 px-5 text-sm font-semibold text-foreground">
                  <Plus className="w-4 h-4" /> Add to Library
                </Button>
                <Button variant="secondary" className="rounded-lg bg-muted/60 border border-border/40 hover:bg-muted px-3.5 h-11 text-foreground">
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Share / Report / Discord Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-5 rounded-xl bg-secondary/60 border border-border/50">
              <div>
                <p className="text-base font-semibold">Share Kayn Scan</p>
                <p className="text-sm text-muted-foreground">to your friends</p>
              </div>
              <Button size="icon" className="rounded-full bg-teal-500 hover:bg-teal-600 h-11 w-11 shadow-md">
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">Facing an Issue?</p>
                  <p className="text-xs text-muted-foreground">Let us know, and we'll help ASAP</p>
                </div>
                <Button size="sm" variant="destructive" className="text-sm rounded-lg gap-1.5 h-9 px-4">
                  <AlertCircle className="w-4 h-4" /> Report
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-between p-4 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-sm font-semibold">Join Our Socials</p>
                  <p className="text-xs text-muted-foreground">to explore more</p>
                </div>
                <Button size="sm" className="text-sm rounded-lg gap-1.5 h-9 px-4 bg-[#5865F2] hover:bg-[#4752C4]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  Discord
                </Button>
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{manga.chapters.length} Chapters</h2>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowDownNarrowWide className="w-4 h-4" />
                {sortDesc ? '9→1' : '1→9'}
              </button>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {visibleChapters.map((ch, idx) => (
                  <Link
                    key={ch.id}
                    to={`/manga/${manga.slug}/chapter/${ch.number}`}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/40 hover:bg-secondary hover:border-border transition-all"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={`/manga/cover${(ch.number % 8) + 1}.jpg`}
                        alt=""
                        className="w-[72px] h-[56px] object-cover rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">Chapter {ch.number}</p>
                        {idx === 0 && sortDesc && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground font-semibold">New</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{ch.date}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {!expanded && sortedChapters.length > 9 && (
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent flex items-end justify-center pb-3 pointer-events-none">
                  <button
                    onClick={() => setExpanded(true)}
                    className="pointer-events-auto flex items-center gap-1.5 px-5 py-2 rounded-lg bg-secondary border border-border/50 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" /> Expand
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
          <CommentSection comments={manga.comments} />
        </div>

        {/* Trending Sidebar */}
        <aside className="w-full xl:w-[380px] shrink-0 space-y-2.5">
          {trending.map((m, i) => (
            <Link
              key={m.id}
              to={`/manga/${m.slug}`}
              className="flex items-center gap-3.5 p-3.5 rounded-xl transition-colors group bg-secondary/40 border border-border/30 hover:bg-secondary/70"
            >
              <img src={m.cover} alt="" className="w-14 h-[76px] object-cover rounded-lg shrink-0" />
              <span className="text-2xl font-bold text-muted-foreground/40 shrink-0 w-7 text-center">{i + 1}</span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{m.title}</p>
                <p className="text-xs text-destructive/80 truncate">{m.genres.slice(0, 3).join(', ')}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">{m.type}</span>
                  {m.status === 'Completed' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-md bg-destructive text-destructive-foreground font-semibold">Completed</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
