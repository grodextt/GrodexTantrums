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

const DEFAULT_GENRE_LIST = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", 
  "Romance", "Sci-Fi", "Slice of Life", "Supernatural", "Thriller", "Tragedy",
  "Psychological", "Historical", "Isekai", "Mecha", "Sports", "Martial Arts",
  "School Life", "Seinen", "Shounen", "Shoujo", "Josei", "Ecchi", "Harem",
  "Yaoi", "Yuri", "Magic", "Military", "Music", "Parody", "Police",
  "Post-Apocalyptic", "Reincarnation", "Revenge", "Survival", "Time Travel",
  "Vampire", "Zombies", "Cyberpunk", "Cooking", "Medical", "Crime", "Detective"
];

const DEFAULT_AUTHOR_LIST = ["Tang Jia San Shao", "Miku (美紅)", "Tanabata Satori"];
const DEFAULT_ARTIST_LIST = ["Asoul, Fan Bao Cao", "Minatogawa Kazuomi", "Nokomi (のこみ)"];
const DEFAULT_YEAR_LIST = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027];

interface CollectionForm {
  title: string;
  description: string;
  icon: string;
  genres: string[];
}

const EMPTY_COLLECTION: CollectionForm = { title: '', description: '', icon: '📚', genres: [] };

export default function CustomizationTab() {
  const { settings, updateSettings } = useSiteSettings();
  const { data: collections = [], isLoading: collectionsLoading } = useCollections();
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const deleteCollection = useDeleteCollection();

  // Sub Tab: layouts or general
  const [subTab, setSubTab] = useState<'layouts' | 'general'>('layouts');

  // Layouts tab state
  const [layouts, setLayouts] = useState(settings.layouts);

  // General metadata state
  const [genres, setGenres] = useState<string[]>(settings.metadata?.genres || DEFAULT_GENRE_LIST);
  const [authors, setAuthors] = useState<string[]>(settings.metadata?.authors || DEFAULT_AUTHOR_LIST);
  const [artists, setArtists] = useState<string[]>(settings.metadata?.artists || DEFAULT_ARTIST_LIST);
  const [years, setYears] = useState<number[]>(settings.metadata?.years || DEFAULT_YEAR_LIST);

  // General pages state
  const [dmcaContent, setDmcaContent] = useState(settings.pages?.dmca_content || '');
  const [privacyContent, setPrivacyContent] = useState(settings.pages?.privacy_content || '');

  // Inline inputs state
  const [newGenre, setNewGenre] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newYear, setNewYear] = useState('');
  
  // Page customizer select tab: dmca or privacy
  const [activePageTab, setActivePageTab] = useState<'dmca' | 'privacy'>('dmca');

  const [saving, setSaving] = useState(false);
  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>(EMPTY_COLLECTION);
  const [deleteCollectionId, setDeleteCollectionId] = useState<string | null>(null);
  const [genreSearch, setGenreSearch] = useState('');

  useEffect(() => {
    setLayouts(settings.layouts);
    setGenres(settings.metadata?.genres || DEFAULT_GENRE_LIST);
    setAuthors(settings.metadata?.authors || DEFAULT_AUTHOR_LIST);
    setArtists(settings.metadata?.artists || DEFAULT_ARTIST_LIST);
    setYears(settings.metadata?.years || DEFAULT_YEAR_LIST);
    setDmcaContent(settings.pages?.dmca_content || '');
    setPrivacyContent(settings.pages?.privacy_content || '');
  }, [settings]);

  const handleSaveLayouts = async () => {
    setSaving(true);
    try {
      await updateSettings.mutateAsync({ key: 'layouts', value: layouts });
      toast.success('Layout settings saved!');
    } catch {
      toast.error('Failed to save layout settings');
    }
    setSaving(false);
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSettings.mutateAsync({
          key: 'metadata',
          value: { genres, authors, artists, years }
        }),
        updateSettings.mutateAsync({
          key: 'pages',
          value: { dmca_content: dmcaContent, privacy_content: privacyContent }
        })
      ]);
      toast.success('General customization settings saved!');
    } catch {
      toast.error('Failed to save general customization settings');
    }
    setSaving(false);
  };

  // Add / Remove handlers
  const handleAddGenre = () => {
    const trimmed = newGenre.trim();
    if (!trimmed) return;
    if (genres.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Genre already exists');
      return;
    }
    setGenres(prev => [...prev, trimmed]);
    setNewGenre('');
  };

  const handleAddAuthor = () => {
    const trimmed = newAuthor.trim();
    if (!trimmed) return;
    if (authors.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Author already exists');
      return;
    }
    setAuthors(prev => [...prev, trimmed]);
    setNewAuthor('');
  };

  const handleAddArtist = () => {
    const trimmed = newArtist.trim();
    if (!trimmed) return;
    if (artists.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Artist already exists');
      return;
    }
    setArtists(prev => [...prev, trimmed]);
    setNewArtist('');
  };

  const handleAddYear = () => {
    const val = parseInt(newYear.trim());
    if (isNaN(val) || val < 1900 || val > 2100) {
      toast.error('Enter a valid year (1900-2100)');
      return;
    }
    if (years.includes(val)) {
      toast.error('Year already exists');
      return;
    }
    setYears(prev => [...prev, val].sort((a, b) => b - a));
    setNewYear('');
  };

  // Collections CRUD Handlers
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

  const toggleGenreSelection = (genre: string) => {
    setCollectionForm(prev => ({
      ...prev,
      genres: prev.genres.includes(genre) ? prev.genres.filter(g => g !== genre) : [...prev.genres, genre],
    }));
  };

  const filteredGenresForCollection = genres.filter(g => g.toLowerCase().includes(genreSearch.toLowerCase()));

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
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  const Section = ({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) => (
    <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 p-5 border-b border-border/50 bg-muted/20">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon icon={icon} className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-bold text-base">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );

  const TagManagerCard = ({
    title,
    icon,
    items,
    inputValue,
    onInputChange,
    onAdd,
    onRemove,
    onReset,
    placeholder,
  }: {
    title: string;
    icon: string;
    items: any[];
    inputValue: string;
    onInputChange: (val: string) => void;
    onAdd: () => void;
    onRemove: (idx: number) => void;
    onReset: () => void;
    placeholder: string;
  }) => (
    <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Icon icon={icon} className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm text-foreground">{title} ({items.length})</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onReset} className="h-7 text-xs text-muted-foreground hover:text-foreground">
          Reset Defaults
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), onAdd())}
          className="h-10 rounded-xl text-sm"
        />
        <Button size="sm" onClick={onAdd} className="h-10 rounded-xl px-4">
          Add
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-3 bg-muted/20 border border-border/40 rounded-xl min-h-[60px] align-content-start">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-1 bg-secondary text-foreground hover:bg-secondary/80 pl-3 pr-1.5 py-1 rounded-lg text-xs font-semibold border border-border transition-colors">
            <span>{item}</span>
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="text-muted-foreground hover:text-destructive w-4 h-4 flex items-center justify-center rounded-full hover:bg-muted transition-colors font-bold text-[10px]"
            >
              ×
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-[11px] text-muted-foreground italic flex items-center justify-center w-full py-4">
            No items in this list. Click add above.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appearance & General Customization</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage layouts, homepage widgets, metadata, and static policy pages.</p>
        </div>
        
        {/* Toggle subtabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50 self-start sm:self-center shrink-0">
          <button
            onClick={() => setSubTab('layouts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              subTab === 'layouts' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Layouts & UI
          </button>
          <button
            onClick={() => setSubTab('general')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
              subTab === 'general' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            General
          </button>
        </div>
      </div>

      {subTab === 'layouts' ? (
        <div className="space-y-6 max-w-4xl">
          <div className="flex justify-between items-center bg-muted/20 border border-border/50 p-4 rounded-2xl">
            <span className="text-sm font-semibold text-muted-foreground">Save layout modifications to update website UI components.</span>
            <Button className="gap-2 rounded-xl" onClick={handleSaveLayouts} disabled={saving}>
              <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Layouts'}
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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-muted/20 border border-border/50 p-4 rounded-2xl">
            <span className="text-sm font-semibold text-muted-foreground">Save general customization changes to update genres, authors, artists, release years, and pages.</span>
            <Button className="gap-2 rounded-xl" onClick={handleSaveGeneral} disabled={saving}>
              <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save General'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Tag managers (Genres, Authors, Artists, Years) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TagManagerCard
                  title="Genres"
                  icon="ph:tag-bold"
                  items={genres}
                  inputValue={newGenre}
                  onInputChange={setNewGenre}
                  onAdd={handleAddGenre}
                  onRemove={(idx) => setGenres(prev => prev.filter((_, i) => i !== idx))}
                  onReset={() => { setGenres(DEFAULT_GENRE_LIST); toast.success('Genres reset to default values'); }}
                  placeholder="e.g. Action, Isekai..."
                />
                
                <TagManagerCard
                  title="Release Years"
                  icon="ph:calendar-bold"
                  items={years}
                  inputValue={newYear}
                  onInputChange={setNewYear}
                  onAdd={handleAddYear}
                  onRemove={(idx) => setYears(prev => prev.filter((_, i) => i !== idx))}
                  onReset={() => { setYears(DEFAULT_YEAR_LIST); toast.success('Years reset to default values'); }}
                  placeholder="e.g. 2026..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TagManagerCard
                  title="Authors"
                  icon="ph:feather-bold"
                  items={authors}
                  inputValue={newAuthor}
                  onInputChange={setNewAuthor}
                  onAdd={handleAddAuthor}
                  onRemove={(idx) => setAuthors(prev => prev.filter((_, i) => i !== idx))}
                  onReset={() => { setAuthors(DEFAULT_AUTHOR_LIST); toast.success('Authors reset to default values'); }}
                  placeholder="e.g. Oda, Horikoshi..."
                />

                <TagManagerCard
                  title="Artists"
                  icon="ph:paint-brush-broad-bold"
                  items={artists}
                  inputValue={newArtist}
                  onInputChange={setNewArtist}
                  onAdd={handleAddArtist}
                  onRemove={(idx) => setArtists(prev => prev.filter((_, i) => i !== idx))}
                  onReset={() => { setArtists(DEFAULT_ARTIST_LIST); toast.success('Artists reset to default values'); }}
                  placeholder="e.g. Murata, Kishimoto..."
                />
              </div>
            </div>

            {/* Right side: Pages customizer */}
            <div className="lg:col-span-5">
              <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4 shadow-sm h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Icon icon="ph:file-html-bold" className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-foreground">Manage Pages</span>
                  </div>
                </div>

                {/* Sub tab selectors for DMCA & Privacy */}
                <div className="flex bg-muted/40 rounded-xl p-1 border border-border/40">
                  <button
                    type="button"
                    onClick={() => setActivePageTab('dmca')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      activePageTab === 'dmca' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    DMCA Policy
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePageTab('privacy')}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      activePageTab === 'privacy' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Privacy Policy
                  </button>
                </div>

                <div className="flex-1 flex flex-col space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-muted-foreground">
                      {activePageTab === 'dmca' ? 'Customize DMCA Takedown & Policy Text' : 'Customize Privacy Policy Text'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (activePageTab === 'dmca') {
                          setDmcaContent('');
                          toast.success('DMCA content cleared (restored default layout)');
                        } else {
                          setPrivacyContent('');
                          toast.success('Privacy Policy cleared (restored default layout)');
                        }
                      }}
                      className="text-primary hover:underline text-[10px] font-semibold"
                    >
                      Use Default Layout
                    </button>
                  </div>

                  <Textarea
                    placeholder={
                      activePageTab === 'dmca'
                        ? "Enter your custom DMCA Policy text here. Leave blank to use the default formatted sections..."
                        : "Enter your custom Privacy Policy text here. Leave blank to use the default formatted sections..."
                    }
                    value={activePageTab === 'dmca' ? dmcaContent : privacyContent}
                    onChange={e => activePageTab === 'dmca' ? setDmcaContent(e.target.value) : setPrivacyContent(e.target.value)}
                    className="flex-1 min-h-[300px] rounded-xl text-sm font-sans resize-none leading-relaxed border-border/70"
                  />
                  <p className="text-[10px] text-muted-foreground italic mt-1 leading-normal">
                    Tip: Paragraphs will be separated by lines exactly as formatted above (whitespace-pre-wrap mode is active on pages).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {filteredGenresForCollection.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenreSelection(genre)}
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
