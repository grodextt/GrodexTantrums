import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, BookOpen, Moon, Sun, Coins, ShoppingCart, Settings, Shield, LogOut, LayoutDashboard, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function UserMenu() {
  const { profile, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useIsAdmin();
  const { settings: premiumSettings } = usePremiumSettings();
  const currencyName = premiumSettings.coin_system.currency_name;
  const currencyIconUrl = premiumSettings.coin_system.currency_icon_url;
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  // Fetch balances
  const { data: balances } = useQuery({
    queryKey: ['user-balances', user?.id],
    queryFn: async () => {
      if (!user) return { coin_balance: 0, token_balance: 0 };
      const { data } = await supabase.from('profiles').select('coin_balance, token_balance').eq('id', user.id).single();
      return { coin_balance: data?.coin_balance ?? 0, token_balance: data?.token_balance ?? 0 };
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const coinBalance = balances?.coin_balance ?? 0;
  const tokenBalance = balances?.token_balance ?? 0;

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

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Coins className={className} />
    );

  return (
    <div className="relative" ref={menuRef}>
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

          {/* Balance Card — matching reference screenshot */}
          <div className="rounded-xl border border-border/40 bg-muted/30 p-3 mb-2">
            <p className="text-[11px] font-bold text-muted-foreground text-center mb-2.5 uppercase tracking-widest">Your Balance</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-background/60 border border-border/30 py-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <CurrencyIcon className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-lg font-bold text-foreground leading-none">{coinBalance}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{currencyName}</span>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-background/60 border border-border/30 py-3 px-2">
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-primary" />
                </div>
                <span className="text-lg font-bold text-foreground leading-none">{tokenBalance}</span>
                <span className="text-[10px] text-muted-foreground font-medium">Tickets</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/40 my-1.5" />

          {/* Menu links */}
          <div className="flex flex-col gap-1">
            {isAdmin && (
              <Link to="/admin" onClick={close}>
                <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-primary/10 text-primary text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4" /> Admin Panel
                </Button>
              </Link>
            )}
            <Link to="/earn" onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-muted text-sm font-medium">
                <Ticket className="w-4 h-4" /> Earn Tickets
              </Button>
            </Link>
            <Link to="/coin-shop" onClick={close}>
              <Button variant="ghost" className="w-full justify-start gap-2.5 rounded-xl h-10 hover:bg-muted text-sm font-medium">
                <ShoppingCart className="w-4 h-4" /> {currencyName} Shop
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
