import { useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { useSeo } from "@/hooks/use-seo";
import { LOGIN_PATH } from "@/const";

/**
 * Carobnjak za postavljanje svjeze (prodane) kopije CMS-a.
 * Prvi korisnik kopije automatski je admin; ovdje upisuje naziv sajta
 * i po zelji ucitava demo sadrzaj.
 */
export default function Setup() {
  useSeo({ title: "Postavljanje sajta", noindex: true });
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const status = trpc.setup.status.useQuery();

  const [siteName, setSiteName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCity, setContactCity] = useState("");
  const [wantDemo, setWantDemo] = useState(true);

  const seedDemo = trpc.setup.seedDemo.useMutation();
  const setSetting = trpc.settings.set.useMutation();
  const complete = trpc.setup.complete.useMutation({
    onSuccess: () => {
      utils.setup.status.invalidate();
      utils.settings.getAll.invalidate();
      navigate("/admin");
    },
  });

  if (isLoading || status.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono-label text-sm text-muted-foreground">
          Ucitavanje…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
        <div className="max-w-md border border-border bg-card p-10 text-center">
          <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
            Postavljanje
          </p>
          <h1 className="mt-3 font-display text-3xl">Dobrodosli u vas CMS</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Ovo je svjeza kopija sajta. Prijavite se vlasničkim računom koji je
            administrator odredio pri postavljanju.
          </p>
          <a
            href={LOGIN_PATH}
            className="mt-6 inline-block bg-primary px-6 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            Prijavi se
          </a>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
        <div className="max-w-md border border-border bg-card p-10 text-center">
          <h1 className="font-display text-3xl">Pristup odbijen</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Postavljanje je dostupno samo administratoru kopije.
          </p>
        </div>
      </div>
    );
  }

  const finish = async () => {
    if (!siteName.trim()) return;
    if (wantDemo && status.data && !status.data.hasContent) {
      await seedDemo.mutateAsync();
    }
    if (contactEmail.trim())
      await setSetting.mutateAsync({
        key: "contactEmail",
        value: contactEmail.trim(),
      });
    if (contactPhone.trim())
      await setSetting.mutateAsync({
        key: "contactPhone",
        value: contactPhone.trim(),
      });
    if (contactCity.trim())
      await setSetting.mutateAsync({
        key: "contactCity",
        value: contactCity.trim(),
      });
    complete.mutate({ siteName: siteName.trim() });
  };

  const busy = seedDemo.isPending || complete.isPending || setSetting.isPending;

  return (
    <div className="mx-auto max-w-[640px] px-6 pb-24 pt-32">
      <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
        Korak 1 od 1
      </p>
      <h1 className="mt-3 font-display text-4xl">Postavljanje vase kopije</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Prijavljeni ste kao <strong>{user.name ?? "vlasnik"}</strong> i imate
        potpunu kontrolu nad ovom kopijom — stranice, teme, objekti,
        rezervacije, mediji. Kopija je potpuno neovisna: vlastita baza, vlastiti
        korisnici i vlastita prijava.
      </p>

      <div className="mt-10 space-y-6">
        <label className="block">
          <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            Naziv sajta
          </span>
          <input
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="npr. Istra Villas"
            className="mt-1 w-full border border-input bg-background px-3 py-3 text-lg outline-none focus:border-primary"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Prikazuje se u zaglavlju, podnožju i SEO naslovima.
          </span>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Kontakt email
            </span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="info@vassajt.hr"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Telefon
            </span>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+385 …"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Grad
            </span>
            <input
              value={contactCity}
              onChange={(e) => setContactCity(e.target.value)}
              placeholder="Split, Hrvatska"
              className="mt-1 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>

        <label className="flex items-start gap-3 border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={wantDemo && !status.data?.hasContent}
            disabled={!!status.data?.hasContent}
            onChange={(e) => setWantDemo(e.target.checked)}
            className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]"
          />
          <span className="text-sm">
            <span className="font-medium">Ucitaj demo sadrzaj</span>
            <span className="mt-0.5 block text-muted-foreground">
              {status.data?.hasContent
                ? "Baza vec ima sadrzaj — preskace se."
                : "8 primjera objekata i pocetne stranice — idealno za upoznavanje s CMS-om. Sve se kasnije moze obrisati ili izmijeniti."}
            </span>
          </span>
        </label>

        {seedDemo.isError && (
          <p className="text-sm text-destructive">
            Ucitavanje demo sadrzaja nije uspjelo — mozete ga dodati kasnije
            rucno.
          </p>
        )}

        <button
          onClick={finish}
          disabled={!siteName.trim() || busy}
          className="w-full bg-primary px-6 py-4 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Postavljanje…" : "Zavrsi postavljanje →"}
        </button>
      </div>
    </div>
  );
}
