import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 left-6 z-50 h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
      aria-label="Scroll to top"
    >
      <Icon icon="ph:arrow-up-bold" className="w-5 h-5" />
    </button>
  );
}
