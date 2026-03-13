import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Settings, ArrowLeft, Plus, Search,
  Eye, Star, Bookmark, TrendingUp, Edit, Trash2, Shield, ChevronDown,
  BarChart3, FileText, Bell, Globe, Upload, MoreHorizontal, List, Save, RotateCcw, Image,
  Database, Palette, Link2, ExternalLink, Crown, X
} from 'lucide-react';
import PremiumContent from '@/pages/admin/PremiumContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { formatViews } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminManga, useDeleteManga } from '@/hooks/useManga';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { MangaFormModal } from '@/components/admin/MangaFormModal';
import { ChapterManager } from '@/components/admin/ChapterManager';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type Manga = Tables<"manga">;
type Tab = 'overview' | 'manga' | 'premium' | 'users' | 'settings';
type SettingsSubTab = 'general' | 'theme' | 'announcements' | 'upload' | 'storage';
type UserTab = 'all' | 'admins';

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  coin_balance?: number | null;
  token_balance?: number | null;
  is_admin?: boolean;
}

import { THEME_PRESETS as ALL_THEME_PRESETS } from '@/lib/themes';

// Helper to upload file to storage
const uploadToStorage = async (file: File, path: string): Promise<string> => {
  const ext = file.name.split('.').pop();
  const fileName = `${path}.${ext}`;
  const { error } = await supabase.storage.from('manga-assets').upload(fileName, file, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from('manga-assets').getPublicUrl(fileName);
  return publicUrl;
};

export default function AdminPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const { data: supabaseManga = [], isLoading: mangaLoading } = useAdminManga();
  const deleteManga = useDeleteManga();
  const { settings, updateSettings } = useSiteSettings();

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('general');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [mangaSearch, setMangaSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mangaFormOpen, setMangaFormOpen] = useState(false);
  const [editingManga, setEditingManga] = useState<Manga | null>(null);
  const [chapterManagerOpen, setChapterManagerOpen] = useState(false);
  const [selectedManga, setSelectedManga] = useState<Manga | null>(null);
  const [deleteMangaId, setDeleteMangaId] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [userTab, setUserTab] = useState<UserTab>('all');
  const [userActionModal, setUserActionModal] = useState<UserRow | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [editCoinBalance, setEditCoinBalance] = useState(0);
  const [editTokenBalance, setEditTokenBalance] = useState(0);
  const [blockIp, setBlockIp] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const { settings: premiumSettings } = usePremiumSettings();

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    site_name: '',
    site_description: '',
    footer_text: '',
    footer_tagline: '',
    logo_url: '',
    discord_url: '',
    patreon_url: '',
    announcement_message: '',
    announcement_button_text: '',
    announcement_button_url: '',
    max_size_mb: 10,
    allowed_formats: 'jpg, png, webp',
    storage_provider: 'supabase',
    blogger_blog_id: '',
    blogger_api_key: '',
    theme_preset: 'Sakura',
    custom_primary_hsl: '',
  });

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setSettingsForm(prev => ({
        ...prev,
        site_name: settings.general.site_name,
        site_description: settings.general.site_description,
        footer_text: settings.general.footer_text,
        footer_tagline: settings.general.footer_tagline,
        logo_url: settings.general.logo_url || '',
        discord_url: (settings.general as any).discord_url || '',
        patreon_url: (settings.general as any).patreon_url || '',
        announcement_message: settings.announcements.message,
        announcement_button_text: (settings.announcements as any).button_text || '',
        announcement_button_url: (settings.announcements as any).button_url || '',
        max_size_mb: settings.upload.max_size_mb,
        allowed_formats: settings.upload.allowed_formats,
        storage_provider: (settings as any).storage?.provider || 'supabase',
        blogger_blog_id: (settings as any).storage?.blogger_blog_id || '',
        blogger_api_key: (settings as any).storage?.blogger_api_key || '',
        theme_preset: (settings as any).theme?.preset || 'Sakura',
        custom_primary_hsl: (settings as any).theme?.custom_primary_hsl || '',
      }));
    }
  }, [settings]);

  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') fetchUsers();
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    const { data } = await supabase.from('profiles').select('id, display_name, avatar_url, created_at, coin_balance, token_balance').order('created_at', { ascending: false });
    // Get admin user IDs
    const { data: adminRoles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    const adminIds = (adminRoles || []).map(r => r.user_id);
    const enriched = (data || []).map(u => ({ ...u, is_admin: adminIds.includes(u.id) }));
    setUsers(enriched as UserRow[]);
    setUsersLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'manga', label: 'Manga', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'premium', label: 'Premium Content', icon: <Crown className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const settingsSubTabs: { id: SettingsSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'theme', label: 'Theme', icon: <Palette className="w-3.5 h-3.5" /> },
    { id: 'announcements', label: 'Announcements', icon: <Bell className="w-3.5 h-3.5" /> },
    { id: 'upload', label: 'Upload', icon: <Upload className="w-3.5 h-3.5" /> },
    { id: 'storage', label: 'Storage', icon: <Database className="w-3.5 h-3.5" /> },
  ];

  const filteredManga = supabaseManga.filter(m =>
    m.title.toLowerCase().includes(mangaSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalViews = supabaseManga.reduce((acc, m) => acc + (m.views || 0), 0);
  const totalBookmarks = supabaseManga.reduce((acc, m) => acc + (m.bookmarks || 0), 0);

  const handleEditManga = (manga: Manga) => { setEditingManga(manga); setMangaFormOpen(true); };
  const handleManageChapters = (manga: Manga) => { setSelectedManga(manga); setChapterManagerOpen(true); };

  const handleDeleteManga = async () => {
    if (!deleteMangaId) return;
    const manga = supabaseManga.find(m => m.id === deleteMangaId);
    if (!manga) return;
    await deleteManga.mutateAsync({ id: deleteMangaId, coverUrl: manga.cover_url, bannerUrl: manga.banner_url || undefined });
    setDeleteMangaId(null);
  };

  const handleMangaFormClose = () => { setMangaFormOpen(false); setEditingManga(null); };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const url = await uploadToStorage(file, `site/logo-${Date.now()}`);
      setSettingsForm(s => ({ ...s, logo_url: url }));
      toast.success('Logo uploaded! Click Save to apply.');
    } catch (err: any) {
      toast.error(`Logo upload failed: ${err.message}`);
    }
    setLogoUploading(false);
  };

  const handleSaveSettings = async () => {
    try {
      await Promise.all([
        updateSettings.mutateAsync({
          key: 'general',
          value: {
            site_name: settingsForm.site_name,
            site_description: settingsForm.site_description,
            footer_text: settingsForm.footer_text,
            footer_tagline: settingsForm.footer_tagline,
            logo_url: settingsForm.logo_url,
            discord_url: settingsForm.discord_url,
            patreon_url: settingsForm.patreon_url,
          },
        }),
        updateSettings.mutateAsync({
          key: 'announcements',
          value: {
            message: settingsForm.announcement_message,
            button_text: settingsForm.announcement_button_text,
            button_url: settingsForm.announcement_button_url,
          },
        }),
        updateSettings.mutateAsync({
          key: 'upload',
          value: { max_size_mb: settingsForm.max_size_mb, allowed_formats: settingsForm.allowed_formats },
        }),
        updateSettings.mutateAsync({
          key: 'storage',
          value: {
            provider: settingsForm.storage_provider,
            blogger_blog_id: settingsForm.blogger_blog_id,
            blogger_api_key: settingsForm.blogger_api_key,
          },
        }),
        updateSettings.mutateAsync({
          key: 'theme',
          value: {
            preset: settingsForm.theme_preset,
          },
        }),
      ]);

      // Theme will be applied automatically by ThemeContext on settings change

      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    if (settings) {
      setSettingsForm({
        site_name: settings.general.site_name,
        site_description: settings.general.site_description,
        footer_text: settings.general.footer_text,
        footer_tagline: settings.general.footer_tagline,
        logo_url: settings.general.logo_url || '',
        discord_url: (settings.general as any).discord_url || '',
        patreon_url: (settings.general as any).patreon_url || '',
        announcement_message: settings.announcements.message,
        announcement_button_text: (settings.announcements as any).button_text || '',
        announcement_button_url: (settings.announcements as any).button_url || '',
        max_size_mb: settings.upload.max_size_mb,
        allowed_formats: settings.upload.allowed_formats,
        storage_provider: (settings as any).storage?.provider || 'supabase',
        blogger_blog_id: (settings as any).storage?.blogger_blog_id || '',
        blogger_api_key: (settings as any).storage?.blogger_api_key || '',
        theme_preset: (settings as any).theme?.preset || 'Sakura',
        custom_primary_hsl: (settings as any).theme?.custom_primary_hsl || '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-sm">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">{settings.general.site_name}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" /> Back to Site
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">Admin Panel</span>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {tabs.find(t => t.id === activeTab)?.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="px-4 pb-3 flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">Overview of your platform stats.</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Series', value: supabaseManga.length, icon: <BookOpen className="w-5 h-5" />, color: 'text-primary' },
                { label: 'Total Views', value: formatViews(totalViews), icon: <Eye className="w-5 h-5" />, color: 'text-blue-500' },
                { label: 'Total Bookmarks', value: formatViews(totalBookmarks), icon: <Bookmark className="w-5 h-5" />, color: 'text-emerald-500' },
                { label: 'Total Users', value: users.length, icon: <Users className="w-5 h-5" />, color: 'text-amber-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Button variant="outline" className="justify-start gap-2 rounded-xl h-11" onClick={() => setActiveTab('manga')}>
                  <Plus className="w-4 h-4" /> Add New Series
                </Button>
                <Button variant="outline" className="justify-start gap-2 rounded-xl h-11" onClick={() => setActiveTab('users')}>
                  <Users className="w-4 h-4" /> Manage Users
                </Button>
                <Button variant="outline" className="justify-start gap-2 rounded-xl h-11" onClick={() => setActiveTab('settings')}>
                  <Settings className="w-4 h-4" /> Site Settings
                </Button>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Recent Series</h3>
              <div className="space-y-2">
                {supabaseManga.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <img src={m.cover_url} alt={m.title} className="w-10 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.type}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-500' : m.status === 'completed' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manga' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold">Manga Management</h1>
                <p className="text-muted-foreground text-sm mt-1">{supabaseManga.length} series total</p>
              </div>
              <Button className="gap-2 rounded-xl" onClick={() => setMangaFormOpen(true)}>
                <Plus className="w-4 h-4" /> Add Series
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search series..." value={mangaSearch} onChange={e => setMangaSearch(e.target.value)} className="pl-9 rounded-xl bg-card border-border" />
            </div>

            {mangaLoading ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Loading manga...</div>
            ) : filteredManga.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">
                {mangaSearch ? 'No series found.' : 'No series yet. Add your first series!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredManga.map(m => (
                  <div key={m.id} className="bg-card border border-border rounded-2xl overflow-hidden group hover:border-primary/30 transition-colors">
                    <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                      {m.cover_url ? (
                        <img src={m.cover_url} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${m.type === 'manhwa' ? 'bg-blue-500/90 text-white' : m.type === 'manga' ? 'bg-red-500/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                          {m.type}
                        </span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md capitalize ${m.status === 'ongoing' ? 'bg-emerald-500/90 text-white' : m.status === 'completed' ? 'bg-blue-500/90 text-white' : 'bg-amber-500/90 text-white'}`}>
                          {m.status}
                        </span>
                      </div>
                      <div className="absolute top-2 right-2 flex gap-1">
                        {m.pinned && <span className="text-xs bg-background/80 rounded px-1">📌</span>}
                        {m.featured && <span className="text-xs bg-background/80 rounded px-1">⭐</span>}
                        {m.trending && <span className="text-xs bg-background/80 rounded px-1">🔥</span>}
                        {m.premium && <span className="text-xs bg-amber-500/80 text-white rounded px-1">P</span>}
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" title={m.title}>{m.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.author || 'Unknown author'}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatViews(m.views || 0)}</span>
                        <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{formatViews(m.bookmarks || 0)}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                        <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-muted text-xs gap-1 flex-1" onClick={() => handleManageChapters(m)}>
                          <List className="w-3.5 h-3.5" /> Chapters
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => handleEditManga(m)}>
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => setDeleteMangaId(m.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'premium' && <PremiumContent />}

        {activeTab === 'users' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
            </div>
            {/* User tabs */}
            <div className="flex gap-2">
              {(['all', 'admins'] as UserTab[]).map(t => (
                <button key={t} onClick={() => setUserTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${userTab === t ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground hover:text-foreground'}`}>
                  {t === 'all' ? 'All Users' : 'Admins'}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 rounded-xl bg-card border-border" />
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_200px_120px_80px] gap-3 px-5 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>User</span><span>Joined</span><span>Role</span><span>Actions</span>
              </div>
              <div className="divide-y divide-border">
                {usersLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Loading users...</div>
                ) : filteredUsers.filter(u => userTab === 'all' || u.is_admin).map(u => (
                  <div key={u.id} className="flex flex-col md:grid md:grid-cols-[1fr_200px_120px_80px] gap-2 md:gap-3 px-5 py-3 hover:bg-muted/30 transition-colors items-start md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${u.is_admin ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                      {u.is_admin ? 'Admin' : 'User'}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => {
                      setUserActionModal(u);
                      setEditUserName(u.display_name || '');
                      setEditUserAvatar(u.avatar_url || '');
                      setEditCoinBalance(u.coin_balance ?? 0);
                      setEditTokenBalance(u.token_balance ?? 0);
                      setBlockIp('');
                    }}>
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {!usersLoading && filteredUsers.filter(u => userTab === 'all' || u.is_admin).length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h1 className="text-2xl font-bold">Site Settings</h1>
              <p className="text-muted-foreground text-sm mt-1">Configure your platform.</p>
            </div>

            {/* Settings sub-tabs */}
            <div className="flex gap-1.5 flex-wrap bg-muted/30 rounded-xl p-1.5">
              {settingsSubTabs.map(st => (
                <button
                  key={st.id}
                  onClick={() => setSettingsSubTab(st.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    settingsSubTab === st.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {st.icon} {st.label}
                </button>
              ))}
            </div>

            {/* General */}
            {settingsSubTab === 'general' && (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> Basic Site Details</h3>
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {settingsForm.logo_url ? (
                        <img src={settingsForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      ) : (
                        <Image className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{settingsForm.site_name || 'Not set'}</p>
                      <p className="text-xs text-muted-foreground truncate">{settingsForm.site_description || 'No description'}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Site Logo</label>
                      <div className="flex items-center gap-3">
                        {settingsForm.logo_url && (
                          <img src={settingsForm.logo_url} alt="Current logo" className="w-10 h-10 rounded-lg object-contain bg-muted" />
                        )}
                        <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-sm">
                          <Upload className="w-4 h-4" /> {logoUploading ? 'Uploading...' : 'Upload Logo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Site Name</label>
                      <Input value={settingsForm.site_name} onChange={e => setSettingsForm(s => ({ ...s, site_name: e.target.value }))} className="rounded-xl bg-background" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Site Description</label>
                      <Input value={settingsForm.site_description} onChange={e => setSettingsForm(s => ({ ...s, site_description: e.target.value }))} className="rounded-xl bg-background" />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Footer</h3>
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-sm font-medium">{settingsForm.footer_text || 'Not set'}</p>
                    <p className="text-xs text-muted-foreground">{settingsForm.footer_tagline || 'No tagline'}</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Footer Text</label>
                      <Input value={settingsForm.footer_text} onChange={e => setSettingsForm(s => ({ ...s, footer_text: e.target.value }))} className="rounded-xl bg-background" placeholder="e.g. MangaHub v1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Footer Tagline</label>
                      <Input value={settingsForm.footer_tagline} onChange={e => setSettingsForm(s => ({ ...s, footer_tagline: e.target.value }))} className="rounded-xl bg-background" placeholder="e.g. Your gateway to manga" />
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Link2 className="w-4 h-4" /> Social Links</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Discord URL</label>
                      <Input value={settingsForm.discord_url} onChange={e => setSettingsForm(s => ({ ...s, discord_url: e.target.value }))} className="rounded-xl bg-background" placeholder="https://discord.gg/..." />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Patreon URL</label>
                      <Input value={settingsForm.patreon_url} onChange={e => setSettingsForm(s => ({ ...s, patreon_url: e.target.value }))} className="rounded-xl bg-background" placeholder="https://patreon.com/..." />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme */}
            {settingsSubTab === 'theme' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Palette className="w-4 h-4" /> Theme Presets</h3>
                <p className="text-sm text-muted-foreground">Choose a full theme preset. Each theme controls all colors for both light and dark modes.</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {ALL_THEME_PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => setSettingsForm(s => ({ ...s, theme_preset: preset.name, custom_primary_hsl: '' }))}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        settingsForm.theme_preset === preset.name
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-2">
                        {preset.colors.map((color, i) => (
                          <div key={i} className="w-5 h-5 rounded-full border border-border/30" style={{ background: color }} />
                        ))}
                      </div>
                      <p className="text-xs font-semibold">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Announcements */}
            {settingsSubTab === 'announcements' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Announcement Bar</h3>
                <p className="text-sm text-muted-foreground">
                  This message will be displayed on the homepage. Leave empty to hide.
                </p>
                <div>
                  <label className="text-sm font-medium mb-1 block">Message</label>
                  <Textarea
                    value={settingsForm.announcement_message}
                    onChange={e => setSettingsForm(s => ({ ...s, announcement_message: e.target.value }))}
                    placeholder="Write your announcement..."
                    className="rounded-xl bg-background min-h-[80px] resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Button Text (optional)</label>
                    <Input
                      value={settingsForm.announcement_button_text}
                      onChange={e => setSettingsForm(s => ({ ...s, announcement_button_text: e.target.value }))}
                      className="rounded-xl bg-background"
                      placeholder="e.g. Learn More"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Button URL (optional)</label>
                    <Input
                      value={settingsForm.announcement_button_url}
                      onChange={e => setSettingsForm(s => ({ ...s, announcement_button_url: e.target.value }))}
                      className="rounded-xl bg-background"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                {settingsForm.announcement_message && (
                  <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Preview:</p>
                    <p className="text-sm">{settingsForm.announcement_message}</p>
                    {settingsForm.announcement_button_text && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                        <ExternalLink className="w-3 h-3" /> {settingsForm.announcement_button_text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload */}
            {settingsSubTab === 'upload' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Settings</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Max Upload Size (MB)</label>
                    <Input type="number" value={settingsForm.max_size_mb} onChange={e => setSettingsForm(s => ({ ...s, max_size_mb: parseInt(e.target.value) || 10 }))} className="rounded-xl bg-background w-32" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Allowed Image Formats</label>
                    <Input value={settingsForm.allowed_formats} onChange={e => setSettingsForm(s => ({ ...s, allowed_formats: e.target.value }))} className="rounded-xl bg-background" />
                  </div>
                </div>
              </div>
            )}

            {/* Storage */}
            {settingsSubTab === 'storage' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Database className="w-4 h-4" /> Storage Provider</h3>
                <p className="text-sm text-muted-foreground">
                  Choose where to store uploaded images. Blogger uses Google's CDN for free unlimited image hosting.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'supabase', label: 'Supabase Storage', desc: 'Default storage (limited by plan)' },
                    { id: 'blogger', label: 'Blogger CDN', desc: 'Free unlimited via Google CDN' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSettingsForm(s => ({ ...s, storage_provider: opt.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        settingsForm.storage_provider === opt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>

                {settingsForm.storage_provider === 'blogger' && (
                  <div className="space-y-3 pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Create a Blogger blog for image hosting, then enter your Blog ID and API key below.
                    </p>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Blog ID</label>
                      <Input
                        value={settingsForm.blogger_blog_id}
                        onChange={e => setSettingsForm(s => ({ ...s, blogger_blog_id: e.target.value }))}
                        className="rounded-xl bg-background"
                        placeholder="e.g. 1234567890"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Blogger API Key / OAuth Token</label>
                      <Input
                        type="password"
                        value={settingsForm.blogger_api_key}
                        onChange={e => setSettingsForm(s => ({ ...s, blogger_api_key: e.target.value }))}
                        className="rounded-xl bg-background"
                        placeholder="Your API key or OAuth access token"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button className="rounded-xl gap-2" onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                <Save className="w-4 h-4" /> {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" className="rounded-xl gap-2" onClick={handleResetSettings}>
                <RotateCcw className="w-4 h-4" /> Reset
              </Button>
            </div>
          </div>
        )}
      </main>

      <MangaFormModal open={mangaFormOpen} onOpenChange={handleMangaFormClose} manga={editingManga || undefined} />
      <ChapterManager open={chapterManagerOpen} onOpenChange={setChapterManagerOpen} manga={selectedManga} />

      {/* User Actions Modal */}
      <Dialog open={!!userActionModal} onOpenChange={() => setUserActionModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User — {userActionModal?.display_name || 'Unknown'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Edit Profile */}
            <div className="space-y-2 rounded-xl border border-border p-3">
              <h4 className="text-sm font-semibold">Edit Profile</h4>
              <Input placeholder="Display Name" value={editUserName} onChange={e => setEditUserName(e.target.value)} className="rounded-lg" />
              <Input placeholder="Avatar URL" value={editUserAvatar} onChange={e => setEditUserAvatar(e.target.value)} className="rounded-lg" />
              <Button size="sm" onClick={async () => {
                if (!userActionModal) return;
                await supabase.from('profiles').update({ display_name: editUserName, avatar_url: editUserAvatar || null }).eq('id', userActionModal.id);
                toast.success('Profile updated'); fetchUsers();
              }}>Save Profile</Button>
            </div>

            {/* Edit Balance */}
            <div className="space-y-2 rounded-xl border border-border p-3">
              <h4 className="text-sm font-semibold">Edit Balance</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">{premiumSettings.coin_system.currency_name}</label>
                  <Input type="number" value={editCoinBalance} onChange={e => setEditCoinBalance(parseInt(e.target.value) || 0)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Tickets</label>
                  <Input type="number" value={editTokenBalance} onChange={e => setEditTokenBalance(parseInt(e.target.value) || 0)} />
                </div>
              </div>
              <Button size="sm" onClick={async () => {
                if (!userActionModal) return;
                try {
                  const { error } = await supabase.rpc('admin_set_user_balance', {
                    p_target_user_id: userActionModal.id,
                    p_coin_balance: editCoinBalance,
                    p_token_balance: editTokenBalance,
                  });
                  if (error) throw error;
                  toast.success('Balance updated'); fetchUsers();
                } catch (err: any) {
                  toast.error(`Failed to update balance: ${err.message}`);
                }
              }}>Save Balance</Button>
            </div>

            {/* Restrict by IP */}
            <div className="space-y-2 rounded-xl border border-border p-3">
              <h4 className="text-sm font-semibold">Restrict by IP</h4>
              <Input placeholder="IP Address" value={blockIp} onChange={e => setBlockIp(e.target.value)} className="rounded-lg" />
              <Button size="sm" variant="destructive" onClick={async () => {
                if (!blockIp.trim()) return;
                await supabase.from('blocked_ips').insert({ ip_address: blockIp.trim() });
                toast.success('IP blocked'); setBlockIp('');
              }}>Block IP</Button>
            </div>

            {/* Delete User */}
            <Button variant="destructive" className="w-full" onClick={() => { setDeleteUserId(userActionModal?.id || null); setUserActionModal(null); }}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteMangaId} onOpenChange={() => setDeleteMangaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Manga</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This will permanently delete the series, all chapters, and images.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteManga} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this user's profile and all associated data. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              if (!deleteUserId) return;
              await supabase.from('profiles').delete().eq('id', deleteUserId);
              toast.success('User deleted'); setDeleteUserId(null); fetchUsers();
            }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
