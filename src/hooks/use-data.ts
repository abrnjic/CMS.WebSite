import { trpc } from '@/providers/trpc';

// ============================================================
// Data hooks — svi podaci dolaze s API-ja (baza), ne iz mockova
// ============================================================

export function useProperties() {
  return trpc.properties.list.useQuery(undefined, { staleTime: 30_000 });
}

export function useProperty(slug: string) {
  return trpc.properties.bySlug.useQuery({ slug }, { staleTime: 30_000 });
}

export function useBookedDates(unitId: number | null) {
  return trpc.booking.bookedDates.useQuery(
    { unitId: unitId ?? 0 },
    { enabled: unitId != null && unitId > 0, staleTime: 15_000 }
  );
}

/** svi zauzeti rasponi — za filtriranje pretrage po datumima */
export function useBookedRanges() {
  return trpc.booking.allRanges.useQuery(undefined, { staleTime: 30_000 });
}

export function useQuote(unitId: number | null, checkIn: string | null, checkOut: string | null, guests: number) {
  return trpc.booking.quote.useQuery(
    { unitId: unitId ?? 0, checkIn: checkIn ?? '', checkOut: checkOut ?? '', guests },
    { enabled: !!unitId && !!checkIn && !!checkOut, staleTime: 5_000 }
  );
}

export function useBookingByCode(code: string) {
  return trpc.booking.byCode.useQuery({ code }, { enabled: code.length >= 4 });
}

// ============================================================
// Admin — upravljanje objektima
// ============================================================

export function useAdminProperties(enabled = true) {
  return trpc.properties.adminList.useQuery(undefined, { enabled, staleTime: 10_000 });
}

export function useAdminProperty(id: number | null) {
  return trpc.properties.adminGet.useQuery(
    { id: id ?? 0 },
    { enabled: id != null && id > 0, staleTime: 5_000 }
  );
}

/** mutacije + invalidacija svega sto prikazuje objekte/kalendare */
export function usePropertyMutations() {
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.properties.invalidate();
    utils.booking.invalidate();
  };
  return {
    create: trpc.properties.create.useMutation({ onSuccess: invalidate }),
    update: trpc.properties.update.useMutation({ onSuccess: invalidate }),
    delete: trpc.properties.delete.useMutation({ onSuccess: invalidate }),
    createUnit: trpc.properties.createUnit.useMutation({ onSuccess: invalidate }),
    updateUnit: trpc.properties.updateUnit.useMutation({ onSuccess: invalidate }),
    deleteUnit: trpc.properties.deleteUnit.useMutation({ onSuccess: invalidate }),
  };
}

// ============================================================
// Admin — iCal sinkronizacija
// ============================================================

export function useIcalFeeds(unitId: number) {
  return trpc.ical.feeds.useQuery({ unitId }, { enabled: unitId > 0 });
}

export function useIcalMutations() {
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.ical.feeds.invalidate();
    utils.booking.invalidate();
  };
  return {
    addFeed: trpc.ical.addFeed.useMutation({ onSuccess: invalidate }),
    removeFeed: trpc.ical.removeFeed.useMutation({ onSuccess: invalidate }),
    syncUnit: trpc.ical.syncUnit.useMutation({ onSuccess: invalidate }),
  };
}
