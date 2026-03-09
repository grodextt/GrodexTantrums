import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Manga = Tables<"manga">;
type Chapter = Tables<"chapters">;

export const useMangaBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["manga", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manga")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Manga;
    },
    enabled: !!slug,
  });
};

export const useMangaChapters = (mangaId: string | undefined) => {
  return useQuery({
    queryKey: ["manga-chapters", mangaId],
    queryFn: async () => {
      if (!mangaId) return [];
      const { data, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("manga_id", mangaId)
        .order("number", { ascending: false });

      if (error) throw error;
      return data as Chapter[];
    },
    enabled: !!mangaId,
  });
};
