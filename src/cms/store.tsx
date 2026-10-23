import { trpc } from '@/providers/trpc';
import type { BlockInstance } from './types';

// ============================================================
// CMS pristup podacima — sve kroz tRPC (baza), bez localStoragea
// Komponente koriste ove hookove direktno.
// ============================================================

const cast = (blocks: unknown): BlockInstance[] => (blocks ?? []) as BlockInstance[];

/** Admin: popis svih stranica */
export function useCmsPages(enabled = true) {
  return trpc.cms.list.useQuery(undefined, { enabled });
}

/** Admin: jedna stranica s revizijama */
export function useCmsPage(id: number | null, enabled = true) {
  const q = trpc.cms.get.useQuery({ id: id ?? 0 }, { enabled: enabled && !!id });
  return {
    ...q,
    page: q.data
      ? { ...q.data, draft: cast(q.data.draft), published: cast(q.data.published), revisions: q.data.revisions.map((r) => ({ ...r, blocks: cast(r.blocks) })) }
      : undefined,
  };
}

/** Javno: objavljena stranica po slug-u */
export function usePublicPage(slug: string) {
  const q = trpc.cms.publicPage.useQuery({ slug }, { staleTime: 15_000 });
  return {
    ...q,
    page: q.data ? { ...q.data, blocks: cast(q.data.blocks) } : q.data,
  };
}

/** Admin mutacije s automatskom invalidacijom */
export function useCmsMutations() {
  const utils = trpc.useUtils();
  const invalidate = () => { utils.cms.list.invalidate(); utils.cms.get.invalidate(); utils.cms.publicPage.invalidate(); };

  return {
    saveDraft: trpc.cms.saveDraft.useMutation({ onSuccess: invalidate }),
    publish: trpc.cms.publish.useMutation({ onSuccess: invalidate }),
    unpublish: trpc.cms.unpublish.useMutation({ onSuccess: invalidate }),
    restoreRevision: trpc.cms.restoreRevision.useMutation({ onSuccess: invalidate }),
    createPage: trpc.cms.createPage.useMutation({ onSuccess: invalidate }),
    deletePage: trpc.cms.deletePage.useMutation({ onSuccess: invalidate }),
    renamePage: trpc.cms.renamePage.useMutation({ onSuccess: invalidate }),
    updateSeo: trpc.cms.updateSeo.useMutation({ onSuccess: invalidate }),
  };
}
