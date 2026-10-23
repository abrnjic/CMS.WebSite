import { TRPCError } from "@trpc/server";
import { getDb, rows, row, update, remove, nextId, decode } from "./connection";
import type { Page } from "@db/schema";
export async function listPages() {
  return rows("pages");
}
export async function getPage(id: number) {
  const p = await row("pages", id);
  if (!p) return null;
  const revs = await rows("page_revisions", "pageId", id);
  return {
    ...p,
    revisions: revs.sort((a, b) => b.version - a.version).slice(0, 20),
  };
}
export async function publicPage(slug: string) {
  const [p] = await rows("pages", "slug", slug);
  return p?.status === "published"
    ? {
        slug: p.slug,
        title: p.title,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        blocks: p.published,
      }
    : null;
}
export async function updatePageSeo(
  id: number,
  seoTitle: string | null,
  seoDescription: string | null,
) {
  await update("pages", id, {
    seoTitle,
    seoDescription,
    updatedAt: new Date(),
  });
}
export async function saveDraft(id: number, blocks: unknown[]) {
  await update("pages", id, { draft: blocks, updatedAt: new Date() });
}
export async function publishPage(id: number) {
  await getDb().runTransaction(async (tx) => {
    const ref = getDb().collection("pages").doc(String(id));
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    const p = decode<Page>(snap.data());
    const version = (p.version || 0) + 1;
    const revId = await nextId("page_revisions", tx);
    tx.update(ref, {
      status: "published",
      published: p.draft,
      version,
      updatedAt: new Date(),
    });
    tx.create(getDb().collection("page_revisions").doc(String(revId)), {
      id: revId,
      pageId: id,
      version,
      blocks: p.draft,
      savedAt: new Date(),
    });
  });
}
export async function unpublishPage(id: number) {
  await update("pages", id, {
    status: "draft",
    published: [],
    updatedAt: new Date(),
  });
}
export async function restoreRevision(id: number, version: number) {
  const r = (await rows("page_revisions", "pageId", id)).find(
    (r) => r.version === version,
  );
  if (r) await saveDraft(id, r.blocks);
  return !!r;
}
export async function createPage(title: string, slug: string) {
  return getDb().runTransaction(async (tx) => {
    const ref = getDb().collection("_page_slugs").doc(slug);
    if ((await tx.get(ref)).exists)
      throw new TRPCError({ code: "CONFLICT", message: "Slug vec postoji" });
    const id = await nextId("pages", tx);
    tx.create(getDb().collection("pages").doc(String(id)), {
      id,
      title,
      slug,
      status: "draft",
      draft: [],
      published: [],
      seoTitle: null,
      seoDescription: null,
      updatedAt: new Date(),
    });
    tx.create(ref, { id });
    return id;
  });
}
export async function deletePage(id: number) {
  const p = await row("pages", id);
  for (const r of await rows("page_revisions", "pageId", id))
    await remove("page_revisions", r.id);
  await remove("pages", id);
  if (p) await getDb().collection("_page_slugs").doc(p.slug).delete();
}
export async function renamePage(id: number, title: string) {
  await update("pages", id, { title, updatedAt: new Date() });
}
