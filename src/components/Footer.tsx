import { useSiteSettings } from '@/hooks/useSiteSettings';
import FooterStyle1 from '@/components/layouts/footer/FooterStyle1';

export default function Footer() {
  const { settings } = useSiteSettings();
  const footerStyle = settings?.layouts?.footer_style || 'style-1';

  switch (footerStyle) {
    case 'style-1':
    default:
      return <FooterStyle1 />;
  }
}
