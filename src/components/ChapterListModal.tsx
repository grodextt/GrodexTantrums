import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import type { Chapter } from "@/data/mockManga";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0 bg-card border-border">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base font-bold">
            Chapter List ({chapters.length} chapters)
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh] px-4 pb-4">
          <div className="space-y-2">
            {chapters.map((chapter) => {
              const isCurrent = currentChapterNumber === chapter.number;
              return (
                <button
                  key={chapter.id}
                  onClick={() => {
                    onClose();
                    navigate(`/manga/${mangaSlug}/chapter/${chapter.number}`);
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200 border group ${
                    isCurrent
                      ? "bg-primary/10 border-primary/40"
                      : "bg-secondary/20 hover:bg-secondary/50 border-transparent hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Chapter number */}
                    <div
                      className={`text-2xl font-bold min-w-[2rem] text-center transition-colors ${
                        isCurrent
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-primary"
                      }`}
                    >
                      {chapter.number}
                    </div>

                    {/* Chapter info */}
                    <div className="text-left">
                      <h3
                        className={`font-semibold text-sm transition-colors flex items-center gap-2 ${
                          isCurrent
                            ? "text-primary"
                            : "text-foreground group-hover:text-primary"
                        }`}
                      >
                        {chapter.title || `Chapter ${chapter.number}`}
                        {/* Show NEW badge for recent chapters (first 3) */}
                        {chapter.number >= chapters.length - 2 && (
                          <Badge className="bg-destructive/80 text-destructive-foreground text-[10px] px-1.5 py-0 h-4 font-semibold border-none">
                            NEW
                          </Badge>
                        )}
                      </h3>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{chapter.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{Math.floor(Math.random() * 900 + 100)}</span>
                        </div>
                        <span>{chapter.pages?.length || 8} pages</span>
                      </div>
                    </div>
                  </div>

                  {/* Current / Read label */}
                  <span
                    className={`text-sm font-medium shrink-0 ${
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isCurrent ? "Current" : "Read"}
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
