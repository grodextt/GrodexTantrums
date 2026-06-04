"use client";
import { useEffect } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export default function DynamicFavicon() {
  const { settings } = useSiteSettings();
  
  useEffect(() => {
    const faviconUrl = settings?.general?.favicon_url;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [settings?.general?.favicon_url]);

  return null;
}
