import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type Manga = Tables<"manga">;

export const useCompletedManga = () => {
  return useQuery({
    queryKey: ["completed-manga"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manga")
        .select("*")
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data as Manga[];
    },
  });
};
