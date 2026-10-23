import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { format, parseISO } from "date-fns";
import { hr } from "date-fns/locale";
import { imgSrc } from "@/lib/img";
import { trpc } from "@/providers/trpc";
import { useProperty, useQuote } from "@/hooks/use-data";
import { eur } from "@/lib/pricing";
import { useSeo } from "@/hooks/use-seo";

export default function CheckoutPage() {
  useSeo({ title: "Rezervacija", noindex: true });
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const slug = params.get("objekt") ?? "";
  const unitId = Number(params.get("jedinica") ?? "0");
  const from = params.get("od") ?? "";
  const to = params.get("do") ?? "";
  const guests = Number(params.get("gosti") ?? "2");

  const { data: property, isLoading } = useProperty(slug);
  const unit = property?.units.find((u) => u.id === unitId);

  // server-side provjera dostupnosti i cijene (jedini izvor istine)
  const quoteQuery = useQuote(unitId || null, from || null, to || null, guests);
  const quote = quoteQuery.data;

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [error, setError] = useState("");

  const createMutation = trpc.booking.create.useMutation({
    onSuccess: (result) => {
      navigate(`/potvrda/${result.code}`);
    },
    onError: (e) => {
      setError(
        e.message === "booked"
          ? "Nažalost, datumi su upravo zauzeti — odaberite druge."
          : "Rezervacija nije uspjela. Pokusajte ponovno.",
      );
    },
  });

  if (isLoading || quoteQuery.isLoading) {
    return (
      <div className="mx-auto max-w-[1100px] animate-pulse px-6 pb-20 pt-36 lg:px-10">
        <div className="h-8 w-72 bg-muted" />
        <div className="mt-8 h-64 bg-muted" />
      </div>
    );
  }

  if (!property || !unit || !quote?.available) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 pb-20 pt-40 text-center">
        <p className="font-display text-3xl">Rezervacija nije valjana</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Datumi su mozda u medjuvremenu zauzeti ili nedostaju podaci.
        </p>
        <button
          onClick={() => navigate("/smjestaj")}
          className="link-underline-faint mt-4 text-sm"
        >
          ← Natrag na smjestaj
        </button>
      </div>
    );
  }

  const pay = () => {
    setError("");
    if (!guestName.trim() || !guestEmail.includes("@")) {
      setError("Unesite ime i valjanu e-mail adresu.");
      return;
    }
    createMutation.mutate({
      unitId: unit.id,
      checkIn: from,
      checkOut: to,
      guests,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone || undefined,
    });
  };

  const processing = createMutation.isPending;

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-20 pt-28 lg:px-10">
      <h1 className="mb-10 font-display text-3xl md:text-4xl">
        Dovrsavanje rezervacije
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        {/* FORMA */}
        <div className="space-y-10">
          <section>
            <h2 className="font-display text-xl">1. Podaci o gostu</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                  Ime i prezime *
                </span>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="mt-2 w-full border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="Ana Horvat"
                />
              </label>
              <label className="block">
                <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                  E-mail *
                </span>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="mt-2 w-full border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="ana@email.com"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                  Telefon
                </span>
                <input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="mt-2 w-full border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                  placeholder="+385 ..."
                />
              </label>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl">2. Potvrda rezervacije</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Online naplata još nije omogućena. Rezervacija se sprema bez
              terećenja kartice; način plaćanja dogovorite s domaćinom.
            </p>
            {error && (
              <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <button
              onClick={pay}
              disabled={processing}
              className="mt-6 w-full bg-primary px-4 py-3.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing ? "Spremanje…" : "Potvrdi rezervaciju"}
            </button>
            <p className="mt-3 text-center font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Dvostruka rezervacija onemogucena transakcijom u bazi
            </p>
          </section>
        </div>

        {/* SAZETAK */}
        <aside>
          <div className="sticky top-24 border border-border bg-card">
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={imgSrc(unit.images[0])}
                alt={property.name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-5">
              <p className="font-display text-xl">{property.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {unit.name}
              </p>
              <p className="mt-1 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
                {property.city}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border text-sm">
                <div className="bg-background p-3">
                  <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                    Dolazak
                  </p>
                  <p className="mt-1">
                    {format(parseISO(from), "d. MMM yyyy.", { locale: hr })}
                  </p>
                </div>
                <div className="bg-background p-3">
                  <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                    Odlazak
                  </p>
                  <p className="mt-1">
                    {format(parseISO(to), "d. MMM yyyy.", { locale: hr })}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>
                    {quote.nights} noci × {guests} gosta
                  </span>
                  <span>{eur(quote.accommodation ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Zavrsno ciscenje</span>
                  <span>{eur(quote.cleaningFee ?? 0)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Boravisna pristojba</span>
                  <span>{eur(quote.touristTax ?? 0)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium">
                  <span>Ukupno</span>
                  <span className="font-display text-xl">
                    {eur(quote.total ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
