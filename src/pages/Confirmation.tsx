import { useNavigate, useParams } from "react-router";
import { format, parseISO } from "date-fns";
import { hr } from "date-fns/locale";
import { eur } from "@/lib/pricing";
import { useBookingByCode, useProperties } from "@/hooks/use-data";
import { useSeo } from "@/hooks/use-seo";

export default function ConfirmationPage() {
  useSeo({ title: "Potvrda rezervacije", noindex: true });
  const { code } = useParams();
  const navigate = useNavigate();
  const { data: booking, isLoading } = useBookingByCode(code ?? "");
  const { data: properties } = useProperties();
  const property = booking
    ? properties?.find((p) => p.id === booking.propertyId)
    : undefined;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-[760px] animate-pulse px-6 pb-20 pt-36 text-center">
        <div className="mx-auto h-10 w-80 bg-muted" />
      </div>
    );
  }

  if (!booking)
    return (
      <div className="px-6 pb-20 pt-36 text-center">
        <h1 className="font-display text-3xl">Rezervacija nije pronađena</h1>
        <p className="mt-4">Provjerite šifru rezervacije.</p>
      </div>
    );

  const cancelled = booking.status === "cancelled";

  return (
    <div className="mx-auto max-w-[760px] px-6 pb-20 pt-36 text-center">
      <p
        className={`font-mono-label text-xs uppercase tracking-widest ${cancelled ? "text-destructive" : "text-success"}`}
      >
        {cancelled ? "Rezervacija nije aktivna" : "✓ Rezervacija spremljena"}
      </p>
      <h1 className="mt-4 font-display text-4xl md:text-5xl">
        {cancelled ? "Rezervacija otkazana" : "Rezervacija potvrđena"}
      </h1>
      <p className="mt-4 text-muted-foreground">
        {cancelled
          ? "Ova rezervacija je otkazana. Za novi termin odaberite smještaj ili kontaktirajte domaćina."
          : "Sačuvajte šifru rezervacije. Za plaćanje i upute za dolazak kontaktirajte domaćina."}
      </p>

      <div className="mt-10 border border-border bg-card p-8">
        <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
          Sifra rezervacije
        </p>
        <p className="mt-2 font-mono-label text-3xl tracking-widest">{code}</p>

        {booking && (
          <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border text-left sm:grid-cols-4">
            <div className="bg-background p-4">
              <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                Objekt
              </p>
              <p className="mt-1 text-sm">
                {property ? `${property.name}, ${property.city}` : "—"}
              </p>
            </div>
            <div className="bg-background p-4">
              <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                Dolazak
              </p>
              <p className="mt-1 text-sm">
                {format(parseISO(booking.checkIn), "d. MMM yyyy.", {
                  locale: hr,
                })}
              </p>
            </div>
            <div className="bg-background p-4">
              <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                Odlazak
              </p>
              <p className="mt-1 text-sm">
                {format(parseISO(booking.checkOut), "d. MMM yyyy.", {
                  locale: hr,
                })}
              </p>
            </div>
            <div className="bg-background p-4">
              <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
                Ukupno
              </p>
              <p className="mt-1 text-sm font-medium">
                {eur(booking.totalPrice)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-10 flex items-center justify-center gap-6">
        <button
          onClick={() => navigate("/smjestaj")}
          className="link-underline-faint text-sm"
        >
          Istrazi jos objekata
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          onClick={() => navigate("/")}
          className="link-underline-faint text-sm"
        >
          Naslovnica
        </button>
      </div>
    </div>
  );
}
