// Pomocne funkcije za datume i cijene (prikaz)
import { addDays, differenceInCalendarDays, eachDayOfInterval, format, isBefore, isAfter, parseISO } from 'date-fns';

export const toISO = (d: Date) => format(d, 'yyyy-MM-dd');
export { parseISO, addDays, eachDayOfInterval, differenceInCalendarDays, isBefore, isAfter };

export const eur = (n: number) =>
  new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(n);

/** je li raspon [from, to) u sukobu s jednom zauzetom rezervacijom [bIn, bOut) */
export function rangesOverlap(from: string, to: string, bIn: string, bOut: string) {
  return bIn < to && bOut > from;
}
