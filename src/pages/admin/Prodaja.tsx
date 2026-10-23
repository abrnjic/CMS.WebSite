import { Link } from "react-router";
import { trpc } from "@/providers/trpc";
import { useSeo } from "@/hooks/use-seo";

/** Admin: prodaja / prijenos CMS kopije na kupca */
export default function Prodaja() {
  useSeo({ title: "Prodaja kopije", noindex: true });
  const status = trpc.setup.status.useQuery();

  return (
    <div className="mx-auto max-w-[900px] px-8 pb-20">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Prodaja i prijenos kopije</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Svaka prodana kopija je potpuno neovisna instanca — vlastita baza,
          korisnici, prijava i sadrzaj, bez ikakve veze s ovom stranicom.
        </p>
      </div>

      {/* SCENARIJ A */}
      <section className="mt-8 border border-border bg-card p-6">
        <p className="font-mono-label text-[10px] uppercase tracking-widest text-primary">
          Scenarij A
        </p>
        <h2 className="mt-2 font-display text-2xl">
          Kupac dobiva novu, praznu kopiju
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Najcesci slucaj: kupac dobiva vlastiti CMS sa svim mogucnostima, ali
          bez vasih podataka.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Isporucite kupcu novu instancu sajta (duplikat aplikacije) — za nju
            zasebno konfigurirajte Firebase projekt, bazu, pohranu i
            OWNER_EMAIL.
          </li>
          <li>
            Kupac otvori{" "}
            <code className="bg-surface-warm px-1.5 py-0.5 text-xs">
              /postavljanje
            </code>{" "}
            i prijavi se svojim racunom (Google).
          </li>
          <li>
            Račun određen postavkom OWNER_EMAIL postaje{" "}
            <strong>vlasnik-administrator</strong> te kopije.
          </li>
          <li>
            Kupac u carobnjaku upise naziv svog sajta i po zelji ucita demo
            sadrzaj.
          </li>
        </ol>
        <div className="mt-4 border border-border bg-surface-warm p-4 text-sm">
          <span className="font-medium">Vazno: </span>
          <span className="text-muted-foreground">
            kupcev racun, baza i sadrzaj nemaju nikakve veze s ovom instancom —
            ne vidite njegove podatke, a on ne vidi vase.
          </span>
        </div>
      </section>

      {/* SCENARIJ B */}
      <section className="mt-6 border border-border bg-card p-6">
        <p className="font-mono-label text-[10px] uppercase tracking-widest text-primary">
          Scenarij B
        </p>
        <h2 className="mt-2 font-display text-2xl">
          Kupac preuzima ovu instancu (s postojecim sadrzajem)
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ako prodajete bas ovu stranicu zajedno sa sadrzajem:
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            Na stranici{" "}
            <Link to="/admin/administratori" className="link-underline-faint">
              Administratori
            </Link>{" "}
            stvorite pozivnicu za kupcev email i posaljite mu link.
          </li>
          <li>Kupac se prijavi svojim racunom i aktivira admin ulogu.</li>
          <li>
            Nakon sto kupac postane admin, u popisu korisnika kliknite{" "}
            <em>„Makni admina"</em> pokraj svog racuna — kupac ostaje jedini
            vlasnik.
          </li>
        </ol>
        <Link
          to="/admin/administratori"
          className="mt-4 inline-block bg-primary px-5 py-2.5 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
        >
          Otvori Administratore →
        </Link>
      </section>

      {/* STATUS INSTANCE */}
      <section className="mt-6 border border-border bg-card p-6">
        <h2 className="font-display text-2xl">Ova instanca</h2>
        <div className="mt-4 grid grid-cols-2 gap-px border border-border bg-border sm:grid-cols-4">
          <div className="bg-background p-4">
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Naziv
            </p>
            <p className="mt-1 truncate text-sm">
              {status.data?.siteName || "—"}
            </p>
          </div>
          <div className="bg-background p-4">
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Sadrzaj
            </p>
            <p className="mt-1 text-sm">
              {status.data?.hasContent ? "Ucitan" : "Prazno"}
            </p>
          </div>
          <div className="bg-background p-4">
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Korisnici
            </p>
            <p className="mt-1 text-sm">
              {status.data?.hasUsers ? "Ima" : "Nema"}
            </p>
          </div>
          <div className="bg-background p-4">
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Postavljanje
            </p>
            <p className="mt-1 text-sm">
              {status.data?.completed ? "Dovrseno" : "Nedovrseno"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
