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

const SUPABASE_STORAGE_PREFIX = '/storage/v1/object/public/';
const SUPABASE_RENDER_PREFIX = '/storage/v1/render/image/public/';

/**
 * Converts a Supabase Storage public URL to use the image transformation API
 * for automatic WebP conversion and resizing.
 */
export function optimizedImageUrl(
  url: string | null | undefined,
  width: number,
  quality: number = 75
): string {
  if (!url) return '';
  // Only transform Supabase Storage URLs
  if (!url.includes(SUPABASE_STORAGE_PREFIX)) return url;
  const transformed = url.replace(SUPABASE_STORAGE_PREFIX, SUPABASE_RENDER_PREFIX);
  return `${transformed}?width=${width}&resize=contain&quality=${quality}&format=webp`;
}
