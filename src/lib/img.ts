import { images } from '@/data/properties';

/**
 * kljuc slike -> src za <img>:
 * - ugradjene slike (apt1, hero…) dolaze iz asset mape
 * - uploadane slike (media/…) serviraju se s vlastitog backenda (/api/media/<key>)
 */
export function imgSrc(key: string | undefined | null): string | undefined {
  if (!key) return undefined;
  if (images[key]) return images[key];
  if (key.startsWith('media/')) return `/api/media/${key}`;
  return undefined;
}
