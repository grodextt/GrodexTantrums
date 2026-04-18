
import { Helmet } from 'react-helmet-async';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useEffect } from 'react';

const SEOHead = () => {
  const { settings } = useSiteSettings();
  const { seo, general } = settings;

  // Inject extra head scripts if any
  useEffect(() => {
    if (seo.extra_head_scripts) {
      const container = document.createElement('div');
      container.innerHTML = seo.extra_head_scripts;
      
      // Filter out only scripts/styles/meta to be safe, or just append everything
      const fragmentedElements = Array.from(container.childNodes);
      fragmentedElements.forEach(node => {
        if (node instanceof HTMLElement) {
          // Check if it already exists to avoid duplicates
          const existing = document.head.querySelector(`[data-seo-extra="${node.tagName.toLowerCase()}"]`);
          if (!existing) {
            const clone = node.cloneNode(true) as HTMLElement;
            clone.setAttribute('data-seo-extra', 'true');
            document.head.appendChild(clone);
          }
        }
      });

      return () => {
        // Cleanup on unmount or settings change
        document.head.querySelectorAll('[data-seo-extra="true"]').forEach(el => el.remove());
      };
    }
  }, [seo.extra_head_scripts]);

  // Google Analytics Injection
  useEffect(() => {
    if (seo.google_analytics_id) {
      const script1 = document.createElement('script');
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${seo.google_analytics_id}`;
      script1.async = true;
      script1.setAttribute('data-ga-id', seo.google_analytics_id);
      
      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${seo.google_analytics_id}');
      `;
      script2.setAttribute('data-ga-id', seo.google_analytics_id);

      document.head.appendChild(script1);
      document.head.appendChild(script2);

      return () => {
        document.head.querySelectorAll(`[data-ga-id="${seo.google_analytics_id}"]`).forEach(el => el.remove());
      };
    }
  }, [seo.google_analytics_id]);

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{`${general.site_title || general.site_name}${general.site_title_suffix || ''}`}</title>
      <meta name="title" content={general.site_title || general.site_name} />
      <meta name="description" content={general.site_description} />
      <meta name="robots" content={seo.robots_meta || 'index, follow'} />
      <meta name="author" content={general.site_name} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={window.location.origin} />
      <meta property="og:title" content={`${general.site_title || general.site_name}${general.site_title_suffix || ''}`} />
      <meta property="og:description" content={general.site_description} />
      <meta property="og:image" content={general.logo_url || '/og-image.png'} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={window.location.origin} />
      <meta property="twitter:title" content={`${general.site_title || general.site_name}${general.site_title_suffix || ''}`} />
      <meta property="twitter:description" content={general.site_description} />
      <meta property="twitter:image" content={general.logo_url || '/og-image.png'} />

      {/* Google Verification */}
      {seo.google_site_verification && (
        <meta name="google-site-verification" content={seo.google_site_verification} />
      )}

      {/* Analytics (Primary Head Tag) */}
      {seo.google_analytics_id && (
        <link rel="preconnect" href="https://www.googletagmanager.com" />
      )}
      
      {/* Favicon / Branding */}
      {general.favicon_url ? (
        <link rel="icon" href={general.favicon_url} />
      ) : general.logo_url ? (
        <link rel="icon" href={general.logo_url} />
      ) : (
        <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      )}
    </Helmet>
  );
};

export default SEOHead;
