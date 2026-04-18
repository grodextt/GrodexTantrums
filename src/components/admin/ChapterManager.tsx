import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAdminChapters, useCreateChapter, useDeleteChapter, useUpdateChapter,
  usePushChapterToFree, useBulkPushToFree,
} from "@/hooks/useManga";
import { usePremiumSettings } from "@/hooks/usePremiumSettings";
import { Tables } from "@/integrations/supabase/types";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useQueryClient } from "@tanstack/react-query";
import { PageEditor } from "@/components/admin/PageEditor";

type Manga = Tables<"manga">;
type Chapter = Tables<"chapters">;

interface ChapterManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manga: Manga | null;
}

export const ChapterManager = ({ open, onOpenChange, manga }: ChapterManagerProps) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterNumber, setChapterNumber] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [isSubscription, setIsSubscription] = useState(false);
  const [coinPrice, setCoinPrice] = useState(100);
  const [autoFreeEnabled, setAutoFreeEnabled] = useState(false);
  const [autoFreeDays, setAutoFreeDays] = useState(7);
  const [autoFreeHours, setAutoFreeHours] = useState(0);
  const [pageFiles, setPageFiles] = useState<FileList | null>(null);
  const [deleteChapterId, setDeleteChapterId] = useState<string | null>(null);
  const [pushToFreeId, setPushToFreeId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [htmlPasteOpen, setHtmlPasteOpen] = useState(false);
  const [pastedHtml, setPastedHtml] = useState('');
  const [extractedUrls, setExtractedUrls] = useState<string[]>([]);
  const [pageEditorChapter, setPageEditorChapter] = useState<Chapter | null>(null);

  const { user } = useAuth();
  const { isAdmin, isMod } = useUserRole();
  const { settings } = usePremiumSettings();
  const queryClient = useQueryClient();

  const { settings: siteSettings } = useSiteSettings();
  const isManualBlogger = siteSettings.storage.provider === 'manual_blogger';
  const currencyName = settings.coin_system.currency_name;

  const canManageChapter = (c: Chapter) => isAdmin || (isMod && c.created_by === user?.id);

  const { data: chapters = [], isLoading } = useAdminChapters(manga?.id || null);
  const createChapter = useCreateChapter();
  const updateChapter = useUpdateChapter();
  const deleteChapter = useDeleteChapter();
  const pushToFree = usePushChapterToFree();
  const bulkPushToFree = useBulkPushToFree();

  const sortedChapters = [...chapters].sort((a, b) => sortAsc ? a.number - b.number : b.number - a.number);
  const premiumChapters = sortedChapters.filter((c) => c.premium);
  const selectedPremiumIds = [...selectedIds].filter((id) => premiumChapters.some((c) => c.id === id));

  const resetForm = () => {
    setChapterNumber(""); setChapterTitle(""); setIsPremium(false); setIsSubscription(false);
    setCoinPrice(100); setAutoFreeEnabled(false); setAutoFreeDays(7); setAutoFreeHours(0);
    setPageFiles(null); setShowAddForm(false); setEditingChapter(null);
    setPastedHtml(''); setExtractedUrls([]);
  };

  // Extract image src URLs from Blogger HTML
  const handleExtractFromHtml = () => {
    if (!pastedHtml.trim()) {
      toast.error('Please paste some HTML first.');
      return;
    }
    const regex = /<img[^>]+src=["']([^"']+)["']/gi;
    const urls: string[] = [];
    let match;
    while ((match = regex.exec(pastedHtml)) !== null) {
      // Filter to only include typical Blogger CDN domains
      const url = match[1];
      if (url && url.startsWith('http')) {
        urls.push(url);
      }
    }
    if (urls.length === 0) {
      toast.error('No image URLs found in the HTML. Make sure you copied the HTML view from Blogger.');
      return;
    }
    setExtractedUrls(urls);
    toast.success(`Found ${urls.length} image(s) from your HTML!`);
  };

  const handleConfirmHtml = () => {
    if (extractedUrls.length === 0) {
      toast.error('No images extracted yet. Click "Extract Images" first.');
      return;
    }
    setHtmlPasteOpen(false);
    setPastedHtml('');
  };

  const handleEditClick = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterNumber(chapter.number.toString());
    setChapterTitle(chapter.title || '');
    setIsPremium(chapter.premium || false);
    setIsSubscription(chapter.is_subscription || false);
    setCoinPrice(chapter.coin_price ?? 100);
    const hasAutoFree = chapter.auto_free_days !== null;
    setAutoFreeEnabled(hasAutoFree);
    if (hasAutoFree && chapter.auto_free_days !== null) {
      const days = Math.floor(chapter.auto_free_days);
      const hours = Math.round((chapter.auto_free_days - days) * 24);
      setAutoFreeDays(days);
      setAutoFreeHours(hours);
    } else if (chapter.is_subscription && chapter.subscription_free_release_days) {
      setAutoFreeEnabled(true);
      const subDays = Math.floor(chapter.subscription_free_release_days);
      const subHours = Math.round((chapter.subscription_free_release_days - subDays) * 24);
      setAutoFreeDays(subDays);
      setAutoFreeHours(subHours);
    } else {
      setAutoFreeDays(7);
      setAutoFreeHours(0);
    }
    setShowAddForm(true);
  };

  // Calculate total auto_free_days including hours as fractional days
  const getTotalAutoFreeDays = () => {
    // We store as integer days in DB, but use hours for the trigger calculation
    // The trigger uses (auto_free_days || ' days')::interval
    // So we need to pass total days. For hours, we'll pass it as a fraction
    // Actually the DB column is integer, so let's keep days as integer
    // and add a separate approach: we'll compute free_release_at directly
    return autoFreeDays;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manga) return;

    const num = parseFloat(chapterNumber);
    if (isNaN(num)) { toast.error("Chapter number must be a valid number"); return; }

    const files = pageFiles ? Array.from(pageFiles) : [];

    // For manual blogger, we use extracted URLs directly (no file upload needed)
    if (isManualBlogger) {
      if (extractedUrls.length === 0 && !editingChapter) {
        toast.error("Please paste Blogger HTML and extract images first.");
        return;
      }
    } else {
      if (files.length === 0 && !editingChapter) {
        toast.error("Please select at least one page image");
        return;
      }
    }

    const autoFreeDaysValue = isPremium && autoFreeEnabled ? autoFreeDays + (autoFreeHours / 24) : null;
    const subFreeDays = isSubscription && autoFreeEnabled ? autoFreeDays + (autoFreeHours / 24) : null;

    try {
      if (editingChapter) {
        await updateChapter.mutateAsync({
          id: editingChapter.id,
          mangaId: manga.id,
          chapter: {
            number: num,
            title: chapterTitle,
            premium: isPremium,
            coin_price: isPremium ? coinPrice : null,
            auto_free_days: autoFreeDaysValue,
            is_subscription: isSubscription,
            subscription_free_release_days: subFreeDays,
            // For manual blogger: if new URLs provided, use them; otherwise keep existing
            ...(isManualBlogger && extractedUrls.length > 0 ? { pages: extractedUrls } : {}),
          },
          pageFiles: isManualBlogger ? undefined : (files.length > 0 ? files : undefined),
          mangaSlug: manga.slug,
          oldPages: editingChapter.pages || undefined,
        });
      } else {
        // Uniform use of hook for both manual blogger and standard upload
        await createChapter.mutateAsync({
          chapter: {
            manga_id: manga.id,
            number: num,
            title: chapterTitle,
            premium: isPremium,
            coin_price: isPremium ? coinPrice : null,
            auto_free_days: autoFreeDaysValue,
            is_subscription: isSubscription,
            subscription_free_release_days: subFreeDays,
            // Pass pages directly if manual blogger
            ...(isManualBlogger ? { pages: extractedUrls } : {}),
          },
          pageFiles: isManualBlogger ? [] : files,
          mangaSlug: manga.slug,
        });
      }
      resetForm();
    } catch (error: any) {
      console.error("Failed to save chapter:", error);
      toast.error(error.message || "Failed to save chapter. Check your connection.");
    }
  };

  const handleDelete = async () => {
    if (!deleteChapterId) return;
    const chapter = chapters.find((c) => c.id === deleteChapterId);
    if (!chapter || !manga) return;
    await deleteChapter.mutateAsync({ id: deleteChapterId, mangaId: manga.id, pages: chapter.pages || undefined });
    setDeleteChapterId(null);
  };

  const handlePushToFree = async () => {
    if (!pushToFreeId || !manga) return;
    await pushToFree.mutateAsync({ id: pushToFreeId, mangaId: manga.id });
    setPushToFreeId(null);
  };

  const handleBulkPushToFree = async () => {
    if (selectedPremiumIds.length === 0 || !manga) return;
    await bulkPushToFree.mutateAsync({ ids: selectedPremiumIds, mangaId: manga.id });
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === sortedChapters.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(sortedChapters.map((c) => c.id)));
  };

  const isSaving = createChapter.isPending || updateChapter.isPending || pushToFree.isPending || bulkPushToFree.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[85vh] sm:max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 flex-wrap">
              Manage Chapters — {manga?.title}
              <Badge variant="secondary" className="ml-2 text-xs">{chapters.length} chapters</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!showAddForm ? (
              <>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button onClick={() => setShowAddForm(true)} size="sm"><Icon icon="ph:plus-bold" className="mr-1 h-4 w-4" />Add Chapter</Button>
                  {selectedPremiumIds.length > 0 && (
                    <Button variant="outline" size="sm" onClick={handleBulkPushToFree} disabled={isSaving} className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
                      {bulkPushToFree.isPending && <Icon icon="ph:spinner-gap-bold" className="mr-1 h-4 w-4 animate-spin" />}
                      <Icon icon="ph:lock-open-bold" className="mr-1 h-4 w-4" />Push {selectedPremiumIds.length} to Free
                    </Button>
                  )}
                  <div className="ml-auto">
                    <Button variant="ghost" size="sm" onClick={() => setSortAsc((p) => !p)}>
                      <Icon icon="ph:arrows-down-up-bold" className="mr-1 h-4 w-4" />{sortAsc ? "Oldest first" : "Newest first"}
                    </Button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8"><Icon icon="ph:spinner-gap-bold" className="h-8 w-8 animate-spin text-primary" /></div>
                ) : chapters.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No chapters yet. Add your first chapter!</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"><Checkbox checked={selectedIds.size === sortedChapters.length && sortedChapters.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>
                          <TableHead>Ch #</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Pages</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Released</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedChapters.map((chapter) => (
                          <TableRow key={chapter.id}>
                            <TableCell><Checkbox checked={selectedIds.has(chapter.id)} onCheckedChange={() => toggleSelect(chapter.id)} /></TableCell>
                            <TableCell className="font-medium">{chapter.number}</TableCell>
                            <TableCell className="max-w-[120px] truncate">{chapter.title}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-muted-foreground"><Icon icon="ph:image-bold" className="h-3.5 w-3.5" />{chapter.pages?.length || 0}</div>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const isSubExpired = chapter.is_subscription && chapter.subscription_free_release_at && new Date(chapter.subscription_free_release_at).getTime() <= Date.now();
                                const isPremExpired = chapter.premium && chapter.free_release_at && new Date(chapter.free_release_at).getTime() <= Date.now();
                                
                                if (chapter.premium && !isPremExpired) {
                                  return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">Premium</Badge>;
                                } else if (chapter.is_subscription && !isSubExpired) {
                                  return (
                                    <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30">
                                      <Icon icon="mdi:new-releases" className="w-3 h-3 mr-1" />{settings.subscription_settings?.badge_label || 'Early Access'}
                                    </Badge>
                                  );
                                } else {
                                  return <Badge variant="secondary" className="text-muted-foreground">Free</Badge>;
                                }
                              })()}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {chapter.premium ? `${chapter.coin_price ?? 100} ${currencyName}` : '—'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(chapter.created_at), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right">
                              <TooltipProvider delayDuration={300}>
                                <div className="flex items-center justify-end gap-0.5">
                                    {chapter.premium && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10" 
                                            onClick={() => setPushToFreeId(chapter.id)} 
                                            disabled={isSaving || !canManageChapter(chapter)}
                                            title={!canManageChapter(chapter) ? "You can only push chapters you created" : "Push to Free"}
                                          >
                                            <Icon icon="ph:lock-open-bold" className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Push to Free</TooltipContent>
                                      </Tooltip>
                                    )}
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" 
                                        onClick={() => setPageEditorChapter(chapter)}
                                        disabled={!canManageChapter(chapter)}
                                        title={!canManageChapter(chapter) ? "You can only manage chapters you created" : "Edit Pages"}
                                      >
                                        <Icon icon="ph:images-bold" className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Pages</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8" 
                                        onClick={() => handleEditClick(chapter)}
                                        disabled={!canManageChapter(chapter)}
                                        title={!canManageChapter(chapter) ? "You can only edit chapters you created" : "Edit"}
                                      >
                                        <Icon icon="ph:pencil-simple-bold" className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit Chapter</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive" 
                                        onClick={() => setDeleteChapterId(chapter.id)}
                                        disabled={!canManageChapter(chapter)}
                                        title={!canManageChapter(chapter) ? "You can only delete chapters you created" : "Delete"}
                                      >
                                        <Icon icon="ph:trash-bold" className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TooltipProvider>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="chapter-number">Chapter Number</Label>
                    <Input id="chapter-number" type="number" step="0.1" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} placeholder="1" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter-title">Chapter Title (Optional)</Label>
                    <Input id="chapter-title" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="e.g. The Beginning (Optional)" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label htmlFor="premium">Premium Chapter (Coins)</Label>
                  <Switch id="premium" checked={isPremium} onCheckedChange={(v) => { setIsPremium(v); if (v) setIsSubscription(false); }} />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor="subscription">Subscription Chapter</Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Only subscribers can read. Cannot be unlocked with coins.</p>
                  </div>
                  <Switch id="subscription" checked={isSubscription} onCheckedChange={(v) => { setIsSubscription(v); if (v) { setIsPremium(false); setAutoFreeEnabled(true); } }} />
                </div>

                {isPremium && (
                  <div className="space-y-4 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] p-4">
                    <div className="space-y-2">
                      <Label>Unlock Price ({currencyName})</Label>
                      <Input type="number" value={coinPrice} onChange={(e) => setCoinPrice(parseInt(e.target.value) || 0)} min={1} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-free">Auto Free Release</Label>
                      <Switch id="auto-free" checked={autoFreeEnabled} onCheckedChange={setAutoFreeEnabled} />
                    </div>
                    {autoFreeEnabled && (
                      <div className="space-y-3">
                        <Label>Release as free after</Label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={autoFreeDays}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAutoFreeDays(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                              }}
                              min={0}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={autoFreeHours}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAutoFreeHours(val === '' ? 0 : Math.min(23, Math.max(0, parseInt(val) || 0)));
                              }}
                              min={0}
                              max={23}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">hours</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total: {autoFreeDays} day{autoFreeDays !== 1 ? 's' : ''} {autoFreeHours > 0 ? `${autoFreeHours} hour${autoFreeHours !== 1 ? 's' : ''}` : ''} after chapter release
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {isSubscription && (
                  <div className="space-y-4 rounded-lg border border-purple-500/20 bg-purple-500/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-purple-400">
                      <Icon icon="mdi:new-releases" className="w-4 h-4" /> Subscription Chapter Settings
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sub-auto-free">Auto Free Release</Label>
                      <Switch id="sub-auto-free" checked={autoFreeEnabled} onCheckedChange={setAutoFreeEnabled} />
                    </div>
                    {autoFreeEnabled && (
                      <div className="space-y-3">
                        <Label>Becomes free after</Label>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={autoFreeDays}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAutoFreeDays(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                              }}
                              min={0}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">days</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={autoFreeHours}
                              onChange={(e) => {
                                const val = e.target.value;
                                setAutoFreeHours(val === '' ? 0 : Math.min(23, Math.max(0, parseInt(val) || 0)));
                              }}
                              min={0}
                              max={23}
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">hours</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Total: {autoFreeDays} day{autoFreeDays !== 1 ? 's' : ''} {autoFreeHours > 0 ? `${autoFreeHours} hour${autoFreeHours !== 1 ? 's' : ''}` : ''} after chapter release
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pages">Page Images {editingChapter && "(Leave empty to keep existing pages)"}</Label>

                  {isManualBlogger ? (
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                        <Icon icon="ph:info-bold" className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          <strong>Manual Blogger mode active.</strong> Upload images in Blogger, switch to HTML view, copy all HTML, then paste it below.
                        </p>
                      </div>
                      <Button type="button" variant="outline" className="w-full gap-2 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10" onClick={() => setHtmlPasteOpen(true)}>
                        <Icon icon="ph:code-bold" className="w-4 h-4" />
                        Paste Blogger HTML
                        {extractedUrls.length > 0 && (
                          <span className="ml-auto text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full">{extractedUrls.length} images ready</span>
                        )}
                      </Button>
                      {editingChapter?.pages && extractedUrls.length === 0 && (
                        <p className="text-xs text-muted-foreground">Current: {editingChapter.pages.length} page(s). Paste new HTML to replace them.</p>
                      )}
                    </div>
                  ) : (
                    <>
                      <Input id="pages" type="file" accept="image/*" multiple onChange={(e) => setPageFiles(e.target.files)} />
                      {pageFiles && <p className="text-sm text-muted-foreground">{pageFiles.length} file(s) selected</p>}
                      {editingChapter && editingChapter.pages && <p className="text-sm text-muted-foreground">Current: {editingChapter.pages.length} page(s)</p>}
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>Cancel</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Icon icon="ph:spinner-gap-bold" className="mr-2 h-4 w-4 animate-spin" />}
                    {editingChapter ? "Update Chapter" : "Create Chapter"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* HTML Paste Modal for Manual Blogger */}
      <Dialog open={htmlPasteOpen} onOpenChange={setHtmlPasteOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="ph:file-html-bold" className="w-5 h-5 text-emerald-500" />
              Paste Blogger HTML
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-xl border border-border/40 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">How to get Blogger HTML:</p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Open <strong>blogger.com</strong> and create a new post.</li>
                <li>Click <strong>Insert Image</strong> and upload all your chapter images.</li>
                <li>Switch to <strong>HTML view</strong> (the {'<>'} icon in the toolbar).</li>
                <li>Select all (Ctrl+A) and copy (Ctrl+C).</li>
                <li>Paste into the box below.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label>Paste HTML here</Label>
              <Textarea
                value={pastedHtml}
                onChange={e => setPastedHtml(e.target.value)}
                placeholder="<div class='separator'>...<img src='https://blogger.googleusercontent.com/...' /></div>"
                className="font-mono text-xs min-h-[200px] resize-y"
              />
            </div>

            {extractedUrls.length > 0 && (
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2">
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ {extractedUrls.length} image(s) extracted and ready:</p>
                <div className="max-h-32 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                  {extractedUrls.map((url, i) => (
                    <p key={i} className="text-[10px] font-mono text-muted-foreground break-all">
                      <span className="text-emerald-500 font-bold mr-1">{i + 1}.</span> {url}
                    </p>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setHtmlPasteOpen(false); }}>Cancel</Button>
              <Button variant="outline" onClick={handleExtractFromHtml} className="gap-2">
                <Icon icon="ph:magnifying-glass-bold" className="w-4 h-4" />
                Extract Images
              </Button>
              <Button onClick={handleConfirmHtml} disabled={extractedUrls.length === 0} className="gap-2">
                <Icon icon="ph:check-bold" className="w-4 h-4" />
                Use {extractedUrls.length} Image{extractedUrls.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pushToFreeId} onOpenChange={() => setPushToFreeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Push to Free</AlertDialogTitle>
            <AlertDialogDescription>This will make the chapter free and reset its release date to now.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePushToFree}>
              {pushToFree.isPending && <Icon icon="ph:spinner-gap-bold" className="mr-2 h-4 w-4 animate-spin" />}Push to Free
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteChapterId} onOpenChange={() => setDeleteChapterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will permanently delete all chapter pages and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Page Editor Dialog */}
      {pageEditorChapter && (
        <PageEditor
          open={!!pageEditorChapter}
          onOpenChange={(v) => { if (!v) setPageEditorChapter(null); }}
          chapterId={pageEditorChapter.id}
          chapterTitle={`Chapter ${pageEditorChapter.number}${pageEditorChapter.title ? ` — ${pageEditorChapter.title}` : ''}`}
          initialPages={pageEditorChapter.pages || []}
          isManualBlogger={isManualBlogger}
          onSaved={(pages) => {
            // Invalidate admin-chapters cache so page count refreshes
            queryClient.invalidateQueries({ queryKey: ['admin-chapters', manga?.id] });
            setPageEditorChapter(null);
          }}
        />
      )}
    </>
  );
};
