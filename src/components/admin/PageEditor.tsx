import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: string;
  chapterTitle: string;
  initialPages: string[];
  onSaved: (pages: string[]) => void;
  isManualBlogger?: boolean;
}

// Upload a single file to supabase storage (or other provider based on site settings)
async function uploadPageFile(file: File, path: string): Promise<string> {
  const { data: storageRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "storage")
    .single();

  const storage = storageRow?.value as any;
  const provider = storage?.provider || "supabase";
  const ext = file.name.split(".").pop();
  const fileName = `${path}.${ext}`;

  if (provider === "imgbb") {
    const apiKey = storage?.imgbb_api_key;
    if (!apiKey) throw new Error("ImgBB API key not configured.");
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(`ImgBB upload failed: ${data.error?.message}`);
    return data.data.url;
  }

  if (provider === "r2") {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const accountId = storage?.r2_account_id;
    const accessKeyId = storage?.r2_access_key;
    const secretAccessKey = storage?.r2_secret_key;
    const bucketName = storage?.r2_bucket_name;
    let publicUrl = storage?.r2_public_url?.replace(/\/$/, "");
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicUrl) {
      throw new Error("Cloudflare R2 not fully configured.");
    }
    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    const buf = new Uint8Array(await file.arrayBuffer());
    await s3.send(new PutObjectCommand({ Bucket: bucketName, Key: fileName, Body: buf, ContentType: file.type }));
    return `${publicUrl}/${fileName}`;
  }

  // Supabase
  const { error } = await supabase.storage.from("manga-assets").upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from("manga-assets").getPublicUrl(fileName);
  return publicUrl;
}

export function PageEditor({
  open,
  onOpenChange,
  chapterId,
  chapterTitle,
  initialPages,
  onSaved,
  isManualBlogger = false,
}: PageEditorProps) {
  const [pages, setPages] = useState<string[]>(initialPages);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null); // index being uploaded
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [urlEditIdx, setUrlEditIdx] = useState<number | null>(null);
  const [urlEditValue, setUrlEditValue] = useState("");
  // For blogger: inline URL paste
  const [bloggerUrlInput, setBloggerUrlInput] = useState("");

  const addFileRef = useRef<HTMLInputElement>(null);
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const replaceIdx = useRef<number | null>(null);

  // ── Drag-and-drop reorder ─────────────────────────────────────────────────
  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
  const handleDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...pages];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    setPages(next);
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // ── Delete page ───────────────────────────────────────────────────────────
  const removePage = (i: number) => {
    setPages(prev => prev.filter((_, idx) => idx !== i));
  };

  // ── Replace single page (file) ────────────────────────────────────────────
  const triggerReplace = (i: number) => {
    replaceIdx.current = i;
    replaceFileRef.current?.click();
  };

  const handleReplaceFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replaceIdx.current === null) return;
    const idx = replaceIdx.current;
    setUploading(idx);
    try {
      const url = await uploadPageFile(file, `chapters/page-edit-${chapterId}-${Date.now()}`);
      setPages(prev => { const next = [...prev]; next[idx] = url; return next; });
      toast.success(`Page ${idx + 1} replaced`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    }
    setUploading(null);
    if (replaceFileRef.current) replaceFileRef.current.value = "";
  };

  // ── Add new pages (files) ─────────────────────────────────────────────────
  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(-1);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const url = await uploadPageFile(files[i], `chapters/page-edit-${chapterId}-${Date.now()}-${i}`);
        urls.push(url);
      }
      setPages(prev => [...prev, ...urls]);
      toast.success(`${urls.length} page(s) added`);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    }
    setUploading(null);
    if (addFileRef.current) addFileRef.current.value = "";
  };

  // ── Add page by URL (Blogger mode) ────────────────────────────────────────
  const handleAddBloggerUrl = () => {
    const url = bloggerUrlInput.trim();
    if (!url.startsWith("http")) { toast.error("Please enter a valid URL"); return; }
    setPages(prev => [...prev, url]);
    setBloggerUrlInput("");
    toast.success("Page URL added");
  };

  // ── Replace by URL (Blogger mode inline edit) ─────────────────────────────
  const startUrlEdit = (i: number) => { setUrlEditIdx(i); setUrlEditValue(pages[i]); };
  const commitUrlEdit = () => {
    if (urlEditIdx === null) return;
    if (!urlEditValue.startsWith("http")) { toast.error("Invalid URL"); return; }
    setPages(prev => { const next = [...prev]; next[urlEditIdx!] = urlEditValue; return next; });
    setUrlEditIdx(null);
  };

  // ── Quick Sort (guess by filename number embedded in URL) ─────────────────
  const quickSort = () => {
    const extract = (url: string) => {
      const m = url.match(/(\d+)(?=[^/]*$)/);
      return m ? parseInt(m[1], 10) : 0;
    };
    setPages(prev => [...prev].sort((a, b) => extract(a) - extract(b)));
    toast.success("Pages sorted by embedded number");
  };

  // ── Remove all ────────────────────────────────────────────────────────────
  const removeAll = () => {
    if (!confirm("Remove all pages? This cannot be undone until you save.")) return;
    setPages([]);
    toast.info("All pages removed (not yet saved)");
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("chapters")
        .update({ pages })
        .eq("id", chapterId);
      if (error) throw error;
      onSaved(pages);
      toast.success("Pages saved!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Icon icon="ph:images-bold" className="w-5 h-5 text-primary" />
            Edit Chapter Pages
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">{chapterTitle}</p>
        </DialogHeader>

        <div className="px-6 pb-2">
          {/* Hidden file inputs */}
          <input ref={addFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddFiles} />
          <input ref={replaceFileRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceFile} />

          {/* Info bar */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Pages
              <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {pages.length}
              </span>
            </p>
            {!isManualBlogger && (
              <p className="text-[10px] text-muted-foreground">Drag cards to reorder • Pencil to replace • × to delete</p>
            )}
          </div>

          {/* Blogger URL add bar */}
          {isManualBlogger && (
            <div className="flex gap-2 mb-4">
              <input
                type="url"
                value={bloggerUrlInput}
                onChange={e => setBloggerUrlInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddBloggerUrl()}
                placeholder="Paste Blogger image URL here and press Enter or Add"
                className="flex-1 h-9 rounded-lg border border-border bg-background text-sm px-3 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button size="sm" variant="outline" onClick={handleAddBloggerUrl} className="shrink-0 border-primary/40 text-primary">
                <Icon icon="ph:plus-bold" className="w-4 h-4 mr-1" /> Add URL
              </Button>
            </div>
          )}

          {/* URL edit modal (inlined) */}
          {urlEditIdx !== null && (
            <div className="mb-4 p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
              <p className="text-xs font-semibold text-primary">Editing URL for page {urlEditIdx + 1}</p>
              <input
                autoFocus
                type="url"
                value={urlEditValue}
                onChange={e => setUrlEditValue(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") commitUrlEdit(); if (e.key === "Escape") setUrlEditIdx(null); }}
                className="w-full h-8 rounded-lg border border-border bg-background text-xs px-3 focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={commitUrlEdit}>Confirm</Button>
                <Button size="sm" variant="ghost" onClick={() => setUrlEditIdx(null)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Page grid */}
          {pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <Icon icon="ph:images-bold" className="w-12 h-12 opacity-20" />
              <p className="text-sm">No pages yet.</p>
              {!isManualBlogger && (
                <Button size="sm" variant="outline" onClick={() => addFileRef.current?.click()} disabled={uploading !== null}>
                  <Icon icon="ph:upload-bold" className="w-4 h-4 mr-1" /> Upload pages
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {pages.map((url, i) => (
                <div
                  key={i}
                  draggable={!isManualBlogger}
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={e => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  className={`relative group aspect-[3/4] rounded-xl border-2 overflow-hidden cursor-grab active:cursor-grabbing transition-all ${
                    dragOverIdx === i
                      ? "border-primary scale-105 shadow-lg shadow-primary/20"
                      : dragIdx === i
                      ? "border-primary/40 opacity-40"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {/* Thumbnail */}
                  <img
                    src={url}
                    alt={`Page ${i + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />

                  {/* Uploading overlay */}
                  {uploading === i && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Icon icon="ph:spinner-gap-bold" className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}

                  {/* Drag overlay icon */}
                  {!isManualBlogger && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Icon icon="ph:arrows-out-cardinal-bold" className="w-8 h-8 text-white drop-shadow" />
                    </div>
                  )}

                  {/* Controls */}
                  <div className="absolute top-1 left-1 right-1 flex justify-between gap-1">
                    {/* Replace / Edit URL */}
                    <button
                      onClick={() => isManualBlogger ? startUrlEdit(i) : triggerReplace(i)}
                      className="w-6 h-6 rounded-md bg-black/60 hover:bg-primary flex items-center justify-center text-white transition-colors shadow"
                      title={isManualBlogger ? "Edit URL" : "Replace image"}
                    >
                      <Icon icon="ph:pencil-simple-bold" className="w-3 h-3" />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => removePage(i)}
                      className="w-6 h-6 rounded-md bg-black/60 hover:bg-destructive flex items-center justify-center text-white transition-colors shadow"
                      title="Remove page"
                    >
                      <Icon icon="ph:x-bold" className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Page number badge */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                    <span className="text-[9px] font-bold text-white bg-black/60 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                      {i + 1}
                    </span>
                  </div>
                </div>
              ))}

              {/* Add page card */}
              {!isManualBlogger && (
                <button
                  onClick={() => addFileRef.current?.click()}
                  disabled={uploading !== null}
                  className="aspect-[3/4] rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-primary transition-all hover:bg-primary/5 disabled:opacity-50"
                >
                  {uploading === -1 ? (
                    <Icon icon="ph:spinner-gap-bold" className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      <Icon icon="ph:plus-bold" className="w-7 h-7" />
                      <span className="text-[10px] font-semibold">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Footer action bar */}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-border">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={quickSort} className="text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                <Icon icon="ph:sort-ascending-bold" className="w-3.5 h-3.5" /> Quick sort
              </Button>
              <Button variant="ghost" size="sm" onClick={removeAll} className="text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10">
                <Icon icon="ph:trash-bold" className="w-3.5 h-3.5" /> Remove all pages
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving || uploading !== null} className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-6">
                {saving ? <Icon icon="ph:spinner-gap-bold" className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
