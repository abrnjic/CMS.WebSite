import { Link } from 'react-router';
import { useSiteSettings } from '@/hooks/use-seo';

export function Footer() {
  const s = useSiteSettings();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-surface-deep text-surface-deep-foreground">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-4 lg:px-10">
        <div className="md:col-span-2">
          <p className="font-display text-2xl">{s.siteName}</p>
          <p className="mt-4 max-w-sm text-sm opacity-70">
            {s.footerTagline || 'Pažljivo odabrani smještaj uz Jadran — s trenutnom potvrdom, pravim kalendarom dostupnosti i sigurnim plaćanjem.'}
          </p>
        </div>
        <div>
          <p className="font-mono-label text-xs uppercase tracking-widest opacity-60">Navigacija</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/" className="link-underline-faint">Naslovnica</Link></li>
            <li><Link to="/smjestaj" className="link-underline-faint">Smjestaj</Link></li>
            <li><Link to="/kako-funkcionira" className="link-underline-faint">Kako funkcionira</Link></li>
            <li><Link to="/stranica/o-nama" className="link-underline-faint">O nama</Link></li>
            <li><Link to="/admin" className="link-underline-faint">Admin panel</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono-label text-xs uppercase tracking-widest opacity-60">Kontakt</p>
          <ul className="mt-4 space-y-2 text-sm opacity-90">
            {s.contactEmail && <li>{s.contactEmail}</li>}
            {s.contactPhone && <li>{s.contactPhone}</li>}
            {s.contactCity && <li>{s.contactCity}</li>}
            {!s.contactEmail && !s.contactPhone && !s.contactCity && <li className="opacity-60">Kontakt se postavlja u admin panelu (SEO i postavke).</li>}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center font-mono-label text-xs opacity-50">
        © {s.siteName} {year}
      </div>
    </footer>
  );
}
