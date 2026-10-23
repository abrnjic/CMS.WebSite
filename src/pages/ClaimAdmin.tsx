import { useSearchParams, Link } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import { useSeo } from '@/hooks/use-seo';
import { LOGIN_PATH } from '@/const';

/** Preuzimanje administratorske uloge jednokratnom pozivnicom (/admin-claim?code=…) */
export default function ClaimAdmin() {
  useSeo({ title: 'Aktivacija administratora', noindex: true });
  const [params] = useSearchParams();
  const code = params.get('code') ?? '';
  const { user, isLoading } = useAuth();
  const utils = trpc.useUtils();

  const claim = trpc.adminUsers.claimInvite.useMutation({
    onSuccess: () => utils.auth.me.invalidate(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono-label text-sm text-muted-foreground">Provjera prijave…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
        <div className="max-w-md border border-border bg-card p-10 text-center">
          <h1 className="font-display text-3xl">Najprije se prijavite</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Pozivnica se vezuje na vaš račun — prijavite se (npr. Googleom), pa se vratite na ovaj link.
          </p>
          <a href={LOGIN_PATH}
            className="mt-6 inline-block bg-primary px-6 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90">
            Prijavi se
          </a>
        </div>
      </div>
    );
  }

  if (user.role === 'admin') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
        <div className="max-w-md border border-border bg-card p-10 text-center">
          <h1 className="font-display text-3xl">Već ste administrator</h1>
          <p className="mt-3 text-sm text-muted-foreground">Vaš račun već ima administratorsku ulogu.</p>
          <Link to="/admin" className="mt-6 inline-block bg-primary px-6 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90">
            Otvori admin panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24">
      <div className="max-w-md border border-border bg-card p-10 text-center">
        {claim.isSuccess ? (
          <>
            <p className="font-mono-label text-xs uppercase tracking-widest text-success">Uspjeh</p>
            <h1 className="mt-3 font-display text-3xl">Admin uloga aktivirana</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Račun {user.name ?? ''} sada ima administratorski pristup.
            </p>
            <Link to="/admin" className="mt-6 inline-block bg-primary px-6 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90">
              Otvori admin panel
            </Link>
          </>
        ) : (
          <>
            <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">Pozivnica</p>
            <h1 className="mt-3 font-display text-3xl">Aktivacija administratora</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Prijavljeni ste kao {user.name ?? 'korisnik'}. Kliknite za preuzimanje administratorske uloge.
            </p>
            <button
              onClick={() => claim.mutate({ code })}
              disabled={!code || claim.isPending}
              className="mt-6 inline-block bg-primary px-6 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {claim.isPending ? 'Aktivacija…' : 'Aktiviraj admin pristup'}
            </button>
            {claim.isError && (
              <p className="mt-4 text-sm text-destructive">
                Pozivnica nije valjana ili je već iskorištena. Zatražite novu od vlasnika sajta.
              </p>
            )}
            {!code && (
              <p className="mt-4 text-sm text-destructive">Link ne sadrži kod pozivnice.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
