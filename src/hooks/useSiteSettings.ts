import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cachedFetch } from '@/lib/cachedFetch';

export interface GeneralSettings {
  site_name: string;
  site_title: string;
  site_title_suffix?: string;
  site_description: string;
  footer_text: string;
  footer_tagline: string;
  logo_url?: string;
  favicon_url?: string;
  loader_name?: string;
  loader_logo_url?: string;
  discord_url?: string;
  donation_name?: string;
  donation_url?: string;
  donation_icon_url?: string;
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
  provider: 'supabase' | 'blogger' | 'discord' | 'imgbb' | 'r2' | 'manual_blogger';
  blogger_blog_id?: string;
  blogger_api_key?: string;
  blogger_client_id?: string;
  blogger_client_secret?: string;
  discord_webhook_url?: string;
  imgbb_api_key?: string;
  r2_account_id?: string;
  r2_access_key?: string;
  r2_secret_key?: string;
  r2_bucket_name?: string;
  r2_public_url?: string;
}

export interface ThemeSettings {
  preset: string;
  custom_primary_hsl?: string;
  primary?: string;
  primaryDark?: string;
}

export interface SEOSettings {
  google_site_verification?: string;
  google_analytics_id?: string;
  robots_meta?: string;
  sitemap_url?: string;
  extra_head_scripts?: string;
}

export interface SiteSettings {
  general: GeneralSettings;
  announcements: AnnouncementSettings;
  upload: UploadSettings;
  storage: StorageSettings;
  theme: ThemeSettings;
  seo: SEOSettings;
}

const DEFAULT_SETTINGS: SiteSettings = {
  general: {
    site_name: 'Grodex Tantrums',
    site_title: 'Grodex Tantrums',
    site_title_suffix: '',
    site_description: 'Read the latest manga online.',
    footer_text: 'Grodex Tantrums',
    footer_tagline: 'Your gateway to manga.',
    favicon_url: '',
    loader_name: 'Grodex Tantrums',
    loader_logo_url: '',
    discord_url: '',
  },
  announcements: { message: '' },
  upload: { max_size_mb: 10, allowed_formats: 'jpg, png, webp' },
  storage: { provider: 'supabase' },
  theme: { preset: 'Obsidian' },
  seo: {
    google_site_verification: '',
    google_analytics_id: '',
    robots_meta: 'index, follow',
    sitemap_url: '',
    extra_head_scripts: '',
  },
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
    staleTime: 1000 * 30,
  });

  const updateSettings = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate and refetch immediately to ensure UI reflects database state
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.refetchQueries({ queryKey: ['site-settings'] });
    },
  });

  const refreshSettings = () => {
    queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    queryClient.refetchQueries({ queryKey: ['site-settings'] });
  };

  return {
    settings: settings || DEFAULT_SETTINGS,
    isLoading,
    updateSettings,
    refreshSettings,
  };
};
