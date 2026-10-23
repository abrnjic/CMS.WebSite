// ============================================================
// Frontend tipovi — oblici koje vraca API (mapirani iz Drizzle sheme)
// ============================================================

export type PropertyType = 'apartment' | 'house' | 'villa';

export interface Amenity {
  key: string;
  label: string;
}

export interface PriceRule {
  from: string;
  to: string;
  pricePerNight: number;
  label?: string;
}

export interface Unit {
  id: number;
  propertyId: number;
  name: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  sizeM2: number;
  basePrice: number;
  currency: string;
  minNights: number;
  cleaningFee: number;
  touristTax: number;
  priceRules: PriceRule[];
  images: string[];
}

export interface Property {
  id: number;
  slug: string;
  name: string;
  type: PropertyType;
  tagline: string;
  description: string;
  city: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  amenities: string[];
  images: string[];
  featured: boolean;
  distanceToSea: number;
  units: Unit[];
}

export interface QuoteResult {
  available: boolean;
  reason?: 'booked' | 'min-nights' | 'past' | 'invalid';
  nights?: number;
  accommodation?: number;
  cleaningFee?: number;
  touristTax?: number;
  total?: number;
}

export interface BookingInfo {
  code: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: number;
  propertyId: number;
}

export type ThemeKey = 'mediteran' | 'obala' | 'noc';

export interface ThemeDef {
  key: ThemeKey;
  label: string;
  swatch: string;
}
