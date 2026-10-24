import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useSeo } from '@/hooks/use-seo';
import { LOGIN_PATH } from '@/const';
import { trpc } from '@/providers/trpc';

/** banner za svjezu kopiju — vodi admina na carobnjak postavljanja */
function SetupBanner() {
  const status = trpc.setup.status.useQuery(undefined, { staleTime: 60_000 });
  if (!status.data || status.data.completed) return null;
  return (
    <div className="flex items-center justify-between gap-4 border-b border-primary/30 bg-primary/10 px-6 py-3">
      <p className="text-sm">
        Kopija jos nije postavljena — upisite naziv sajta i po zelji ucitajte demo sadrzaj.
      </p>
      <Link to="/postavljanje"
        className="shrink-0 bg-primary px-4 py-2 font-mono-label text-[11px] uppercase tracking-wider text-primary-foreground transition-opacity hover:opacity-90">
        Dovrsi postavljanje →
      </Link>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="font-mono-label text-sm text-muted-foreground">Provjera prijave…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="max-w-md border border-border bg-card p-10 text-center">
          <p className="font-mono-label text-xs uppercase tracking-widest text-muted-foreground">Admin panel</p>
          <h1 className="mt-3 font-display text-3xl">Potrebna je prijava</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Upravljanje stranicama i temama dostupno je samo prijavljenim korisnicima.
          </p>
          <a
            href={LOGIN_PATH}
            className="mt-6 inline-block bg-primary px-6 py-3 font-mono-label text-xs uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90"
          >
            Prijavi se
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AdminLayout() {
  useSeo({ title: 'Admin', noindex: true });
  const { user, logout } = useAuth();

  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <aside className="w-[220px] shrink-0 border-r border-border bg-surface-warm pt-24">
          <div className="px-6">
            <p className="font-mono-label text-[11px] uppercase tracking-widest text-muted-foreground">Admin panel</p>
            <p className="mt-1 font-display text-lg">Upravljanje</p>
            {user && <p className="mt-1 truncate font-mono-label text-[10px] text-muted-foreground">{user.email ?? user.name}</p>}
          </div>
          <nav className="mt-8 space-y-1 px-3">
            <NavLink to="/admin" end
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Stranice
            </NavLink>
            <NavLink to="/admin/objekti"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Objekti
            </NavLink>
            <NavLink to="/admin/rezervacije"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Rezervacije
            </NavLink>
            <NavLink to="/admin/upiti"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Upiti
            </NavLink>
            <NavLink to="/admin/mediji"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Mediji
            </NavLink>
            <NavLink to="/admin/seo"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              SEO
            </NavLink>
            <NavLink to="/admin/teme"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Teme
            </NavLink>
            <NavLink to="/admin/administratori"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Administratori
            </NavLink>
            <NavLink to="/admin/prodaja"
              className={({ isActive }) => `block px-3 py-2 text-sm transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'}`}>
              Prodaja kopije
            </NavLink>
          </nav>
          <div className="mt-12 space-y-2 border-t border-border px-6 py-4">
            <Link to="/" className="link-underline-faint block text-sm">← Natrag na sajt</Link>
            <button onClick={logout} className="link-underline-faint block text-sm text-muted-foreground">Odjava</button>
          </div>
        </aside>
        <div className="flex-1 pt-24">
          <SetupBanner />
          <Outlet />
        </div>
      </div>
    </RequireAuth>
  );
}
