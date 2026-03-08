import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Moon, Sun, Coins, ShoppingCart, Settings, Shield, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';

export default function UserMenu() {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger: icon-only on mobile/tablet, icon+name on desktop */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full bg-muted/60 border border-border/40 hover:bg-muted transition-all duration-200 hover:scale-[1.02] h-11 px-2 lg:px-4"
      >
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <span className="hidden lg:inline text-sm font-medium truncate max-w-[120px]">
          {profile?.display_name || 'User'}
        </span>
      </button>

      {/* Floating menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-card border border-border/60 shadow-2xl p-3 z-[200] animate-in fade-in zoom-in-95 duration-150">
          {/* Top row: Library + Theme toggle */}
          <div className="flex gap-2 mb-2">
            <Link to="/library" onClick={close} className="flex-1">
              <Button
                variant="ghost"
                className="w-full rounded-xl h-10 bg-muted/50 hover:bg-muted gap-2 text-sm font-medium justify-center"
              >
                <BookOpen className="w-4 h-4" /> Library
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="rounded-xl h-10 w-10 bg-muted/50 hover:bg-muted shrink-0"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>

          <div className="h-px bg-border/40 my-1.5" />

          {/* Menu links */}
          <div className="flex flex-col gap-1">
            <Link to="/earn" onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-muted text-sm font-medium">
                <Coins className="w-4 h-4" /> Earn Coins/Tickets
              </Button>
            </Link>
            <Link to="/coin-shop" onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-muted text-sm font-medium">
                <ShoppingCart className="w-4 h-4" /> Coin Shop
              </Button>
            </Link>
            <Link to="/settings" onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-muted text-sm font-medium">
                <Settings className="w-4 h-4" /> User Settings
              </Button>
            </Link>

            {isMobile ? (
              <>
                <div className="h-px bg-border/40 my-1.5" />
                <div className="flex gap-2">
                  <Link to="/dmca" onClick={close} className="flex-1">
                    <Button variant="ghost" className="w-full rounded-xl h-10 bg-muted/50 hover:bg-muted gap-2 text-sm font-medium justify-center">
                      <Shield className="w-4 h-4" /> DMCA
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="flex-1 rounded-xl h-10 bg-destructive/10 hover:bg-destructive/20 text-destructive gap-2 text-sm font-medium justify-center"
                    onClick={() => { logout(); close(); }}
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/dmca" onClick={close}>
                <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-muted text-sm font-medium">
                  <Shield className="w-4 h-4" /> DMCA
                </Button>
              </Link>
            )}
          </div>

          {/* Desktop/Tablet logout */}
          {!isMobile && (
            <>
              <div className="h-px bg-border/40 my-1.5" />
              <Button
                variant="ghost"
                className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-destructive/10 text-destructive text-sm font-medium"
                onClick={() => { logout(); close(); }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
