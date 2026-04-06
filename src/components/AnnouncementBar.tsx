import { Icon } from '@iconify/react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const announcement = settings.announcements as any;
  const hasAnnouncement = announcement?.message?.trim();

  return (
    <div className="space-y-3">
      {/* Dynamic announcement from admin */}
      {hasAnnouncement && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
          <Icon icon="ph:megaphone-bold" className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">{announcement.message}</p>
          </div>
          {announcement.button_text && announcement.button_url && (
            <a
              href={announcement.button_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
            >
              {announcement.button_text}
              <Icon icon="ph:arrow-square-out-bold" className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Static cards */}
      <div className="flex flex-col sm:flex-row items-stretch gap-3">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/40">
          <Icon icon="ph:share-network-bold" className="w-4 h-4 text-primary shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Share {settings.general.site_name || ''}</p>
            <p className="text-xs text-muted-foreground">to your friends</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/40">
          <Icon icon="ph:warning-bold" className="w-4 h-4 text-destructive shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Facing an Issue?</p>
            <p className="text-xs text-muted-foreground">Let us know, and we'll help ASAP</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/40">
          <Icon icon="ph:chat-circle-dots-bold" className="w-4 h-4 text-[hsl(235,86%,65%)] shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Join Our Socials</p>
            <p className="text-xs text-muted-foreground">to explore more</p>
          </div>
        </div>

        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-lg bg-card border border-border/40">
          <Icon icon="ph:heart-bold" className="w-4 h-4 text-pink-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">Donate Us</p>
            <p className="text-xs text-muted-foreground">to support us</p>
          </div>
        </div>
      </div>
    </div>
  );
}
