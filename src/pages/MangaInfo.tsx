import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Plus, Bell, Share2, AlertCircle, ChevronDown, ArrowDownNarrowWide } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMangaBySlug, getTrendingManga, formatViews } from '@/data/mockManga';
import TypeBadge from '@/components/TypeBadge';
import CommentSection from '@/components/CommentSection';

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
    <div className="container py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header: Cover + Info */}
          <div className="flex flex-col sm:flex-row gap-5">
            <img
              src={manga.cover}
              alt={manga.title}
              className="w-40 h-56 sm:w-44 sm:h-60 object-cover rounded-xl shrink-0 mx-auto sm:mx-0"
            />
            <div className="flex-1 space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{manga.title}</h1>

              <div>
                <p className="text-sm text-muted-foreground font-medium">Alternative titles</p>
                <p className="text-xs text-muted-foreground/70">—</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-3 py-1 rounded text-xs font-bold ${manga.status === 'Ongoing' ? 'bg-green-600 text-white' : manga.status === 'Completed' ? 'bg-blue-600 text-white' : 'bg-yellow-600 text-white'}`}>
                  {manga.status}
                </span>
                <TypeBadge type={manga.type} />
                <span className="text-xs text-muted-foreground">⏱ 4 days ago</span>
                {manga.genres.slice(0, 4).map(g => (
                  <span key={g} className="text-xs text-muted-foreground">{g}</span>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {manga.genres.map(g => (
                  <span key={g} className="px-2.5 py-1 rounded-md bg-secondary border border-border text-xs text-foreground">
                    {g}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div className="bg-secondary/60 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed border border-border/50">
                {manga.description}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Link to={`/manga/${manga.slug}/chapter/1`}>
                  <Button size="sm" variant="secondary" className="gap-2 rounded-lg">
                    <Play className="w-3.5 h-3.5" /> Start Reading
                  </Button>
                </Link>
                <Link to={`/manga/${manga.slug}/chapter/${maxChapter}`}>
                  <Button size="sm" variant="secondary" className="gap-2 rounded-lg">
                    <Play className="w-3.5 h-3.5" /> New Chapter
                  </Button>
                </Link>
                <Button size="sm" variant="secondary" className="gap-2 rounded-lg">
                  <Plus className="w-3.5 h-3.5" /> Add to Library
                </Button>
                <Button size="sm" variant="secondary" className="rounded-lg px-2.5">
                  <Bell className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Share / Report / Discord Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/60 border border-border/50">
              <div>
                <p className="text-sm font-semibold">Share Kayn Scan</p>
                <p className="text-xs text-muted-foreground">to your friends</p>
              </div>
              <Button size="icon" className="rounded-full bg-primary h-9 w-9">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-xs font-medium">Facing an Issue?</p>
                  <p className="text-[10px] text-muted-foreground">Let us know, and we'll help ASAP</p>
                </div>
                <Button size="sm" variant="destructive" className="text-xs rounded-lg gap-1 h-7">
                  <AlertCircle className="w-3 h-3" /> Report
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-between p-3 rounded-xl bg-secondary/60 border border-border/50">
                <div>
                  <p className="text-xs font-medium">Join Our Socials</p>
                  <p className="text-[10px] text-muted-foreground">to explore more</p>
                </div>
                <Button size="sm" className="text-xs rounded-lg gap-1 h-7 bg-[#5865F2] hover:bg-[#4752C4]">
                  Discord
                </Button>
              </div>
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{manga.chapters.length} Chapters</h2>
              <button
                onClick={() => setSortDesc(!sortDesc)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowDownNarrowWide className="w-4 h-4" />
                {sortDesc ? '9→1' : '1→9'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {visibleChapters.map(ch => (
                <Link
                  key={ch.id}
                  to={`/manga/${manga.slug}/chapter/${ch.number}`}
                  className="group flex items-center gap-2.5 p-2 rounded-lg bg-secondary/50 border border-border/40 hover:bg-secondary hover:border-border transition-colors"
                >
                  <img
                    src={manga.cover}
                    alt=""
                    className="w-14 h-14 object-cover rounded-md shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">Chapter {ch.number}</p>
                    <p className="text-[10px] text-muted-foreground">{ch.date}</p>
                  </div>
                </Link>
              ))}
            </div>

            {!expanded && sortedChapters.length > 9 && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className="w-4 h-4" /> Expand
              </button>
            )}
          </div>

          {/* Reactions */}
          <div className="rounded-xl bg-secondary/60 border border-border/50 p-6 text-center space-y-4">
            <div>
              <p className="font-bold">What do you think?</p>
              <p className="text-xs text-muted-foreground">{Object.values(reactions).reduce((a, b) => a + b, 0)} Reactions</p>
            </div>
            <div className="flex justify-center gap-5">
              {REACTIONS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setReactions(prev => ({ ...prev, [r.label]: prev[r.label] + 1 }))}
                  className="flex flex-col items-center gap-1 hover:scale-110 transition-transform"
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <span className="text-xs text-muted-foreground">{reactions[r.label]}</span>
                  <span className="text-[10px] text-muted-foreground">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <CommentSection comments={manga.comments} />
        </div>

        {/* Trending Sidebar */}
        <aside className="w-full lg:w-72 xl:w-80 shrink-0 space-y-2">
          {trending.map((m, i) => (
            <Link
              key={m.id}
              to={`/manga/${m.slug}`}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/80 transition-colors group"
            >
              <img src={m.cover} alt="" className="w-11 h-14 object-cover rounded-md shrink-0" />
              <span className="text-lg font-bold text-muted-foreground/50 shrink-0 w-5 text-center">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{m.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{m.genres.slice(0, 3).join(', ')}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TypeBadge type={m.type} />
                  {m.status === 'Completed' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-600 text-white font-medium">Completed</span>
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
