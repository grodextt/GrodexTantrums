import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu, X, LayoutGrid, LogIn, LogOut, User, ClipboardList, ArrowLeft, BookOpen } from 'lucide-react';
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

  // Extract slug from path for chapter pages
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
            <button onClick={handleBack} className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">Kayn Scan</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
              <div className="w-10 h-10 rounded-full bg-muted/80 flex items-center justify-center overflow-hidden">
                <span className="text-foreground font-bold text-base">K</span>
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">Kayn Scan</span>
            </Link>
          )}

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              className="rounded-full gap-2.5 px-6 h-12 bg-muted/80 hover:bg-muted text-base font-semibold"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
              Search
            </Button>

            <Link to="/latest">
              <Button
                variant="ghost"
                className={`rounded-full px-5 h-12 bg-muted/80 hover:bg-muted ${isActive('/latest') ? 'bg-muted' : ''}`}
              >
                <ClipboardList className="w-5 h-5" />
              </Button>
            </Link>

            <Link to="/series">
              <Button
                variant="ghost"
                className={`rounded-full gap-2.5 px-6 h-12 bg-muted/80 hover:bg-muted text-base font-semibold ${isActive('/series') ? 'bg-muted' : ''}`}
              >
                <LayoutGrid className="w-5 h-5" />
                Series
              </Button>
            </Link>

            <Link to="/library">
              <Button
                variant="ghost"
                className={`rounded-full gap-2.5 px-6 h-12 bg-muted/80 hover:bg-muted text-base font-semibold ${isActive('/library') ? 'bg-muted' : ''}`}
              >
                <BookOpen className="w-5 h-5" />
                Library
              </Button>
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center gap-3 ml-1">
                <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-muted/80">
                  <User className="w-5 h-5 text-primary" />
                  <span className="text-base font-semibold">{user?.name}</span>
                </div>
                <Button variant="ghost" className="rounded-full h-12 px-5 bg-muted/80 hover:bg-muted" onClick={logout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="rounded-full gap-2.5 px-6 h-12 bg-muted/80 hover:bg-muted text-base font-semibold ml-1"
                onClick={() => setShowLoginModal(true)}
              >
                <LogIn className="w-5 h-5" />
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
          <div className="md:hidden border-t border-border/30 bg-secondary/90 backdrop-blur-xl animate-fade-up">
            <div className="px-6 sm:px-10 lg:px-16 xl:px-24 py-4 flex flex-col gap-2">
              <Button variant="ghost" className="w-full justify-start gap-2 rounded-full bg-muted/80 hover:bg-muted" onClick={() => { setSearchOpen(true); setMobileOpen(false); }}>
                <Search className="w-4 h-4" /> Search
              </Button>
              <Link to="/latest" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className={`w-full justify-start gap-2 rounded-full ${isActive('/latest') ? 'bg-muted' : 'bg-muted/80 hover:bg-muted'}`}>
                  <ClipboardList className="w-4 h-4" /> Latest
                </Button>
              </Link>
              <Link to="/series" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className={`w-full justify-start gap-2 rounded-full ${isActive('/series') ? 'bg-muted' : 'bg-muted/80 hover:bg-muted'}`}>
                  <LayoutGrid className="w-4 h-4" /> Series
                </Button>
              </Link>
              <Link to="/library" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className={`w-full justify-start gap-2 rounded-full ${isActive('/library') ? 'bg-muted' : 'bg-muted/80 hover:bg-muted'}`}>
                  <BookOpen className="w-4 h-4" /> Library
                </Button>
              </Link>
              {isAuthenticated ? (
                <Button variant="ghost" className="w-full justify-start gap-2 rounded-full bg-muted/80 hover:bg-muted" onClick={() => { logout(); setMobileOpen(false); }}>
                  <LogOut className="w-4 h-4" /> Sign Out
                </Button>
              ) : (
                <Button variant="ghost" className="w-full justify-start gap-2 rounded-full bg-muted/80 hover:bg-muted" onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}>
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