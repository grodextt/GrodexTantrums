import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ─── Flickering Grid Canvas ─────────────────────────────────────────────────

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  className?: string;
}

function resolveColor(cssColor: string): string {
  if (typeof window === 'undefined') return '180, 180, 180';
  const el = document.createElement('div');
  el.style.color = cssColor;
  document.body.appendChild(el);
  const computed = getComputedStyle(el).color;
  document.body.removeChild(el);
  const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? `${m[1]}, ${m[2]}, ${m[3]}` : '180, 180, 180';
}

const FlickeringGridInner: React.FC<FlickeringGridProps> = ({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = 'rgb(0, 0, 0)',
  maxOpacity = 0.3,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const rgb = useMemo(() => resolveColor(color), [color]);

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const cols = Math.ceil(w / (squareSize + gridGap));
      const rows = Math.ceil(h / (squareSize + gridGap));
      const squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++) squares[i] = Math.random() * maxOpacity;
      return { cols, rows, squares, dpr };
    },
    [squareSize, gridGap, maxOpacity],
  );

  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D, cols: number, rows: number, squares: Float32Array, dpr: number) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx.fillStyle = `rgba(${rgb}, ${squares[i * rows + j]})`;
          ctx.fillRect(
            i * (squareSize + gridGap) * dpr,
            j * (squareSize + gridGap) * dpr,
            squareSize * dpr,
            squareSize * dpr,
          );
        }
      }
    },
    [rgb, squareSize, gridGap],
  );

  const updateSquares = useCallback(
    (squares: Float32Array, total: number) => {
      for (let i = 0; i < total; i++) {
        if (Math.random() < flickerChance) squares[i] = Math.random() * maxOpacity;
      }
    },
    [flickerChance, maxOpacity],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    let gp: ReturnType<typeof setupCanvas>;

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      setCanvasSize({ width: w, height: h });
      gp = setupCanvas(canvas, w, h);
    };

    resize();

    const animate = () => {
      if (isInView) {
        updateSquares(gp.squares, gp.cols * gp.rows);
        drawGrid(ctx, gp.cols, gp.rows, gp.squares, gp.dpr);
      }
      raf = requestAnimationFrame(animate);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    animate();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [setupCanvas, drawGrid, updateSquares, isInView]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const io = new IntersectionObserver(([e]) => setIsInView(e.isIntersecting), { threshold: 0 });
    io.observe(container);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn('w-full h-full', className)}>
      <canvas ref={canvasRef} style={{ width: canvasSize.width, height: canvasSize.height }} />
    </div>
  );
};

// ─── Footer Section Types ───────────────────────────────────────────────────

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

// ─── Exported Footer Component ──────────────────────────────────────────────

interface FlickeringFooterProps {
  brandName?: string;
  brandDescription?: string;
  sections?: FooterSection[];
  maskedText?: string;
  gridColor?: string;
  gridMaxOpacity?: number;
  gridFlickerChance?: number;
  gridSquareSize?: number;
  gridGap?: number;
}

const defaultSections: FooterSection[] = [
  {
    title: 'Navigation',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Series', href: '/series' },
      { label: 'Latest', href: '/latest' },
      { label: 'Library', href: '/library' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'DMCA', href: '#' },
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  },
  {
    title: 'Social',
    links: [{ label: 'Discord', href: '#' }],
  },
];

export function FlickeringFooter({
  brandName = 'Kayn Scan',
  brandDescription = 'Read the latest Manhwa, Manga, and Manhua releases translated to English at Kayn Scans.',
  sections = defaultSections,
  maskedText = 'Kayn Scan',
  gridColor = 'hsl(var(--primary))',
  gridMaxOpacity = 0.15,
  gridFlickerChance = 0.1,
  gridSquareSize = 4,
  gridGap = 6,
}: FlickeringFooterProps) {
  return (
    <footer className="relative border-t border-border mt-16 overflow-hidden">
      {/* Flickering grid background */}
      <div className="absolute inset-0 z-0">
        <FlickeringGridInner
          className="absolute inset-0 w-full h-full"
          squareSize={gridSquareSize}
          gridGap={gridGap}
          color={gridColor}
          maxOpacity={gridMaxOpacity}
          flickerChance={gridFlickerChance}
        />
      </div>

      {/* Gradient fade at top */}
      <div
        className="absolute inset-x-0 top-0 h-24 z-[1]"
        style={{ background: 'linear-gradient(to bottom, hsl(var(--background)), transparent)' }}
      />

      {/* Large masked text at bottom */}
      <div className="absolute bottom-0 inset-x-0 z-[1] flex items-end justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="text-[clamp(3rem,10vw,8rem)] font-black uppercase tracking-widest leading-none pb-4 whitespace-nowrap"
          style={{
            background: 'linear-gradient(to top, hsl(var(--foreground) / 0.06), transparent)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {maskedText}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-[2] container py-12 pb-28">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <span className="text-primary font-bold text-sm">K</span>
              </div>
              <span className="font-semibold text-foreground text-lg">{brandName}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{brandDescription}</p>
          </div>

          {/* Link columns */}
          {sections.map((section) => (
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
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ♥ by <span className="text-primary">{brandName}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default FlickeringFooter;
