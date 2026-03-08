import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { FlickeringGrid } from '@/components/ui/flickering-grid';

const footerSections = [
  {
    title: "Navigation",
    links: [
      { label: "Home", href: "/" },
      { label: "Series", href: "/series" },
      { label: "Latest", href: "/latest" },
      { label: "Library", href: "/library" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "DMCA", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
    ],
  },
  {
    title: "Social",
    links: [
      { label: "Discord", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border mt-16 overflow-hidden">
      {/* Flickering grid background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGrid
          className="absolute inset-0 w-full h-full"
          squareSize={4}
          gridGap={6}
          color="hsl(var(--primary))"
          maxOpacity={0.15}
          flickerChance={0.1}
        />
      </div>

      {/* Gradient fade overlay at top */}
      <div
        className="absolute inset-x-0 top-0 h-24 z-[1]"
        style={{
          background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)',
        }}
      />

      {/* Content */}
      <div className="relative z-[2] container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand section */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">K</span>
              </div>
              <span className="font-semibold text-foreground text-lg">Kayn Scan</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Read the latest Manhwa, Manga, and Manhua releases translated to English at Kayn Scans.
            </p>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="group flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                      <ChevronRight className="h-4 w-4 mr-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kayn Scan. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ♥ by <span className="text-primary">Kayn Scan</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
