import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNowStrict } from 'date-fns';

type Tab = 'All' | 'Chapters' | 'Comments';

export default function NotificationMenu() {
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('All');

  // Hide entirely for logged-out users
  if (!isAuthenticated) {
    return null;
  }

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Chapters') return n.type === 'chapter_update';
    if (activeTab === 'Comments') return n.type === 'comment_reply';
    return true;
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-11 w-11 bg-muted/60 hover:bg-muted relative transition-all duration-200 hover:scale-[1.05]">
          <Icon icon="ph:bell-bold" className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0 rounded-2xl border-border bg-card shadow-xl overflow-hidden" align="end" sideOffset={8}>
        <div className="flex flex-col px-4 pt-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon icon="ph:check-square-offset-bold" className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {(['All', 'Chapters', 'Comments'] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1 px-3 rounded-full text-xs font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <Icon icon="ph:bell-bold" className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            filteredNotifications.map(n => (
              <div
                key={n.id}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0 relative ${!n.is_read ? 'bg-primary/5' : ''}`}
                onClick={() => {
                  if (!n.is_read) markAsRead.mutate(n.id);
                  setOpen(false);
                }}
              >
                {/* Unread Indicator */}
                {!n.is_read && (
                  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                )}

                {n.type === 'chapter_update' && n.manga ? (
                  <>
                    <Link to={`/manga/${n.manga.slug}`} className="shrink-0 pl-1">
                      <img src={n.manga.cover_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-bold text-foreground truncate">{n.manga.title}</p>
                      <p className="text-xs font-semibold text-emerald-500 truncate mt-0.5">
                        New: {n.title}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0 font-medium">
                      {formatDistanceToNowStrict(new Date(n.created_at))}
                    </p>
                  </>
                ) : n.type === 'comment_reply' ? (
                  <>
                    <Link to={n.manga ? `/manga/${n.manga.slug}` : '#'} className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 pl-1">
                      <Icon icon="ph:chat-circle-dots-bold" className="w-5 h-5 text-primary" />
                    </Link>
                    <Link to={n.manga ? `/manga/${n.manga.slug}` : '#'} className="flex-1 min-w-0 pr-2">
                      <p className="text-sm font-bold text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.message}</p>
                    </Link>
                    <p className="text-[10px] text-muted-foreground shrink-0 font-medium">
                      {formatDistanceToNowStrict(new Date(n.created_at))}
                    </p>
                  </>
                ) : null}
              </div>
            ))
          )}
        </div>
        
        <div className="border-t border-border bg-muted/20">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block py-3 text-center text-sm font-semibold text-primary hover:bg-muted/40 transition-colors"
          >
            View all
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
