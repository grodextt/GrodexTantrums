import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Users, Settings, ArrowLeft, Plus, Search,
  Eye, Star, Bookmark, TrendingUp, Edit, Trash2, Shield, ChevronDown,
  BarChart3, FileText, Bell, Globe, Upload, MoreHorizontal, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { mockManga, formatViews } from '@/data/mockManga';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdminManga, useDeleteManga } from '@/hooks/useManga';
import { MangaFormModal } from '@/components/admin/MangaFormModal';
import { ChapterManager } from '@/components/admin/ChapterManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tables } from '@/integrations/supabase/types';

type Manga = Tables<"manga">;

type Tab = 'overview' | 'manga' | 'users' | 'settings';

interface UserRow {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { isAdmin, loading } = useIsAdmin();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
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

  const { data: supabaseManga = [], isLoading: mangaLoading } = useAdminManga();
  const deleteManga = useDeleteManga();

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    setSearchParams({ tab: activeTab });
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'overview') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as UserRow[]) || []);
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
    { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  const filteredManga = supabaseManga.filter(m =>
    m.title.toLowerCase().includes(mangaSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const totalViews = supabaseManga.reduce((acc, m) => acc + (m.views || 0), 0);
  const totalBookmarks = supabaseManga.reduce((acc, m) => acc + (m.bookmarks || 0), 0);

  const handleEditManga = (manga: Manga) => {
    setEditingManga(manga);
    setMangaFormOpen(true);
  };

  const handleManageChapters = (manga: Manga) => {
    setSelectedManga(manga);
    setChapterManagerOpen(true);
  };

  const handleDeleteManga = async () => {
    if (!deleteMangaId) return;
    const manga = supabaseManga.find(m => m.id === deleteMangaId);
    if (!manga) return;

    await deleteManga.mutateAsync({
      id: deleteMangaId,
      coverUrl: manga.cover_url,
      bannerUrl: manga.banner_url || undefined,
    });
    setDeleteMangaId(null);
  };

  const handleMangaFormClose = () => {
    setMangaFormOpen(false);
    setEditingManga(null);
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
              <p className="text-xs text-muted-foreground">Kayn Scan</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
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
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {tabs.find(t => t.id === activeTab)?.label}
            <ChevronDown className={`w-3 h-3 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
        {mobileMenuOpen && (
          <div className="px-4 pb-3 flex gap-2 flex-wrap">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
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

            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Series', value: mockManga.length, icon: <BookOpen className="w-5 h-5" />, color: 'text-primary' },
                { label: 'Total Chapters', value: totalChapters, icon: <FileText className="w-5 h-5" />, color: 'text-emerald-500' },
                { label: 'Total Views', value: formatViews(totalViews), icon: <Eye className="w-5 h-5" />, color: 'text-blue-500' },
                { label: 'Total Users', value: users.length, icon: <Users className="w-5 h-5" />, color: 'text-amber-500' },
              ].map(stat => (
                <div key={stat.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className={`${stat.color} mb-2`}>{stat.icon}</div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Quick actions */}
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

            {/* Recent series */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-semibold mb-3">Recent Series</h3>
              <div className="space-y-2">
                {mockManga.slice(0, 5).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                    <img src={m.cover} alt={m.title} className="w-10 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.type} · {m.chapters.length} chapters</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.status === 'Ongoing' ? 'bg-emerald-500/10 text-emerald-500' :
                      m.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
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
                <p className="text-muted-foreground text-sm mt-1">{mockManga.length} series total</p>
              </div>
              <Button className="gap-2 rounded-xl">
                <Plus className="w-4 h-4" /> Add Series
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search series..."
                value={mangaSearch}
                onChange={e => setMangaSearch(e.target.value)}
                className="pl-9 rounded-xl bg-card border-border"
              />
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_100px_100px_100px_100px_80px] gap-3 px-5 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>Series</span>
                <span>Type</span>
                <span>Status</span>
                <span>Chapters</span>
                <span>Views</span>
                <span>Actions</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-border">
                {filteredManga.map(m => (
                  <div key={m.id} className="flex flex-col md:grid md:grid-cols-[1fr_100px_100px_100px_100px_80px] gap-2 md:gap-3 px-5 py-3 hover:bg-muted/30 transition-colors items-start md:items-center">
                    <div className="flex items-center gap-3">
                      <img src={m.cover} alt={m.title} className="w-10 h-14 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.author}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                      m.type === 'Manhwa' ? 'bg-blue-500/10 text-blue-500' :
                      m.type === 'Manga' ? 'bg-red-500/10 text-red-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}>{m.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full w-fit ${
                      m.status === 'Ongoing' ? 'bg-emerald-500/10 text-emerald-500' :
                      m.status === 'Completed' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>{m.status}</span>
                    <span className="text-sm">{m.chapters.length}</span>
                    <span className="text-sm">{formatViews(m.views)}</span>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredManga.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No series found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 max-w-6xl">
            <div>
              <h1 className="text-2xl font-bold">User Management</h1>
              <p className="text-muted-foreground text-sm mt-1">{users.length} registered users</p>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="pl-9 rounded-xl bg-card border-border"
              />
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_200px_120px_80px] gap-3 px-5 py-3 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                <span>User</span>
                <span>Joined</span>
                <span>Role</span>
                <span>Actions</span>
              </div>

              <div className="divide-y divide-border">
                {usersLoading ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">Loading users...</div>
                ) : filteredUsers.map(u => (
                  <div key={u.id} className="flex flex-col md:grid md:grid-cols-[1fr_200px_120px_80px] gap-2 md:gap-3 px-5 py-3 hover:bg-muted/30 transition-colors items-start md:items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.display_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground w-fit">User</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {!usersLoading && filteredUsers.length === 0 && (
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

            {/* General */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Globe className="w-4 h-4" /> General</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Site Name</label>
                  <Input defaultValue="Kayn Scan" className="rounded-xl bg-background" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Site Description</label>
                  <Input defaultValue="Read the latest manga, manhwa, and manhua translations." className="rounded-xl bg-background" />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Announcements</h3>
              <div>
                <label className="text-sm font-medium mb-1 block">Announcement Bar Message</label>
                <Input defaultValue="" placeholder="Leave empty to hide the announcement bar" className="rounded-xl bg-background" />
              </div>
            </div>

            {/* Upload */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Max Upload Size (MB)</label>
                  <Input type="number" defaultValue="10" className="rounded-xl bg-background w-32" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Allowed Image Formats</label>
                  <Input defaultValue="jpg, png, webp" className="rounded-xl bg-background" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="rounded-xl">Save Settings</Button>
              <Button variant="outline" className="rounded-xl">Reset</Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
