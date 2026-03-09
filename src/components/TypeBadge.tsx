import { cn } from '@/lib/utils';

export type MangaType = 'manhwa' | 'manga' | 'manhua';

interface TypeBadgeProps {
  type: MangaType | string;
  className?: string;
}

export default function TypeBadge({ type, className }: TypeBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-white',
      className
    )}>
      {type}
    </span>
  );
}
