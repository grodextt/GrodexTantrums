import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="container py-10 flex flex-col items-center text-center gap-4">
        {/* Logo */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <span className="text-foreground font-bold text-lg">K</span>
        </div>

        {/* Brand */}
        <p className="font-semibold text-foreground">Kayn Scan</p>

        {/* Description */}
        <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
          Kayn Scans – Kaynscans.com Read English Manhwa Releases Kaynscans, The best site for reading manhwa, manga, manhua at Kayn Scans
        </p>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/series" className="hover:text-foreground transition-colors">Series</Link>
          <Link to="/latest" className="hover:text-foreground transition-colors">Latest</Link>
        </div>

        {/* Bottom icons */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground">DMCA</span>
        </div>
      </div>
    </footer>
  );
}
