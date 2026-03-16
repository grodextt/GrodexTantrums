import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatViews(n: number | null | undefined): string {
  if (n == null) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

/**
 * Returns the image URL as-is. Supabase image transformations require a paid
 * plan, so we bypass the render API and serve originals directly.
 */
export function optimizedImageUrl(
  url: string | null | undefined,
  _width?: number,
  _quality?: number
): string {
  if (!url) return '';
  return url;
}
