import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type MangaType = 'manhwa' | 'manga' | 'manhua';

interface TypeBadgeProps {
  type: MangaType | string;
  className?: string;
}

const TypeBadge = forwardRef<HTMLSpanElement, TypeBadgeProps>(({ type, className }, ref) => {
  return (
    <span ref={ref} className={cn(
      'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-white',
      className
    )}>
      {type}
    </span>
  );
});

TypeBadge.displayName = 'TypeBadge';

export default TypeBadge;
