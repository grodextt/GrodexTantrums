import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutGrid, LogIn, ClipboardList, ArrowLeft, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { optimizedImageUrl } from '@/lib/utils';
import SearchModal from './SearchModal';
import UserMenu from './UserMenu';
import NotificationMenu from './NotificationMenu';
import logoImg from '@/assets/logo.png';

const NAV_LINKS = [
  { path: '/latest', label: 'Latest', icon: ClipboardList },
  { path: '/series', label: 'Series', icon: LayoutGrid },
];

export default function Navbar() {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const siteName = settings.general.site_name || 'MangaHub v1';
  const isActive = (path: string) => location.pathname === path;
  const isSubPage = location.pathname.startsWith('/manga/');

  const pathParts = location.pathname.split('/');
  const isChapterPage = pathParts.length >= 5 && pathParts[3] === 'chapter';
  const mangaSlug = pathParts[2] || '';

  const handleBack = () => {
    if (isChapterPage) {
      navigate(`/manga/${mangaSlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <nav className="z-50 bg-transparent">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 flex h-20 items-center justify-between">
          {isSubPage ? (
            <button onClick={handleBack} className="flex items-center gap-3 group">
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
              <span className="font-bold text-xl text-foreground tracking-tight">{siteName}</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
              <div className="w-9 h-9 rounded-lg overflow-hidden">
                <img src={optimizedImageUrl(settings.general.logo_url || logoImg, 72)} alt={`${siteName} logo`} className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">{siteName}</span>
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" className="rounded-full h-11 bg-muted/60 hover:bg-muted text-sm font-medium transition-all duration-200 hover:scale-[1.02] md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5" onClick={() => setSearchOpen(true)}>
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">Search</span>
            </Button>
            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button variant="ghost" className={`rounded-full h-11 transition-all duration-200 hover:scale-[1.02] text-sm font-medium md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5 ${isActive(path) ? 'bg-primary/15 text-primary hover:bg-primary/20 ring-1 ring-primary/30' : 'bg-muted/60 hover:bg-muted'}`}>
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              </Link>
            ))}
            <div className="w-px h-6 bg-border/60 mx-1" />
            <NotificationMenu />
            {!isAuthenticated && (
              <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted transition-all duration-200 hover:scale-[1.05]" onClick={toggleTheme}>
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button variant="ghost" className="rounded-full gap-2 px-5 h-11 bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-all duration-200 hover:scale-[1.02] ml-1" onClick={() => setShowLoginModal(true)}>
                <LogIn className="w-4 h-4" />
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            {isAuthenticated && <NotificationMenu />}
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted" onClick={toggleTheme}>
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-primary/15 hover:bg-primary/25 text-primary" onClick={() => setShowLoginModal(true)}>
                  <LogIn className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border/60 shadow-2xl p-5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
            <p className="text-sm font-semibold text-muted-foreground mb-2 px-1">Menu</p>
            <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-12 bg-muted/40 hover:bg-muted text-sm font-medium" onClick={() => { setSearchOpen(true); setMobileOpen(false); }}>
              <Search className="w-4 h-4" /> Search
            </Button>
            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className={`w-full justify-start gap-2.5 rounded-xl h-12 text-sm font-medium ${isActive(path) ? 'bg-primary/15 text-primary' : 'bg-muted/40 hover:bg-muted'}`}>
                  <Icon className="w-4 h-4" /> {label}
                </Button>
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <div className="h-px bg-border/40 my-1" />
                <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-12 bg-primary/15 text-primary text-sm font-medium" onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}>
                  <LogIn className="w-4 h-4" /> Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
