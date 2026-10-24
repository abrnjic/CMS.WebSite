import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { amenityLabel } from '@/data/properties';
import { imgSrc } from '@/lib/img';
import { useProperty, useBookedDates, useQuote } from '@/hooks/use-data';
import { useSeo, useSiteSettings } from '@/hooks/use-seo';
import { AvailabilityCalendar } from '@/components/AvailabilityCalendar';
import { eur, toISO } from '@/lib/pricing';

function Gallery({ imgs, name }: { imgs: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden border border-border">
        {imgs.map((key, i) => (
          <img
            key={key + i}
            src={imgSrc(key)}
            alt={`${name} — slika ${i + 1}`}
            className={`gallery-img absolute inset-0 h-full w-full object-cover ${i === active ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        {imgs.map((key, i) => (
          <button
            key={key + i}
            onClick={() => setActive(i)}
            className={`relative aspect-[3/2] w-24 overflow-hidden border transition-opacity ${
              i === active ? 'border-primary' : 'border-border opacity-60 hover:opacity-100'
            }`}
            aria-label={`Prikazi sliku ${i + 1}`}
          >
            <img src={imgSrc(key)} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PropertyPage() {
  const { slug } = useParams();
  const { data: property, isLoading } = useProperty(slug ?? '');
  const navigate = useNavigate();
  const { siteName } = useSiteSettings();

  const cover = property?.images[0] ? imgSrc(property.images[0]) : undefined;
  useSeo({
    title: property ? `${property.name} — ${property.city} | ${siteName}` : undefined,
    description: property?.tagline,
    image: cover,
    jsonLd: property
      ? {
          '@context': 'https://schema.org',
          '@type': 'LodgingBusiness',
          name: property.name,
          description: property.tagline,
          url: window.location.origin + window.location.pathname,
          image: cover
            ? cover.startsWith('http')
              ? cover
              : window.location.origin + cover
            : undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: property.address,
            addressLocality: property.city,
            addressRegion: property.region,
            addressCountry: 'HR',
          },
          geo: { '@type': 'GeoCoordinates', latitude: property.lat, longitude: property.lng },
          ...(property.reviewCount > 0
            ? {
                aggregateRating: {
                  '@type': 'AggregateRating',
                  ratingValue: property.rating,
                  reviewCount: property.reviewCount,
                },
              }
            : {}),
        }
      : undefined,
  });

  const [unitId, setUnitId] = useState<number | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(2);

  const unit = useMemo(
    () => property?.units.find((u) => u.id === unitId) ?? property?.units[0],
    [property, unitId]
  );

  const bookedDatesQuery = useBookedDates(unit?.id ?? null);
  const quoteQuery = useQuote(
    unit?.id ?? null,
    checkIn ? toISO(checkIn) : null,
    checkOut ? toISO(checkOut) : null,
    guests
  );
  const quote = quoteQuery.data;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] animate-pulse px-6 pb-20 pt-28 lg:px-10">
        <div className="h-12 w-96 bg-muted" />
        <div className="mt-8 aspect-[16/10] bg-muted" />
      </div>
    );
  }

  if (!property || !unit) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-40 text-center">
        <p className="font-display text-3xl">Objekt nije pronadjen</p>
        <button onClick={() => navigate('/smjestaj')} className="link-underline-faint mt-4 text-sm">← Natrag na smjestaj</button>
      </div>
    );
  }

  const goCheckout = () => {
    if (!quote?.available || !checkIn || !checkOut) return;
    const params = new URLSearchParams({
      objekt: property.slug,
      jedinica: String(unit.id),
      od: toISO(checkIn),
      do: toISO(checkOut),
      gosti: String(guests),
    });
    navigate(`/rezervacija?${params.toString()}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-28 lg:px-10">
      {/* ZAGLAVLJE */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
          {property.city} · {property.region} · {property.distanceToSea < 1000 ? `${property.distanceToSea} m do mora` : 'u zaledju'}
        </p>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-4xl md:text-5xl">{property.name}</h1>
          <span className="font-mono-label text-sm">★ {property.rating.toFixed(1)} · {property.reviewCount} recenzija</span>
        </div>
        <p className="mt-2 font-display text-lg italic text-muted-foreground">{property.tagline}</p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
        {/* LIJEVO */}
        <div className="space-y-12">
          <Gallery imgs={unit.images} name={unit.name} />

          <div className="grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
            {[
              [`${unit.maxGuests}`, 'gostiju'],
              [`${unit.bedrooms}`, 'spavacih soba'],
              [`${unit.beds}`, 'kreveta'],
              [`${unit.sizeM2} m²`, 'povrsine'],
            ].map(([v, l]) => (
              <div key={l} className="bg-card p-4 text-center">
                <p className="font-display text-2xl">{v}</p>
                <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display text-2xl">O objektu</h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{property.description}</p>
            <p className="mt-4 font-mono-label text-xs uppercase tracking-widest text-muted-foreground">{property.address}</p>
          </div>

          <div>
            <h2 className="font-display text-2xl">Sadrzaji</h2>
            <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-3">
              {property.amenities.map((a) => (
                <div key={a} className="bg-card px-4 py-3 text-sm">{amenityLabel(a)}</div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-4 font-display text-2xl">Kalendar dostupnosti</h2>
            <AvailabilityCalendar
              unit={unit}
              bookedDates={bookedDatesQuery.data ?? []}
              checkIn={checkIn}
              checkOut={checkOut}
              onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
            />
          </div>
        </div>

        {/* DESNO: booking panel */}
        <aside>
          <div className="sticky top-24 border border-border bg-card">
            {property.units.length > 1 && (
              <div className="border-b border-border p-5">
                <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Jedinica</p>
                <select
                  value={unit.id}
                  onChange={(e) => { setUnitId(Number(e.target.value)); setCheckIn(null); setCheckOut(null); }}
                  className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm outline-none"
                >
                  {property.units.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            <div className="border-b border-border p-5">
              <div className="flex items-baseline justify-between">
                <p className="font-display text-3xl">{eur(unit.basePrice)}</p>
                <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">po noci</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border">
                <div className="bg-background p-3">
                  <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Dolazak</p>
                  <p className="mt-1 text-sm">{checkIn ? format(checkIn, 'd. MMM yyyy.', { locale: hr }) : '— odaberi —'}</p>
                </div>
                <div className="bg-background p-3">
                  <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Odlazak</p>
                  <p className="mt-1 text-sm">{checkOut ? format(checkOut, 'd. MMM yyyy.', { locale: hr }) : '— odaberi —'}</p>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">Gosti (max {unit.maxGuests})</span>
                <input
                  type="number" min={1} max={unit.maxGuests} value={guests}
                  onChange={(e) => setGuests(Math.min(unit.maxGuests, Math.max(1, Number(e.target.value))))}
                  className="mt-2 w-full border border-border bg-background px-3 py-2 text-sm outline-none"
                />
              </label>
            </div>

            <div className="p-5">
              {quote && !quote.available && (
                <p className="mb-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {quote.reason === 'booked' && 'Odabrani datumi su zauzeti — pogledajte kalendar.'}
                  {quote.reason === 'min-nights' && `Minimalan boravak je ${unit.minNights} noci.`}
                  {quote.reason === 'past' && 'Dolazak ne moze biti u proslosti.'}
                  {quote.reason === 'invalid' && 'Odlazak mora biti nakon dolaska.'}
                </p>
              )}

              {quote?.available ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{quote.nights} {quote.nights === 1 ? 'noc' : 'noci'}</span>
                    <span>{eur(quote.accommodation ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Zavrsno ciscenje</span><span>{eur(quote.cleaningFee ?? 0)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Boravisna pristojba</span><span>{eur(quote.touristTax ?? 0)}</span>
                  </div>
                  <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium">
                    <span>Ukupno</span><span className="font-display text-xl">{eur(quote.total ?? 0)}</span>
                  </div>
                </div>
              ) : (
                !quote && (
                  <p className="text-sm text-muted-foreground">
                    Odaberite datume u kalendaru za tocan izracun cijene.
                  </p>
                )
              )}

              <button
                onClick={goCheckout}
                disabled={!quote?.available}
                className="mt-5 w-full bg-primary px-4 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Nastavi na rezervaciju
              </button>
              <p className="mt-3 text-center font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                Cijena se izracunava na serveru
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
