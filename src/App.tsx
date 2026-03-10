import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import Index from "./pages/Index";
import MangaInfo from "./pages/MangaInfo";
import ChapterReader from "./pages/ChapterReader";
import Latest from "./pages/Latest";
import Series from "./pages/Series";
import Library from "./pages/Library";
import EarnCoins from "./pages/EarnCoins";
import CoinShop from "./pages/CoinShop";
import UserSettings from "./pages/UserSettings";
import DMCA from "./pages/DMCA";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = () => {
  const location = useLocation();
  const { settings } = useSiteSettings();
  const isChapterReader = /^\/manga\/[^/]+\/chapter\//.test(location.pathname);
  const isAdminPanel = location.pathname.startsWith('/admin');
  const hideShell = isChapterReader || isAdminPanel;

  // Apply theme from settings
  useEffect(() => {
    const theme = (settings as any)?.theme;
    if (theme?.primary) {
      document.documentElement.style.setProperty('--primary', theme.primary);
      document.documentElement.style.setProperty('--ring', theme.primary);
    }
    if (theme?.primaryDark) {
      // Apply to dark mode via a class check
      const isDark = document.documentElement.classList.contains('dark');
      if (isDark) {
        document.documentElement.style.setProperty('--primary', theme.primaryDark);
        document.documentElement.style.setProperty('--ring', theme.primaryDark);
      }
    }
  }, [settings]);

  return (
    <div className="min-h-screen flex flex-col">
      {!hideShell && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/manga/:slug" element={<MangaInfo />} />
          <Route path="/manga/:slug/chapter/:chapterId" element={<ChapterReader />} />
          <Route path="/latest" element={<Latest />} />
          <Route path="/series" element={<Series />} />
          <Route path="/library" element={<Library />} />
          <Route path="/earn" element={<EarnCoins />} />
          <Route path="/coin-shop" element={<CoinShop />} />
          <Route path="/settings" element={<UserSettings />} />
          <Route path="/dmca" element={<DMCA />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!hideShell && <Footer />}
      <LoginModal />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
