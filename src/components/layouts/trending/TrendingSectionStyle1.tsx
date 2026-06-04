"use client";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import { optimizedImageUrl } from '@/lib/utils';
import TypeBadge from '@/components/TypeBadge';

interface TrendingManga {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  type: string;
  genres: string[];
}

interface TrendingSectionStyle1Props {
  trending: TrendingManga[];
}

export default function TrendingSectionStyle1({ trending }: TrendingSectionStyle1Props) {
  return (
    <section>
      <h2 className="text-2xl font-extrabold mb-4 flex items-center gap-2">
        <Icon icon="ph:trend-up-bold" className="w-6 h-6 text-primary" />
        Trending
      </h2>
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
            <div className="mt-2.5 flex items-center gap-3 px-1">
              <span className="text-4xl font-black text-primary leading-none shrink-0" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>{i + 1}</span>
              <div className="min-w-0 flex flex-col justify-center">
                <p className="text-sm font-bold text-foreground truncate leading-tight">{m.title}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5 capitalize">
                  {m.genres?.slice(0, 2).join(', ') || m.type}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
