import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { AMENITIES } from '@/data/properties';
import { PropertyCard } from '@/components/PropertyCard';
import { useProperties, useBookedRanges } from '@/hooks/use-data';
import { useSeo, useSiteSettings } from '@/hooks/use-seo';
import { rangesOverlap } from '@/lib/pricing';

type SortKey = 'preporuka' | 'cijena-uzlazno' | 'cijena-silazno' | 'ocjena';

export default function PropertiesPage() {
  const [params, setParams] = useSearchParams();
  const { data: properties, isLoading } = useProperties();
  const { data: ranges } = useBookedRanges();
  const { siteName } = useSiteSettings();

  useSeo({
    title: `Smještaj | ${siteName}`,
    description: 'Pretražite apartmane, kuće i vile duž Jadrana — filtrirajte po destinaciji, datumu, cijeni i sadržajima.',
  });

  const [types, setTypes] = useState<string[]>([]);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [sort, setSort] = useState<SortKey>('preporuka');
  const [seaOnly, setSeaOnly] = useState(false);

  const city = params.get('grad') ?? '';
  const from = params.get('od') ?? '';
  const to = params.get('do') ?? '';
  const guests = Number(params.get('gosti') ?? '1');

  const results = useMemo(() => {
    if (!properties) return [];
    let list = properties.filter((p) => {
      if (city && p.city !== city) return false;
      if (types.length && !types.includes(p.type)) return false;
      if (seaOnly && p.distanceToSea > 500) return false;
      if (amenities.length && !amenities.every((a) => p.amenities.includes(a))) return false;
      const matchingUnits = p.units.filter((u) => {
        if (u.maxGuests < guests) return false;
        if (u.basePrice > maxPrice) return false;
        if (from && to && to > from) {
          const nights = differenceInCalendarDays(parseISO(to), parseISO(from));
          if (nights < u.minNights) return false;
          const unitRanges = (ranges ?? []).filter((r) => r.unitId === u.id);
          if (unitRanges.some((r) => rangesOverlap(from, to, r.checkIn, r.checkOut))) return false;
        }
        return true;
      });
      return matchingUnits.length > 0;
    });

    const minP = (p: (typeof properties)[number]) => Math.min(...p.units.map((u) => u.basePrice));
    switch (sort) {
      case 'cijena-uzlazno': list = [...list].sort((a, b) => minP(a) - minP(b)); break;
      case 'cijena-silazno': list = [...list].sort((a, b) => minP(b) - minP(a)); break;
      case 'ocjena': list = [...list].sort((a, b) => b.rating - a.rating); break;
      default: list = [...list].sort((a, b) => Number(b.featured) - Number(a.featured));
    }
    return list;
  }, [properties, ranges, city, types, amenities, maxPrice, seaOnly, sort, guests, from, to]);

  const toggle = (arr: string[], v: string, set: (x: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 lg:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
            {isLoading ? 'Ucitavanje…' : `${results.length} ${results.length === 1 ? 'objekt' : 'objekata'}`}
          </p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Smjestaj</h1>
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="border border-border bg-card px-3 py-2 text-sm outline-none"
        >
          <option value="preporuka">Preporuceno</option>
          <option value="cijena-uzlazno">Cijena: niza prema visoj</option>
          <option value="cijena-silazno">Cijena: visa prema nizoj</option>
          <option value="ocjena">Najbolje ocijenjeno</option>
        </select>
      </div>

      <div className="flex gap-10">
        {/* FILTRI */}
        <aside className="hidden w-[235px] shrink-0 md:block">
          <div className="sticky top-24 space-y-8">
            <div>
              <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Destinacija</p>
              <select
                value={city}
                onChange={(e) => setParam('grad', e.target.value)}
                className="mt-2 w-full border border-border bg-card px-3 py-2 text-sm outline-none"
              >
                <option value="">Sve destinacije</option>
                {Array.from(new Set((properties ?? []).map((p) => p.city))).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Dolazak</span>
                <input type="date" value={from} onChange={(e) => setParam('od', e.target.value)}
                  className="mt-2 w-full border border-border bg-card px-2 py-2 text-xs outline-none" />
              </label>
              <label className="block">
                <span className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Odlazak</span>
                <input type="date" value={to} onChange={(e) => setParam('do', e.target.value)}
                  className="mt-2 w-full border border-border bg-card px-2 py-2 text-xs outline-none" />
              </label>
              <label className="col-span-2 block">
                <span className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Gosti</span>
                <input type="number" min={1} max={12} value={guests}
                  onChange={(e) => setParam('gosti', e.target.value)}
                  className="mt-2 w-full border border-border bg-card px-2 py-2 text-sm outline-none" />
              </label>
            </div>

            <div>
              <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Vrsta</p>
              <div className="mt-3 space-y-2">
                {[['apartment', 'Apartman'], ['house', 'Kuca'], ['villa', 'Vila']].map(([k, label]) => (
                  <label key={k} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={types.includes(k)} onChange={() => toggle(types, k, setTypes)}
                      className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
                Max. cijena po noci — <span className="text-foreground">{maxPrice} €</span>
              </p>
              <input type="range" min={50} max={350} step={10} value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-3 w-full accent-[hsl(var(--primary))]" />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={seaOnly} onChange={(e) => setSeaOnly(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--primary))]" />
              Do 500 m od mora
            </label>

            <div>
              <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Sadrzaji</p>
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-2">
                {AMENITIES.map((a) => (
                  <label key={a.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={amenities.includes(a.key)}
                      onChange={() => toggle(amenities, a.key, setAmenities)}
                      className="h-4 w-4 accent-[hsl(var(--primary))]" />
                    {a.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* REZULTATI */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid animate-pulse grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="aspect-[3/2] bg-muted" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="border border-dashed border-border p-16 text-center">
              <p className="font-display text-2xl">Nema rezultata</p>
              <p className="mt-2 text-sm text-muted-foreground">Probajte prosiriti datume ili ukloniti dio filtera.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((p) => <PropertyCard key={p.id} property={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
