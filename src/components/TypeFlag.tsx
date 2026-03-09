export type MangaType = 'manhwa' | 'manga' | 'manhua';

const FLAGS: Record<string, string> = {
  manhwa: '🇰🇷',
  manga: '🇯🇵',
  manhua: '🇨🇳',
  Manhwa: '🇰🇷',
  Manga: '🇯🇵',
  Manhua: '🇨🇳',
};

export default function TypeFlag({ type }: { type: MangaType | 'Novel' | string }) {
  if (type === 'Novel') {
    return (
      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
        N
      </span>
    );
  }

  return (
    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs shrink-0 overflow-hidden">
      {FLAGS[type] || '📖'}
    </span>
  );
}
