import { Link } from 'react-router-dom';
import { ArrowRight, Megaphone } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import MangaCard from '@/components/MangaCard';
import AnnouncementBar from '@/components/AnnouncementBar';
import PinnedCarousel from '@/components/PinnedCarousel';
import LatestUpdates from '@/components/LatestUpdates';
import EditorChoice from '@/components/EditorChoice';
import CompletedSeries from '@/components/CompletedSeries';
import TypeBadge from '@/components/TypeBadge';
import { getTrendingManga, mockManga } from '@/data/mockManga';

export default function Index() {
  const trending = getTrendingManga();
  const mangaType = mockManga.filter(m => m.type === 'Manga');

  return (
    <div className="container py-6 space-y-10">
      {/* Hero */}
      <HeroCarousel />

      {/* Trending */}
      <section>
        <h2 className="text-2xl font-extrabold mb-4">Trending</h2>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {trending.map((m, i) => (
            <Link
              key={m.id}
              to={`/manga/${m.slug}`}
              className="flex-shrink-0 w-[70vw] sm:w-[45vw] md:w-[30vw] lg:w-[calc(100%/6-14px)] group"
            >
              <div className="relative overflow-hidden rounded-lg aspect-[3/4.2] bg-secondary">
                <img
                  src={m.cover}
                  alt={m.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <TypeBadge type={m.type} variant="uniform" />
                </div>
              </div>
              <div className="mt-2">
                <p className="text-sm font-bold text-foreground truncate">
                  <span className="text-primary mr-1.5">{i + 1}.</span>
                  {m.title}
                </p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {m.genres.slice(0, 2).join(' · ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* New manga announcement */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 text-sm">
        <Megaphone className="w-4 h-4 text-primary shrink-0" />
        <span className="text-muted-foreground">
          <strong className="text-foreground">New Manga Series Added</strong> · Check out our latest additions in the 'Latest Series' section — your feedback means a lot!
        </span>
        <Link to="/latest" className="ml-auto text-primary hover:underline text-xs font-medium whitespace-nowrap">View all</Link>
      </div>

      {/* Pinned Series */}
      <PinnedCarousel />

      {/* Latest Updates */}
      <LatestUpdates />

      {/* Editor's Choice */}
      <EditorChoice />

      {/* Manga - Black & White */}
      {mangaType.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Manga – Black & White</h2>
            <Link to="/series" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mangaType.map(m => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Series */}
      <CompletedSeries />
    </div>
  );
}
