"use client";
import { useNavigate, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from 'react';
import { Icon } from '@iconify/react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { optimizedImageUrl } from '@/lib/utils';
import SearchModal from './SearchModal';
import UserMenu from './UserMenu';
import NotificationMenu from './NotificationMenu';
import logoImg from '@/assets/logo.png';
import DesktopHeaderStyle1 from '@/components/layouts/header/desktop/DesktopHeaderStyle1';
import MobileHeaderStyle1 from '@/components/layouts/header/mobile/MobileHeaderStyle1';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';

const BASE_NAV_LINKS = [
  { path: '/latest', label: 'Latest', icon: 'akar-icons:schedule' },
  { path: '/series', label: 'Series', icon: 'ic:round-dashboard' },
];

export default function Navbar() {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { settings } = useSiteSettings();
  const { settings: premiumSettings } = usePremiumSettings();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const subName = premiumSettings?.subscription_settings?.subscription_name || 'Subscribe';

  type NavLink = { path: string; label: string; icon: string; highlight?: boolean };
  const NAV_LINKS: NavLink[] = [
    ...BASE_NAV_LINKS,
    ...(isAuthenticated && premiumSettings.premium_config.enable_subscriptions ? [{ path: '/subscribe', label: subName, icon: 'mdi:latest', highlight: true }] : [])
  ];

  const siteName = settings?.general?.site_name || 'Grodex Tantrums';
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

  const desktopStyle = settings?.layouts?.header_desktop_style || 'style-1';
  const mobileStyle = settings?.layouts?.header_mobile_style || 'style-1';

  const renderDesktopHeader = () => {
    switch (desktopStyle) {
      case 'style-1':
      default:
        return (
          <DesktopHeaderStyle1
            navLinks={NAV_LINKS}
            isActive={isActive}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
            setShowLoginModal={setShowLoginModal}
            setSearchOpen={setSearchOpen}
          />
        );
    }
  };

  const renderMobileHeader = () => {
    switch (mobileStyle) {
      case 'style-1':
      default:
        return (
          <MobileHeaderStyle1
            navLinks={NAV_LINKS}
            isActive={isActive}
            isAuthenticated={isAuthenticated}
            theme={theme}
            toggleTheme={toggleTheme}
            setShowLoginModal={setShowLoginModal}
            setSearchOpen={setSearchOpen}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />
        );
    }
  };

  return (
    <>
      <nav className="z-50 bg-transparent">
        <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 flex h-20 items-center justify-between">
          {isSubPage ? (
            <button onClick={handleBack} className="flex items-center gap-3 group">
              <Icon icon="ph:arrow-left-bold" className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
              <span className="font-bold text-xl text-foreground tracking-tight">{siteName}</span>
            </button>
          ) : (
            <Link to="/" className="flex items-center gap-3 group" onClick={() => setMobileOpen(false)}>
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <img src={optimizedImageUrl(settings.general.logo_url || (typeof logoImg === 'string' ? logoImg : (logoImg as any).src), 96)} alt={`${siteName} logo`} className="w-full h-full object-contain" />
              </div>
              <span className="font-bold text-xl text-foreground tracking-tight">{siteName}</span>
            </Link>
          )}

          {renderDesktopHeader()}
          {renderMobileHeader()}
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
