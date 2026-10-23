import { useMemo, useState } from 'react';
import {
  addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  isBefore, isAfter, format, startOfWeek, endOfWeek,
} from 'date-fns';
import { hr } from 'date-fns/locale';
import type { Unit } from '@/types';
import { toISO } from '@/lib/pricing';

interface Props {
  unit: Unit;
  /** zauzeti datumi (ISO yyyy-MM-dd) — dolaze s API-ja */
  bookedDates: string[];
  checkIn: Date | null;
  checkOut: Date | null;
  onSelect: (checkIn: Date | null, checkOut: Date | null) => void;
}

const WEEKDAYS = ['Po', 'Ut', 'Sr', 'Ce', 'Pe', 'Su', 'Ne'];

export function AvailabilityCalendar({ unit, bookedDates, checkIn, checkOut, onSelect }: Props) {
  const [baseMonth, setBaseMonth] = useState(() => startOfMonth(new Date()));
  const booked = useMemo(() => new Set(bookedDates), [bookedDates]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDay = (day: Date) => {
    const iso = toISO(day);
    if (isBefore(day, today) || booked.has(iso)) return;
    if (!checkIn || (checkIn && checkOut)) {
      onSelect(day, null);
      return;
    }
    if (isBefore(day, checkIn) || isSameDay(day, checkIn)) {
      onSelect(day, null);
      return;
    }
    // raspon ne smije presjecati zauzete datume
    const days = eachDayOfInterval({ start: checkIn, end: day });
    if (days.slice(1, -1).some((d) => booked.has(toISO(d)))) {
      onSelect(day, null);
      return;
    }
    onSelect(checkIn, day);
  };

  const months = [baseMonth, addMonths(baseMonth, 1)];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setBaseMonth((m) => addMonths(m, -1))}
          disabled={isBefore(endOfMonth(baseMonth), today)}
          className="border border-border px-3 py-1.5 font-mono-label text-xs transition-colors hover:bg-secondary disabled:opacity-30"
          aria-label="Prethodni mjesec"
        >
          ←
        </button>
        <div className="flex items-center gap-5 font-mono-label text-[11px] uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 border border-border bg-card" /> Slobodno</span>
          <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 bg-muted-foreground/30" /> Zauzeto</span>
          <span className="flex items-center gap-2"><i className="inline-block h-3 w-3 bg-primary" /> Odabrano</span>
        </div>
        <button
          onClick={() => setBaseMonth((m) => addMonths(m, 1))}
          className="border border-border px-3 py-1.5 font-mono-label text-xs transition-colors hover:bg-secondary"
          aria-label="Sljedeci mjesec"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {months.map((month) => {
          const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
          const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start, end });
          return (
            <div key={month.toISOString()}>
              <p className="mb-2 text-center font-display text-lg capitalize">
                {format(month, 'LLLL yyyy.', { locale: hr })}
              </p>
              <div className="grid grid-cols-7 text-center font-mono-label text-[10px] uppercase tracking-wider text-muted-foreground">
                {WEEKDAYS.map((w) => <span key={w} className="py-1">{w}</span>)}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day) => {
                  const iso = toISO(day);
                  const inMonth = day.getMonth() === month.getMonth();
                  const past = isBefore(day, today);
                  const isBooked = booked.has(iso);
                  const isStart = checkIn && isSameDay(day, checkIn);
                  const isEnd = checkOut && isSameDay(day, checkOut);
                  const inRange = checkIn && checkOut && isAfter(day, checkIn) && isBefore(day, checkOut);
                  const disabled = past || isBooked || !inMonth;

                  let cls = 'bg-card hover:bg-secondary cursor-pointer';
                  if (!inMonth) cls = 'opacity-0 pointer-events-none';
                  else if (isStart || isEnd) cls = 'bg-primary text-primary-foreground';
                  else if (inRange) cls = 'bg-primary/25';
                  else if (isBooked) cls = 'bg-muted-foreground/25 text-muted-foreground/50 cursor-not-allowed line-through decoration-1';
                  else if (past) cls = 'text-muted-foreground/40 cursor-not-allowed';

                  return (
                    <button
                      key={iso}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleDay(day)}
                      className={`aspect-square border border-border/60 text-sm transition-colors duration-150 ${cls}`}
                      aria-label={format(day, 'd. MMMM yyyy.', { locale: hr })}
                      aria-pressed={!!(isStart || isEnd || inRange)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 font-mono-label text-[11px] uppercase tracking-wider text-muted-foreground">
        Minimalan boravak: {unit.minNights} noci
      </p>
    </div>
  );
}
