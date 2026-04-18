import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import PremiumContent from '@/pages/admin/PremiumContent';
import { StorageSection } from '@/components/admin/StorageSection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { formatViews } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminManga, useDeleteManga } from '@/hooks/useManga';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useSubscriptionPlans } from '@/hooks/useSubscription';
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
type Tab = 'overview' | 'manga' | 'premium' | 'google_setup' | 'users' | 'settings';
type SettingsSubTab = 'general' | 'theme' | 'announcements' | 'upload' | 'storage';
type GoogleSubTab = 'search_console' | 'analytics' | 'oauth' | 'ads' | 'seo';
type UserTab = 'all' | 'admins';

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: 'admin' | 'moderator' | 'user';
  coin_balance?: number | null;
  token_balance?: number | null;
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
  const { isAdmin, isMod, isStaff, loading } = useUserRole();
  const { data: supabaseManga = [], isLoading: mangaLoading } = useAdminManga();
  const deleteManga = useDeleteManga();
  const { settings, updateSettings } = useSiteSettings();

  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [settingsSubTab, setSettingsSubTab] = useState<SettingsSubTab>('general');
  type GoogleSubTab = 'seo' | 'analytics' | 'oauth' | 'ads';
  const [googleSubTab, setGoogleSubTab] = useState<GoogleSubTab>('seo');
  const [googleTutorialOpen, setGoogleTutorialOpen] = useState<Record<string, boolean>>({});
  const toggleTutorial = (key: string) => setGoogleTutorialOpen(p => ({ ...p, [key]: !p[key] }));
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [realViewCount, setRealViewCount] = useState(0);
  const [realBookmarkCount, setRealBookmarkCount] = useState(0);
  const [mangaViewCounts, setMangaViewCounts] = useState<Record<string, number>>({});
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
  const { data: subscriptionPlans = [] } = useSubscriptionPlans();
  const [editSubPlanId, setEditSubPlanId] = useState('');

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    site_name: '',
    site_title: '',
    site_title_suffix: '',
    site_description: '',
    footer_text: '',
    footer_tagline: '',
    logo_url: '',
    favicon_url: '',
    loader_name: '',
    loader_logo_url: '',
    discord_url: '',
    donation_name: 'Patreon',
    donation_url: '',
    donation_icon_url: '',
    announcement_message: '',
    announcement_button_text: '',
    announcement_button_url: '',
    max_size_mb: 10,
    allowed_formats: 'jpg, png, webp',
    storage_provider: 'supabase',
    imgbb_api_key: '',
    r2_account_id: '',
    r2_access_key: '',
    r2_secret_key: '',
    r2_bucket_name: '',
    r2_public_url: '',
    theme_preset: 'Obsidian',
    custom_primary_hsl: '',
    google_site_verification: '',
    google_analytics_id: '',
    robots_meta: 'index, follow',
    sitemap_url: '',
    extra_head_scripts: '',
    google_client_id: '',
    google_client_secret: '',
    google_ads_slot: '',
  });

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Load settings into form exactly once on load
  // We fetch directly from Supabase so admins receive protected keys like 'storage'
  useEffect(() => {
    const loadSettings = async () => {
      if (settingsLoaded) return;
      
      const { data, error } = await supabase.from('site_settings').select('key, value');
      if (error || !data) {
        toast.error('Failed to load admin settings');
        return;
      }
      
      const adminData: any = {};
      data.forEach(r => { adminData[r.key] = r.value; });
      
      setSettingsForm(prev => ({
        ...prev,
        site_name: adminData.general?.site_name ?? settings?.general?.site_name ?? 'Grodex Tantrums',
        site_title: adminData.general?.site_title ?? settings?.general?.site_title ?? 'Grodex Tantrums',
        site_title_suffix: adminData.general?.site_title_suffix ?? settings?.general?.site_title_suffix ?? '- Read Manga',
        site_description: adminData.general?.site_description ?? settings?.general?.site_description ?? '',
        footer_text: adminData.general?.footer_text ?? settings?.general?.footer_text ?? '',
        footer_tagline: adminData.general?.footer_tagline ?? settings?.general?.footer_tagline ?? '',
        logo_url: adminData.general?.logo_url ?? settings?.general?.logo_url ?? '',
        favicon_url: adminData.general?.favicon_url ?? settings?.general?.favicon_url ?? '',
        loader_name: adminData.general?.loader_name ?? settings?.general?.loader_name ?? '',
        loader_logo_url: adminData.general?.loader_logo_url ?? settings?.general?.loader_logo_url ?? '',
        discord_url: adminData.general?.discord_url ?? settings?.general?.discord_url ?? '',
        donation_name: adminData.general?.donation_name ?? settings?.general?.donation_name ?? 'Patreon',
        donation_url: adminData.general?.donation_url ?? settings?.general?.donation_url ?? '',
        donation_icon_url: adminData.general?.donation_icon_url ?? settings?.general?.donation_icon_url ?? '',
        announcement_message: adminData.announcements?.message ?? settings?.announcements?.message ?? '',
        announcement_button_text: adminData.announcements?.button_text ?? settings?.announcements?.button_text ?? '',
        announcement_button_url: adminData.announcements?.button_url ?? settings?.announcements?.button_url ?? '',
        max_size_mb: adminData.upload?.max_size_mb ?? settings?.upload?.max_size_mb ?? 10,
        allowed_formats: adminData.upload?.allowed_formats ?? settings?.upload?.allowed_formats ?? 'png, jpg, webp',
        storage_provider: adminData.storage?.provider ?? settings?.storage?.provider ?? 'supabase',
        imgbb_api_key: adminData.storage?.imgbb_api_key ?? '',
        r2_account_id: adminData.storage?.r2_account_id ?? '',
        r2_access_key: adminData.storage?.r2_access_key ?? '',
        r2_secret_key: adminData.storage?.r2_secret_key ?? '',
        r2_bucket_name: adminData.storage?.r2_bucket_name ?? '',
        r2_public_url: adminData.storage?.r2_public_url ?? '',
        theme_preset: adminData.theme?.preset ?? settings?.theme?.preset ?? 'Obsidian',
        custom_primary_hsl: adminData.theme?.custom_primary_hsl ?? settings?.theme?.custom_primary_hsl ?? '',
        google_site_verification: adminData.seo?.google_site_verification ?? settings?.seo?.google_site_verification ?? '',
        google_analytics_id: adminData.seo?.google_analytics_id ?? settings?.seo?.google_analytics_id ?? '',
        robots_meta: adminData.seo?.robots_meta ?? settings?.seo?.robots_meta ?? 'index, follow',
        sitemap_url: adminData.seo?.sitemap_url ?? settings?.seo?.sitemap_url ?? '',
        extra_head_scripts: adminData.seo?.extra_head_scripts ?? settings?.seo?.extra_head_scripts ?? '',
        google_client_id: adminData.seo?.google_client_id ?? '',
        google_client_secret: adminData.seo?.google_client_secret ?? '',
        google_ads_slot: adminData.seo?.google_ads_slot ?? '',
      }));
      setSettingsLoaded(true);
    };
    
    // settings provides a reactive trigger to ensure we only load once initial auth checking is done
    if (settings && !settingsLoaded) {
      loadSettings();
    }
  }, [settings, settingsLoaded]);

  useEffect(() => {
    // Only redirect after both auth AND role have fully resolved
    if (!loading && !isStaff) navigate('/');
  }, [isStaff, loading, navigate]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') fetchUsers();
    if (activeTab === 'overview') fetchRealStats();
    
    // Redirect mods if they land on an unauthorized tab
    if (isMod && !['manga', 'users'].includes(activeTab)) {
      setActiveTab('manga');
    }
  }, [activeTab, isMod]);

  const fetchRealStats = async () => {
    const [{ count: viewCount }, { count: bookmarkCount }] = await Promise.all([
      supabase.from('manga_views').select('*', { count: 'exact', head: true }),
      supabase.from('bookmarks').select('*', { count: 'exact', head: true }),
    ]);
    setRealViewCount(viewCount || 0);
    setRealBookmarkCount(bookmarkCount || 0);

    // Fetch view counts per manga for top 5
    const { data: viewData } = await supabase
      .from('manga_views')
      .select('manga_id');
    
    if (viewData) {
      const counts: Record<string, number> = {};
      viewData.forEach(v => {
        counts[v.manga_id] = (counts[v.manga_id] || 0) + 1;
      });
      setMangaViewCounts(counts);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { toast.error('Error fetching users'); return; }

    // Get roles for all fetched users
    const { data: allRoles } = await supabase.from('user_roles').select('user_id, role');
    const roleMap: Record<string, 'admin' | 'moderator' | 'user'> = {};
    (allRoles || []).forEach(r => { roleMap[r.user_id] = r.role as any; });

    const enriched = (data || []).map(u => ({ 
      ...u, 
      role: roleMap[u.id] || 'user' 
    }));
    setUsers(enriched as UserRow[]);
    setUsersLoading(false);
  };

  if (loading || !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const adminTabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Icon icon="ph:layout-bold" className="w-4 h-4" /> },
    { id: 'manga', label: 'Manga', icon: <Icon icon="ph:book-open-bold" className="w-4 h-4" /> },
    { id: 'premium', label: 'Premium Content', icon: <Icon icon="ph:crown-bold" className="w-4 h-4" /> },
    { id: 'google_setup', label: 'Google Setup', icon: <Icon icon="ph:google-logo-bold" className="w-4 h-4" /> },
    { id: 'users', label: 'Users', icon: <Icon icon="ph:users-bold" className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Icon icon="ph:gear-bold" className="w-4 h-4" /> },
  ];

  const tabs = isMod 
    ? adminTabs.filter(t => ['manga', 'users'].includes(t.id))
    : adminTabs;

  const settingsSubTabs: { id: SettingsSubTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <Icon icon="ph:globe-bold" className="w-3.5 h-3.5" /> },
    { id: 'theme', label: 'Theme', icon: <Icon icon="ph:palette-bold" className="w-3.5 h-3.5" /> },
    { id: 'announcements', label: 'Announcements', icon: <Icon icon="ph:bell-bold" className="w-3.5 h-3.5" /> },
    { id: 'upload', label: 'Upload', icon: <Icon icon="ph:upload-bold" className="w-3.5 h-3.5" /> },
    { id: 'storage', label: 'Storage', icon: <Icon icon="ph:database-bold" className="w-3.5 h-3.5" /> },
  ];

  const filteredManga = (supabaseManga || []).filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(mangaSearch.toLowerCase());
    // Mods see all manga to allow uploading chapters to any, but can only edit/delete their own
    return matchesSearch;
  });

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const canManageManga = (m: Manga) => isAdmin || (isMod && m.created_by === user?.id);

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
            site_title: settingsForm.site_title,
            site_title_suffix: settingsForm.site_title_suffix,
            site_description: settingsForm.site_description,
            footer_text: settingsForm.footer_text,
            footer_tagline: settingsForm.footer_tagline,
            logo_url: settingsForm.logo_url,
            favicon_url: settingsForm.favicon_url,
            loader_name: settingsForm.loader_name,
            loader_logo_url: settingsForm.loader_logo_url,
            discord_url: settingsForm.discord_url,
            donation_name: settingsForm.donation_name,
            donation_url: settingsForm.donation_url,
            donation_icon_url: settingsForm.donation_icon_url,
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
            imgbb_api_key: settingsForm.imgbb_api_key,
            r2_account_id: settingsForm.r2_account_id,
            r2_access_key: settingsForm.r2_access_key,
            r2_secret_key: settingsForm.r2_secret_key,
            r2_bucket_name: settingsForm.r2_bucket_name,
            r2_public_url: settingsForm.r2_public_url,
          },
        }),
        updateSettings.mutateAsync({
          key: 'theme',
          value: {
            preset: settingsForm.theme_preset,
          },
        }),
        updateSettings.mutateAsync({
          key: 'seo',
          value: {
            google_site_verification: settingsForm.google_site_verification,
            google_analytics_id: settingsForm.google_analytics_id,
            robots_meta: settingsForm.robots_meta,
            sitemap_url: settingsForm.sitemap_url,
            extra_head_scripts: settingsForm.extra_head_scripts,
            google_client_id: settingsForm.google_client_id,
            google_client_secret: settingsForm.google_client_secret,
            google_ads_client_id: settingsForm.google_ads_client_id,
            google_ads_slot: settingsForm.google_ads_slot,
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
        site_title: settings.general.site_title || settings.general.site_name,
        site_title_suffix: settings.general.site_title_suffix || '- Read Manga',
        site_description: settings.general.site_description,
        footer_text: settings.general.footer_text,
        footer_tagline: settings.general.footer_tagline,
        logo_url: settings.general.logo_url || '',
        favicon_url: settings.general.favicon_url || '',
        loader_name: settings.general.loader_name || '',
        loader_logo_url: settings.general.loader_logo_url || '',
        discord_url: settings.general.discord_url || '',
        donation_name: settings.general.donation_name || 'Patreon',
        donation_url: settings.general.donation_url || '',
        donation_icon_url: settings.general.donation_icon_url || '',
        announcement_message: settings.announcements.message,
        announcement_button_text: settings.announcements.button_text || '',
        announcement_button_url: settings.announcements.button_url || '',
        max_size_mb: settings.upload.max_size_mb,
        allowed_formats: settings.upload.allowed_formats,
        storage_provider: settings.storage?.provider || 'supabase',
        imgbb_api_key: settings.storage?.imgbb_api_key || '',
        r2_account_id: settings.storage?.r2_account_id || '',
        r2_access_key: settings.storage?.r2_access_key || '',
        r2_secret_key: settings.storage?.r2_secret_key || '',
        r2_bucket_name: settings.storage?.r2_bucket_name || '',
        r2_public_url: settings.storage?.r2_public_url || '',
        theme_preset: settings.theme?.preset || 'Obsidian',
        custom_primary_hsl: settings.theme?.custom_primary_hsl || '',
        google_site_verification: settings.seo?.google_site_verification || '',
        google_analytics_id: settings.seo?.google_analytics_id || '',
        robots_meta: settings.seo?.robots_meta || 'index, follow',
        sitemap_url: settings.seo?.sitemap_url || '',
        extra_head_scripts: settings.seo?.extra_head_scripts || '',
        google_client_id: (settings.seo as any)?.google_client_id || '',
        google_client_secret: (settings.seo as any)?.google_client_secret || '',
        google_ads_client_id: (settings.seo as any)?.google_ads_client_id || '',
        google_ads_slot: (settings.seo as any)?.google_ads_slot || '',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-72 border-r border-border/50 bg-secondary/20 shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg flex items-center justify-center">
              <Icon icon="ph:shield-check-bold" className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight">Admin Dashboard</h2>
              <p className="text-xs font-medium text-muted-foreground">{settings.general.site_name}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground/50 mb-3 mt-2">Menu</p>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'}`}>
              <div className={activeTab === tab.id ? 'text-primary-foreground' : 'text-muted-foreground/70'}>{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border/50 bg-card/30">
          <Button variant="ghost" className="w-full justify-start gap-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 h-11" onClick={() => navigate('/')}>
            <Icon icon="ph:arrow-left-bold" className="w-5 h-5" /> Back to Main Site
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-50 bg-card border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/')}>
              <Icon icon="ph:arrow-left-bold" className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Icon icon="ph:shield-bold" className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">Admin Dashboard</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {tabs.find(t => t.id === activeTab)?.label}
            <Icon icon="ph:caret-down-bold" className={`w-3 h-3 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="px-4 pb-4 flex gap-2 flex-wrap bg-card absolute w-full border-b border-border shadow-xl">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-secondary text-muted-foreground'}`}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8 overflow-auto bg-background/50">
        {activeTab === 'overview' && (
          <div className="space-y-8 max-w-6xl">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, Admin 👋</h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your platform today.</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Series', value: supabaseManga.length, icon: <Icon icon="ph:book-open-fill" className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { label: 'Overall Site Views', value: formatViews(realViewCount), icon: <Icon icon="ph:eye-fill" className="w-6 h-6" />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Total Saves', value: formatViews(realBookmarkCount), icon: <Icon icon="ph:bookmark-simple-fill" className="w-6 h-6" />, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                { label: 'Users', value: users.length, icon: <Icon icon="ph:users-fill" className="w-6 h-6" />, color: 'text-amber-500', bg: 'bg-amber-500/10' },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div>
                    <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg tracking-tight">Recent Series</h3>
                  <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setActiveTab('manga')}>View All</Button>
                </div>
                <div className="space-y-1">
                  {supabaseManga.slice(0, 5).map(m => (
                    <div key={m.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/60 transition-colors cursor-pointer" onClick={() => handleEditManga(m)}>
                      <img src={m.cover_url} alt={m.title} className="w-12 h-16 rounded-lg object-cover shadow-sm bg-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate tracking-tight">{m.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-muted-foreground capitalize">{m.type}</span>
                          <span className="w-1 h-1 rounded-full bg-border" />
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${m.status === 'ongoing' ? 'bg-emerald-500/10 text-emerald-500' : m.status === 'completed' ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-500'}`}>
                            {m.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatViews(mangaViewCounts[m.id] || 0)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Views</p>
                      </div>
                    </div>
                  ))}
                  {supabaseManga.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">No series added yet.</div>
                  )}
                </div>
              </div>

              <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold text-lg tracking-tight mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <Button variant="secondary" className="w-full justify-start gap-3 h-12 rounded-xl font-semibold border border-transparent hover:border-border" onClick={() => setActiveTab('manga')}>
                    <Icon icon="ph:books-bold" className="w-5 h-5 text-primary" /> Manage Manga
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-3 h-12 rounded-xl font-semibold border border-transparent hover:border-border" onClick={() => { setActiveTab('manga'); setMangaFormOpen(true); }}>
                    <Icon icon="ph:plus-circle-bold" className="w-5 h-5 text-emerald-500" /> Add New Series
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-3 h-12 rounded-xl font-semibold border border-transparent hover:border-border" onClick={() => setActiveTab('users')}>
                    <Icon icon="ph:users-bold" className="w-5 h-5 text-blue-500" /> Manage Users
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-3 h-12 rounded-xl font-semibold border border-transparent hover:border-border" onClick={() => setActiveTab('settings')}>
                    <Icon icon="ph:gear-bold" className="w-5 h-5 text-amber-500" /> Site Settings
                  </Button>
                  <Button variant="secondary" className="w-full justify-start gap-3 h-12 rounded-xl font-semibold border border-transparent hover:border-border" onClick={() => setActiveTab('settings')}>
                    <Icon icon="ph:palette-bold" className="w-5 h-5 text-purple-500" /> Change Theme
                  </Button>
                </div>
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
                <Icon icon="ph:plus-bold" className="w-4 h-4" /> Add Series
              </Button>
            </div>
            <div className="relative">
              <Icon icon="ph:magnifying-glass-bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
                          <Icon icon="ph:image-bold" className="w-8 h-8 text-muted-foreground" />
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
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Icon icon="ph:eye-bold" className="w-3 h-3" />{formatViews(m.views || 0)}</span>
                          <span className="flex items-center gap-1"><Icon icon="ph:bookmark-simple-bold" className="w-3 h-3" />{formatViews(m.bookmarks || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg hover:bg-muted text-xs gap-1 flex-1" onClick={() => handleManageChapters(m)}>
                            <Icon icon="ph:list-bold" className="w-3.5 h-3.5" /> Chapters
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-muted" 
                            onClick={() => handleEditManga(m)}
                            disabled={!canManageManga(m)}
                            title={!canManageManga(m) ? "You can only edit series you created" : "Edit"}
                          >
                            <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" 
                            onClick={() => setDeleteMangaId(m.id)}
                            disabled={!canManageManga(m)}
                            title={!canManageManga(m) ? "You can only delete series you created" : "Delete"}
                          >
                            <Icon icon="ph:trash-bold" className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'premium' && <PremiumContent />}

        {activeTab === 'google_setup' && (
          <div className="space-y-6 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">Google Setup & SEO</h1>
                <p className="text-muted-foreground text-sm mt-1">Connect your site with Google services to boost reach and track growth.</p>
              </div>
              <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/50">
                {(['seo', 'analytics', 'oauth', 'ads'] as GoogleSubTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setGoogleSubTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                      googleSubTab === tab ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {tab.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden p-6 md:p-8">
              <div className="space-y-8">
                {/* ── SEARCH CONSOLE / SEO ── */}
                {googleSubTab === 'seo' && (
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                          <Icon icon="ph:google-logo-bold" className="w-6 h-6 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Search Console</h3>
                          <p className="text-sm text-muted-foreground">Manage indexing and search visibility.</p>
                        </div>
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold flex items-center gap-2">
                            Robots Meta Tag
                            <Icon icon="ph:info-bold" className="w-3.5 h-3.5 text-muted-foreground" />
                          </label>
                          <select
                            value={settingsForm.robots_meta}
                            onChange={e => setSettingsForm(s => ({ ...s, robots_meta: e.target.value }))}
                            className="w-full rounded-xl bg-background border border-border h-12 px-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                          >
                            <option value="index, follow">Index, Follow (Recommended)</option>
                            <option value="noindex, nofollow">No Index, No Follow (Private)</option>
                            <option value="noindex, follow">No Index, Follow</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Sitemap URL Override</label>
                          <Input
                            value={settingsForm.sitemap_url}
                            onChange={e => setSettingsForm(s => ({ ...s, sitemap_url: e.target.value }))}
                            placeholder="https://yourdomain.com/sitemap.xml"
                            className="rounded-xl font-mono text-xs h-12 bg-background border-border"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Verification HTML Tag</label>
                          <Input
                            value={settingsForm.google_site_verification}
                            onChange={e => setSettingsForm(s => ({ ...s, google_site_verification: e.target.value }))}
                            placeholder='<meta name="google-site-verification" content="..." />'
                            className="rounded-xl font-mono text-xs h-12 bg-background border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4">
                      <button onClick={() => toggleTutorial('seo')} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:book-open-bold" className="w-5 h-5 text-primary" />
                          <h4 className="font-bold text-sm uppercase tracking-wider">Setup Tutorial</h4>
                        </div>
                        <Icon icon={googleTutorialOpen['seo'] ? "ph:caret-up-bold" : "ph:caret-down-bold"} className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {googleTutorialOpen['seo'] && (
                        <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                          <ol className="text-xs space-y-4 text-muted-foreground list-decimal pl-4">
                            <li>Go to <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google Search Console</a> and sign in.</li>
                            <li>Click <strong>"Add Property"</strong> in the top left dropdown.</li>
                            <li>Enter your website URL (e.g. <code className="bg-muted px-1 rounded">https://yourdomain.com</code>) under the <strong>URL Prefix</strong> option.</li>
                            <li>In the verification methods list, expand the <strong>HTML tag</strong> section.</li>
                            <li>Copy the meta tag provided — it should look like: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px]">&lt;meta name="google-site-verification" content="..." /&gt;</code>.</li>
                            <li>Paste the FULL meta tag into the <strong>Verification HTML Tag</strong> field above and click <strong>Save</strong>.</li>
                            <li>Go back to Search Console and click <strong>"Verify"</strong> to confirm you added the tag.</li>
                            <li>In the left sidebar, navigate to <strong>Indexing → Sitemaps</strong>.</li>
                            <li>Type <code className="bg-background px-1.5 py-0.5 rounded text-primary font-mono font-bold italic">sitemap.xml</code> in the box and click <strong>Submit</strong>. This helps Google index your manga and chapters faster.</li>
                            <li>Check back in 24 hours to see your indexing status and search performance.</li>
                          </ol>
                          <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg mt-2">
                            <Icon icon="ph:info-bold" className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-600 dark:text-blue-400">Search Console is essential for tracking how your site ranks in Google search results and identifying many common SEO issues.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── GOOGLE ANALYTICS ── */}
                {googleSubTab === 'analytics' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                          <Icon icon="ph:chart-bar-bold" className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Google Analytics 4</h3>
                          <p className="text-sm text-muted-foreground">Track user behavior and traffic sources.</p>
                        </div>
                      </div>
                      <Input
                        value={settingsForm.google_analytics_id}
                        onChange={e => setSettingsForm(s => ({ ...s, google_analytics_id: e.target.value }))}
                        placeholder="G-XXXXXXXXXX"
                        className="rounded-xl font-mono text-xs h-12 bg-background border-border"
                      />
                    </div>

                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4">
                      <button onClick={() => toggleTutorial('ga4')} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:book-open-bold" className="w-5 h-5 text-primary" />
                          <h4 className="font-bold text-sm uppercase tracking-wider">Setup Tutorial</h4>
                        </div>
                        <Icon icon={googleTutorialOpen['ga4'] ? "ph:caret-up-bold" : "ph:caret-down-bold"} className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {googleTutorialOpen['ga4'] && (
                        <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                          <ol className="text-xs space-y-4 text-muted-foreground list-decimal pl-4">
                            <li>Go to <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google Analytics</a> and sign in with your Google account.</li>
                            <li>Click <strong>"Start measuring"</strong> and enter an account name (e.g. "My Manga Site").</li>
                            <li>Create a new <strong>Property</strong> — enter your website name and set your timezone and currency.</li>
                            <li>Under <strong>Data Streams</strong>, click <strong>"Add stream" → "Web"</strong>.</li>
                            <li>Enter your website URL (e.g. <code className="bg-muted px-1 rounded">https://yourdomain.com</code>) and give it a stream name.</li>
                            <li>Copy the <strong>Measurement ID</strong> displayed (format: <code className="bg-muted px-1 rounded">G-XXXXXXXXXX</code>).</li>
                            <li>Paste it into the field above and click <strong>Save</strong>.</li>
                          </ol>
                          <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg mt-2">
                            <Icon icon="ph:info-bold" className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-600 dark:text-blue-400">Data will start appearing in your Analytics dashboard within 24-48 hours after setup. Real-time data should appear almost immediately.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── OAUTH LOGIN ── */}
                {googleSubTab === 'oauth' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                          <Icon icon="ph:google-logo-bold" className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">OAuth Login</h3>
                          <p className="text-sm text-muted-foreground">Allow users to sign in with Google.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <Input
                          value={settingsForm.google_client_id}
                          onChange={e => setSettingsForm(s => ({ ...s, google_client_id: e.target.value }))}
                          placeholder="Client ID"
                          className="rounded-xl font-mono text-xs h-12"
                        />
                        <Input
                          type="password"
                          value={settingsForm.google_client_secret}
                          onChange={e => setSettingsForm(s => ({ ...s, google_client_secret: e.target.value }))}
                          placeholder="Client Secret"
                          className="rounded-xl font-mono text-xs h-12"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4">
                      <button onClick={() => toggleTutorial('oauth')} className="w-full flex items-center justify-between">
                        <h4 className="font-bold text-sm uppercase">Setup Tutorial</h4>
                        <Icon icon={googleTutorialOpen['oauth'] ? "ph:caret-up-bold" : "ph:caret-down-bold"} />
                      </button>
                      {googleTutorialOpen['oauth'] && (
                        <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                          <ol className="text-xs space-y-4 text-muted-foreground list-decimal pl-4">
                            <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google Cloud Console</a>.</li>
                            <li>Create a new project (or select an existing one). Give it a name like <strong>"Grodex Tantrums Auth"</strong>.</li>
                            <li>In the left sidebar, navigate to <strong>APIs & Services → OAuth consent screen</strong>.</li>
                            <li>Configure the consent screen:
                              <ul className="list-disc pl-4 mt-1 space-y-1">
                                <li>User Type: <strong>External</strong></li>
                                <li>App name: Your site name</li>
                                <li>Support email: Your email</li>
                                <li>Authorized domains: Add your production domain (e.g. <code className="bg-muted px-1 rounded">yourdomain.com</code>)</li>
                              </ul>
                            </li>
                            <li>Go to <strong>APIs & Services → Credentials</strong> and click <strong>"Create Credentials" → "OAuth client ID"</strong>.</li>
                            <li>Select <strong>"Web application"</strong> as the Application type.</li>
                            <li>Under <strong>Authorized redirect URIs</strong>, add your Supabase callback URL:<br />
                              <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] break-all block mt-1">
                                https://esbwpbkjiigftefoiqoy.supabase.co/auth/v1/callback
                              </code>
                            </li>
                            <li>Click <strong>Create</strong>. Copy the <strong>Client ID</strong> and <strong>Client Secret</strong> shown.</li>
                            <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Supabase Dashboard</a> → <strong>Authentication → Providers → Google</strong>.</li>
                            <li>Enable the Google provider and paste the <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
                            <li>Click <strong>Save</strong> in both the Supabase dashboard and here.</li>
                          </ol>
                          <div className="flex items-start gap-2 p-2 bg-indigo-500/10 rounded-lg mt-2">
                            <Icon icon="ph:info-bold" className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-indigo-600 dark:text-indigo-400">The Client ID/Secret fields here are for reference only. The actual Google OAuth configuration must be set in the <strong>Supabase Dashboard → Authentication → Providers</strong> section for login to work.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── GOOGLE ADS ── */}
                {googleSubTab === 'ads' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <Icon icon="ph:megaphone-bold" className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">Google AdSense</h3>
                          <p className="text-sm text-muted-foreground">Monetize your site with display ads.</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Publisher ID</label>
                          <Input
                            value={settingsForm.google_ads_client_id}
                            onChange={e => setSettingsForm(s => ({ ...s, google_ads_client_id: e.target.value }))}
                            placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                            className="rounded-xl font-mono text-xs h-12 bg-background border-border"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Ad Slot ID</label>
                          <Input
                            value={settingsForm.google_ads_slot}
                            onChange={e => setSettingsForm(s => ({ ...s, google_ads_slot: e.target.value }))}
                            placeholder="1234567890"
                            className="rounded-xl font-mono text-xs h-12 bg-background border-border"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/30 border border-border/50 rounded-2xl p-6 space-y-4">
                      <button onClick={() => toggleTutorial('ads')} className="w-full flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon icon="ph:book-open-bold" className="w-5 h-5 text-primary" />
                          <h4 className="font-bold text-sm uppercase tracking-wider">Setup Tutorial</h4>
                        </div>
                        <Icon icon={googleTutorialOpen['ads'] ? "ph:caret-up-bold" : "ph:caret-down-bold"} className="w-4 h-4 text-muted-foreground" />
                      </button>
                      {googleTutorialOpen['ads'] && (
                        <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                          <ol className="text-xs space-y-4 text-muted-foreground list-decimal pl-4">
                            <li>Go to <a href="https://adsense.google.com" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">Google AdSense</a> and sign up with your Google account.</li>
                            <li>Add your website URL and wait for Google to review and approve your site (this can take 1-14 days).</li>
                            <li>Once approved, go to <strong>Ads → By ad unit</strong> and create a new <strong>Display ad</strong>.</li>
                            <li>Copy the <strong>Publisher ID</strong> from your AdSense dashboard (format: <code className="bg-muted px-1 rounded">ca-pub-XXXX</code>). It's in the top-right under your account info.</li>
                            <li>Copy the <strong>Ad Slot ID</strong> from the ad unit you created (a numeric value like <code className="bg-muted px-1 rounded">1234567890</code>).</li>
                            <li>Paste both values above and click <strong>Save</strong>.</li>
                          </ol>
                          <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg mt-2">
                            <Icon icon="ph:warning-bold" className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-600 dark:text-amber-400">AdSense requires your site to have original content and comply with Google's policies. Ensure your site has a Privacy Policy page before applying.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Extra Head Scripts */}
                <div className="pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-4">
                    <Icon icon="ph:code-bold" className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-base">Advanced Customization</h3>
                  </div>
                  <Textarea
                    value={settingsForm.extra_head_scripts}
                    onChange={e => setSettingsForm(s => ({ ...s, extra_head_scripts: e.target.value }))}
                    placeholder="<script>...</script>"
                    className="rounded-xl font-mono text-[11px] min-h-[100px] bg-background border-border"
                  />
                </div>

                <div className="flex gap-3 pt-8 border-t border-border/50">
                  <Button className="rounded-xl" onClick={handleSaveSettings}>Save Google Settings</Button>
                  <Button variant="outline" className="rounded-xl" onClick={handleResetSettings}>Reset</Button>
                </div>
              </div>
            </div>
          </div>
        )}


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
                  {t === 'all' ? 'All Users' : 'Staff (Admins/Mods)'}
                </button>
              ))}
            </div>
            <div className="relative">
              <Icon icon="ph:magnifying-glass-bold" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 rounded-xl bg-card border-border" />
            </div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_200px_120px_80px] gap-3 px-5 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>User</span><span>Joined</span><span>Role</span><span>Actions</span>
              </div>
              <div className="divide-y divide-border">
                {usersLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Loading users...</div>
                ) : filteredUsers.filter(u => userTab === 'all' || u.role === 'admin' || u.role === 'moderator').map(u => (
                  <div key={u.id} className="flex flex-col md:grid md:grid-cols-[1fr_200px_120px_80px] gap-2 md:gap-3 px-5 py-3 hover:bg-muted/30 transition-colors items-start md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <Icon icon="ph:users-bold" className="w-4 h-4 text-primary" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit capitalize ${u.role === 'admin' ? 'bg-primary/15 text-primary' : u.role === 'moderator' ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground'}`}>
                      {u.role}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => {
                      if (isMod && u.role !== 'user') {
                        toast.error('Moderators can only moderate regular users');
                        return;
                      }
                      setUserActionModal(u);
                      setEditUserName(u.display_name || '');
                      setEditUserAvatar(u.avatar_url || '');
                      setEditCoinBalance(u.coin_balance ?? 0);
                      setEditTokenBalance(u.token_balance ?? 0);
                      setEditSubPlanId('');
                      setBlockIp('');
                    }}>
                      <Icon icon="ph:dots-three-outline-bold" className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {!usersLoading && filteredUsers.filter(u => userTab === 'all' || u.role === 'admin').length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-5xl">
            <div>
              <h1 className="text-2xl font-bold">Site Settings</h1>
              <p className="text-muted-foreground text-sm mt-1">Configure your platform.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Settings side-tabs */}
              <div className="w-full md:w-56 flex flex-col gap-1 shrink-0">
                {settingsSubTabs.map(st => (
                  <button
                    key={st.id}
                    onClick={() => setSettingsSubTab(st.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                      settingsSubTab === st.id ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`}
                  >
                    <div className={settingsSubTab === st.id ? 'text-primary-foreground text-lg' : 'text-muted-foreground text-lg'}>{st.icon}</div>
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Settings Content */}
              <div className="flex-1 min-w-0 w-full space-y-6">

            {/* General */}
            {settingsSubTab === 'general' && (
              <div className="space-y-4 pb-20">
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:globe-bold" className="w-4 h-4" /> Basic Site Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Site Name</label>
                      <Input value={settingsForm.site_name} onChange={e => setSettingsForm(s => ({ ...s, site_name: e.target.value }))} className="rounded-xl bg-background" placeholder="e.g. MangaHub" />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Site Description</label>
                      <Input value={settingsForm.site_description} onChange={e => setSettingsForm(s => ({ ...s, site_description: e.target.value }))} className="rounded-xl bg-background" placeholder="Site tagline for SEO" />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center pt-2">
                    <div className="space-y-3 flex-1 w-full">
                      <label className="text-sm font-medium mb-1 block">Site Logo</label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                          {settingsForm.logo_url ? (
                            <img src={settingsForm.logo_url} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <Icon icon="ph:image-bold" className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-sm font-semibold shadow-sm">
                          <Icon icon="ph:upload-simple-bold" className="w-4 h-4 text-primary" /> {logoUploading ? 'Uploading...' : 'Upload Logo'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={logoUploading} />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 flex-1 w-full">
                      <label className="text-sm font-medium mb-1 block">Favicon (Tab Icon)</label>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-xl bg-secondary/30 flex items-center justify-center overflow-hidden shrink-0 border border-border/50">
                          {settingsForm.favicon_url ? (
                            <img src={settingsForm.favicon_url} alt="Favicon" className="w-full h-full object-contain p-2" />
                          ) : (
                            <Icon icon="ph:browser-bold" className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-sm font-semibold shadow-sm">
                          <Icon icon="ph:upload-simple-bold" className="w-4 h-4 text-primary" /> {logoUploading ? 'Uploading...' : 'Upload Favicon'}
                          <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setLogoUploading(true);
                            try {
                              const url = await uploadToStorage(file, `site/favicon-${Date.now()}`);
                              setSettingsForm(s => ({ ...s, favicon_url: url }));
                              toast.success('Favicon uploaded! Click Save to apply.');
                            } catch (err: any) {
                              toast.error(`Favicon upload failed: ${err.message}`);
                            }
                            setLogoUploading(false);
                          }} disabled={logoUploading} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:file-text-bold" className="w-4 h-4" /> Footer</h3>
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

                {/* Social & Donation */}
                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:link-bold" className="w-4 h-4" /> Support & Social</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Discord URL</label>
                      <Input value={settingsForm.discord_url} onChange={e => setSettingsForm(s => ({ ...s, discord_url: e.target.value }))} className="rounded-xl bg-background" placeholder="https://discord.gg/..." />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Donation Name</label>
                        <Input value={settingsForm.donation_name} onChange={e => setSettingsForm(s => ({ ...s, donation_name: e.target.value }))} className="rounded-xl bg-background" placeholder="Patreon" />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1 block">Donation URL</label>
                        <Input value={settingsForm.donation_url} onChange={e => setSettingsForm(s => ({ ...s, donation_url: e.target.value }))} className="rounded-xl bg-background" placeholder="https://..." />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Donation Icon URL</label>
                      <Input value={settingsForm.donation_icon_url} onChange={e => setSettingsForm(s => ({ ...s, donation_icon_url: e.target.value }))} className="rounded-xl bg-background" placeholder="https://... or ph:coffee-bold" />
                      <p className="text-xs text-muted-foreground mt-1.5">You can use an image URL or an Iconify ID like `ph:coffee-bold`.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:spinner-bold" className="w-4 h-4 text-primary" /> Loader Configuration</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">Customize the branding of the initial loading screen (splash screen).</p>
                  
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="space-y-3 flex-1">
                        <label className="text-sm font-medium mb-1 block">Loader Name</label>
                        <Input 
                          value={settingsForm.loader_name} 
                          onChange={e => setSettingsForm(s => ({ ...s, loader_name: e.target.value }))} 
                          className="rounded-xl bg-background" 
                          placeholder="e.g. MangaHub" 
                        />
                        <p className="text-[10px] text-muted-foreground italic">Defaults to Site Name if empty.</p>
                      </div>

                      <div className="space-y-3 flex-1">
                        <label className="text-sm font-medium mb-1 block">Loader Logo</label>
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-muted border border-border/50 flex items-center justify-center overflow-hidden shrink-0">
                            {settingsForm.loader_logo_url ? (
                              <img src={settingsForm.loader_logo_url} alt="Loader logo" className="w-full h-full object-contain" />
                            ) : (
                              <Icon icon="ph:image-bold" className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-sm font-semibold shadow-sm">
                            <Icon icon="ph:upload-simple-bold" className="w-4 h-4 text-primary" /> {logoUploading ? 'Uploading...' : 'Upload Logo'}
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setLogoUploading(true);
                              try {
                                const url = await uploadToStorage(file, `site/loader-logo-${Date.now()}`);
                                setSettingsForm(s => ({ ...s, loader_logo_url: url }));
                                toast.success('Loader logo uploaded!');
                              } catch (err: any) {
                                toast.error(`Upload failed: ${err.message}`);
                              }
                              setLogoUploading(false);
                            }} disabled={logoUploading} />
                          </label>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">If no logo is set, the system will automatically generate one using the first letters of the Loader Name.</p>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-white/5 relative overflow-hidden group">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 text-center">Loader Preview</p>
                      
                      <div className="flex flex-col items-center justify-center gap-6">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-2xl bg-primary/20 animate-pulse border border-primary/30 flex items-center justify-center p-3">
                            <div className="w-14 h-14 rounded-xl bg-primary shadow-[0_0_30px_rgba(var(--primary),0.5)] flex items-center justify-center overflow-hidden">
                              {settingsForm.loader_logo_url ? (
                                <img src={settingsForm.loader_logo_url} alt="Logo" className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-2xl font-black text-primary-foreground italic">
                                  {(settingsForm.loader_name || settingsForm.site_name || 'Grodex Tantrums')
                                    .split(' ')
                                    .filter(Boolean)
                                    .map(w => w[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <h2 className="text-white font-black tracking-tight text-xl uppercase italic">
                          {settingsForm.loader_name || settingsForm.site_name || 'Grodex Tantrums'}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
                  <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:browser-bold" className="w-4 h-4 text-primary" /> Browser Tab Configuration</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase">Tab Title</label>
                        <Input 
                          value={settingsForm.site_title} 
                          onChange={e => setSettingsForm(s => ({ ...s, site_title: e.target.value }))} 
                          className="rounded-xl bg-background" 
                          placeholder="e.g. MangaHub" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-muted-foreground ml-1 uppercase">Title Suffix</label>
                        <Input 
                          value={settingsForm.site_title_suffix} 
                          onChange={e => setSettingsForm(s => ({ ...s, site_title_suffix: e.target.value }))} 
                          className="rounded-xl bg-background" 
                          placeholder="e.g. - Read Manga" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Theme */}
            {settingsSubTab === 'theme' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:palette-bold" className="w-4 h-4" /> Theme Presets</h3>
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
                <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:bell-bold" className="w-4 h-4" /> Announcement Bar</h3>
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
                        <Icon icon="ph:arrow-square-out-bold" className="w-3 h-3" /> {settingsForm.announcement_button_text}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Upload */}
            {settingsSubTab === 'upload' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:upload-bold" className="w-4 h-4" /> Upload Settings</h3>
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
              <StorageSection
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
              />
            )}

            {/* Removed SEO block to put in Main Menu */}

            <div className="flex gap-2 pt-4">
              <Button className="rounded-xl gap-2" onClick={handleSaveSettings} disabled={updateSettings.isPending}>
                <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" /> {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
              </Button>
              <Button variant="outline" className="rounded-xl gap-2" onClick={handleResetSettings}>
                <Icon icon="ph:arrow-counter-clockwise-bold" className="w-4 h-4" /> Reset
              </Button>
            </div>
          </div>
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

            {/* Grant Subscription */}
            {premiumSettings.premium_config.enable_subscriptions && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <h4 className="text-sm font-semibold text-purple-400">Grant Subscription</h4>
                <div className="flex gap-2">
                  <select 
                    value={editSubPlanId} 
                    onChange={e => setEditSubPlanId(e.target.value)}
                    className="flex-1 bg-background border border-border outline-none rounded-lg text-sm px-3 py-2"
                  >
                    <option value="">Select a plan</option>
                    {subscriptionPlans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name} ({plan.duration_days} days)</option>
                    ))}
                  </select>
                  <Button size="sm" className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-0" onClick={async () => {
                    if (!userActionModal || !editSubPlanId) return;
                    const plan = subscriptionPlans.find(p => p.id === editSubPlanId);
                    if (!plan) return;
                    try {
                      const { error } = await supabase.rpc('admin_grant_subscription', {
                        p_target_user_id: userActionModal.id,
                        p_plan_id: plan.id,
                        p_duration_days: plan.duration_days,
                      });
                      if (error) throw error;
                      toast.success(`Granted ${plan.name} to ${userActionModal.display_name}!`);
                      setEditSubPlanId('');
                    } catch (err: any) {
                      toast.error(`Failed to grant subscription: ${err.message}`);
                    }
                  }}>Grant</Button>
                </div>
              </div>
            )}

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

            {/* Role Management (Admin Only) */}
            {isAdmin && (
              <div className="space-y-2 rounded-xl border border-border p-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Icon icon="ph:shield-check-bold" className="w-4 h-4" /> Role Management
                </h4>
                <p className="text-xs text-muted-foreground">
                  Current role: <span className={`font-bold capitalize ${userActionModal?.role === 'admin' ? 'text-primary' : userActionModal?.role === 'moderator' ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {userActionModal?.role}
                  </span>
                </p>
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant={userActionModal?.role === 'admin' ? 'secondary' : 'default'} className="w-full gap-2" disabled={userActionModal?.id === user?.id} onClick={async () => {
                    if (!userActionModal) return;
                    try {
                      const { error } = await supabase.from('user_roles').upsert({ user_id: userActionModal.id, role: 'admin' });
                      if (error) throw error;
                      toast.success(`${userActionModal.display_name || 'User'} promoted to Admin`);
                      fetchUsers(); setUserActionModal(null);
                    } catch (err: any) { toast.error(`Failed: ${err.message}`); }
                  }}>
                    <Icon icon="ph:shield-check-bold" className="w-4 h-4" /> {userActionModal?.role === 'admin' ? 'Already Admin' : 'Make Admin'}
                  </Button>
                  <Button size="sm" variant={userActionModal?.role === 'moderator' ? 'secondary' : 'outline'} className="w-full gap-2" disabled={userActionModal?.id === user?.id} onClick={async () => {
                    if (!userActionModal) return;
                    try {
                      const { error } = await supabase.from('user_roles').upsert({ user_id: userActionModal.id, role: 'moderator' });
                      if (error) throw error;
                      toast.success(`${userActionModal.display_name || 'User'} assigned Moderator role`);
                      fetchUsers(); setUserActionModal(null);
                    } catch (err: any) { toast.error(`Failed: ${err.message}`); }
                  }}>
                    <Icon icon="ph:shield-bold" className="w-4 h-4" /> {userActionModal?.role === 'moderator' ? 'Already Moderator' : 'Make Moderator'}
                  </Button>
                  {userActionModal?.role !== 'user' && (
                    <Button size="sm" variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={userActionModal?.id === user?.id} onClick={async () => {
                      if (!userActionModal) return;
                      try {
                        await supabase.from('user_roles').delete().eq('user_id', userActionModal.id);
                        toast.success(`${userActionModal.display_name || 'User'} demoted to regular User`);
                        fetchUsers(); setUserActionModal(null);
                      } catch (err: any) { toast.error(`Failed: ${err.message}`); }
                    }}>
                      <Icon icon="ph:user-bold" className="w-4 h-4" /> Remove Role (Demote)
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Delete User */}
            <Button variant="destructive" className="w-full" onClick={() => { setDeleteUserId(userActionModal?.id || null); setUserActionModal(null); }}>
              <Icon icon="ph:trash-bold" className="w-4 h-4 mr-2" /> Delete User
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
