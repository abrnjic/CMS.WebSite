import { trpc } from "@/providers/trpc";

export default function AdminInquiries() {
  const utils = trpc.useUtils();
  const list = trpc.contact.list.useQuery();
  const status = trpc.contact.setStatus.useMutation({
    onSuccess: () => utils.contact.list.invalidate(),
  });
  return (
    <div className="p-6 lg:p-10">
      <h1 className="font-display text-3xl">Upiti</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Posljednjih 200 poruka iz kontakt forme. Označite obrađene upite nakon
        odgovora gostu.
      </p>
      {list.isLoading && (
        <p className="mt-6" role="status">
          Učitavanje upita…
        </p>
      )}
      {list.error && (
        <p role="alert" className="mt-6 text-destructive">
          Upiti se nisu učitali. Pokušajte osvježiti stranicu.
        </p>
      )}
      {status.error && (
        <p role="alert" className="mt-6 text-destructive">
          Status nije spremljen. Pokušajte ponovno.
        </p>
      )}
      {list.data?.length === 0 && <p className="mt-6">Još nema upita.</p>}
      <div className="mt-6 space-y-4">
        {list.data?.map((q) => (
          <article key={q.id} className="border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl">{q.name}</h2>
                <a className="underline" href={`mailto:${q.email}`}>
                  {q.email}
                </a>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(q.createdAt).toLocaleString("hr-HR")} ·{" "}
                  {q.status === "new" ? "Novi upit" : "Obrađen"}
                </p>
              </div>
              <button
                disabled={status.isPending}
                onClick={() =>
                  status.mutate({
                    id: q.id,
                    status: q.status === "new" ? "handled" : "new",
                  })
                }
                className="border border-border px-3 py-2 text-sm disabled:opacity-50"
              >
                {q.status === "new" ? "Označi obrađenim" : "Vrati u nove"}
              </button>
            </div>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm">
              {q.message}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
