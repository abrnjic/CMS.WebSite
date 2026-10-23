import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import { trpc } from '@/providers/trpc';
import { eur } from '@/lib/pricing';

type Tab = 'upcoming' | 'all' | 'past' | 'cancelled';

const TAB_LABEL: Record<Tab, string> = {
  upcoming: 'Nadolazeće',
  all: 'Sve',
  past: 'Prošle',
  cancelled: 'Otkazane',
};

const fmt = (iso: string) => format(parseISO(iso), 'd. M. yyyy.', { locale: hr });
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AdminBookings() {
  const { data: all, isLoading, error } = trpc.booking.adminList.useQuery(undefined, { staleTime: 10_000 });
  const utils = trpc.useUtils();
  const cancel = trpc.booking.cancel.useMutation({
    onSuccess: () => utils.booking.invalidate(),
    onError: (e) => alert(e.message),
  });
  const [tab, setTab] = useState<Tab>('upcoming');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    let list = all ?? [];
    const today = todayISO();
    if (tab === 'upcoming') list = list.filter((b) => b.status === 'confirmed' && b.checkOut >= today);
    else if (tab === 'past') list = list.filter((b) => b.status === 'confirmed' && b.checkOut < today);
    else if (tab === 'cancelled') list = list.filter((b) => b.status === 'cancelled');
    if (tab === 'upcoming') list = [...list].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((b) =>
        [b.code, b.guestName, b.guestEmail, b.propertyName, b.unitName]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      );
    }
    return list;
  }, [all, tab, q]);

  const stats = useMemo(() => {
    const list = all ?? [];
    const today = todayISO();
    const upcoming = list.filter((b) => b.status === 'confirmed' && b.checkOut >= today);
    const revenue = list
      .filter((b) => b.status === 'confirmed' && b.source === 'direct')
      .reduce((s, b) => s + b.totalPrice, 0);
    return { upcoming: upcoming.length, confirmed: list.filter((b) => b.status === 'confirmed').length, revenue };
  }, [all]);

  return (
    <div className="mx-auto max-w-[1100px] px-8 pb-20">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Rezervacije</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sve rezervacije — direktne i uvezene preko iCal feedova. Otkazivanje odmah oslobađa datume u kalendaru.
        </p>
      </div>

      {/* STATISTIKA */}
      <div className="mt-6 grid grid-cols-3 gap-px border border-border bg-border">
        {[
          { label: 'Nadolazećih dolazaka', value: String(stats.upcoming) },
          { label: 'Aktivnih rezervacija', value: String(stats.confirmed) },
          { label: 'Prihod (direktne)', value: eur(stats.revenue) },
        ].map((s) => (
          <div key={s.label} className="bg-card px-5 py-4">
            <p className="font-display text-2xl">{s.value}</p>
            <p className="mt-1 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* FILTERI */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-mono-label text-[11px] uppercase tracking-widest transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-secondary'
            }`}>
            {TAB_LABEL[t]}
          </button>
        ))}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Traži: kod, gost, email, objekt…"
          className="ml-auto w-64 border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* POPIS */}
      {isLoading ? (
        <div className="mt-6 animate-pulse space-y-px">{[1, 2, 3, 4].map((i) => <div key={i} className="h-16 bg-muted" />)}</div>
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">Greška pri učitavanju rezervacija.</p>
      ) : (
        <div className="mt-6 space-y-px border border-border bg-border">
          {rows.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-4 bg-card px-5 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono-label text-xs">{b.code}</span>
                  <span className={`px-2 py-0.5 font-mono-label text-[9px] uppercase tracking-widest ${
                    b.status === 'confirmed' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground line-through'
                  }`}>
                    {b.status === 'confirmed' ? 'Potvrđena' : 'Otkazana'}
                  </span>
                  <span className={`px-2 py-0.5 font-mono-label text-[9px] uppercase tracking-widest ${
                    b.source === 'external' ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'
                  }`}>
                    {b.source === 'external' ? 'Vanjska (iCal)' : 'Direktna'}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm">
                  <span className="font-medium">{b.guestName}</span>
                  {b.source === 'direct' && <span className="text-muted-foreground"> · {b.guestEmail}{b.guestPhone ? ` · ${b.guestPhone}` : ''}</span>}
                </p>
                <p className="mt-0.5 font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">
                  {b.propertyName} · {b.unitName} · {fmt(b.checkIn)} → {fmt(b.checkOut)} · {b.nights} noći · {b.guests} gosta
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {b.source === 'direct' && <span className="font-display">{eur(b.totalPrice)}</span>}
                {b.status === 'confirmed' && b.source === 'direct' && b.checkIn >= todayISO() && (
                  <button
                    onClick={() => {
                      if (confirm(`Otkazati rezervaciju ${b.code} (${b.guestName})? Datumi se odmah oslobađaju.`)) {
                        cancel.mutate({ id: b.id });
                      }
                    }}
                    className="border border-destructive/50 px-3 py-1.5 font-mono-label text-[11px] uppercase tracking-wider text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  >
                    Otkaži
                  </button>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="bg-card px-5 py-10 text-center text-sm text-muted-foreground">
              Nema rezervacija za odabrani filter.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
