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

interface DesktopHeaderStyle1Props {
  navLinks: NavLink[];
  isActive: (path: string) => boolean;
  isAuthenticated: boolean;
  theme: string;
  toggleTheme: () => void;
  setShowLoginModal: (show: boolean) => void;
  setSearchOpen: (show: boolean) => void;
}

export default function DesktopHeaderStyle1({
  navLinks,
  isActive,
  isAuthenticated,
  theme,
  toggleTheme,
  setShowLoginModal,
  setSearchOpen
}: DesktopHeaderStyle1Props) {
  return (
    <div className="hidden md:flex items-center gap-2">
      <Button variant="ghost" className="rounded-full h-11 bg-muted/60 hover:bg-muted text-sm font-medium transition-all duration-200 hover:scale-[1.02] md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5" onClick={() => setSearchOpen(true)}>
        <Icon icon="ph:magnifying-glass-bold" className="w-4 h-4" />
        <span className="hidden lg:inline">Search</span>
      </Button>
      {navLinks.map(({ path, label, icon, highlight }) => (
        <Link key={path} to={path}>
          {highlight ? (
            <Button variant="ghost" className={`rounded-full h-11 transition-all duration-200 hover:scale-[1.02] text-sm font-bold md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5 ${isActive(path) ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 ring-1 ring-purple-400' : 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-500'}`}>
              <Icon icon={icon} className="w-4 h-4" />
              <span className="hidden lg:inline">{label}</span>
            </Button>
          ) : (
            <Button variant="ghost" className={`rounded-full h-11 transition-all duration-200 hover:scale-[1.02] text-sm font-medium md:w-11 md:px-0 lg:w-auto lg:gap-2 lg:px-5 ${isActive(path) ? 'bg-primary/15 text-primary hover:bg-primary/20 ring-1 ring-primary/30' : 'bg-muted/60 hover:bg-muted'}`}>
              <Icon icon={icon} className="w-4 h-4" />
              <span className="hidden lg:inline">{label}</span>
            </Button>
          )}
        </Link>
      ))}
      <div className="w-px h-6 bg-border/60 mx-1" />
      <NotificationMenu />
      {!isAuthenticated && (
        <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted transition-all duration-200 hover:scale-[1.05]" onClick={toggleTheme}>
          {theme === 'dark' ? <Icon icon="ph:sun-bold" className="w-4 h-4" /> : <Icon icon="ph:moon-bold" className="w-4 h-4" />}
        </Button>
      )}
      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <Button variant="ghost" className="rounded-full gap-2 px-5 h-11 bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-all duration-200 hover:scale-[1.02] ml-1" onClick={() => setShowLoginModal(true)}>
          <Icon icon="ph:sign-in-bold" className="w-4 h-4" />
          Sign in
        </Button>
      )}
    </div>
  );
}
