import { ScrollArea } from '@/components/ui/scroll-area';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function PrivacyPolicy() {
  const { settings } = useSiteSettings();
  const siteName = settings?.general?.site_name || 'the platform';

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-12 max-w-3xl mx-auto min-h-screen animate-in fade-in duration-500">
      <div className="space-y-12">
        <header className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Privacy Policy</h1>
          <div className="h-1 w-12 bg-primary/40 rounded-full" />
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Effective Date: April 11, 2026</p>
        </header>

        <ScrollArea className="h-[calc(100vh-300px)] pr-6 -mr-6">
          <div className="space-y-10 text-[13px] leading-relaxed text-muted-foreground/90">
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">01. Overview</h2>
              <p>
                {siteName} operates as a digital scanlation platform. This document outlines our commitment to your privacy 
                while navigating our services. We prioritize data minimization and user anonymity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">02. Information Acquisition</h2>
              <div className="space-y-4">
                <p>We process data only when essential for service delivery:</p>
                <ul className="space-y-2 list-none pl-0 border-l border-primary/20 ml-1">
                  <li className="pl-4"><strong>Authentication:</strong> Email and password (encrypted) for account security.</li>
                  <li className="pl-4"><strong>Preferences:</strong> Cloud-synced reading history, bookmarks, and UI settings.</li>
                  <li className="pl-4"><strong>Monetization:</strong> Transaction identifiers for balance synchronization.</li>
                </ul>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">03. Persistence & Cookies</h2>
              <p>
                We utilize local storage and session cookies to maintain your authentication state and preferred 
                viewing modes (Dark/Light). We do not deploy intrusive cross-site tracking technologies.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">04. Third-Party Integration</h2>
              <p>
                Financial transactions are processed exclusively through secure external gateways (Stripe, PayPal, Cryptomus). 
                {siteName} does not store or process raw financial data on its infrastructure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">05. Security Architecture</h2>
              <p>
                Access to user data is governed by Row Level Security (RLS) policies within our Supabase infrastructure, 
                ensuring that records are strictly private and accessible only by the account owner.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">06. Governance & Rights</h2>
              <p>
                Users maintain full autonomy over their data. Adjustments can be made via User Settings. 
                For complete data erasure (Right to be Forgotten), please initiate a request via our support channels.
              </p>
            </section>

            <footer className="pt-8 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground/60 leading-normal">
                {siteName} reserves the right to modify this policy. Continued use of the platform constitutes 
                acceptance of refined terms.
              </p>
            </footer>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
