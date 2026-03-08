import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutGrid, LogIn, LogOut, User, ClipboardList, ArrowLeft, BookOpen, Bell, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import SearchModal from './SearchModal';
import logoImg from '@/assets/logo.png';

const NAV_LINKS = [
  { path: '/latest', label: 'Latest', icon: ClipboardList },
  { path: '/series', label: 'Series', icon: LayoutGrid },
  { path: '/library', label: 'Library', icon: BookOpen },
];

export default function Navbar() {
  const { isAuthenticated, profile, logout, setShowLoginModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
          {/* Logo */}
          {isSubPage ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-3 group"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
              <span className="font-bold text-xl text-foreground tracking-tight">Kayn Scan</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
              <div className="w-9 h-9 rounded-lg overflow-hidden">
                <img src={logoImg} alt="Kayn Scan logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">Kayn Scan</span>
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            {/* Search */}
            <Button
              variant="ghost"
              className="rounded-full h-11 bg-muted/60 hover:bg-muted text-sm font-medium transition-all duration-200 hover:scale-[1.02] md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
              <span className="hidden lg:inline">Search</span>
            </Button>

            {/* Nav links */}
            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path}>
                <Button
                  variant="ghost"
                  className={`rounded-full h-11 transition-all duration-200 hover:scale-[1.02] text-sm font-medium md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5 ${
                    isActive(path)
                      ? 'bg-primary/15 text-primary hover:bg-primary/20 ring-1 ring-primary/30'
                      : 'bg-muted/60 hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:inline">{label}</span>
                </Button>
              </Link>
            ))}

            {/* Divider */}
            <div className="w-px h-6 bg-border/60 mx-1" />

            {/* Notification bell */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted transition-all duration-200 hover:scale-[1.05] relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </Button>

            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted transition-all duration-200 hover:scale-[1.05]"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-1">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 border border-border/40">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{profile?.display_name || 'User'}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted transition-all duration-200 hover:scale-[1.05]"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="rounded-full gap-2 px-5 h-11 bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-all duration-200 hover:scale-[1.02] ml-1"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted relative"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

      </nav>

      {/* Mobile menu popup */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border/60 shadow-2xl p-5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <p className="text-sm font-semibold text-muted-foreground mb-2 px-1">Menu</p>

            <Button
              variant="ghost"
              className="w-full justify-start gap-2.5 rounded-xl h-12 bg-muted/40 hover:bg-muted text-sm font-medium"
              onClick={() => { setSearchOpen(true); setMobileOpen(false); }}
            >
              <Search className="w-4 h-4" /> Search
            </Button>
            {NAV_LINKS.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start gap-2.5 rounded-xl h-12 text-sm font-medium ${
                    isActive(path)
                      ? 'bg-primary/15 text-primary'
                      : 'bg-muted/40 hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </Button>
              </Link>
            ))}
            <div className="h-px bg-border/40 my-1" />
            {isAuthenticated ? (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 rounded-xl h-12 bg-muted/40 hover:bg-muted text-sm font-medium"
                onClick={() => { logout(); setMobileOpen(false); }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 rounded-xl h-12 bg-primary/15 text-primary text-sm font-medium"
                onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}
              >
                <LogIn className="w-4 h-4" /> Sign in
              </Button>
            )}
          </div>
        </div>
      )}

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
