import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { images } from '@/data/properties';
import { imgSrc } from '@/lib/img';
import { PropertyCard } from '@/components/PropertyCard';
import { useProperties } from '@/hooks/use-data';
import type { BlockDef } from './types';

// ============================================================
// Blok registry — svaki blok: polja (za inspektor) + render
// Vecina blokova ima vise modela (props.variant) koji se
// mijenjaju na jedan klik u inspektoru.
// ============================================================

const IMAGE_OPTIONS = Object.keys(images).map((k) => ({ value: k, label: k }));

const v = (p: Record<string, unknown>, fallback: string) => String(p.variant ?? fallback);

/** zajednicko zaglavlje sekcije */
function SectionHead({ kicker, heading, dark }: { kicker?: unknown; heading?: unknown; dark?: boolean }) {
  return (
    <div className="mb-10 border-b border-border pb-6" style={dark ? { borderColor: 'rgba(255,255,255,0.2)' } : undefined}>
      {!!kicker && <p className={`font-mono-label text-xs uppercase tracking-widest ${dark ? 'opacity-60' : 'text-muted-foreground'}`}>{String(kicker)}</p>}
      {!!heading && <h2 className="mt-2 font-display text-3xl md:text-4xl">{String(heading)}</h2>}
    </div>
  );
}

/* ---------- HERO (3 modela) ---------- */
function HeroBlock(p: Record<string, unknown>) {
  const { image, label, title, subtitle } = p;
  const lines = String(title ?? '').split('\n');
  const src = imgSrc(String(image)) ?? images.hero;
  const model = v(p, 'klasicni');
  const Title = (
    <h1 className="font-display text-5xl leading-[1.05] text-white md:text-7xl">
      {lines.map((l, i) => <span key={i}>{l}{i < lines.length - 1 && <br />}</span>)}
    </h1>
  );

  if (model === 'centrirani') {
    return (
      <section className="relative flex h-[92vh] min-h-[560px] items-center justify-center">
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'hsl(var(--hero-overlay) / 0.55)' }} />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {!!label && <p className="mb-6 font-mono-label text-xs uppercase tracking-[0.25em] text-white/85">{String(label)}</p>}
          {Title}
          {!!subtitle && <p className="mx-auto mt-6 max-w-xl text-white/85">{String(subtitle)}</p>}
        </div>
      </section>
    );
  }

  if (model === 'split') {
    return (
      <section className="grid min-h-[92vh] grid-cols-1 lg:grid-cols-2">
        <div className="flex items-end bg-surface-warm px-6 pb-24 pt-32 lg:px-10">
          <div>
            {!!label && <p className="mb-6 font-mono-label text-xs uppercase tracking-[0.25em] text-muted-foreground">{String(label)}</p>}
            <h1 className="font-display text-5xl leading-[1.05] md:text-6xl">
              {lines.map((l, i) => <span key={i}>{l}{i < lines.length - 1 && <br />}</span>)}
            </h1>
            {!!subtitle && <p className="mt-6 max-w-md text-muted-foreground">{String(subtitle)}</p>}
          </div>
        </div>
        <div className="relative min-h-[50vh]">
          <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        </div>
      </section>
    );
  }

  // klasicni (donji desni naslov)
  return (
    <section className="relative flex h-[92vh] min-h-[560px] items-end">
      <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, hsl(var(--hero-overlay) / 0.72) 0%, transparent 55%)' }} />
      {!!label && (
        <div className="absolute left-6 top-24 lg:left-10">
          <p className="font-mono-label text-xs uppercase tracking-[0.25em] text-white/85">{String(label)}</p>
        </div>
      )}
      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-24 lg:px-10">
        <div className="ml-auto max-w-3xl text-right">{Title}</div>
        {!!subtitle && <p className="ml-auto mt-6 max-w-md text-right text-white/85">{String(subtitle)}</p>}
      </div>
    </section>
  );
}

/* ---------- SEARCH BAR (booking-aware, 2 modela) ---------- */
export function SearchBarBlock(p: Record<string, unknown>) {
  const navigate = useNavigate();
  const { data: properties } = useProperties();
  const cities = ['Sve destinacije', ...Array.from(new Set((properties ?? []).map((x) => x.city)))];
  const [city, setCity] = useState(cities[0]);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const model = v(p, 'traka');

  const search = () => {
    const params = new URLSearchParams();
    if (city !== cities[0]) params.set('grad', city);
    if (checkIn) params.set('od', checkIn);
    if (checkOut) params.set('do', checkOut);
    params.set('gosti', String(guests));
    navigate(`/smjestaj?${params.toString()}`);
  };

  const fields = (
    <>
      <label className="block bg-card p-4">
        <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Destinacija</span>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none">
          {cities.map((d) => <option key={d}>{d}</option>)}
        </select>
      </label>
      <label className="block bg-card p-4">
        <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Dolazak</span>
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none" />
      </label>
      <label className="block bg-card p-4">
        <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Odlazak</span>
        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="mt-1 w-full bg-transparent text-sm outline-none" />
      </label>
      <label className="block bg-card p-4">
        <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Gosti</span>
        <input type="number" min={1} max={12} value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="mt-1 w-full bg-transparent text-sm outline-none" />
      </label>
    </>
  );

  if (model === 'plutajuca') {
    return (
      <section className="relative z-10 mx-auto -mt-14 max-w-[1100px] px-6 lg:px-10">
        <div className="grid grid-cols-2 gap-px border border-border bg-border shadow-xl md:grid-cols-5">
          {fields}
          <button onClick={search} className="bg-primary p-4 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:opacity-90">
            Pretrazi →
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-border bg-surface-warm">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
        <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-5">
          {fields}
          <button onClick={search} className="bg-primary p-4 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-colors hover:opacity-90">
            Pretrazi →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- GALERIJA (4 modela + lightbox) ---------- */
function useGalleryImages(props: Record<string, unknown>): string[] {
  const keys = Array.isArray(props.images) ? props.images.map(String) : [];
  return keys.map((k) => imgSrc(k)).filter((x): x is string => !!x);
}

function Lightbox({ list, index, onClose, onNav }: {
  list: string[]; index: number; onClose: () => void; onNav: (i: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNav((index + 1) % list.length);
      if (e.key === 'ArrowLeft') onNav((index - 1 + list.length) % list.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, list.length, onClose, onNav]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4" onClick={onClose} role="dialog" aria-label="Pregled slike">
      <button onClick={onClose} aria-label="Zatvori"
        className="absolute right-5 top-5 border border-white/30 px-3 py-2 font-mono-label text-xs uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-black">
        Zatvori ✕
      </button>
      <button onClick={(e) => { e.stopPropagation(); onNav((index - 1 + list.length) % list.length); }} aria-label="Prethodna"
        className="absolute left-4 top-1/2 -translate-y-1/2 border border-white/30 px-3 py-4 text-xl text-white transition-colors hover:bg-white hover:text-black">
        ←
      </button>
      <img src={list[index]} alt="" onClick={(e) => e.stopPropagation()} className="max-h-[85vh] max-w-[90vw] object-contain" />
      <button onClick={(e) => { e.stopPropagation(); onNav((index + 1) % list.length); }} aria-label="Sljedeca"
        className="absolute right-4 top-1/2 -translate-y-1/2 border border-white/30 px-3 py-4 text-xl text-white transition-colors hover:bg-white hover:text-black">
        →
      </button>
      <p className="absolute bottom-5 left-1/2 -translate-x-1/2 font-mono-label text-xs uppercase tracking-widest text-white/70">
        {index + 1} / {list.length}
      </p>
    </div>
  );
}

function GalleryBlock(props: Record<string, unknown>) {
  const list = useGalleryImages(props);
  const model = v(props, 'masonry');
  const [open, setOpen] = useState<number | null>(null);
  const [slide, setSlide] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  if (list.length === 0) {
    return <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10"><p className="text-sm text-muted-foreground">Galerija: odaberite slike u inspektoru.</p></section>;
  }

  const head = <SectionHead kicker={props.kicker} heading={props.heading} />;
  const box = open !== null && (
    <Lightbox list={list} index={open} onClose={() => setOpen(null)} onNav={setOpen} />
  );

  /* --- model: vodoravna traka (scroll-snap) --- */
  if (model === 'traka') {
    const scrollBy = (dir: number) => stripRef.current?.scrollBy({ left: dir * (stripRef.current.clientWidth * 0.7), behavior: 'smooth' });
    return (
      <section className="py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">{head}</div>
        <div className="relative">
          <div ref={stripRef} className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 lg:px-10" style={{ scrollbarWidth: 'none' }}>
            {list.map((src, i) => (
              <button key={i} onClick={() => setOpen(i)}
                className="group relative h-[420px] w-[80vw] shrink-0 snap-center overflow-hidden sm:w-[480px]">
                <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 font-mono-label text-[10px] uppercase tracking-widest text-white">{i + 1} / {list.length}</span>
              </button>
            ))}
          </div>
          <div className="mx-auto mt-4 flex max-w-[1400px] justify-end gap-2 px-6 lg:px-10">
            <button onClick={() => scrollBy(-1)} aria-label="Lijevo" className="border border-border px-4 py-2 transition-colors hover:bg-foreground hover:text-background">←</button>
            <button onClick={() => scrollBy(1)} aria-label="Desno" className="border border-border px-4 py-2 transition-colors hover:bg-foreground hover:text-background">→</button>
          </div>
        </div>
        {box}
      </section>
    );
  }

  /* --- model: slider (velika slika + minijature) --- */
  if (model === 'slider') {
    const i = Math.min(slide, list.length - 1);
    return (
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
        {head}
        <div className="relative aspect-[16/9] overflow-hidden border border-border">
          <img src={list[i]} alt="" onClick={() => setOpen(i)} className="h-full w-full cursor-zoom-in object-cover" />
          <button onClick={() => setSlide((i - 1 + list.length) % list.length)} aria-label="Prethodna"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 px-3 py-3 text-white transition-colors hover:bg-primary">←</button>
          <button onClick={() => setSlide((i + 1) % list.length)} aria-label="Sljedeca"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 px-3 py-3 text-white transition-colors hover:bg-primary">→</button>
          <span className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 font-mono-label text-[10px] uppercase tracking-widest text-white">{i + 1} / {list.length}</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {list.map((src, ti) => (
            <button key={ti} onClick={() => setSlide(ti)}
              className={`aspect-[4/3] overflow-hidden border ${ti === i ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'}`}>
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
        {box}
      </section>
    );
  }

  /* --- model: bento mreza (prva slika velika) --- */
  if (model === 'mreza') {
    return (
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
        {head}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {list.slice(0, 9).map((src, i) => (
            <button key={i} onClick={() => setOpen(i)}
              className={`group relative overflow-hidden border border-border ${i === 0 ? 'col-span-2 row-span-2 aspect-auto' : 'aspect-square'}`}>
              <img src={src} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
            </button>
          ))}
        </div>
        {list.length > 9 && (
          <button onClick={() => setOpen(9)} className="link-underline-faint mt-4 text-sm">+ jos {list.length - 9} slika →</button>
        )}
        {box}
      </section>
    );
  }

  /* --- model: masonry (zadani) --- */
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
      {head}
      <div className="columns-2 gap-4 md:columns-3 [column-fill:balance]">
        {list.map((src, i) => (
          <button key={i} onClick={() => setOpen(i)} className="group relative mb-4 block w-full break-inside-avoid overflow-hidden border border-border">
            <img src={src} alt="" className="w-full transition-transform duration-500 group-hover:scale-105" />
            <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
          </button>
        ))}
      </div>
      {box}
    </section>
  );
}

/* ---------- RECENZIJE / GOOGLE KARTICE (3 modela) ---------- */
function Stars({ n, size = 'text-sm' }: { n: number; size?: string }) {
  return (
    <span className={`${size} tracking-wider text-primary`} aria-label={`Ocjena ${n} od 5`}>
      {'★'.repeat(n)}{'☆'.repeat(Math.max(0, 5 - n))}
    </span>
  );
}

interface Review { name: string; text: string; rating: number; when: string; }

function useReviews(props: Record<string, unknown>): Review[] {
  return [1, 2, 3, 4, 5, 6]
    .map((i) => ({
      name: String(props[`r${i}name`] ?? ''),
      text: String(props[`r${i}text`] ?? ''),
      rating: Math.min(5, Math.max(1, Number(props[`r${i}rating`]) || 5)),
      when: String(props[`r${i}when`] ?? ''),
    }))
    .filter((r) => r.name || r.text);
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <article className="flex h-full flex-col border border-border bg-card p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-mono-label text-sm text-primary-foreground">
          {r.name.slice(0, 1).toUpperCase() || 'G'}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{r.name}</p>
          {!!r.when && <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">{r.when}</p>}
        </div>
        <span className="ml-auto font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Google</span>
      </div>
      <div className="mt-3"><Stars n={r.rating} /></div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
    </article>
  );
}

function ReviewsBlock(props: Record<string, unknown>) {
  const reviews = useReviews(props);
  const model = v(props, 'kartice');
  const [idx, setIdx] = useState(0);
  const source = String(props.source ?? '');

  if (reviews.length === 0) {
    return <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10"><p className="text-sm text-muted-foreground">Recenzije: unesite barem jednu u inspektoru.</p></section>;
  }

  const badge = !!source && (
    <p className="mb-6 inline-flex items-center gap-2 border border-border bg-card px-4 py-2 text-sm">
      <Stars n={5} /> <span className="font-medium">{source}</span>
    </p>
  );

  /* --- model: izdvojena (veliki citat + strelice) --- */
  if (model === 'izdvojena') {
    const r = reviews[Math.min(idx, reviews.length - 1)];
    return (
      <section className="border-y border-border bg-surface-warm">
        <div className="mx-auto max-w-[900px] px-6 py-24 text-center">
          <SectionHead kicker={props.kicker} heading={props.heading} />
          {badge}
          <Stars n={r.rating} size="text-xl" />
          <blockquote className="mt-6 font-display text-2xl leading-snug md:text-4xl">“{r.text}”</blockquote>
          <p className="mt-6 font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
            {r.name}{r.when ? ` · ${r.when}` : ''}
          </p>
          <div className="mt-8 flex items-center justify-center gap-2">
            <button onClick={() => setIdx((idx - 1 + reviews.length) % reviews.length)} aria-label="Prethodna recenzija"
              className="border border-border px-4 py-2 transition-colors hover:bg-foreground hover:text-background">←</button>
            <span className="px-3 font-mono-label text-xs text-muted-foreground">{idx + 1} / {reviews.length}</span>
            <button onClick={() => setIdx((idx + 1) % reviews.length)} aria-label="Sljedeca recenzija"
              className="border border-border px-4 py-2 transition-colors hover:bg-foreground hover:text-background">→</button>
          </div>
        </div>
      </section>
    );
  }

  /* --- model: pokretna traka (marquee) --- */
  if (model === 'traka') {
    const doubled = [...reviews, ...reviews];
    return (
      <section className="overflow-hidden border-y border-border bg-surface-warm py-20">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <SectionHead kicker={props.kicker} heading={props.heading} />
          {badge}
        </div>
        <div className="group relative" style={{ maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)' }}>
          <div className="flex w-max animate-marquee gap-4 py-2 group-hover:[animation-play-state:paused]">
            {doubled.map((r, i) => (
              <div key={i} className="w-[340px] shrink-0"><ReviewCard r={r} /></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  /* --- model: kartice (zadani grid) --- */
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
      <SectionHead kicker={props.kicker} heading={props.heading} />
      {badge}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => <ReviewCard key={i} r={r} />)}
      </div>
    </section>
  );
}

/* ---------- O NAMA (3 modela) ---------- */
function AboutBlock(p: Record<string, unknown>) {
  const model = v(p, 'split');
  const src = imgSrc(String(p.image)) ?? images.apt7;
  const paragraphs = String(p.body ?? '').split('\n').filter(Boolean);
  const stats = [1, 2, 3]
    .map((i) => ({ num: String(p[`s${i}num`] ?? ''), label: String(p[`s${i}label`] ?? '') }))
    .filter((s) => s.num);

  if (model === 'centrirano') {
    return (
      <section className="mx-auto max-w-[820px] px-6 py-24 text-center">
        {!!p.kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(p.kicker)}</p>}
        {!!p.heading && <h2 className="mt-3 font-display text-4xl md:text-6xl">{String(p.heading)}</h2>}
        <div className="mt-8 space-y-4 text-left leading-relaxed text-muted-foreground md:text-center">
          {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
        </div>
        {!!p.quote && (
          <blockquote className="mx-auto mt-12 border-t border-border pt-10 font-display text-2xl italic leading-snug md:text-3xl">
            “{String(p.quote)}”
            {!!p.quoteAuthor && <footer className="mt-4 font-mono-label text-xs not-italic uppercase tracking-widest text-muted-foreground">— {String(p.quoteAuthor)}</footer>}
          </blockquote>
        )}
      </section>
    );
  }

  if (model === 'statistike') {
    return (
      <section className="border-y border-border bg-surface-warm">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 py-24 lg:grid-cols-2 lg:px-10">
          <div>
            {!!p.kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(p.kicker)}</p>}
            {!!p.heading && <h2 className="mt-3 font-display text-4xl md:text-5xl">{String(p.heading)}</h2>}
            <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
              {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
            </div>
          </div>
          <div className="grid grid-cols-1 content-center gap-px border border-border bg-border sm:grid-cols-3 lg:grid-cols-1">
            {stats.map((s, i) => (
              <div key={i} className="flex items-baseline justify-between bg-card p-8 lg:p-10">
                <span className="font-display text-5xl md:text-6xl">{s.num}</span>
                <span className="max-w-[40%] text-right font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // split (slika lijevo, tekst desno)
  return (
    <section className="mx-auto max-w-[1400px] px-6 py-24 lg:px-10">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden border border-border">
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
          {!!p.quote && (
            <div className="absolute -bottom-8 left-6 max-w-xs border border-border bg-card p-5 shadow-lg">
              <p className="font-display text-lg italic leading-snug">“{String(p.quote)}”</p>
              {!!p.quoteAuthor && <p className="mt-2 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">— {String(p.quoteAuthor)}</p>}
            </div>
          )}
        </div>
        <div className="lg:pl-6">
          {!!p.kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(p.kicker)}</p>}
          {!!p.heading && <h2 className="mt-3 font-display text-4xl md:text-5xl">{String(p.heading)}</h2>}
          <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
            {paragraphs.map((t, i) => <p key={i}>{t}</p>)}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- PROPERTY GRID (booking-aware, 2 modela) ---------- */
function PropertyGridBlock(props: Record<string, unknown>) {
  const { kicker, heading, featuredOnly, count } = props;
  const navigate = useNavigate();
  const { data: properties, isLoading } = useProperties();
  let list = (properties ?? []).filter((p) => (featuredOnly ? p.featured : true));
  list = list.slice(0, Number(count) || 6);
  const wide = v(props, 'mreza') === 'siroka';
  const cols = wide ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4';

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
      <div className="mb-10 flex items-end justify-between border-b border-border pb-6">
        <div>
          {!!kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(kicker)}</p>}
          <h2 className="mt-2 font-display text-3xl md:text-4xl">{String(heading ?? '')}</h2>
        </div>
        <button onClick={() => navigate('/smjestaj')} className="link-underline-faint hidden text-sm md:block">Svi objekti →</button>
      </div>
      {isLoading ? (
        <div className={`grid animate-pulse grid-cols-1 gap-8 ${cols}`}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="aspect-[3/2] bg-muted" />)}
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-8 ${cols}`}>
          {list.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </section>
  );
}

/* ---------- FEATURE STRIP (3 modela) ---------- */
function FeatureStripBlock(props: Record<string, unknown>) {
  const items = [1, 2, 3].map((i) => ({ n: `0${i}`, t: String(props[`t${i}`] ?? ''), d: String(props[`d${i}`] ?? '') }));
  const model = v(props, 'brojevi');

  if (model === 'kartice') {
    return (
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {items.map((f) => (
            <div key={f.n} className="border border-border bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-mono-label text-sm text-primary-foreground">{f.n}</p>
              <h3 className="mt-6 font-display text-2xl">{f.t}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (model === 'minimal') {
    return (
      <section className="border-y border-border">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-3">
          {items.map((f, i) => (
            <div key={f.n} className={`px-8 py-12 text-center ${i > 0 ? 'border-t border-border md:border-l md:border-t-0' : ''}`}>
              <h3 className="font-display text-xl">{f.t}</h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // brojevi (zadani)
  return (
    <section className="border-y border-border bg-surface-warm">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-3">
        {items.map((f, i) => (
          <div key={f.n} className={`p-10 ${i > 0 ? 'border-t border-border md:border-l md:border-t-0' : ''}`}>
            <p className="font-mono-label text-xs text-muted-foreground">{f.n}</p>
            <h3 className="mt-4 font-display text-2xl">{f.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- DESTINATIONS (2 modela) ---------- */
function DestinationsBlock(props: Record<string, unknown>) {
  const { kicker, heading } = props;
  const navigate = useNavigate();
  const { data: properties } = useProperties();
  const all = properties ?? [];
  const cities = Array.from(new Set(all.map((p) => p.city)));
  const model = v(props, 'mreza');

  if (model === 'slike') {
    const pool = [images.apt1, images.apt4, images.apt7, images.apt2, images.apt5, images.apt8];
    return (
      <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
        <SectionHead kicker={kicker} heading={heading} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((c, i) => {
            const count = all.filter((p) => p.city === c).length;
            return (
              <button key={c} onClick={() => navigate(`/smjestaj?grad=${encodeURIComponent(c)}`)}
                className="group relative aspect-[3/4] overflow-hidden text-left">
                <img src={pool[i % pool.length]} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent 55%)' }} />
                <span className="absolute bottom-0 left-0 p-5 text-white">
                  <span className="block font-display text-2xl">{c}</span>
                  <span className="mt-1 block font-mono-label text-[11px] uppercase tracking-widest text-white/80">
                    {count} {count === 1 ? 'objekt' : 'objekta'} →
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-20 lg:px-10">
      <SectionHead kicker={kicker} heading={heading} />
      <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
        {cities.map((c) => {
          const count = all.filter((p) => p.city === c).length;
          return (
            <button key={c} onClick={() => navigate(`/smjestaj?grad=${encodeURIComponent(c)}`)}
              className="group bg-card p-8 text-left transition-colors hover:bg-secondary">
              <p className="font-display text-xl group-hover:text-primary">{c}</p>
              <p className="mt-1 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
                {count} {count === 1 ? 'objekt' : 'objekta'}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- RICH TEXT (3 modela) ---------- */
function RichTextBlock(props: Record<string, unknown>) {
  const { kicker, heading, body } = props;
  const paragraphs = String(body ?? '').split('\n').filter(Boolean);
  const model = v(props, 'klasicni');

  if (model === 'dva-stupca') {
    return (
      <section className="mx-auto max-w-[1200px] px-6 py-20">
        {!!kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(kicker)}</p>}
        {!!heading && <h2 className="mt-2 max-w-xl font-display text-4xl md:text-5xl">{String(heading)}</h2>}
        <div className="mt-8 columns-1 gap-12 space-y-4 leading-relaxed text-muted-foreground md:columns-2">
          {paragraphs.map((p, i) => <p key={i} className="break-inside-avoid">{p}</p>)}
        </div>
      </section>
    );
  }

  if (model === 'citat') {
    return (
      <section className="mx-auto max-w-[900px] px-6 py-24 text-center">
        {!!kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(kicker)}</p>}
        {!!heading && <h2 className="mt-4 font-display text-3xl italic leading-snug md:text-5xl">“{String(heading)}”</h2>}
        <div className="mx-auto mt-8 max-w-xl space-y-4 text-sm leading-relaxed text-muted-foreground">
          {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[900px] px-6 py-20">
      {!!kicker && <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{String(kicker)}</p>}
      {!!heading && <h2 className="mt-2 font-display text-4xl md:text-5xl">{String(heading)}</h2>}
      <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
        {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </section>
  );
}

/* ---------- IMAGE BANNER (3 modela) ---------- */
function ImageBannerBlock(props: Record<string, unknown>) {
  const { image, caption } = props;
  const model = v(props, 'standard');
  const src1 = imgSrc(String(image)) ?? images.hero;
  const src2 = imgSrc(String(props.image2));

  if (model === 'full-bleed') {
    return (
      <section className="relative">
        <div className="h-[70vh] min-h-[420px] overflow-hidden">
          <img src={src1} alt="" className="h-full w-full object-cover" />
        </div>
        {!!caption && (
          <p className="absolute bottom-4 left-1/2 w-full max-w-[1400px] -translate-x-1/2 px-6 font-mono-label text-[11px] uppercase tracking-widest text-white lg:px-10" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>
            {String(caption)}
          </p>
        )}
      </section>
    );
  }

  if (model === 'dvije') {
    return (
      <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="aspect-[4/3] overflow-hidden border border-border"><img src={src1} alt="" className="h-full w-full object-cover" /></div>
          <div className="aspect-[4/3] overflow-hidden border border-border">{src2 && <img src={src2} alt="" className="h-full w-full object-cover" />}</div>
        </div>
        {!!caption && <p className="mt-3 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">{String(caption)}</p>}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-10 lg:px-10">
      <div className="relative aspect-[21/9] overflow-hidden border border-border">
        <img src={src1} alt="" className="h-full w-full object-cover" />
      </div>
      {!!caption && <p className="mt-3 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">{String(caption)}</p>}
    </section>
  );
}

/* ---------- CTA BANNER (3 modela) ---------- */
function CtaBannerBlock(props: Record<string, unknown>) {
  const { title, text, buttonLabel, buttonLink } = props;
  const model = v(props, 'centrirano');
  const Btn = !!buttonLabel && (
    <a href={String(buttonLink ?? '#')}
      className="inline-block border border-current px-6 py-3 font-mono-label text-xs uppercase tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary">
      {String(buttonLabel)}
    </a>
  );

  if (model === 'split') {
    return (
      <section className="border-y border-border bg-surface-warm">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 px-6 py-14 md:flex-row md:items-center lg:px-10">
          <div>
            <h2 className="max-w-xl font-display text-3xl md:text-4xl">{String(title ?? '')}</h2>
            {!!text && <p className="mt-3 max-w-lg text-muted-foreground">{String(text)}</p>}
          </div>
          {Btn}
        </div>
      </section>
    );
  }

  if (model === 'slika') {
    const src = imgSrc(String(props.image)) ?? images.apt3;
    return (
      <section className="relative">
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative mx-auto max-w-[1400px] px-6 py-28 text-center text-white lg:px-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-5xl">{String(title ?? '')}</h2>
          {!!text && <p className="mx-auto mt-4 max-w-xl text-white/80">{String(text)}</p>}
          <div className="mt-8">{Btn}</div>
        </div>
      </section>
    );
  }

  // centrirano (zadano)
  return (
    <section className="border-y border-border bg-surface-deep text-surface-deep-foreground">
      <div className="mx-auto max-w-[1400px] px-6 py-16 text-center lg:px-10">
        <h2 className="mx-auto max-w-2xl font-display text-3xl md:text-4xl">{String(title ?? '')}</h2>
        {!!text && <p className="mx-auto mt-4 max-w-xl opacity-75">{String(text)}</p>}
        <div className="mt-8">{Btn}</div>
      </div>
    </section>
  );
}

/* ---------- SPACER ---------- */
function SpacerBlock({ height }: Record<string, unknown>) {
  return <div style={{ height: Number(height) || 48 }} />;
}

// ============================================================
// REGISTRY
// ============================================================

const DEFAULT_GALLERY = ['apt1', 'int1', 'apt3', 'int2', 'apt5', 'apt7', 'int3', 'apt8'];

const REVIEW_FIELDS = [1, 2, 3, 4, 5, 6].flatMap((i) => [
  { key: `r${i}name`, label: `Recenzija ${i} — ime`, type: 'string' as const },
  { key: `r${i}text`, label: `Recenzija ${i} — tekst`, type: 'textarea' as const },
  { key: `r${i}rating`, label: `Recenzija ${i} — ocjena (1–5)`, type: 'number' as const, min: 1, max: 5 },
  { key: `r${i}when`, label: `Recenzija ${i} — vrijeme (npr. "prije 2 tjedna")`, type: 'string' as const },
]);

export const BLOCKS: BlockDef[] = [
  {
    type: 'hero', label: 'Hero sekcija', category: 'layout',
    description: 'Velika uvodna slika s naslovom i podnaslovom',
    variants: [
      { key: 'klasicni', label: 'Klasicni', description: 'Naslov dolje desno preko slike' },
      { key: 'centrirani', label: 'Centrirani', description: 'Naslov u sredini, tamni prekrivac' },
      { key: 'split', label: 'Split', description: 'Tekst lijevo na pozadini, slika desno' },
    ],
    defaultProps: { variant: 'klasicni', image: 'hero', label: 'Dobrodosli', title: 'Naslov stranice', subtitle: 'Kratki opis ovdje.' },
    fields: [
      { key: 'image', label: 'Pozadinska slika', type: 'image', options: IMAGE_OPTIONS },
      { key: 'label', label: 'Mala labela', type: 'string' },
      { key: 'title', label: 'Naslov (enter = novi red)', type: 'textarea' },
      { key: 'subtitle', label: 'Podnaslov', type: 'textarea' },
    ],
    render: (p) => <HeroBlock {...p} />,
  },
  {
    type: 'search-bar', label: 'Traka za pretragu', category: 'booking',
    description: 'Pretraga smjestaja: destinacija, datumi, gosti',
    variants: [
      { key: 'traka', label: 'Traka', description: 'Puna sirina ispod hero sekcije' },
      { key: 'plutajuca', label: 'Plutajuca kartica', description: 'Preklapa donji rub hero sekcije' },
    ],
    defaultProps: { variant: 'traka' }, fields: [],
    render: (p) => <SearchBarBlock {...p} />,
  },
  {
    type: 'property-grid', label: 'Mreza objekata', category: 'booking',
    description: 'Prikaz objekata iz baze (kartice s cijenama)',
    variants: [
      { key: 'mreza', label: 'Mreza 4 stupca', description: 'Kompaktna mreza kartica' },
      { key: 'siroka', label: 'Siroka 2 stupca', description: 'Vece kartice, vise prostora' },
    ],
    defaultProps: { variant: 'mreza', kicker: 'Izbor', heading: 'Objekti', featuredOnly: false, count: 4 },
    fields: [
      { key: 'kicker', label: 'Mala labela', type: 'string' },
      { key: 'heading', label: 'Naslov', type: 'string' },
      { key: 'featuredOnly', label: 'Samo istaknuti', type: 'boolean' },
      { key: 'count', label: 'Broj objekata', type: 'number', min: 1, max: 8 },
    ],
    render: (p) => <PropertyGridBlock {...p} />,
  },
  {
    type: 'gallery', label: 'Galerija', category: 'sadrzaj',
    description: 'Moderna galerija slika — 4 modela, klik za povecanje',
    variants: [
      { key: 'masonry', label: 'Masonry', description: 'Organski raspored razlicitih visina' },
      { key: 'mreza', label: 'Bento mreza', description: 'Prva slika velika, ostale u mrezi' },
      { key: 'slider', label: 'Slider', description: 'Velika slika, strelice i minijature' },
      { key: 'traka', label: 'Vodoravna traka', description: 'Pomicni red velikih slika' },
    ],
    defaultProps: {
      variant: 'masonry', kicker: 'Dojmovi', heading: 'Galerija', images: DEFAULT_GALLERY,
    },
    fields: [
      { key: 'kicker', label: 'Mala labela', type: 'string' },
      { key: 'heading', label: 'Naslov', type: 'string' },
      { key: 'images', label: 'Slike (odaberi vise)', type: 'images', options: IMAGE_OPTIONS },
    ],
    render: (p) => <GalleryBlock {...p} />,
  },
  {
    type: 'reviews', label: 'Recenzije (Google)', category: 'sadrzaj',
    description: 'Google kartice s ocjenama — 3 modela prikaza',
    variants: [
      { key: 'kartice', label: 'Kartice', description: 'Mreza Google kartica sa zvjezdicama' },
      { key: 'traka', label: 'Pokretna traka', description: 'Automatsko pomicanje, pauza na hover' },
      { key: 'izdvojena', label: 'Izdvojena', description: 'Veliki citat sa strelicama' },
    ],
    defaultProps: {
      variant: 'kartice', kicker: 'Sto kazu gosti', heading: 'Recenzije', source: '4.9 na Googleu',
      r1name: 'Ivana K.', r1text: 'Savrsena lokacija, cisto i uredno. Rezervacija je prosla bez ijednog problema.', r1rating: 5, r1when: 'prije 2 tjedna',
      r2name: 'Marko P.', r2text: 'Kalendar dostupnosti je tocno prikazao slobodne termine — nikakvih iznenadjenja.', r2rating: 5, r2when: 'prije mjesec dana',
      r3name: 'Sara M.', r3text: 'Vrlo profesionalna komunikacija s domacinom. Preporucujem svima!', r3rating: 4, r3when: 'prije 2 mjeseca',
    },
    fields: [
      { key: 'kicker', label: 'Mala labela', type: 'string' },
      { key: 'heading', label: 'Naslov', type: 'string' },
      { key: 'source', label: 'Izvor (npr. "4.9 na Googleu")', type: 'string' },
      ...REVIEW_FIELDS,
    ],
    render: (p) => <ReviewsBlock {...p} />,
  },
  {
    type: 'about', label: 'O nama', category: 'sadrzaj',
    description: 'Predstavljanje tima / prica — 3 modela',
    variants: [
      { key: 'split', label: 'Split sa slikom', description: 'Slika lijevo s citatom, tekst desno' },
      { key: 'centrirano', label: 'Centrirano', description: 'Veliki naslov i tekst u sredini' },
      { key: 'statistike', label: 'Statistike', description: 'Tekst lijevo, veliki brojevi desno' },
    ],
    defaultProps: {
      variant: 'split', kicker: 'Nas tim', heading: 'O nama',
      body: 'Kratak opis vase price.\nDrugi odlomak ovdje.',
      image: 'apt7', quote: 'Radimo ono sto volimo.', quoteAuthor: 'Osnivac',
      s1num: '120+', s1label: 'objekata', s2num: '4.9', s2label: 'prosjecna ocjena', s3num: '10k', s3label: 'gostiju godisnje',
    },
    fields: [
      { key: 'kicker', label: 'Mala labela', type: 'string' },
      { key: 'heading', label: 'Naslov', type: 'string' },
      { key: 'body', label: 'Tekst (prazan red = novi odlomak)', type: 'textarea' },
      { key: 'image', label: 'Slika (split model)', type: 'image', options: IMAGE_OPTIONS },
      { key: 'quote', label: 'Citat', type: 'string' },
      { key: 'quoteAuthor', label: 'Autor citata', type: 'string' },
      ...[1, 2, 3].flatMap((i) => [
        { key: `s${i}num`, label: `Statistika ${i} — broj`, type: 'string' as const },
        { key: `s${i}label`, label: `Statistika ${i} — opis`, type: 'string' as const },
      ]),
    ],
    render: (p) => <AboutBlock {...p} />,
  },
  {
    type: 'feature-strip', label: 'Traka znacajki', category: 'sadrzaj',
    description: 'Tri stupca — prednosti sustava',
    variants: [
      { key: 'brojevi', label: 'Brojevi', description: 'Numerirani stupci na toploj pozadini' },
      { key: 'kartice', label: 'Kartice', description: 'Kartice s krugom, digni se na hover' },
      { key: 'minimal', label: 'Minimal', description: 'Cist tekst bez pozadine' },
    ],
    defaultProps: { variant: 'brojevi', t1: 'Znacajka 1', d1: 'Opis…', t2: 'Znacajka 2', d2: 'Opis…', t3: 'Znacajka 3', d3: 'Opis…' },
    fields: [1, 2, 3].flatMap((i) => [
      { key: `t${i}`, label: `Stupac ${i} — naslov`, type: 'string' as const },
      { key: `d${i}`, label: `Stupac ${i} — tekst`, type: 'textarea' as const },
    ]),
    render: (p) => <FeatureStripBlock {...p} />,
  },
  {
    type: 'destinations', label: 'Destinacije', category: 'booking',
    description: 'Mreza destinacija s brojem objekata',
    variants: [
      { key: 'mreza', label: 'Tekstualna mreza', description: 'Ciste plocice s imenima gradova' },
      { key: 'slike', label: 'Kartice sa slikom', description: 'Fotografije s prekrivacem i imenom' },
    ],
    defaultProps: { variant: 'mreza', kicker: 'Gdje dalje', heading: 'Destinacije' },
    fields: [
      { key: 'kicker', label: 'Mala labela', type: 'string' },
      { key: 'heading', label: 'Naslov', type: 'string' },
    ],
    render: (p) => <DestinationsBlock {...p} />,
  },
  {
    type: 'rich-text', label: 'Tekst', category: 'sadrzaj',
    description: 'Naslov i slobodan tekst (prazan red = novi odlomak)',
    variants: [
      { key: 'klasicni', label: 'Klasicni', description: 'Uski stupac teksta, lijevo poravnat' },
      { key: 'dva-stupca', label: 'Dva stupca', description: 'Tekst u dva stupca, novinski stil' },
      { key: 'citat', label: 'Citat', description: 'Naslov kao veliki kurzivni citat' },
    ],
    defaultProps: { variant: 'klasicni', kicker: '', heading: 'Naslov', body: 'Tekst ovdje.' },
    fields: [
      { key: 'kicker', label: 'Mala labela', type: 'string' },
      { key: 'heading', label: 'Naslov', type: 'string' },
      { key: 'body', label: 'Tekst', type: 'textarea' },
    ],
    render: (p) => <RichTextBlock {...p} />,
  },
  {
    type: 'image-banner', label: 'Slika (banner)', category: 'sadrzaj',
    description: 'Siroka slika s opcionalnim opisom',
    variants: [
      { key: 'standard', label: 'Standard', description: 'Siroki omjer 21:9 u okviru' },
      { key: 'full-bleed', label: 'Preko cijele sirine', description: 'Visoka slika od ruba do ruba' },
      { key: 'dvije', label: 'Dvije slike', description: 'Par slika jedna do druge' },
    ],
    defaultProps: { variant: 'standard', image: 'apt3', image2: 'int1', caption: '' },
    fields: [
      { key: 'image', label: 'Slika', type: 'image', options: IMAGE_OPTIONS },
      { key: 'image2', label: 'Druga slika (model "dvije")', type: 'image', options: IMAGE_OPTIONS },
      { key: 'caption', label: 'Opis ispod slike', type: 'string' },
    ],
    render: (p) => <ImageBannerBlock {...p} />,
  },
  {
    type: 'cta-banner', label: 'Poziv na akciju', category: 'sadrzaj',
    description: 'Traka s naslovom i gumbom',
    variants: [
      { key: 'centrirano', label: 'Tamna traka', description: 'Centrirano na tamnoj pozadini' },
      { key: 'split', label: 'Split', description: 'Tekst lijevo, gumb desno, svijetlo' },
      { key: 'slika', label: 'Pozadinska slika', description: 'Tekst preko fotografije' },
    ],
    defaultProps: { variant: 'centrirano', title: 'Poziv na akciju', text: '', buttonLabel: 'Saznaj vise', buttonLink: '#', image: 'apt3' },
    fields: [
      { key: 'title', label: 'Naslov', type: 'string' },
      { key: 'text', label: 'Tekst', type: 'textarea' },
      { key: 'buttonLabel', label: 'Tekst gumba', type: 'string' },
      { key: 'buttonLink', label: 'Link gumba', type: 'string' },
      { key: 'image', label: 'Pozadinska slika (model "slika")', type: 'image', options: IMAGE_OPTIONS },
    ],
    render: (p) => <CtaBannerBlock {...p} />,
  },
  {
    type: 'spacer', label: 'Razmak', category: 'layout',
    description: 'Prazan prostor izmedju blokova',
    defaultProps: { height: 48 },
    fields: [{ key: 'height', label: 'Visina (px)', type: 'number', min: 8, max: 200 }],
    render: (p) => <SpacerBlock {...p} />,
  },
];

export const blockDef = (type: string) => BLOCKS.find((b) => b.type === type);
