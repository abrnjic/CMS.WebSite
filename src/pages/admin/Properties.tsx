import { useNavigate } from 'react-router';
import { useAdminProperties, usePropertyMutations } from '@/hooks/use-data';
import { imgSrc } from '@/lib/img';

const TYPE_LABEL: Record<string, string> = {
  apartment: 'Apartman',
  house: 'Kuća',
  villa: 'Vila',
};

export default function AdminProperties() {
  const { data: props, isLoading, error } = useAdminProperties();
  const mutations = usePropertyMutations();
  const navigate = useNavigate();

  const createNew = () => {
    mutations.create.mutate(
      {
        slug: `novi-objekt-${Date.now().toString(36)}`,
        name: 'Novi objekt',
        type: 'apartment',
        tagline: 'Kratki opis objekta',
        description: 'Opišite objekt — lokacija, sadržaj, što ga čini posebnim.',
        city: 'Split',
        region: 'Splitsko-dalmatinska',
        address: 'Adresa 1',
        lat: 43.5,
        lng: 16.44,
        rating: 5,
        reviewCount: 0,
        amenities: ['wifi'],
        images: ['apt1'],
        featured: false,
        distanceToSea: 100,
      },
      { onSuccess: (id) => navigate(`/admin/objekti/${id}`) }
    );
  };

  return (
    <div className="mx-auto max-w-[1000px] px-8 pb-20">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-3xl">Objekti</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Apartmani, kuće i vile — sve što se vidi na javnom sajtu dolazi odavde.
          </p>
        </div>
        <button
          onClick={createNew}
          disabled={mutations.create.isPending}
          className="bg-primary px-5 py-2.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          + Novi objekt
        </button>
      </div>

      {isLoading ? (
        <div className="mt-8 animate-pulse space-y-px">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted" />)}
        </div>
      ) : error ? (
        <p className="mt-8 text-sm text-destructive">Greška pri učitavanju objekata.</p>
      ) : (
        <div className="mt-8 space-y-px border border-border bg-border">
          {(props ?? []).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 bg-card px-5 py-4">
              <div className="flex min-w-0 items-center gap-4">
                {imgSrc(p.images[0]) && (
                  <img src={imgSrc(p.images[0])} alt="" className="h-14 w-20 shrink-0 object-cover" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-lg">
                    {p.name}
                    {p.featured && <span className="ml-2 font-mono-label text-[10px] uppercase tracking-widest text-primary">★ Istaknuto</span>}
                  </p>
                  <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
                    {TYPE_LABEL[p.type] ?? p.type} · {p.city} · {p.units.length}{' '}
                    {p.units.length === 1 ? 'jedinica' : 'jedinice/i'} · {p.bookingCount} rezervacija
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  onClick={() => window.open(`/smjestaj/${p.slug}`, '_blank')}
                  className="border border-border px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-secondary"
                >
                  Pregled
                </button>
                <button
                  onClick={() => navigate(`/admin/objekti/${p.id}`)}
                  className="border border-foreground px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
                >
                  Uredi
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Obrisati objekt "${p.name}" i sve njegove jedinice?`)) {
                      mutations.delete.mutate(
                        { id: p.id },
                        { onError: (e) => alert(e.message) }
                      );
                    }
                  }}
                  className="border border-destructive/50 px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                >
                  Obriši
                </button>
              </div>
            </div>
          ))}
          {(props ?? []).length === 0 && (
            <p className="bg-card px-5 py-10 text-center text-sm text-muted-foreground">
              Nema objekata — kreirajte prvi gore desno.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
