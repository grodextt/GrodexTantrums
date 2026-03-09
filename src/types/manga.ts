// Shared types for Manga application
import { Tables } from '@/integrations/supabase/types';

export type MangaType = 'manhwa' | 'manga' | 'manhua';
export type MangaStatus = 'ongoing' | 'completed' | 'hiatus' | 'season_end' | 'cancelled';

export interface Chapter {
  id: string | number;
  number: number;
  title: string;
  date: string;
  pages?: string[];
  premium?: boolean;
}

export interface Comment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  date: string;
  likes: number;
}

export type Manga = Tables<"manga">;
