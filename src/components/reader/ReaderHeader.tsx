import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

import type { HeaderMode } from '@/hooks/useReaderSettings';

interface ReaderHeaderProps {
  mangaTitle: string;
  mangaSlug: string;
  mangaCover: string;
  chapterNum: number;
  chapterTitle?: string;
  headerMode: HeaderMode;
  onMenuOpen: () => void;
  isHeaderVisible: boolean;
}

export default function ReaderHeader({
  mangaTitle,
  mangaSlug,
  mangaCover,
  chapterNum,
  chapterTitle,
  headerMode,
  onMenuOpen,
  isHeaderVisible,
}: ReaderHeaderProps) {
  const chapterLine = `Chapter ${chapterNum}${chapterTitle ? ` — ${chapterTitle}` : ''}`;

  const shouldShow = headerMode === 'sticky' || isHeaderVisible;

  return (
    <header
      className={`z-50 bg-[#0f1117]/95 backdrop-blur-sm border-b border-white/5 transition-transform duration-300 ${
        headerMode === 'sticky' ? 'sticky top-0' : 'fixed top-0 left-0 right-0'
      } ${shouldShow ? 'translate-y-0' : '-translate-y-full'}`}
    >
      <div className="w-full px-3 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Left: Home + Cover + Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Home icon */}
            <Link
              to="/"
              className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/10 hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <Icon icon="lucide:home" className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" />
            </Link>

            {/* Cover thumbnail */}
            <Link to={`/manga/${mangaSlug}`} className="shrink-0">
              <img
                src={mangaCover}
                alt={mangaTitle}
                className="w-[36px] h-[46px] sm:w-[40px] sm:h-[52px] rounded-md object-cover"
              />
            </Link>

            {/* Title block */}
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-sm sm:text-[15px] leading-tight truncate">
                {mangaTitle}
              </p>
              <p className="text-gray-400 text-xs sm:text-[13px] leading-tight truncate mt-0.5">
                {chapterLine}
              </p>
            </div>
          </div>

          {/* Right: MENU button */}
          <button
            onClick={onMenuOpen}
            className="shrink-0 ml-2 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
          >
            <Icon icon="lucide:layout-grid" className="w-4 h-4 text-primary-foreground" />
            <span className="text-primary-foreground font-bold text-xs sm:text-sm tracking-wide">MENU</span>
          </button>
        </div>
      </div>
    </header>
  );
}
