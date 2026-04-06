import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@iconify/react';

export type MangaType = 'manhwa' | 'manga' | 'manhua';

interface TypeBadgeProps {
  type: MangaType | string;
  className?: string;
}

const TYPE_ICONS: Record<string, string> = {
  manhwa: 'emojione:flag-for-south-korea',
  manga: 'emojione:flag-for-japan',
  manhua: 'emojione:flag-for-china',
};

const TypeBadge = forwardRef<HTMLSpanElement, TypeBadgeProps>(({ type, className }, ref) => {
  const iconName = TYPE_ICONS[type.toLowerCase()];

  return (
    <span ref={ref} className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold capitalize tracking-wider bg-muted text-white',
      className
    )}>
      {iconName && <Icon icon={iconName} className="w-3.5 h-3.5" />}
      {type}
    </span>
  );
});

TypeBadge.displayName = 'TypeBadge';

export default TypeBadge;
