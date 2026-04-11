import { Icon } from '@iconify/react';
import { useState, useRef, useEffect } from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';

interface Chapter {
  id: string;
  number: number;
  title?: string;
  premium?: boolean;
  coin_price?: number;
  free_release_at?: string;
  is_subscription?: boolean;
  subscription_free_release_at?: string;
}

interface ChapterSubPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  currentChapterNum: number;
  mangaSlug: string;
  onNavigate: (chapterNum: number) => void;
}

export function ChapterSubPanel({
  isOpen,
  onClose,
  chapters,
  currentChapterNum,
  mangaSlug,
  onNavigate,
}: ChapterSubPanelProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const { settings: premiumSettings } = usePremiumSettings();
  const currencyName = premiumSettings.coin_system.currency_name;
  const currencyIconUrl = premiumSettings.coin_system.currency_icon_url;
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: userUnlocks = [] } = useQuery({
    queryKey: ['user-chapter-unlocks-panel', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('chapter_unlocks')
        .select('chapter_id, unlock_type, expires_at')
        .eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user && isOpen,
  });

  useEffect(() => {
    if (isOpen && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const getUnlockStatus = (chapterId: string) => {
    const unlock = userUnlocks.find(u => u.chapter_id === chapterId);
    if (!unlock) return null;
    if (unlock.expires_at && new Date(unlock.expires_at) <= new Date()) return null;
    return unlock;
  };

  const sortedChapters = [...chapters].sort((a, b) => b.number - a.number);
  const filtered = search.trim()
    ? sortedChapters.filter(ch => String(ch.number).includes(search.trim()))
    : sortedChapters;

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Icon icon="lucide:coins" className={className} />
    );

  return (
    <div
      className={`absolute inset-0 z-10 bg-[#0d1117] transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm font-semibold text-white">Chapters</span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="relative">
          <Icon icon="lucide:search" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Find number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-gray-500 outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Chapter list */}
      <ScrollArea className="h-[calc(100%-96px)]">
        <div className="px-2 py-1">
          {filtered.map(ch => {
            const isCurrent = ch.number === currentChapterNum;
            const unlockRecord = getUnlockStatus(ch.id);
            const isUnlocked = !!unlockRecord;
            const isTicketUnlock = unlockRecord?.unlock_type === 'ticket';
            const ticketExpiry = isTicketUnlock && unlockRecord?.expires_at;

            const daysLeft = ticketExpiry
              ? Math.max(0, Math.ceil((new Date(ticketExpiry).getTime() - Date.now()) / 86400000))
              : 0;
            const hoursLeft = ticketExpiry
              ? Math.max(0, Math.floor(((new Date(ticketExpiry).getTime() - Date.now()) % 86400000) / 3600000))
              : 0;

            const isSubFreeRelease = ch.subscription_free_release_at ? new Date(ch.subscription_free_release_at).getTime() <= Date.now() : false;
            const isFreeRelease = ch.free_release_at ? new Date(ch.free_release_at).getTime() <= Date.now() : false;
            
            const isPremium = !!ch.premium && !isFreeRelease;
            const isSub = !!ch.is_subscription && !isSubFreeRelease;

            return (
              <button
                key={ch.id}
                onClick={() => {
                  onNavigate(ch.number);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 ${
                  isCurrent
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isCurrent && <Icon icon="lucide:play" className="w-3 h-3 fill-current shrink-0" />}
                  <span className={`${isCurrent ? 'font-semibold' : ''}`}>
                    Chapter {ch.number}{ch.title ? ` — ${ch.title}` : ''}
                  </span>
                  {isSub && (
                    <Icon icon="mdi:latest" className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                </div>
                {/* Premium indicators */}
                {isPremium && !isUnlocked && (
                  <div className="flex items-center gap-1.5 mt-1 ml-5 text-xs">
                    <Icon icon="lucide:lock" className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-500 font-medium">Premium</span>
                    <CurrencyIcon className="w-3 h-3 text-amber-500 ml-1" />
                    <span className="text-amber-400">{ch.coin_price ?? 100} {currencyName}</span>
                  </div>
                )}
                {(isPremium || isSub) && isUnlocked && !isTicketUnlock && (
                  <div className="flex items-center gap-1.5 mt-1 ml-5 text-xs">
                    <Icon icon="lucide:unlock" className="w-3 h-3 text-green-500" />
                  </div>
                )}
                {(isPremium || isSub) && isUnlocked && isTicketUnlock && (
                  <div className="flex items-center gap-1.5 mt-1 ml-5 text-xs">
                    <Icon icon="lucide:unlock" className="w-3 h-3 text-green-500" />
                    <Icon icon="lucide:timer" className="w-3 h-3 text-gray-400 ml-1" />
                    <span className="text-gray-400">{daysLeft}d {hoursLeft}h remaining</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

interface PageSubPanelProps {
  isOpen: boolean;
  onClose: () => void;
  totalPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
}

export function PageSubPanel({
  isOpen,
  onClose,
  totalPages,
  currentPage,
  onPageSelect,
}: PageSubPanelProps) {
  return (
    <div
      className={`absolute inset-0 z-10 bg-[#0d1117] transition-transform duration-200 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <span className="text-sm font-semibold text-white">Pages</span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Icon icon="lucide:chevron-right" className="w-4 h-4" />
        </button>
      </div>

      {/* Page list */}
      <ScrollArea className="h-[calc(100%-52px)]">
        <div className="px-2 py-1">
          {Array.from({ length: totalPages }, (_, i) => {
            const isCurrent = i === currentPage;
            return (
              <button
                key={i}
                onClick={() => {
                  onPageSelect(i);
                  onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors mb-0.5 flex items-center gap-2 ${
                  isCurrent
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                {isCurrent && <Icon icon="lucide:play" className="w-3 h-3 fill-current shrink-0" />}
                <span className={isCurrent ? 'font-semibold' : ''}>Page {i + 1}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
