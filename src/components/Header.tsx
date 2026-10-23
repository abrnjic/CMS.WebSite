import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { useApp, THEMES } from '@/context/AppContext';
import { useSiteSettings } from '@/hooks/use-seo';
import type { ThemeKey } from '@/types';

/** modeli izbornika — biraju se u adminu (Teme), spremaju se po temi */
export const HEADER_VARIANTS = [
  { key: 'klasicni', label: 'Klasicni', description: 'Logo lijevo, linkovi i gumb desno' },
  { key: 'centrirani', label: 'Centrirani', description: 'Logo u sredini, linkovi lijevo i desno' },
  { key: 'minimalni', label: 'Minimalni', description: 'Logo lijevo, kompaktni linkovi uokvireni' },
] as const;

export type HeaderVariant = (typeof HEADER_VARIANTS)[number]['key'];

function ThemeSwitcher() {
  const { theme, setTheme } = useApp();
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="Odabir teme">
      {THEMES.map((t) => (
        <button
          key={t.key}
          onClick={() => setTheme(t.key as ThemeKey)}
          title={t.label}
          aria-label={`Tema ${t.label}`}
          aria-checked={theme === t.key}
          role="radio"
          className={`h-5 w-5 rounded-full border transition-all duration-200 ${
            theme === t.key ? 'scale-110 ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-60 hover:opacity-100'
          }`}
          style={{ backgroundColor: t.swatch }}
        />
      ))}
    </div>
  );
}

export function Header() {
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const navigate = useNavigate();
  const { theme, overrides } = useApp();
  const { siteName } = useSiteSettings();
  const variant = (overrides[theme]?.['header-variant'] ?? 'klasicni') as HeaderVariant;

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 40);
      // sakrij na scroll dolje, pokazi na scroll gore
      if (y > lastY && y > 120) setHidden(true);
      else setHidden(false);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerCls = `fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
    hidden ? '-translate-y-full' : 'translate-y-0'
  } ${solid ? 'bg-background/95 backdrop-blur border-b border-border text-foreground' : 'bg-transparent text-white'}`;

  const logo = (
    <Link to="/" className="inline-block whitespace-nowrap font-display text-xl tracking-wide">
      {siteName}
    </Link>
  );

  const links = (
    <>
      <NavLink to="/" className="link-underline-faint text-sm">Naslovnica</NavLink>
      <NavLink to="/smjestaj" className="link-underline-faint text-sm">Smještaj</NavLink>
      <NavLink to="/kako-funkcionira" className="link-underline-faint text-sm">Kako funkcionira</NavLink>
    </>
  );

  const bookBtn = (
    <button
      onClick={() => navigate('/smjestaj')}
      className="hidden border border-current px-4 py-2 font-mono-label text-xs uppercase tracking-widest transition-colors duration-200 hover:bg-primary hover:border-primary hover:text-primary-foreground md:block"
    >
      Rezerviraj
    </button>
  );

  /* --- model: centrirani (logo u sredini) --- */
  if (variant === 'centrirani') {
    return (
      <header className={headerCls}>
        <div className="mx-auto grid max-w-[1400px] grid-cols-3 items-center px-6 py-4 lg:px-10">
          <nav className="hidden items-center gap-8 md:flex">{links}</nav>
          <div className="text-left md:text-center">{logo}</div>
          <div className="flex items-center justify-end gap-6">
            <ThemeSwitcher />
            {bookBtn}
          </div>
        </div>
      </header>
    );
  }

  /* --- model: minimalni (linkovi uokvireni desno) --- */
  if (variant === 'minimalni') {
    return (
      <header className={headerCls}>
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
          {logo}
          <div className="flex items-center gap-6">
            <nav className={`hidden items-center gap-4 border px-4 py-1.5 md:flex ${solid ? 'border-border' : 'border-white/30'}`}>
              {links}
            </nav>
            <ThemeSwitcher />
            {bookBtn}
          </div>
        </div>
      </header>
    );
  }

  /* --- model: klasicni (zadani) --- */
  return (
    <header className={headerCls}>
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 lg:px-10">
        {logo}
        <nav className="hidden items-center gap-8 md:flex">{links}</nav>
        <div className="flex items-center gap-6">
          <ThemeSwitcher />
          {bookBtn}
        </div>
      </div>
    </header>
  );
}
