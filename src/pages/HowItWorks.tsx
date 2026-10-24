import { useFadeIn } from '@/hooks/use-fade-in';

const STEPS = [
  { n: '01', t: 'Pronadjite objekt', d: 'Pretrazite po destinaciji, datumima, broju gostiju, cijeni i sadrzajima. Kalendar pokazuje samo stvarno slobodne termine.' },
  { n: '02', t: 'Odaberite datume', d: 'Kalendar dostupnosti prikazuje zauzete datume, minimalni boravak i tocan izracun cijene — ukljucujuci ciscenje i boravisnu pristojbu.' },
  { n: '03', t: 'Potvrdite rezervaciju', d: 'Unesite podatke i potvrdite rezervaciju bez terećenja kartice. Plaćanje dogovorite s domaćinom.' },
  { n: '04', t: 'Sačuvajte potvrdu', d: 'Na stranici potvrde prikazuje se šifra rezervacije. Sačuvajte je i kontaktirajte domaćina za upute za dolazak.' },
];

export default function HowItWorksPage() {
  const ref = useFadeIn<HTMLDivElement>();
  return (
    <div ref={ref} className="mx-auto max-w-[900px] px-6 pb-20 pt-36">
      <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">Vodic</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Kako funkcionira</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Četiri koraka od pregledavanja smještaja do potvrde rezervacije. Plaćanje i dolazak dogovorite izravno s domaćinom.
      </p>

      <div className="mt-14 space-y-0 border-t border-border">
        {STEPS.map((s) => (
          <div key={s.n} className="fade-item grid grid-cols-[80px_1fr] gap-6 border-b border-border py-10 md:grid-cols-[120px_1fr]">
            <p className="font-display text-4xl text-primary md:text-5xl">{s.n}</p>
            <div>
              <h2 className="font-display text-2xl">{s.t}</h2>
              <p className="mt-2 max-w-lg leading-relaxed text-muted-foreground">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
