import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutGrid, BarChart3, LogIn, LogOut, User, ClipboardList, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import SearchModal from './SearchModal';

export default function Navbar() {
  const { isAuthenticated, user, logout, setShowLoginModal } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;
  const isSubPage = location.pathname.startsWith('/manga/');

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/30">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 flex h-14 items-center justify-between">
          {/* Logo */}
          {isSubPage ? (
            <button onClick={() => navigate(-1)} className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <ArrowLeft className="w-4 h-4 text-foreground" />
              </div>
              <span className="font-semibold text-base text-foreground tracking-tight">Kayn Scan</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                <span className="text-foreground font-bold text-sm">K</span>
              </div>
              <span className="font-semibold text-base text-foreground tracking-tight">Kayn Scan</span>
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="rounded-full gap-2 px-4 h-9 bg-secondary/80 hover:bg-secondary text-sm font-medium"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
              Search
            </Button>

            <Link to="/latest">
              <Button
                variant="secondary"
                size="sm"
                className={`rounded-full px-3 h-9 bg-secondary/80 hover:bg-secondary ${isActive('/latest') ? 'bg-secondary text-foreground' : ''}`}
              >
                <ClipboardList className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/series">
              <Button
                variant="secondary"
                size="sm"
                className={`rounded-full gap-2 px-4 h-9 bg-secondary/80 hover:bg-secondary text-sm font-medium ${isActive('/series') ? 'bg-secondary text-foreground' : ''}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Series
              </Button>
            </Link>

            <Link to="/library">
              <Button
                variant="secondary"
                size="sm"
                className={`rounded-full gap-2 px-4 h-9 bg-secondary/80 hover:bg-secondary text-sm font-medium ${isActive('/library') ? 'bg-secondary text-foreground' : ''}`}
              >
                <BarChart3 className="w-4 h-4" />
                Library
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 ml-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80">
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{user?.name}</span>
                </div>
                <Button variant="secondary" size="sm" className="rounded-full h-9 px-3 bg-secondary/80" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full gap-2 px-4 h-9 bg-secondary/80 hover:bg-secondary text-sm font-medium ml-1"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="w-4 h-4" />
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/30 bg-background animate-fade-up">
            <div className="px-6 sm:px-10 lg:px-16 xl:px-24 py-4 flex flex-col gap-2">
              <Button variant="secondary" className="w-full justify-start gap-2 rounded-full" onClick={() => { setSearchOpen(true); setMobileOpen(false); }}>
                <Search className="w-4 h-4" /> Search
              </Button>
              <Link to="/latest" onClick={() => setMobileOpen(false)}>
                <Button variant={isActive('/latest') ? 'default' : 'secondary'} className="w-full justify-start gap-2 rounded-full">
                  <ClipboardList className="w-4 h-4" /> Latest
                </Button>
              </Link>
              <Link to="/series" onClick={() => setMobileOpen(false)}>
                <Button variant={isActive('/series') ? 'default' : 'secondary'} className="w-full justify-start gap-2 rounded-full">
                  <LayoutGrid className="w-4 h-4" /> Series
                </Button>
              </Link>
              <Link to="/library" onClick={() => setMobileOpen(false)}>
                <Button variant={isActive('/library') ? 'default' : 'secondary'} className="w-full justify-start gap-2 rounded-full">
                  <BarChart3 className="w-4 h-4" /> Library
                </Button>
              </Link>
              {isAuthenticated ? (
                <Button variant="secondary" className="w-full justify-start gap-2 rounded-full" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              ) : (
                <Button variant="secondary" className="w-full justify-start gap-2 rounded-full" onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}>
                  <LogIn className="w-4 h-4" /> Sign in
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}