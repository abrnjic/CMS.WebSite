import { useFadeIn } from '@/hooks/use-fade-in';

const STEPS = [
  { n: '01', t: 'Pronadjite objekt', d: 'Pretrazite po destinaciji, datumima, broju gostiju, cijeni i sadrzajima. Kalendar pokazuje samo stvarno slobodne termine.' },
  { n: '02', t: 'Odaberite datume', d: 'Kalendar dostupnosti prikazuje zauzete datume, minimalni boravak i tocan izracun cijene — ukljucujuci ciscenje i boravisnu pristojbu.' },
  { n: '03', t: 'Rezervirajte i platite', d: 'Vas termin se drzi 15 minuta dok dovrsavate uplatu karticom. Placanje je sigurno i sifrirano.' },
  { n: '04', t: 'Primitte potvrdu', d: 'Odmah dobivate e-mail potvrdu sa sifrom rezervacije, a vlasnik dobiva obavijest s vasim podacima.' },
];

export default function HowItWorksPage() {
  const ref = useFadeIn<HTMLDivElement>();
  return (
    <div ref={ref} className="mx-auto max-w-[900px] px-6 pb-20 pt-36">
      <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">Vodic</p>
      <h1 className="mt-2 font-display text-4xl md:text-5xl">Kako funkcionira</h1>
      <p className="mt-4 max-w-xl text-muted-foreground">
        Cetiri koraka od pregledavanja do kljuceva u ruci — sve digitalno, bez telefonskih poziva i cekanja na potvrdu.
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
