import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useCmsPages, useCmsMutations } from '@/cms/store';

export default function AdminDashboard() {
  const { data: pages, isLoading } = useCmsPages();
  const mutations = useCmsMutations();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');

  const create = () => {
    if (!title.trim() || !slug.trim()) return;
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    mutations.createPage.mutate(
      { title: title.trim(), slug: cleanSlug },
      {
        onSuccess: (id) => {
          setTitle(''); setSlug('');
          navigate(`/admin/stranice/${id}`);
        },
      }
    );
  };

  return (
    <div className="mx-auto max-w-[1000px] px-8 pb-20">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Stranice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Svaka stranica je skup blokova u bazi. Uredjujte skicu, pa je objavite — javni sajt uvijek prikazuje zadnju objavljenu verziju.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 animate-pulse space-y-px">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted" />)}
        </div>
      ) : (
        <div className="mt-8 space-y-px border border-border bg-border">
          {(pages ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 bg-card px-5 py-4">
              <div>
                <p className="font-display text-lg">{p.title}</p>
                <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
                  /{p.slug === 'home' ? '' : `stranica/${p.slug}`} · {((p.draft as unknown[]) ?? []).length} blokova ·{' '}
                  <span className={p.status === 'published' ? 'text-success' : 'text-muted-foreground'}>
                    {p.status === 'published' ? 'Objavljeno' : 'Skica'}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.status === 'published' ? (
                  <>
                    {p.slug !== 'home' && (
                      <button onClick={() => window.open(`/stranica/${p.slug}`, '_blank')}
                        className="border border-border px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-secondary">
                        Pregled
                      </button>
                    )}
                    <button onClick={() => mutations.unpublish.mutate({ id: p.id })} disabled={p.slug === 'home'}
                      className="border border-border px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-secondary disabled:opacity-30">
                      Skini s objave
                    </button>
                  </>
                ) : (
                  <button onClick={() => mutations.publish.mutate({ id: p.id })}
                    className="border border-primary bg-primary px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90">
                    Objavi
                  </button>
                )}
                <button onClick={() => navigate(`/admin/stranice/${p.id}`)}
                  className="border border-foreground px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background">
                  Uredi
                </button>
                {p.slug !== 'home' && (
                  <button onClick={() => { if (confirm(`Obrisati stranicu "${p.title}"?`)) mutations.deletePage.mutate({ id: p.id }); }}
                    className="border border-destructive/50 px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground">
                    Obrisi
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NOVA STRANICA */}
      <div className="mt-10 border border-dashed border-border p-6">
        <p className="font-display text-xl">Nova stranica</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Naslov</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" placeholder="npr. Uvjeti koristenja" />
          </label>
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Slug (URL)</span>
            <input value={slug} onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full border border-input bg-card px-3 py-2 font-mono-label text-sm outline-none focus:border-primary" placeholder="uvjeti-koristenja" />
          </label>
          <div className="flex items-end">
            <button onClick={create} disabled={!title.trim() || !slug.trim() || mutations.createPage.isPending}
              className="w-full bg-primary px-4 py-2.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30">
              + Kreiraj i uredi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
