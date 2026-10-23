import type { ReactNode } from 'react';

// ============================================================
// CMS jezgra — tipovi (odraz Page/Block/Revision sheme u bazi)
// ============================================================

export interface BlockInstance {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface PageRevision {
  id: number;
  pageId: number;
  version: number;
  blocks: BlockInstance[];
  savedAt: string | Date;
}

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  draft: BlockInstance[];
  published: BlockInstance[];
  revisions: PageRevision[];
}

/** Opisnik polja za automatsko generiranje forme u inspektoru */
export interface FieldDef {
  key: string;
  label: string;
  type: 'string' | 'textarea' | 'number' | 'boolean' | 'select' | 'image' | 'images';
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
}

/** Model/varijanta bloka — zamjenjuje se na jedan klik u inspektoru */
export interface VariantDef {
  key: string;
  label: string;
  description: string;
}

export interface BlockDef {
  type: string;
  label: string;
  category: 'layout' | 'sadrzaj' | 'booking';
  description: string;
  fields: FieldDef[];
  /** dostupni modeli — prvi je zadani; sprema se u props.variant */
  variants?: VariantDef[];
  defaultProps: Record<string, unknown>;
  render: (props: Record<string, unknown>) => ReactNode;
}
