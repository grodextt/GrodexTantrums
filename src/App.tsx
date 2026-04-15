import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginModal from "@/components/LoginModal";
import ScrollToTop from "@/components/ScrollToTop";
import { HelmetProvider } from "react-helmet-async";
import SEOHead from "@/components/SEOHead";
import FloatingAdminBar from "@/components/FloatingAdminBar";
import Index from "./pages/Index";

const MangaInfo = lazy(() => import("./pages/MangaInfo"));
const ChapterReader = lazy(() => import("./pages/ChapterReader"));
const Latest = lazy(() => import("./pages/Latest"));
const Series = lazy(() => import("./pages/Series"));
const Library = lazy(() => import("./pages/Library"));
const EarnCoins = lazy(() => import("./pages/EarnCoins"));
const CoinShop = lazy(() => import("./pages/CoinShop"));
const UserSettings = lazy(() => import("./pages/UserSettings"));
const DMCA = lazy(() => import("./pages/DMCA"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const SubscribeCheckout = lazy(() => import("./pages/SubscribeCheckout"));
const SubscribeSuccess = lazy(() => import("./pages/SubscribeSuccess"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

// Scroll to top on route change
function ScrollToTopOnNavigate() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const AppLayout = () => {
  const location = useLocation();
  const { settings, isLoading } = useSiteSettings();
  const isChapterReader = /^\/manga\/[^/]+\/chapter\//.test(location.pathname);
  const isAdminPanel = location.pathname.startsWith('/admin');
  const hideShell = isChapterReader || isAdminPanel;

  // Site name for loader (e.g. MangaZ -> MZ)
  const shortName = settings.general.site_name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-[9999]">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 animate-pulse border border-primary/30 flex items-center justify-center p-4">
            <div className="w-16 h-16 rounded-2xl bg-primary shadow-[0_0_40px_rgba(var(--primary),0.5)] animate-bounce flex items-center justify-center overflow-hidden">
              {settings.general.logo_url ? (
                <img src={settings.general.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl font-black text-primary-foreground italic">{shortName || 'MZ'}</span>
              )}
            </div>
          </div>
          <div className="absolute -inset-6 bg-primary/20 blur-[50px] animate-pulse rounded-full -z-10" />
        </div>
        <div className="mt-10 space-y-3 text-center">
          <h2 className="text-white font-black tracking-tighter text-2xl uppercase italic drop-shadow-lg">
            {settings.general.site_name}
          </h2>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto border border-white/5">
            <div className="h-full bg-primary animate-loading-bar" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold animate-pulse">Loading Content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead />
      <ScrollToTopOnNavigate />
      {!isAdminPanel && <FloatingAdminBar />}
      {!hideShell && <Navbar />}
      <main className="flex-1">
        <Suspense fallback={null}>
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
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/subscribe" element={<Subscribe />} />
            <Route path="/subscribe/checkout/:planId" element={<SubscribeCheckout />} />
            <Route path="/subscribe/success" element={<SubscribeSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {!hideShell && <Footer />}
      <ScrollToTop />
      <LoginModal />
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HelmetProvider>
        <AuthProvider>
          <ThemeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppLayout />
            </BrowserRouter>
          </ThemeProvider>
        </AuthProvider>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
