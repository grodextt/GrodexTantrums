import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Manga = Tables<"manga">;
type Chapter = Tables<"chapters">;

export type MangaWithChapters = Manga & { chapters: Chapter[] };

export const useAllManga = () => {
  return useQuery({
    queryKey: ["all-manga"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manga")
        .select("*, chapters(id, number, title, created_at, premium)")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      
      // Sort chapters by number descending and limit to 4
      return (data as MangaWithChapters[]).map(m => ({
        ...m,
        chapters: (m.chapters || [])
          .sort((a, b) => b.number - a.number)
          .slice(0, 4),
      }));
    },
  });
};
