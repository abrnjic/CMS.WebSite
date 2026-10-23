import type { Amenity } from '@/types';

import hero from '@/assets/img/hero.jpg';
import apt1 from '@/assets/img/apt1.jpg';
import apt2 from '@/assets/img/apt2.jpg';
import apt3 from '@/assets/img/apt3.jpg';
import apt4 from '@/assets/img/apt4.jpg';
import apt5 from '@/assets/img/apt5.jpg';
import apt6 from '@/assets/img/apt6.jpg';
import apt7 from '@/assets/img/apt7.jpg';
import apt8 from '@/assets/img/apt8.jpg';
import int1 from '@/assets/img/int1.jpg';
import int2 from '@/assets/img/int2.jpg';
import int3 from '@/assets/img/int3.jpg';
import int4 from '@/assets/img/int4.jpg';

/** mapa kljuc -> asset (slike se i dalje isporucuju sa sajta; kljucevi su u bazi) */
export const images: Record<string, string> = {
  hero, apt1, apt2, apt3, apt4, apt5, apt6, apt7, apt8, int1, int2, int3, int4,
};

export const AMENITIES: Amenity[] = [
  { key: 'wifi', label: 'Wi-Fi' },
  { key: 'parking', label: 'Parking' },
  { key: 'pool', label: 'Bazen' },
  { key: 'ac', label: 'Klima' },
  { key: 'kitchen', label: 'Kuhinja' },
  { key: 'washer', label: 'Perilica rublja' },
  { key: 'tv', label: 'TV' },
  { key: 'terrace', label: 'Terasa' },
  { key: 'seaview', label: 'Pogled na more' },
  { key: 'pets', label: 'Ljubimci dobrodosli' },
  { key: 'bbq', label: 'Rostilj' },
  { key: 'garden', label: 'Vrt' },
];

export const amenityLabel = (key: string) =>
  AMENITIES.find((a) => a.key === key)?.label ?? key;
