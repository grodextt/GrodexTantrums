"use client";
import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import NotificationMenu from '@/components/NotificationMenu';
import UserMenu from '@/components/UserMenu';

interface NavLink {
  path: string;
  label: string;
  icon: string;
  highlight?: boolean;
}

interface MobileHeaderStyle1Props {
  navLinks: NavLink[];
  isActive: (path: string) => boolean;
  isAuthenticated: boolean;
  theme: string;
  toggleTheme: () => void;
  setShowLoginModal: (show: boolean) => void;
  setSearchOpen: (show: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function MobileHeaderStyle1({
  navLinks,
  isActive,
  isAuthenticated,
  theme,
  toggleTheme,
  setShowLoginModal,
  setSearchOpen,
  mobileOpen,
  setMobileOpen
}: MobileHeaderStyle1Props) {
  return (
    <>
      <div className="flex items-center gap-1.5 md:hidden">
        {isAuthenticated && <NotificationMenu />}
        {isAuthenticated ? (
          <UserMenu />
        ) : (
          <>
            <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted" onClick={toggleTheme}>
              {theme === 'dark' ? <Icon icon="ph:sun-bold" className="w-4 h-4" /> : <Icon icon="ph:moon-bold" className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-primary/15 hover:bg-primary/25 text-primary" onClick={() => setShowLoginModal(true)}>
              <Icon icon="ph:sign-in-bold" className="w-4 h-4" />
            </Button>
          </>
        )}
        <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <Icon icon="ph:x-bold" className="w-5 h-5 text-foreground" /> : <Icon icon="ph:list-bold" className="w-5 h-5 text-foreground" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border/60 shadow-2xl p-5 flex flex-col gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors">
              <Icon icon="ph:x-bold" className="w-5 h-5 text-muted-foreground" />
            </button>
            <p className="text-sm font-semibold text-muted-foreground mb-2 px-1">Menu</p>
            <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-12 bg-muted/40 hover:bg-muted text-sm font-medium" onClick={() => { setSearchOpen(true); setMobileOpen(false); }}>
              <Icon icon="ph:magnifying-glass-bold" className="w-4 h-4" /> Search
            </Button>
            {navLinks.map(({ path, label, icon, highlight }) => (
              <Link key={path} to={path} onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className={`w-full justify-start gap-2.5 rounded-xl h-12 text-sm font-semibold ${highlight ? (isActive(path) ? 'bg-purple-500 text-white' : 'bg-purple-500/10 text-purple-500') : (isActive(path) ? 'bg-primary/15 text-primary' : 'bg-muted/40 hover:bg-muted')}`}>
                  <Icon icon={icon} className="w-4 h-4" /> {label}
                </Button>
              </Link>
            ))}
            {!isAuthenticated && (
              <>
                <div className="h-px bg-border/40 my-1" />
                <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-12 bg-primary/15 text-primary text-sm font-medium" onClick={() => { setShowLoginModal(true); setMobileOpen(false); }}>
                  <Icon icon="ph:sign-in-bold" className="w-4 h-4" /> Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
