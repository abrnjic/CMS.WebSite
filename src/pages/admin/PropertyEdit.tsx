import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { useAdminProperty, useIcalFeeds, useIcalMutations, usePropertyMutations } from '@/hooks/use-data';
import { AMENITIES, images } from '@/data/properties';
import { slugify } from '@/lib/slugify';
import { trpc } from '@/providers/trpc';

// ---------- tipovi forme (isti oblik kao API input) ----------

type PropertyForm = {
  slug: string; name: string; type: 'apartment' | 'house' | 'villa';
  tagline: string; description: string; city: string; region: string; address: string;
  lat: number; lng: number; rating: number; reviewCount: number;
  amenities: string[]; images: string[]; featured: boolean; distanceToSea: number;
};

type PriceRuleForm = { from: string; to: string; pricePerNight: number; label?: string };

type UnitForm = {
  id?: number;
  name: string; maxGuests: number; bedrooms: number; beds: number; bathrooms: number;
  sizeM2: number; basePrice: number; minNights: number; cleaningFee: number; touristTax: number;
  priceRules: PriceRuleForm[]; images: string[];
};

const EMPTY_UNIT: UnitForm = {
  name: 'Nova jedinica', maxGuests: 2, bedrooms: 1, beds: 1, bathrooms: 1,
  sizeM2: 40, basePrice: 100, minNights: 1, cleaningFee: 0, touristTax: 1.5,
  priceRules: [], images: ['int1'],
};

// ---------- mali poljski helperi ----------

const inputCls =
  'mt-1 w-full border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary';
const labelCls = 'font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  );
}

function Num({ value, onChange, step = 1, min }: { value: number; onChange: (n: number) => void; step?: number; min?: number }) {
  return (
    <input
      type="number" step={step} min={min} value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      className={inputCls}
    />
  );
}

function ImagePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const { data: media } = trpc.media.list.useQuery(undefined, { staleTime: 10_000 });
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  const badge = (key: string) => {
    const idx = value.indexOf(key);
    return idx >= 0 ? (
      <span className="absolute left-0 top-0 bg-primary px-1.5 py-0.5 font-mono-label text-[9px] uppercase tracking-wider text-primary-foreground">
        {idx === 0 ? 'Naslovna' : idx + 1}
      </span>
    ) : null;
  };
  const btnCls = (key: string) =>
    `relative border-2 transition-colors ${value.includes(key) ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`;
  return (
    <div>
      {(media ?? []).length > 0 && (
        <>
          <p className="mt-3 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Učitane slike</p>
          <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(media ?? []).map((m) => (
              <button key={m.key} type="button" onClick={() => toggle(m.key)} className={btnCls(m.key)}>
                <img src={`/api/media/${m.key}`} alt={m.name} className="h-16 w-full object-cover" loading="lazy" />
                {badge(m.key)}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="mt-3 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Ugrađene slike</p>
      <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Object.entries(images).map(([key, src]) => (
          <button key={key} type="button" onClick={() => toggle(key)} className={btnCls(key)}>
            <img src={src} alt={key} className="h-16 w-full object-cover" />
            {badge(key)}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Klik za odabir — prva odabrana slika je naslovna. Vlastite slike učitajte pod{' '}
        <Link to="/admin/mediji" className="link-underline-faint">Mediji</Link>.
      </p>
    </div>
  );
}

function PriceRulesEditor({ value, onChange }: { value: PriceRuleForm[]; onChange: (v: PriceRuleForm[]) => void }) {
  const set = (i: number, patch: Partial<PriceRuleForm>) =>
    onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  return (
    <div>
      <div className="mt-2 space-y-2">
        {value.map((r, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_110px_1fr_36px] items-end gap-2">
            <Field label="Od"><input type="date" value={r.from} onChange={(e) => set(i, { from: e.target.value })} className={inputCls} /></Field>
            <Field label="Do"><input type="date" value={r.to} onChange={(e) => set(i, { to: e.target.value })} className={inputCls} /></Field>
            <Field label="€ / noć"><Num value={r.pricePerNight} onChange={(n) => set(i, { pricePerNight: n })} /></Field>
            <Field label="Naziv (opc.)"><input value={r.label ?? ''} onChange={(e) => set(i, { label: e.target.value || undefined })} className={inputCls} placeholder="Sezona" /></Field>
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="border border-destructive/50 px-2 py-2 text-xs text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground">✕</button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, { from: '2027-07-01', to: '2027-08-31', pricePerNight: 150, label: 'Vrhunac sezone' }])}
        className="mt-2 border border-dashed border-border px-3 py-1.5 font-mono-label text-[10px] uppercase tracking-widest transition-colors hover:bg-secondary"
      >
        + Sezonsko pravilo
      </button>
    </div>
  );
}

// ---------- iCal sinkronizacija ----------

function IcalSection({ unitId }: { unitId: number }) {
  const { data: feeds, isLoading } = useIcalFeeds(unitId);
  const mutations = useIcalMutations();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [addErr, setAddErr] = useState('');
  const exportUrl = `${window.location.origin}/api/ical/${unitId}.ics`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard nedostupan */ }
  };

  const add = () => {
    setAddErr('');
    if (!label.trim() || !url.trim()) return;
    mutations.addFeed.mutate(
      { unitId, label: label.trim(), url: url.trim() },
      {
        onSuccess: () => { setLabel(''); setUrl(''); },
        onError: (e) => setAddErr(e.message),
      }
    );
  };

  const sync = () => {
    setSyncMsg('');
    mutations.syncUnit.mutate({ unitId }, {
      onSuccess: (results) => {
        setSyncMsg(
          results
            .map((r) =>
              r.ok && r.stats
                ? `${r.label}: ${r.stats.total} događaja (+${r.stats.added} novih, ${r.stats.updated} izmijenjeno, ${r.stats.cancelled} otkazano)`
                : `${r.label}: ✕ ${r.error ?? 'greška'}`
            )
            .join(' · ') || 'Nema feedova za sinkronizaciju.'
        );
      },
      onError: (e) => setSyncMsg(e.message),
    });
  };

  return (
    <div className="border border-border bg-secondary/20 p-4">
      <p className={labelCls}>iCal sinkronizacija (Airbnb / Booking)</p>

      {/* EXPORT */}
      <div className="mt-3">
        <p className="text-xs text-muted-foreground">
          Izvoz — zalijepite ovaj link u Airbnb/Booking kao „calendar export"; vide samo zauzete datume:
        </p>
        <div className="mt-1 flex gap-2">
          <input readOnly value={exportUrl} onFocus={(e) => e.target.select()}
            className={`${inputCls} font-mono-label text-xs`} />
          <button type="button" onClick={copy}
            className="mt-1 shrink-0 border border-border px-3 font-mono-label text-[10px] uppercase tracking-wider transition-colors hover:bg-secondary">
            {copied ? 'Kopirano ✓' : 'Kopiraj'}
          </button>
        </div>
      </div>

      {/* FEEDOVI */}
      <div className="mt-4">
        <p className="text-xs text-muted-foreground">
          Uvoz — dodajte iCal linkove iz Airbnb/Bookinga; sinkronizacija blokira te datume ovdje:
        </p>
        {isLoading ? (
          <div className="mt-2 h-10 animate-pulse bg-muted" />
        ) : (
          <div className="mt-2 space-y-2">
            {(feeds ?? []).map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-3 border border-border bg-card px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm">{f.label}</p>
                  <p className="truncate font-mono-label text-[10px] text-muted-foreground">
                    {f.url}
                    {f.lastSyncAt && ` · zadnja sync: ${format(f.lastSyncAt, 'd. M. yyyy. HH:mm', { locale: hr })}`}
                  </p>
                  {f.lastError && <p className="text-[11px] text-destructive">✕ {f.lastError}</p>}
                </div>
                <button type="button"
                  onClick={() => {
                    if (confirm(`Ukloniti feed "${f.label}"? Njegove rezervacije bit će otkazane.`)) {
                      mutations.removeFeed.mutate({ id: f.id });
                    }
                  }}
                  className="shrink-0 border border-destructive/50 px-2 py-1 font-mono-label text-[10px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground">
                  Ukloni
                </button>
              </div>
            ))}
            {(feeds ?? []).length === 0 && (
              <p className="text-[11px] text-muted-foreground">Nema vanjskih kalendara.</p>
            )}
          </div>
        )}

        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[160px_1fr_auto]">
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Naziv (npr. Airbnb)"
            className="border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.airbnb.com/calendar/ical/…"
            className="border border-input bg-card px-3 py-2 font-mono-label text-xs outline-none focus:border-primary" />
          <button type="button" onClick={add} disabled={!label.trim() || !url.trim() || mutations.addFeed.isPending}
            className="border border-foreground px-4 py-2 font-mono-label text-[10px] uppercase tracking-widest transition-colors hover:bg-foreground hover:text-background disabled:opacity-30">
            + Dodaj
          </button>
        </div>
        {addErr && <p className="mt-1 text-[11px] text-destructive">{addErr}</p>}

        {(feeds ?? []).length > 0 && (
          <div className="mt-3 flex items-center gap-3">
            <button type="button" onClick={sync} disabled={mutations.syncUnit.isPending}
              className="bg-primary px-4 py-2 font-mono-label text-[10px] uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30">
              {mutations.syncUnit.isPending ? 'Sinkroniziram…' : '⟳ Sinkroniziraj sada'}
            </button>
            {syncMsg && <p className="text-[11px] text-muted-foreground">{syncMsg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- kartica jedinice ----------

function UnitCard({ unit, propertyId }: { unit: UnitForm; propertyId: number }) {
  const [form, setForm] = useState<UnitForm>(unit);
  const [open, setOpen] = useState(unit.id == null);
  const [msg, setMsg] = useState('');
  const mutations = usePropertyMutations();
  const set = <K extends keyof UnitForm>(k: K, v: UnitForm[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = () => {
    setMsg('');
    const { id, ...data } = form;
    if (id == null) {
      mutations.createUnit.mutate({ propertyId, data }, {
        onSuccess: (r) => { setForm((f) => ({ ...f, id: r.id })); setMsg('Spremljeno ✓'); },
        onError: (e) => setMsg(e.message),
      });
    } else {
      mutations.updateUnit.mutate({ id, propertyId, data }, {
        onSuccess: () => setMsg('Spremljeno ✓'),
        onError: (e) => setMsg(e.message),
      });
    }
  };

  return (
    <div className="border border-border bg-card">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-secondary/50">
        <span className="font-display">{form.name}</span>
        <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
          {form.basePrice} €/noć · {form.maxGuests} gosta · {open ? '▲ zatvori' : '▼ uredi'}
        </span>
      </button>
      {open && (
        <div className="space-y-5 border-t border-border px-5 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Naziv jedinice"><input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} /></Field>
            <Field label="Maks. gostiju"><Num value={form.maxGuests} onChange={(n) => set('maxGuests', n)} min={1} /></Field>
            <Field label="Spavaće sobe"><Num value={form.bedrooms} onChange={(n) => set('bedrooms', n)} min={0} /></Field>
            <Field label="Kreveti"><Num value={form.beds} onChange={(n) => set('beds', n)} min={1} /></Field>
            <Field label="Kupaonice"><Num value={form.bathrooms} onChange={(n) => set('bathrooms', n)} min={0} /></Field>
            <Field label="Površina (m²)"><Num value={form.sizeM2} onChange={(n) => set('sizeM2', n)} min={5} /></Field>
            <Field label="Osnovna cijena (€/noć)"><Num value={form.basePrice} onChange={(n) => set('basePrice', n)} min={1} /></Field>
            <Field label="Min. noći"><Num value={form.minNights} onChange={(n) => set('minNights', n)} min={1} /></Field>
            <Field label="Čišćenje (€)"><Num value={form.cleaningFee} onChange={(n) => set('cleaningFee', n)} step={0.5} /></Field>
            <Field label="Bor. pristojba (€/dan/os.)"><Num value={form.touristTax} onChange={(n) => set('touristTax', n)} step={0.1} /></Field>
          </div>
          <div>
            <span className={labelCls}>Sezonske cijene</span>
            <PriceRulesEditor value={form.priceRules} onChange={(v) => set('priceRules', v)} />
          </div>
          <div>
            <span className={labelCls}>Slike jedinice</span>
            <ImagePicker value={form.images} onChange={(v) => set('images', v)} />
          </div>
          {form.id != null && <IcalSection unitId={form.id} />}
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <button type="button" onClick={save} disabled={mutations.createUnit.isPending || mutations.updateUnit.isPending}
              className="bg-primary px-5 py-2 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30">
              {form.id == null ? 'Kreiraj jedinicu' : 'Spremi jedinicu'}
            </button>
            {form.id != null && (
              <button type="button"
                onClick={() => {
                  if (confirm(`Obrisati jedinicu "${form.name}"?`)) {
                    mutations.deleteUnit.mutate({ id: form.id! }, {
                      onError: (e) => alert(e.message),
                    });
                  }
                }}
                className="border border-destructive/50 px-4 py-2 font-mono-label text-xs uppercase tracking-widest text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground">
                Obriši
              </button>
            )}
            {msg && <span className={`text-xs ${msg.includes('✓') ? 'text-success' : 'text-destructive'}`}>{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- glavna stranica ----------

export default function AdminPropertyEdit() {
  const { id } = useParams<{ id: string }>();
  const propId = Number(id);
  const { data, isLoading, error } = useAdminProperty(propId);
  const mutations = usePropertyMutations();
  const [form, setForm] = useState<PropertyForm | null>(null);
  const [units, setUnits] = useState<UnitForm[]>([]);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!data) return;
    const { units: us, ...p } = data;
    // formu objekta punimo samo na prvom ucitavanju (ne brisati nespremljene izmjene)
    if (loadedFor !== data.id) {
      setForm({ ...p });
      setLoadedFor(data.id);
    }
    // jedinice uvijek sinkroniziraj sa servera, ali zadrzi nespremljene nove kartice
    setUnits((prev) => [...us.map((u) => ({ ...u })), ...prev.filter((u) => u.id == null)]);
  }, [data, loadedFor]);

  if (isLoading) return <div className="mx-auto max-w-[1000px] px-8 pb-20"><div className="mt-8 h-40 animate-pulse bg-muted" /></div>;
  if (error || !form) return <div className="mx-auto max-w-[1000px] px-8 pb-20"><p className="mt-8 text-sm text-destructive">Objekt nije pronađen.</p></div>;

  const set = <K extends keyof PropertyForm>(k: K, v: PropertyForm[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = () => {
    if (!form) return;
    setMsg('');
    mutations.update.mutate({ id: propId, data: form }, {
      onSuccess: () => setMsg('Spremljeno ✓'),
      onError: (e) => setMsg(e.message === 'slug-taken' ? 'Slug je već zauzet — odaberite drugi.' : e.message),
    });
  };

  return (
    <div className="mx-auto max-w-[1000px] px-8 pb-20">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <Link to="/admin/objekti" className="link-underline-faint text-sm text-muted-foreground">← Svi objekti</Link>
          <h1 className="mt-2 font-display text-3xl">{form.name}</h1>
          <p className="mt-1 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
            /smjestaj/{form.slug}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-xs ${msg.includes('✓') ? 'text-success' : 'text-destructive'}`}>{msg}</span>}
          <button onClick={save} disabled={mutations.update.isPending}
            className="bg-primary px-6 py-2.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30">
            Spremi objekt
          </button>
        </div>
      </div>

      {/* OSNOVNO */}
      <section className="mt-8 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Osnovno</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Naziv">
            <input value={form.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
          </Field>
          <Field label="Slug (URL)">
            <div className="flex gap-2">
              <input value={form.slug} onChange={(e) => set('slug', slugify(e.target.value))} className={`${inputCls} font-mono-label`} />
              <button type="button" onClick={() => set('slug', slugify(form.name))}
                className="mt-1 shrink-0 border border-border px-2 font-mono-label text-[10px] uppercase tracking-wider hover:bg-secondary">
                Iz naziva
              </button>
            </div>
          </Field>
          <Field label="Tip">
            <select value={form.type} onChange={(e) => set('type', e.target.value as PropertyForm['type'])} className={inputCls}>
              <option value="apartment">Apartman</option>
              <option value="house">Kuća</option>
              <option value="villa">Vila</option>
            </select>
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Kratki opis (tagline)">
            <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} className={inputCls} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Opis">
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className={inputCls} />
          </Field>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
          Istaknuti objekt (prikazuje se na naslovnici)
        </label>
      </section>

      {/* LOKACIJA */}
      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Lokacija</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Grad"><input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputCls} /></Field>
          <Field label="Regija"><input value={form.region} onChange={(e) => set('region', e.target.value)} className={inputCls} /></Field>
          <Field label="Adresa"><input value={form.address} onChange={(e) => set('address', e.target.value)} className={inputCls} /></Field>
          <Field label="Širina (lat)"><Num value={form.lat} onChange={(n) => set('lat', n)} step={0.0001} /></Field>
          <Field label="Dužina (lng)"><Num value={form.lng} onChange={(n) => set('lng', n)} step={0.0001} /></Field>
          <Field label="Udaljenost do mora (m)"><Num value={form.distanceToSea} onChange={(n) => set('distanceToSea', n)} min={0} /></Field>
        </div>
      </section>

      {/* OCJENA */}
      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Ocjena</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Ocjena (0–5)"><Num value={form.rating} onChange={(n) => set('rating', Math.min(5, Math.max(0, n)))} step={0.1} /></Field>
          <Field label="Broj recenzija"><Num value={form.reviewCount} onChange={(n) => set('reviewCount', n)} min={0} /></Field>
        </div>
      </section>

      {/* SADRŽAJI */}
      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Sadržaji</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {AMENITIES.map((a) => (
            <label key={a.key} className="flex items-center gap-2 border border-border px-3 py-2 text-sm transition-colors hover:bg-secondary/50">
              <input
                type="checkbox"
                checked={form.amenities.includes(a.key)}
                onChange={(e) =>
                  set('amenities', e.target.checked ? [...form.amenities, a.key] : form.amenities.filter((k) => k !== a.key))
                }
              />
              {a.label}
            </label>
          ))}
        </div>
      </section>

      {/* SLIKE */}
      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Slike objekta</h2>
        <ImagePicker value={form.images} onChange={(v) => set('images', v)} />
      </section>

      {/* JEDINICE */}
      <section className="mt-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-xl">Jedinice</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Svaka jedinica ima svoj kalendar, cijene i rezervacije. Svaku jedinicu spremate zasebno.
            </p>
          </div>
          <button type="button" onClick={() => setUnits((u) => [...u, { ...EMPTY_UNIT }])}
            className="border border-dashed border-border px-4 py-2 font-mono-label text-[10px] uppercase tracking-widest transition-colors hover:bg-secondary">
            + Nova jedinica
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {units.map((u, i) => (
            <UnitCard key={u.id ?? `new-${i}`} unit={u} propertyId={propId} />
          ))}
          {units.length === 0 && (
            <p className="border border-dashed border-border px-5 py-8 text-center text-sm text-muted-foreground">
              Objekt nema jedinica — bez barem jedne ne može primati rezervacije.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
