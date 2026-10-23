import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { trpc } from '@/providers/trpc';
import { images } from '@/data/properties';

export default function AdminSeo() {
  const { data, isLoading } = trpc.settings.getAll.useQuery(undefined, { staleTime: 5_000 });
  const { data: media } = trpc.media.list.useQuery(undefined, { staleTime: 10_000 });
  const utils = trpc.useUtils();
  const setMutation = trpc.settings.set.useMutation();

  const [siteName, setSiteName] = useState('');
  const [description, setDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactCity, setContactCity] = useState('');
  const [footerTagline, setFooterTagline] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (data) {
      setSiteName(data.siteName ?? '');
      setDescription(data.seoDescription ?? '');
      setOgImage(data.seoOgImage ?? '');
      setContactEmail(data.contactEmail ?? '');
      setContactPhone(data.contactPhone ?? '');
      setContactCity(data.contactCity ?? '');
      setFooterTagline(data.footerTagline ?? '');
    }
  }, [data]);

  const save = async () => {
    setMsg('');
    try {
      await setMutation.mutateAsync({ key: 'siteName', value: siteName.trim() || 'Adriatic Stays' });
      await setMutation.mutateAsync({ key: 'seoDescription', value: description.trim() });
      await setMutation.mutateAsync({ key: 'seoOgImage', value: ogImage });
      await setMutation.mutateAsync({ key: 'contactEmail', value: contactEmail.trim() });
      await setMutation.mutateAsync({ key: 'contactPhone', value: contactPhone.trim() });
      await setMutation.mutateAsync({ key: 'contactCity', value: contactCity.trim() });
      await setMutation.mutateAsync({ key: 'footerTagline', value: footerTagline.trim() });
      utils.settings.getAll.invalidate();
      setMsg('Spremljeno ✓');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Greška pri spremanju');
    }
  };

  if (isLoading) {
    return <div className="mx-auto max-w-[800px] px-8 pb-20"><div className="mt-8 h-40 animate-pulse bg-muted" /></div>;
  }

  const ogPreview = ogImage ? (images[ogImage] ?? `/api/media/${ogImage}`) : null;

  return (
    <div className="mx-auto max-w-[800px] px-8 pb-20">
      <div className="flex items-end justify-between border-b border-border pb-6">
        <div>
          <h1 className="font-display text-3xl">SEO postavke</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zadane vrijednosti za cijeli sajt. Svaka CMS stranica može imati svoj naslov i opis (page builder → SEO),
            a objekti ih izvode automatski iz svojih podataka.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-xs ${msg.includes('✓') ? 'text-success' : 'text-destructive'}`}>{msg}</span>}
          <button onClick={save} disabled={setMutation.isPending}
            className="bg-primary px-6 py-2.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-30">
            Spremi
          </button>
        </div>
      </div>

      <section className="mt-8 space-y-5 border border-border bg-card p-6">
        <label className="block">
          <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Naziv sajta</span>
          <input value={siteName} onChange={(e) => setSiteName(e.target.value)} maxLength={255}
            placeholder="Adriatic Stays"
            className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <p className="mt-1 text-[11px] text-muted-foreground">Koristi se kao nastavak u naslovima: „… | {siteName || 'Adriatic Stays'}"</p>
        </label>

        <label className="block">
          <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            Zadani opis ({description.length}/500)
          </span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3}
            placeholder="Kratki opis sajta za Google rezultate i dijeljenje linkova…"
            className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Preporuka: 120–160 znakova. Koristi se kad stranica nema vlastiti opis.
          </p>
        </label>

        <div>
          <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            Zadana slika za dijeljenje (Open Graph)
          </span>
          {ogPreview && (
            <div className="mt-2 flex items-center gap-3">
              <img src={ogPreview} alt="OG pregled" className="h-20 w-32 border border-border object-cover" />
              <button onClick={() => setOgImage('')} className="font-mono-label text-[10px] uppercase tracking-wider text-destructive hover:underline">
                Ukloni
              </button>
            </div>
          )}
          <p className="mt-2 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground/70">Učitane slike</p>
          <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {(media ?? []).map((m) => (
              <button key={m.key} type="button" onClick={() => setOgImage(m.key)}
                className={`border-2 transition-colors ${ogImage === m.key ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={`/api/media/${m.key}`} alt={m.name} className="h-14 w-full object-cover" loading="lazy" />
              </button>
            ))}
            {(media ?? []).length === 0 && (
              <p className="col-span-full text-[11px] text-muted-foreground">
                Nema učitanih slika — <Link to="/admin/mediji" className="link-underline-faint">dodajte u Medijima</Link>.
              </p>
            )}
          </div>
          <p className="mt-2 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground/70">Ugrađene slike</p>
          <div className="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-6">
            {Object.entries(images).map(([key, src]) => (
              <button key={key} type="button" onClick={() => setOgImage(key)}
                className={`border-2 transition-colors ${ogImage === key ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                <img src={src} alt={key} className="h-14 w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-5 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Brending i kontakt (podnožje sajta)</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Kontakt email</span>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} maxLength={320}
              placeholder="info@vassajt.hr"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Telefon</span>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} maxLength={64}
              placeholder="+385 21 000 000"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Grad / adresa</span>
            <input value={contactCity} onChange={(e) => setContactCity(e.target.value)} maxLength={128}
              placeholder="Split, Hrvatska"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
        </div>
        <label className="block">
          <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Kratki opis u podnožju</span>
          <textarea value={footerTagline} onChange={(e) => setFooterTagline(e.target.value)} maxLength={500} rows={2}
            placeholder="Pažljivo odabrani smještaj uz Jadran…"
            className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
        </label>
      </section>

      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Tehnički SEO</h2>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>✓ <span className="font-mono-label text-xs">/sitemap.xml</span> — dinamički, uključuje sve objekte i objavljene stranice</li>
          <li>✓ <span className="font-mono-label text-xs">/robots.txt</span> — admin, API i checkout su isključeni iz indeksacije</li>
          <li>✓ Open Graph + Twitter Card tagovi na svakoj stranici</li>
          <li>✓ JSON-LD (LodgingBusiness) na stranicama objekata — adresa, geo, ocjena</li>
          <li>✓ Canonical URL i <span className="font-mono-label text-xs">noindex</span> na privatnim stranicama</li>
        </ul>
      </section>
    </div>
  );
}
