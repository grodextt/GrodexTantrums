import { Link } from "react-router-dom";
import { Icon } from '@iconify/react';
import { Tables } from '@/integrations/supabase/types';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import MangaCardStyle1 from '@/components/layouts/manga-card/MangaCardStyle1';

type Manga = Tables<"manga">;
type Chapter = Tables<"chapters">;

export type MangaWithOptionalChapters = Manga & { 
  chapters?: Chapter[];
};

interface Props {
  manga: MangaWithOptionalChapters;
  rank?: number;
  showChapters?: boolean;
}

export default function MangaCard(props: Props) {
  const { settings } = useSiteSettings();
  const cardStyle = settings?.layouts?.manga_card_style || 'style-1';

  switch (cardStyle) {
    case 'style-1':
    default:
      return <MangaCardStyle1 {...props} />;
  }
}
