import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

type Tab = 'All' | 'Chapters' | 'Comments';

export default function AllNotifications() {
  const { isAuthenticated, setShowLoginModal } = useAuth();
  const { notifications, isLoading, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [activeTab, setActiveTab] = useState<Tab>('All');

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
          <Icon icon="ph:bell-bold" className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">Notifications</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Sign in to stay updated with new chapters and replies to your comments.
          </p>
        </div>
        <Button size="lg" className="gap-2 rounded-full px-8 shadow-lg shadow-primary/20" onClick={() => setShowLoginModal(true)}>
          <Icon icon="ph:sign-in-bold" className="w-5 h-5" />
          Sign In
        </Button>
      </div>
    );
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Chapters') return n.type === 'chapter_update';
    if (activeTab === 'Comments') return n.type === 'comment_reply';
    return true;
  });

  const unreadCount = filteredNotifications.filter(n => !n.is_read).length;

  return (
    <div className="container max-w-4xl py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3 italic uppercase">
            <Icon icon="ph:bell-fill" className="w-8 h-8 text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
            Notifications
          </h1>
          <p className="text-muted-foreground font-medium pl-11">
            Manage your updates and stays connected
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300"
              onClick={() => markAllAsRead.mutate()}
            >
              <Icon icon="ph:check-all-bold" className="mr-2 w-4 h-4" />
              Mark all read
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
            onClick={() => {
              if (confirm('Are you sure you want to clear all notifications?')) {
                clearAll.mutate();
              }
            }}
          >
            <Icon icon="ph:trash-bold" className="mr-2 w-4 h-4" />
            Clear all
          </Button>
        </div>
      </div>

      <div className="sticky top-20 z-10 p-1 bg-background/80 backdrop-blur-xl border border-white/5 rounded-2xl flex gap-1 w-fit shadow-xl">
        {(['All', 'Chapters', 'Comments'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-6 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-[1.02]'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/20 rounded-2xl animate-pulse border border-white/5" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-muted/10 rounded-3xl border border-dashed border-white/10 space-y-4">
          <Icon icon="ph:bell-slash-bold" className="w-16 h-16 text-muted-foreground/20" />
          <div className="text-center">
            <h3 className="text-xl font-bold">No updates found</h3>
            <p className="text-sm text-muted-foreground">Check back later for new notifications</p>
          </div>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredNotifications.map((n, idx) => (
            <div
              key={n.id}
              className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-500 hover:scale-[1.01] ${
                !n.is_read 
                  ? 'bg-primary/5 border-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.05)]' 
                  : 'bg-card/40 border-white/5 hover:bg-card/60'
              }`}
              style={{ animationDelay: `${idx * 50}ms` }}
              onClick={() => {
                if (!n.is_read) markAsRead.mutate(n.id);
              }}
            >
              {!n.is_read && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
              )}
              
              <div className="shrink-0 pt-1">
                {n.type === 'chapter_update' && n.manga ? (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-white/5 group-hover:ring-primary/30 transition-all duration-500">
                    <img src={n.manga.cover_url} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                    <Icon icon="ph:chat-circle-dots-fill" className="w-7 h-7" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {n.manga ? (
                      <Link to={`/manga/${n.manga.slug}`} className="hover:text-primary transition-colors">
                        {n.type === 'chapter_update' ? n.manga.title : n.title}
                      </Link>
                    ) : n.title}
                  </h3>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 bg-muted/40 px-2 py-0.5 rounded-md">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-foreground/90 font-medium' : 'text-muted-foreground'}`}>
                    {n.type === 'chapter_update' ? (
                      <>New Chapter Released: <span className="text-emerald-500 font-black italic">{n.title}</span></>
                    ) : (
                      n.message
                    )}
                  </p>
                  
                  {n.manga && n.type === 'chapter_update' && (
                    <Button variant="secondary" size="sm" className="w-fit rounded-lg h-8 text-[11px] font-bold uppercase tracking-wider px-4" asChild>
                      <Link to={`/manga/${n.manga.slug}`}>Read Now</Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!n.is_read) markAsRead.mutate(n.id);
                  }}
                >
                  <Icon icon={n.is_read ? "ph:envelope-open-bold" : "ph:envelope-simple-bold"} className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
