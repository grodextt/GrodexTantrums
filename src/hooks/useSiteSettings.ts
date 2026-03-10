import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GeneralSettings {
  site_name: string;
  site_description: string;
  footer_text: string;
  footer_tagline: string;
  logo_url?: string;
}

export interface AnnouncementSettings {
  message: string;
  button_text?: string;
  button_url?: string;
}

export interface UploadSettings {
  max_size_mb: number;
  allowed_formats: string;
}

export interface StorageSettings {
  provider: 'supabase' | 'blogger';
  blogger_blog_id?: string;
  blogger_api_key?: string;
}

export interface ThemeSettings {
  preset: string;
  custom_primary_hsl?: string;
  primary?: string;
  primaryDark?: string;
}

export interface SiteSettings {
  general: GeneralSettings;
  announcements: AnnouncementSettings;
  upload: UploadSettings;
  storage: StorageSettings;
  theme: ThemeSettings;
}

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    site_name: 'Kayn Scan',
    site_description: 'Read the latest manga, manhwa, and manhua translations.',
    footer_text: 'Kayn Scan',
    footer_tagline: 'Your gateway to manga',
  },
  announcements: { message: '' },
  upload: { max_size_mb: 10, allowed_formats: 'jpg, png, webp' },
  storage: { provider: 'supabase' },
  theme: { preset: 'Purple Night' },
};

export const useSiteSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      const result = { ...DEFAULT_SETTINGS };
      for (const row of (data || [])) {
        const key = row.key as keyof SiteSettings;
        if (key in result) {
          result[key] = { ...result[key], ...(row.value as any) };
        }
      }
      return result;
    },
    staleTime: 1000 * 60 * 5,
  });

  const updateSettings = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings,
  };
};
