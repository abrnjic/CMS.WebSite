import { useNavigate } from 'react-router';
import { usePublicPage } from '@/cms/store';
import { BlockRenderer } from '@/cms/BlockRenderer';
import { useSeo, useSiteSettings } from '@/hooks/use-seo';

/** Javna stranica renderirana iz CMS sadrzaja (objavljena verzija, iz baze) */
export default function CmsPage({ slug }: { slug: string }) {
  const { page, isLoading } = usePublicPage(slug);
  const navigate = useNavigate();
  const { siteName, defaultDescription } = useSiteSettings();

  useSeo({
    title: page ? (page.seoTitle || `${page.title} | ${siteName}`) : undefined,
    description: page?.seoDescription || defaultDescription || undefined,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] animate-pulse px-6 pb-20 pt-40">
        <div className="h-10 w-64 bg-muted" />
        <div className="mt-6 h-4 w-96 bg-muted" />
      </div>
    );
  }

  if (!page || page.blocks.length === 0) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-40 text-center">
        <p className="font-display text-3xl">Stranica nije objavljena</p>
        <button onClick={() => navigate('/')} className="link-underline-faint mt-4 text-sm">← Naslovnica</button>
      </div>
    );
  }

  return <BlockRenderer blocks={page.blocks} />;
}
