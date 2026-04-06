import { Icon } from '@iconify/react';

export type MangaType = 'manhwa' | 'manga' | 'manhua';

const FLAGS: Record<string, string> = {
  manhwa: 'emojione:flag-for-south-korea',
  manga: 'emojione:flag-for-japan',
  manhua: 'emojione:flag-for-china',
  Manhwa: 'emojione:flag-for-south-korea',
  Manga: 'emojione:flag-for-japan',
  Manhua: 'emojione:flag-for-china',
};

export default function TypeFlag({ type }: { type: MangaType | 'Novel' | string }) {
  if (type === 'Novel') {
    return (
      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
        N
      </span>
    );
  }

  const iconName = FLAGS[type];

  return (
    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 overflow-hidden">
      {iconName ? <Icon icon={iconName} className="w-4 h-4" /> : '📖'}
    </span>
  );
}
