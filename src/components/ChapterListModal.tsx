import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { usePremiumSettings } from "@/hooks/usePremiumSettings";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Chapter } from "@/types/manga";
import { filterVisibleChapters } from "@/lib/chapterVisibility";

interface ChapterListModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  mangaSlug: string;
  mangaCover: string;
  currentChapterNumber?: number;
}

const ChapterListModal = ({
  isOpen,
  onClose,
  chapters,
  mangaSlug,
  mangaCover,
  currentChapterNumber,
}: ChapterListModalProps) => {
  const navigate = useNavigate();
  const { settings } = usePremiumSettings();
  const { user } = useAuth();
  const currencyName = settings.coin_system.currency_name;
  const currencyIconUrl = settings.coin_system.currency_icon_url;
  const visibleChapters = filterVisibleChapters(chapters as any, settings?.premium_config) as Chapter[];

  const { data: userUnlocks = [] } = useQuery({
    queryKey: ['user-chapter-unlocks-modal', user?.id],
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

  const getUnlockStatus = (chapterId: string | number) => {
    const id = String(chapterId);
    const unlock = userUnlocks.find(u => u.chapter_id === id);
    if (!unlock) return null;
    if (unlock.expires_at && new Date(unlock.expires_at) <= new Date()) return null;
    return unlock;
  };

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Icon icon="ph:coins-bold" className={className} />
    );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] w-[calc(100vw-2rem)] p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <DialogTitle className="text-base font-bold">
            Chapter List ({visibleChapters.length} chapters)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-3 sm:px-4 pb-4">
          <div className="space-y-2">
            {visibleChapters.map((chapter) => {
              const isCurrent = currentChapterNumber === chapter.number;
              const isPremium = !!chapter.premium;
              const unlockRecord = getUnlockStatus(chapter.id);
              const isUnlocked = !!unlockRecord;
              const isTicketUnlock = unlockRecord?.unlock_type === 'ticket';
              const ticketDaysLeft = isTicketUnlock && unlockRecord?.expires_at
                ? Math.max(0, Math.ceil((new Date(unlockRecord.expires_at).getTime() - Date.now()) / 86400000))
                : 0;

              return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    onClose();
                    navigate(`/manga/${mangaSlug}/chapter/${chapter.number}`);
                  }}
                  className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 border group ${
                    isCurrent
                      ? "bg-primary/10 border-primary/40"
                      : "bg-secondary/20 hover:bg-secondary/50 border-transparent hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div
                      className={`text-xl sm:text-2xl font-bold min-w-[2rem] text-center transition-colors shrink-0 ${
                        isCurrent
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      }`}
                    >
                      {chapter.number}
                    </div>

                    <div className="text-left min-w-0">
                      <h3
                        className={`font-semibold text-sm transition-colors flex items-center gap-1.5 flex-wrap ${
                          isCurrent
                            ? "text-primary"
                            : "text-foreground group-hover:text-primary"
                        }`}
                      >
                        <span className="truncate">{chapter.title || `Chapter ${chapter.number}`}</span>
                        {chapter.number >= chapters.length - 2 && (
                          <Badge className="bg-destructive/80 text-destructive-foreground text-[10px] px-1.5 py-0 h-4 font-semibold border-none shrink-0">
                            NEW
                          </Badge>
                        )}
                        {isPremium && !isUnlocked && (
                          <Badge className="bg-amber-500/15 text-amber-500 text-[10px] px-1.5 py-0 h-4 font-semibold border border-amber-500/20 shrink-0">
                            <Icon icon="ph:lock-key-bold" className="w-2.5 h-2.5 mr-0.5" /> Premium
                          </Badge>
                        )}
                        {isPremium && isUnlocked && (
                          <Badge className="bg-green-500/15 text-green-500 text-[10px] px-1.5 py-0 h-4 font-semibold border border-green-500/20 shrink-0">
                            <Icon icon="ph:lock-key-open-bold" className="w-2.5 h-2.5 mr-0.5" /> Unlocked
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center space-x-2 sm:space-x-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <div className="flex items-center space-x-1">
                          <Icon icon="ph:calendar-bold" className="w-3 h-3" />
                          <span>{chapter.date}</span>
                        </div>
                        <span>{chapter.pages?.length || 8} pages</span>
                        {isPremium && !isUnlocked && (
                          <div className="flex items-center space-x-1 text-amber-500">
                            <CurrencyIcon className="w-3 h-3" />
                            <span className="font-medium">{(chapter as any).coin_price ?? 100} {currencyName}</span>
                          </div>
                        )}
                        {isPremium && isUnlocked && isTicketUnlock && ticketDaysLeft > 0 && (
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <Icon icon="ph:timer-bold" className="w-3 h-3" />
                            <span className="font-medium">{ticketDaysLeft}d left</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs sm:text-sm font-medium shrink-0 ml-2 ${
                      isCurrent ? "text-primary" : isPremium && !isUnlocked ? "text-amber-500" : isUnlocked ? "text-green-500" : "text-muted-foreground"
                    }`}
                  >
                    {isCurrent ? "Current" : isPremium && !isUnlocked ? <Icon icon="ph:lock-key-bold" className="w-4 h-4" /> : isUnlocked ? <Icon icon="ph:lock-key-open-bold" className="w-4 h-4" /> : "Read"}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChapterListModal;
