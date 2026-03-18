import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroCarousel from '@/components/HeroCarousel';
import MangaCard from '@/components/MangaCard';
import AnnouncementBar from '@/components/AnnouncementBar';
import PinnedCarousel from '@/components/PinnedCarousel';
import LatestUpdates from '@/components/LatestUpdates';
import EditorChoice from '@/components/EditorChoice';
import CompletedSeries from '@/components/CompletedSeries';
import TypeBadge from '@/components/TypeBadge';
import { useAllManga } from '@/hooks/useAllManga';
import { useTrendingManga } from '@/hooks/useTrendingManga';
import { optimizedImageUrl } from '@/lib/utils';

export default function Index() {
  const { data: allManga = [] } = useAllManga();
  const { data: trending = [] } = useTrendingManga(6);
  const mangaType = allManga.filter(m => m.type === 'manga');

  return (
    <div className="py-6 space-y-10">
      {/* Hero — full width */}
      <div className="-mx-0">
        <HeroCarousel />
      </div>

      <div className="container max-w-[1600px] xl:px-12 2xl:px-16 space-y-10">

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
                  src={optimizedImageUrl(m.cover_url, 300)}
                  alt={m.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute top-2 left-2">
                  <TypeBadge type={m.type} />
                </div>
              </div>
              <div className="bg-secondary/80 rounded-md px-2 py-1.5 mt-2 flex items-center gap-2">
                <span className="text-2xl font-extrabold text-primary">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{m.title}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">{m.type}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <AnnouncementBar />

        {/* Pinned Carousel */}
        <div className="content-defer">
          <PinnedCarousel />
        </div>

        {/* Latest Updates */}
        <div className="content-defer">
          <LatestUpdates />
        </div>

        {/* Editor's Choice */}
        <div className="content-defer">
          <EditorChoice />
        </div>

        {/* Completed Series */}
        <div className="content-defer">
          <CompletedSeries />
        </div>

        {/* Manga */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Manga</h2>
            <Link to="/series?type=manga" className="flex items-center gap-1 text-sm text-primary hover:underline">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {mangaType.slice(0, 6).map(m => (
              <MangaCard key={m.id} manga={m} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
