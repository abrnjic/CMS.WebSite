import { useState } from 'react';
import { trpc } from '@/providers/trpc';
import { useSeo } from '@/hooks/use-seo';
import { format, parseISO } from 'date-fns';

/** Admin: upravljanje korisnicima i administratorskim pozivnicama */
export default function Admins() {
  useSeo({ title: 'Administratori', noindex: true });
  const utils = trpc.useUtils();
  const users = trpc.adminUsers.listUsers.useQuery();
  const invites = trpc.adminUsers.listInvites.useQuery();
  const [email, setEmail] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const createInvite = trpc.adminUsers.createInvite.useMutation({
    onSuccess: (r) => {
      utils.adminUsers.listInvites.invalidate();
      setCreatedLink(`${window.location.origin}/admin-claim?code=${r.code}`);
      setEmail('');
    },
  });

  const setRole = trpc.adminUsers.setRole.useMutation({
    onSuccess: () => utils.adminUsers.listUsers.invalidate(),
  });

  const copy = async () => {
    await navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteLink = (code: string) => `${window.location.origin}/admin-claim?code=${code}`;

  return (
    <div className="mx-auto max-w-[1000px] px-8 pb-20">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Administratori</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pozovite nove administratore jednokratnim linkom — osoba se prijavi (npr. Googleom) i otvori link.
        </p>
      </div>

      {/* NOVA POZIVNICA */}
      <div className="mt-8 border border-border bg-card p-6">
        <h2 className="font-display text-xl">Nova pozivnica</h2>
        <div className="mt-4 flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email osobe, npr. ime@gmail.com"
            className="flex-1 border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => createInvite.mutate({ email })}
            disabled={!email.includes('@') || createInvite.isPending}
            className="bg-primary px-5 py-2 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {createInvite.isPending ? 'Stvaranje…' : 'Stvori link'}
          </button>
        </div>
        {createInvite.isError && (
          <p className="mt-3 text-sm text-destructive">Greška pri stvaranju pozivnice — provjerite email.</p>
        )}
        {createdLink && (
          <div className="mt-4 border border-border bg-surface-warm p-4">
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              Pošaljite ovaj link osobi (jednokratni):
            </p>
            <div className="mt-2 flex items-center gap-3">
              <code className="flex-1 break-all bg-background px-3 py-2 text-xs">{createdLink}</code>
              <button onClick={copy}
                className="border border-foreground px-4 py-2 font-mono-label text-[11px] uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background">
                {copied ? '✓ Kopirano' : 'Kopiraj'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KORISNICI */}
      <div className="mt-10">
        <h2 className="font-display text-2xl">Registrirani korisnici</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Promijenite ulogu klikom — za prijenos sajta na kupca: kupac postane admin, a vi sebe maknete.
        </p>
        <div className="mt-4 border border-border">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 border-b border-border bg-surface-warm px-4 py-2 font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Korisnik</span><span>Uloga</span><span>Zadnja prijava</span><span />
          </div>
          {(users.data ?? []).map((u) => (
            <div key={u.id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-border px-4 py-3 text-sm last:border-0">
              <span className="flex min-w-0 items-center gap-3">
                {u.avatar && <img src={u.avatar} alt="" className="h-7 w-7 rounded-full" />}
                <span className="truncate">{u.name ?? '—'}</span>
              </span>
              <span className={`font-mono-label text-[10px] uppercase tracking-widest ${u.role === 'admin' ? 'text-primary' : 'text-muted-foreground'}`}>
                {u.role === 'admin' ? 'Admin' : 'Korisnik'}
              </span>
              <span className="font-mono-label text-[11px] text-muted-foreground">
                {u.lastSignInAt ? format(typeof u.lastSignInAt === 'string' ? parseISO(u.lastSignInAt) : u.lastSignInAt, 'd. MMM yyyy.') : '—'}
              </span>
              <button
                onClick={() => setRole.mutate({ userId: u.id, role: u.role === 'admin' ? 'user' : 'admin' })}
                disabled={setRole.isPending}
                className="link-underline-faint text-xs"
              >
                {u.role === 'admin' ? 'Makni admina' : 'Postavi kao admina'}
              </button>
            </div>
          ))}
          {setRole.isError && (
            <p className="border-t border-border px-4 py-3 text-sm text-destructive">
              {(setRole.error as { message?: string }).message ?? 'Promjena uloge nije uspjela.'}
            </p>
          )}
          {users.data?.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">Još nema registriranih korisnika.</p>
          )}
        </div>
      </div>

      {/* POZIVNICE */}
      <div className="mt-10">
        <h2 className="font-display text-2xl">Pozivnice</h2>
        <div className="mt-4 space-y-2">
          {(invites.data ?? []).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-4 border border-border bg-card px-4 py-3 text-sm">
              <span className="min-w-0">
                <span className="block truncate font-medium">{inv.email}</span>
                {!inv.usedAt && (
                  <button
                    onClick={() => navigator.clipboard.writeText(inviteLink(inv.code))}
                    className="link-underline-faint mt-0.5 block truncate font-mono-label text-[11px] text-muted-foreground"
                    title="Klikni za kopiranje linka"
                  >
                    {inviteLink(inv.code)}
                  </button>
                )}
              </span>
              <span className={`shrink-0 font-mono-label text-[10px] uppercase tracking-widest ${inv.usedAt ? 'text-success' : 'text-muted-foreground'}`}>
                {inv.usedAt ? 'Iskorištena' : 'Aktivna'}
              </span>
            </div>
          ))}
          {invites.data?.length === 0 && (
            <p className="border border-border px-4 py-6 text-sm text-muted-foreground">Još nema pozivnica.</p>
          )}
        </div>
      </div>
    </div>
  );
}
