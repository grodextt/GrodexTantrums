import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Collection {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  genres: string[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useCollections = () => {
  return useQuery({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections' as any)
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as Collection[];
    },
    staleTime: 1000 * 30,
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { title: string; description: string; icon: string; genres: string[] }) => {
      const { error } = await supabase
        .from('collections' as any)
        .insert([{
          title: input.title,
          description: input.description,
          icon: input.icon,
          genres: input.genres,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; title: string; description: string; icon: string; genres: string[] }) => {
      const { error } = await supabase
        .from('collections' as any)
        .update({
          title: input.title,
          description: input.description,
          icon: input.icon,
          genres: input.genres,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useDeleteCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collections' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
    },
  });
};

export const useCollectionSeries = (genres: string[]) => {
  return useQuery({
    queryKey: ['collection-series', genres],
    queryFn: async () => {
      if (!genres.length) return [];
      const { data, error } = await supabase
        .from('manga')
        .select('id, title, slug, cover_url, type, status, genres, views')
        .overlaps('genres', genres)
        .order('views', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: genres.length > 0,
    staleTime: 1000 * 60,
  });
};
