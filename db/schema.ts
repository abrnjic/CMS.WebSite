// Stored documents. Numeric IDs preserve the existing CMS UI contracts.
export interface User {
  id: number;
  unionId: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date;
}
export type InsertUser = Pick<User, "unionId"> &
  Partial<Omit<User, "id" | "unionId">>;
export interface AdminInvite {
  id: number;
  email: string;
  code: string;
  usedBy: number | null;
  usedAt: Date | null;
  createdAt: Date;
}
export interface Property {
  id: number;
  slug: string;
  name: string;
  type: "apartment" | "house" | "villa";
  tagline: string;
  description: string;
  city: string;
  region: string;
  address: string;
  lat: number;
  lng: number;
  rating: string;
  reviewCount: number;
  amenities: string[];
  images: string[];
  featured: boolean;
  distanceToSea: number;
  createdAt: Date;
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
  basePrice: string;
  currency: string;
  minNights: number;
  cleaningFee: string;
  touristTax: string;
  priceRules: {
    from: string;
    to: string;
    pricePerNight: number;
    label?: string;
  }[];
  images: string[];
  calendarVersion?: number;
}
export interface Booking {
  id: number;
  code: string;
  unitId: number;
  propertyId: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalPrice: string;
  currency: string;
  status: "confirmed" | "cancelled";
  source: "direct" | "external";
  externalUid: string | null;
  feedId: number | null;
  createdAt: Date;
}
export interface IcalFeed {
  id: number;
  unitId: number;
  label: string;
  url: string;
  lastSyncAt: Date | null;
  lastError: string | null;
  createdAt: Date;
}
export interface MediaFile {
  id: number;
  key: string;
  name: string;
  size: number;
  contentType: string;
  uploadedBy: number | null;
  createdAt: Date;
}
export interface SiteSetting {
  key: string;
  value: string;
}
export interface Page {
  id: number;
  slug: string;
  title: string;
  seoTitle: string | null;
  seoDescription: string | null;
  status: "draft" | "published";
  draft: unknown[];
  published: unknown[];
  updatedAt: Date;
  version?: number;
}
export interface PageRevision {
  id: number;
  pageId: number;
  version: number;
  blocks: unknown[];
  savedAt: Date;
}
export interface ThemeOverride {
  id: number;
  themeKey: string;
  tokens: Record<string, string>;
  updatedAt: Date;
}
export interface Tables {
  users: User;
  admin_invites: AdminInvite;
  properties: Property;
  units: Unit;
  bookings: Booking;
  ical_feeds: IcalFeed;
  media_files: MediaFile;
  pages: Page;
  page_revisions: PageRevision;
  theme_overrides: ThemeOverride;
}
