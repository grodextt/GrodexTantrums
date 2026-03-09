import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Manga = Tables<"manga">;

export const useFeaturedManga = () => {
  return useQuery({
    queryKey: ["featured-manga"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manga")
        .select("*")
        .eq("featured", true)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Manga[];
    },
  });
};
