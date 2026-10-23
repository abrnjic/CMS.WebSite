import type { ReactNode } from "react";
import { useLocation, Link } from "react-router";
import { trpc } from "@/providers/trpc";
export function ServiceStatus({ children }: { children: ReactNode }) {
  const q = trpc.setup.status.useQuery(undefined, {
    retry: false,
    staleTime: 30000,
  });
  const { pathname } = useLocation();
  if (pathname === "/login") return children;
  if (q.isLoading)
    return (
      <div
        className="flex min-h-[70vh] items-center justify-center pt-24"
        role="status"
      >
        Učitavanje…
      </div>
    );
  if (q.isError || q.data?.configured === false)
    return (
      <div className="mx-auto max-w-xl px-6 pb-24 pt-40 text-center">
        <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">
          Adriatic Stays
        </p>
        <h1 className="mt-4 font-display text-4xl">Stranica se priprema</h1>
        <p className="mt-4 text-muted-foreground">
          Ponuda smještaja uskoro će biti dostupna. Hvala na strpljenju.
        </p>
        <Link className="mt-8 inline-block text-sm underline" to="/login">
          Prijava administratora
        </Link>
      </div>
    );
  return children;
}
