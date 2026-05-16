import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useCollections, useCreateCollection, useUpdateCollection, useDeleteCollection } from '@/hooks/useCollections';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const STYLE_OPTIONS = [
  { value: 'style-1', label: 'Style 1 (Current)' },
];

const GENRE_LIST = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Isekai',
  'Magic', 'Martial Arts', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life',
  'Sports', 'Thriller', 'Cyberpunk', 'Historical', 'Psychological', 'Supernatural',
  'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Mecha', 'Music', 'School',
  'Harem', 'Ecchi', 'Military', 'Demons', 'Game', 'Murim', 'Reincarnation',
  'Hunter', 'Delinquents',
];

interface CollectionForm {
  title: string;
  description: string;
  icon: string;
  genres: string[];
}

const EMPTY_COLLECTION: CollectionForm = { title: '', description: '', icon: '📚', genres: [] };

export default function LayoutsTab() {
  const { settings, updateSettings } = useSiteSettings();
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  const [layouts, setLayouts] = useState(settings.layouts);
  const [saving, setSaving] = useState(false);
  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(EMPTY_COLLECTION);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const [genreSearch, setGenreSearch] = useState('');

  useEffect(() => {
    setLayouts(settings.layouts);
  }, [settings.layouts]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({ key: 'layouts', value: layouts });
      toast.success('Layout settings saved!');
    } catch {
      toast.error('Failed to save layout settings');
    }
    setSaving(false);
  };

  const handleOpenCreate = () => {
    setEditingCollectionId(null);
    setCollectionForm(EMPTY_COLLECTION);
    setCollectionFormOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setEditingCollectionId(c.id);
    setCollectionForm({ title: c.title, description: c.description || '', icon: c.icon || '📚', genres: c.genres || [] });
    setCollectionFormOpen(true);
  };

  const handleSaveCollection = async () => {
    if (!collectionForm.title.trim()) { toast.error('Title is required'); return; }
    if (collectionForm.genres.length === 0) { toast.error('Select at least one genre'); return; }
    try {
      if (editingCollectionId) {
        await updateCollection.mutateAsync({ id: editingCollectionId, ...collectionForm });
        toast.success('Collection updated');
      } else {
        await createCollection.mutateAsync(collectionForm);
        toast.success('Collection created');
      }
      setCollectionFormOpen(false);
    } catch {
      toast.error('Failed to save collection');
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteCollectionId) return;
    try {
      await deleteCollection.mutateAsync(deleteCollectionId);
      toast.success('Collection deleted');
    } catch {
      toast.error('Failed to delete collection');
    }
    setDeleteCollectionId(null);
  };

  const toggleGenre = (genre: string) => {
    setCollectionForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) ? prev.genres.filter(g => g !== genre) : [...prev.genres, genre],
    }));
  };

  const filteredGenres = GENRE_LIST.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));

  const StyleDropdown = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl bg-background border border-border h-11 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
      >
        {STYLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const VisibilityToggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-5 border-b border-border/50 bg-muted/20">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon icon={icon} className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Layouts & UI</h1>
          <p className="text-muted-foreground text-sm mt-1">Customize the style and visibility of every section.</p>
        </div>
        <Button className="gap-2 rounded-xl" onClick={handleSave} disabled={saving}>
          <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Header */}
      <Section icon="ph:navigation-arrow-bold" title="Header / Navigation">
        <StyleDropdown label="Desktop Header Style" value={layouts.header_desktop_style} onChange={v => setLayouts(l => ({ ...l, header_desktop_style: v }))} />
        <StyleDropdown label="Mobile Header Style" value={layouts.header_mobile_style} onChange={v => setLayouts(l => ({ ...l, header_mobile_style: v }))} />
      </Section>

      {/* Featured Slider */}
      <Section icon="ph:slideshow-bold" title="Featured Slider">
        <StyleDropdown label="Slider Style" value={layouts.featured_slider_style} onChange={v => setLayouts(l => ({ ...l, featured_slider_style: v }))} />
      </Section>

      {/* Trending */}
      <Section icon="ph:trend-up-bold" title="Trending Section">
        <StyleDropdown label="Trending Style" value={layouts.trending_style} onChange={v => setLayouts(l => ({ ...l, trending_style: v }))} />
        <VisibilityToggle label="Show Trending Section" checked={layouts.trending_visible} onChange={v => setLayouts(l => ({ ...l, trending_visible: v }))} />
      </Section>

      {/* Collections */}
      <Section icon="ph:folders-bold" title="Collections">
        <VisibilityToggle label="Show Collections on Homepage" checked={layouts.collections_visible} onChange={v => setLayouts(l => ({ ...l, collections_visible: v }))} />

        {layouts.collections_visible && (
          <div className="space-y-4 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{collections.length} Collection{collections.length !== 1 ? 's' : ''}</p>
              <Button size="sm" className="gap-1.5 rounded-lg" onClick={handleOpenCreate}>
                <Icon icon="ph:plus-bold" className="w-3.5 h-3.5" /> Add Collection
              </Button>
            </div>

            {collectionsLoading ? (
              <div className="text-sm text-muted-foreground text-center py-6">Loading collections...</div>
            ) : collections.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl">
                No collections yet. Create your first one!
              </div>
            ) : (
              <div className="space-y-2">
                {collections.map(c => (
                  <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/50 hover:border-primary/30 transition-colors">
                    <span className="text-2xl">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{(c.genres || []).join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleOpenEdit(c)}>
                        <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => setDeleteCollectionId(c.id)}>
                        <Icon icon="ph:trash-bold" className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* Manga Card */}
      <Section icon="ph:cards-bold" title="Manga Card">
        <StyleDropdown label="Card Style" value={layouts.manga_card_style} onChange={v => setLayouts(l => ({ ...l, manga_card_style: v }))} />
      </Section>

      {/* Footer */}
      <Section icon="ph:text-align-center-bold" title="Footer">
        <StyleDropdown label="Footer Style" value={layouts.footer_style} onChange={v => setLayouts(l => ({ ...l, footer_style: v }))} />
      </Section>

      {/* Manga Info Page */}
      <Section icon="ph:info-bold" title="Manga Info Page">
        <StyleDropdown label="Info Page Style" value={layouts.manga_info_style} onChange={v => setLayouts(l => ({ ...l, manga_info_style: v }))} />
      </Section>

      {/* Collection Form Dialog */}
      <Dialog open={collectionFormOpen} onOpenChange={setCollectionFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCollectionId ? 'Edit Collection' : 'Create Collection'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-2">
            <div className="flex gap-4">
              <div className="space-y-2 w-20">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Icon</label>
                <Input
                  value={collectionForm.icon}
                  onChange={e => setCollectionForm(f => ({ ...f, icon: e.target.value }))}
                  className="text-center text-2xl h-14 rounded-xl"
                  maxLength={4}
                />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Title</label>
                <Input
                  value={collectionForm.title}
                  onChange={e => setCollectionForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Romance & Shoujo"
                  className="rounded-xl h-14"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Description</label>
              <Textarea
                value={collectionForm.description}
                onChange={e => setCollectionForm(f => ({ ...f, description: e.target.value }))}
                placeholder="A short description for this collection..."
                className="rounded-xl min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">
                Genres ({collectionForm.genres.length} selected)
              </label>
              <Input
                value={genreSearch}
                onChange={e => setGenreSearch(e.target.value)}
                placeholder="Search genres..."
                className="rounded-xl h-10 text-sm"
              />
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-muted/30 rounded-xl border border-border/50">
                {filteredGenres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      collectionForm.genres.includes(genre)
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-background border border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <Button className="w-full rounded-xl h-12" onClick={handleSaveCollection} disabled={createCollection.isPending || updateCollection.isPending}>
              {(createCollection.isPending || updateCollection.isPending) ? 'Saving...' : (editingCollectionId ? 'Update Collection' : 'Create Collection')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCollectionId} onOpenChange={open => !open && setDeleteCollectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this collection. Series won't be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
