import { Icon } from '@iconify/react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { ChapterSubPanel, PageSubPanel } from './ReaderSubPanels';
import AdvancedSettingsModal from './AdvancedSettingsModal';
import type { useReaderSettings } from '@/hooks/useReaderSettings';
import { useMangaBookmark } from '@/hooks/useBookmarks';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface Chapter {
  id: string;
  number: number;
  title?: string;
  premium?: boolean;
  coin_price?: number;
}

interface ReaderMenuPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mangaTitle: string;
  mangaSlug: string;
  mangaId: string;
  chapters: Chapter[];
  currentChapterNum: number;
  totalPages: number;
  currentPage: number;
  hasPrev: boolean;
  hasNext: boolean;
  readerSettings: ReturnType<typeof useReaderSettings>;
  onPageSelect: (page: number) => void;
}

export default function ReaderMenuPanel({
  isOpen,
  onClose,
  mangaTitle,
  mangaSlug,
  mangaId,
  chapters,
  currentChapterNum,
  totalPages,
  currentPage,
  hasPrev,
  hasNext,
  readerSettings,
  onPageSelect,
}: ReaderMenuPanelProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isBookmarked, toggleBookmark } = useMangaBookmark(mangaId);
  const [showChapterPanel, setShowChapterPanel] = useState(false);
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportText, setReportText] = useState('');
  const isMobile = useIsMobile();
  const sortedChapters = [...chapters].sort((a, b) => a.number - b.number);
  const currentChapterIndex = sortedChapters.findIndex(c => c.number === currentChapterNum);
  const prevChapter = currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < sortedChapters.length - 1 ? sortedChapters[currentChapterIndex + 1] : null;

  const { settings, cycleHeaderMode, cycleDisplayMode, cycleFitMode, cycleReadingDirection, cycleProgressPosition, update, updateImage } = readerSettings;

  const handleCycleDisplayMode = () => {
    if (isMobile) {
      if (settings.displayMode === 'longstrip') update('displayMode', 'single');
      else update('displayMode', 'longstrip');
    } else {
      cycleDisplayMode();
    }
  };

  const handleChapterNav = useCallback((chapterNum: number) => {
    navigate(`/manga/${mangaSlug}/chapter/${chapterNum}`);
    onClose();
  }, [navigate, mangaSlug, onClose]);

  const handleReport = () => {
    toast({ title: 'Report submitted', description: 'Thanks for letting us know.' });
    setShowReportInput(false);
    setReportText('');
  };

  const handleShare = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(`${mangaTitle} - Chapter ${currentChapterNum}`);
    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      discord: `https://discord.com/channels/@me`,
      reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
    };
    window.open(urls[platform], '_blank', 'noopener,noreferrer');
  };

  // Setting row display info
  const headerModeInfo = settings.headerMode === 'sticky'
    ? { label: 'Header Sticky', icon: <Icon icon="ph:monitor-bold" className="w-4 h-4" /> }
    : { label: 'Header Hidden', icon: <Icon icon="ph:app-window-bold" className="w-4 h-4" /> };

  const displayModeInfo = {
    longstrip: { label: 'Long Strip', icon: <Icon icon="ph:rows-bold" className="w-4 h-4" /> },
    single: { label: 'Single Page', icon: <Icon icon="ph:file-text-bold" className="w-4 h-4" /> },
    double: { label: 'Double Page', icon: <Icon icon="ph:book-open-bold" className="w-4 h-4" /> },
  }[settings.displayMode];

  const fitModeInfo = {
    height: { label: 'Fit Height', icon: <Icon icon="ph:arrows-out-line-vertical-bold" className="w-4 h-4" /> },
    width: { label: 'Fit Width', icon: <Icon icon="ph:arrows-out-line-horizontal-bold" className="w-4 h-4" /> },
    nolimit: { label: 'No Limit', icon: <Icon icon="ph:corners-out-bold" className="w-4 h-4" /> },
  }[settings.fitMode];

  const directionInfo = settings.readingDirection === 'rtl'
    ? { label: 'Right to Left', icon: <Icon icon="ph:arrow-right-bold" className="w-4 h-4 scale-x-[-1]" /> }
    : { label: 'Left to Right', icon: <Icon icon="ph:arrow-right-bold" className="w-4 h-4" /> };

  const progressInfo = {
    bottom: { label: 'Bottom Progress', icon: <Icon icon="ph:arrow-down-bold" className="w-4 h-4" /> },
    left: { label: 'Left Progress', icon: <Icon icon="ph:arrow-left-bold" className="w-4 h-4" /> },
    none: { label: 'No Progress', icon: <span className="text-sm text-gray-500">—</span> },
  }[settings.progressPosition];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-[280px] sm:w-[300px] bg-[#0d1117] border-l border-white/5 shadow-2xl overflow-hidden transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto relative">
          {/* A) Title + Close */}
          <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
            <h2 className="text-base font-semibold text-white leading-tight truncate flex-1 italic">
              {mangaTitle}
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
            </button>
          </div>

          {/* B) YOU ARE READING */}
          <div className="px-4 py-2.5 bg-white/[0.03] mx-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">you are reading</p>
                <p className="text-sm text-white font-medium mt-0.5">by chapter</p>
              </div>
              <Icon icon="ph:arrows-clockwise-bold" className="w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* C) Language */}
          <div className="flex items-center gap-2 px-4 py-3 mx-3 mt-2 rounded-lg bg-white/[0.03]">
            <Icon icon="ph:globe-bold" className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">Language</span>
            <span className="ml-auto text-sm text-white font-medium">English</span>
          </div>

          {/* D) Chapter selector */}
          <div className="flex items-center gap-1 px-3 mt-3">
            <button
              disabled={!prevChapter}
              onClick={() => prevChapter && handleChapterNav(prevChapter.number)}
              className="w-8 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowChapterPanel(true)}
              className="flex-1 h-9 rounded-lg bg-white/5 flex items-center justify-center gap-1 text-sm text-white hover:bg-white/10 transition-colors"
            >
              Chapter {currentChapterNum}
              <Icon icon="ph:caret-down-bold" className="w-3 h-3 text-gray-500" />
            </button>
            <button
              disabled={!nextChapter}
              onClick={() => nextChapter && handleChapterNav(nextChapter.number)}
              className="w-8 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
            </button>
          </div>

          {/* E) Page selector */}
          <div className="flex items-center gap-1 px-3 mt-2">
            <button
              disabled={currentPage <= 0}
              onClick={() => onPageSelect(currentPage - 1)}
              className="w-8 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Icon icon="ph:caret-left-bold" className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowPagePanel(true)}
              className="flex-1 h-9 rounded-lg bg-white/5 flex items-center justify-center gap-1 text-sm text-white hover:bg-white/10 transition-colors"
            >
              Page {currentPage + 1}
              <Icon icon="ph:caret-down-bold" className="w-3 h-3 text-gray-500" />
            </button>
            <button
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageSelect(currentPage + 1)}
              className="w-8 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <Icon icon="ph:caret-right-bold" className="w-4 h-4" />
            </button>
          </div>

          {/* F) Action rows */}
          <div className="mt-4 mx-3 border-t border-white/5 pt-2">
            <button
              onClick={() => toggleBookmark.mutate()}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                isBookmarked 
                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon icon={isBookmarked ? "ph:check-bold" : "ph:plus-bold"} className="w-4 h-4" />
              <span className="flex-1 text-right">{isBookmarked ? 'In Library' : 'Add to Library'}</span>
            </button>
            <button
              onClick={() => { navigate(`/manga/${mangaSlug}`); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon icon="ph:info-bold" className="w-4 h-4" />
              <span className="flex-1 text-right">Manga Detail</span>
            </button>
            <button
              onClick={() => setShowReportInput(!showReportInput)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon icon="ph:warning-circle-bold" className="w-4 h-4" />
              <span className="flex-1 text-right">Report Error</span>
            </button>
            {showReportInput && (
              <div className="px-3 pb-2 space-y-2">
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 resize-none"
                />
                <button
                  onClick={handleReport}
                  className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Submit Report
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="mx-6 my-2 border-t border-white/5" />

          {/* G) Settings rows */}
          <div className="mx-3 space-y-0.5">
            <button onClick={cycleHeaderMode} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>{headerModeInfo.label}</span>
              {headerModeInfo.icon}
            </button>
            <button onClick={handleCycleDisplayMode} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>{displayModeInfo.label}</span>
              {displayModeInfo.icon}
            </button>
            <button onClick={cycleFitMode} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>{fitModeInfo.label}</span>
              {fitModeInfo.icon}
            </button>
            <button onClick={cycleReadingDirection} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>{directionInfo.label}</span>
              {directionInfo.icon}
            </button>
            <button onClick={cycleProgressPosition} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>{progressInfo.label}</span>
              {progressInfo.icon}
            </button>
            <button onClick={() => setShowAdvanced(true)} className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors">
              <span>Advanced Settings</span>
              <Icon icon="ph:sliders-horizontal-bold" className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom padding */}
          <div className="pb-6" />
        </div>

        {/* Sub-panels */}
        <ChapterSubPanel
          isOpen={showChapterPanel}
          onClose={() => setShowChapterPanel(false)}
          chapters={chapters}
          currentChapterNum={currentChapterNum}
          mangaSlug={mangaSlug}
          onNavigate={handleChapterNav}
        />
        <PageSubPanel
          isOpen={showPagePanel}
          onClose={() => setShowPagePanel(false)}
          totalPages={totalPages}
          currentPage={currentPage}
          onPageSelect={(p) => { onPageSelect(p); setShowPagePanel(false); }}
        />
      </div>

      {/* Advanced Settings Modal */}
      <AdvancedSettingsModal
        isOpen={showAdvanced}
        onClose={() => setShowAdvanced(false)}
        displayMode={settings.displayMode}
        fitMode={settings.fitMode}
        readingDirection={settings.readingDirection}
        stripMargin={settings.stripMargin}
        showTips={settings.showTips}
        advancedProgressPosition={settings.advancedProgressPosition}
        imageSettings={settings.imageSettings}
        onDisplayModeChange={(m) => update('displayMode', m)}
        onReadingDirectionChange={(d) => update('readingDirection', d)}
        onStripMarginChange={(v) => update('stripMargin', v)}
        onShowTipsChange={(v) => update('showTips', v)}
        onAdvancedProgressChange={(p) => update('advancedProgressPosition', p)}
        onImageSettingChange={updateImage}
      />
    </>
  );
}
