"use client";
import { Link } from "react-router-dom";

import { Icon } from '@iconify/react';
import HeroCarousel from '@/components/HeroCarousel';
import MangaCard from '@/components/MangaCard';
import AnnouncementBar from '@/components/AnnouncementBar';
import PinnedCarousel from '@/components/PinnedCarousel';
import LatestUpdates from '@/components/LatestUpdates';
import EditorChoice from '@/components/EditorChoice';
import Collections from '@/components/Collections';
import TypeBadge from '@/components/TypeBadge';
import { useAllManga } from '@/hooks/useAllManga';
import { useTrendingManga } from '@/hooks/useTrendingManga';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { optimizedImageUrl } from '@/lib/utils';
import TrendingSectionStyle1 from '@/components/layouts/trending/TrendingSectionStyle1';

export default function Index() {
  const { data: allManga = [] } = useAllManga();
  const { data: trending = [] } = useTrendingManga(6);
  const { settings } = useSiteSettings();
  const mangaType = allManga.filter(m => m.type === 'manga');

  return (
    <div className="py-6 space-y-10">
      {/* Hero — full width */}
      <div className="-mx-0">
        <HeroCarousel />
      </div>

      <div className="container max-w-[1600px] xl:px-12 2xl:px-16 space-y-10">

      {/* Trending */}
      {settings.layouts.trending_visible && (
        (() => {
          const trendingStyle = settings.layouts.trending_style || 'style-1';
          switch (trendingStyle) {
            case 'style-1':
            default:
              return <TrendingSectionStyle1 trending={trending as any} />;
          }
        })()
      )}

      {/* Collections */}
      {settings.layouts.collections_visible && <Collections />}

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
      </div>
    </div>
  );
}
