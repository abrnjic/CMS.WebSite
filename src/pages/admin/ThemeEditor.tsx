import { useApp, THEMES } from "@/context/AppContext";
import { hexToHsl, hslToHex } from "@/lib/color";
import { HEADER_VARIANTS } from "@/components/Header";
import type { ThemeKey } from "@/types";

// bazne vrijednosti tema (odraz index.css) — za prikaz u editorima
const BASE: Record<ThemeKey, Record<string, string>> = {
  mediteran: {
    "--background": "40 21% 95%",
    "--foreground": "0 17% 15%",
    "--primary": "48 20% 37%",
    "--surface-warm": "42 24% 92%",
  },
  obala: {
    "--background": "160 9% 95%",
    "--foreground": "190 22% 14%",
    "--primary": "187 36% 29%",
    "--surface-warm": "165 12% 92%",
  },
  noc: {
    "--background": "25 24% 7%",
    "--foreground": "36 33% 90%",
    "--primary": "37 45% 60%",
    "--surface-warm": "28 18% 12%",
  },
};

const FONT_PAIRS = [
  {
    label: "Playfair Display / Rubik",
    display: "Playfair Display",
    body: "Rubik",
  },
  {
    label: "Cormorant Garamond / Source Sans 3",
    display: "Cormorant Garamond",
    body: "Source Sans 3",
  },
  {
    label: "DM Serif Display / Inter",
    display: "DM Serif Display",
    body: "Inter",
  },
];

const COLOR_TOKENS = [
  { key: "--primary", label: "Primarna boja (gumbi, akcenti)" },
  { key: "--background", label: "Pozadina" },
  { key: "--foreground", label: "Tekst" },
  { key: "--surface-warm", label: "Pozadina sekcija" },
];

export default function ThemeEditor() {
  const {
    theme,
    setSiteTheme,
    savingTheme,
    themeError,
    overrides,
    setOverride,
    resetOverrides,
  } = useApp();
  const current = overrides[theme] ?? {};

  const valueOf = (token: string) =>
    current[token] ?? BASE[theme][token] ?? "0 0% 50%";

  const fontName = (value: string | undefined) =>
    value?.replace(/^['"]|['"]$/g, "").trim();
  const activeFontPair = FONT_PAIRS.findIndex(
    (p) =>
      (fontName(current["--font-display"]) ?? p.display) === p.display &&
      (fontName(current["--font-body"]) ?? p.body) === p.body &&
      (current["--font-display"] || current["--font-body"]),
  );

  return (
    <div className="mx-auto max-w-[1000px] px-8 pb-20">
      <div className="border-b border-border pb-6">
        <h1 className="font-display text-3xl">Teme</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Promjene se primjenjuju odmah, na cijelom sajtu — bez deploy-a. Tema
          je samo skup design tokena.
        </p>
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {savingTheme
            ? "Spremanje teme…"
            : "Aktivna tema i prilagodbe spremaju se za cijeli sajt. Posjetitelji mogu odabrati vlastiti prikaz."}
        </p>
        {themeError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            Spremanje nije uspjelo: {themeError}
          </p>
        )}
      </div>

      {/* ODABIR TEME */}
      <div className="mt-8 grid grid-cols-3 gap-px border border-border bg-border">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setSiteTheme(t.key)}
            disabled={savingTheme}
            className={`p-6 text-left transition-colors ${theme === t.key ? "bg-secondary" : "bg-card hover:bg-secondary/60"}`}
          >
            <span
              className="inline-block h-8 w-8 rounded-full border border-border"
              style={{ backgroundColor: t.swatch }}
            />
            <p className="mt-3 font-display text-xl">{t.label}</p>
            <p className="font-mono-label text-[10px] uppercase tracking-widest text-muted-foreground">
              {theme === t.key ? "Aktivna tema" : "Klikni za aktivaciju"}
            </p>
          </button>
        ))}
      </div>

      {/* BOJE */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl">
            Boje — {THEMES.find((t) => t.key === theme)?.label}
          </h2>
          <button
            onClick={() => resetOverrides(theme)}
            className="link-underline-faint text-sm"
          >
            Vrati zadano
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-2">
          {COLOR_TOKENS.map((tok) => (
            <label
              key={tok.key}
              className="flex items-center justify-between gap-4 bg-card p-4"
            >
              <span className="text-sm">{tok.label}</span>
              <span className="flex items-center gap-3">
                <span className="font-mono-label text-[11px] text-muted-foreground">
                  {hslToHex(valueOf(tok.key))}
                </span>
                <input
                  type="color"
                  value={hslToHex(valueOf(tok.key))}
                  onChange={(e) =>
                    setOverride(theme, tok.key, hexToHsl(e.target.value))
                  }
                  className="h-9 w-14 cursor-pointer border border-border bg-transparent"
                  aria-label={tok.label}
                />
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* MODEL IZBORNIKA */}
      <div className="mt-10">
        <h2 className="font-display text-2xl">Model izbornika</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kliknite model — odmah se primjenjuje na zaglavlju cijelog sajta.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-px border border-border bg-border sm:grid-cols-3">
          {HEADER_VARIANTS.map((m) => {
            const active = (current["header-variant"] ?? "klasicni") === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setOverride(theme, "header-variant", m.key)}
                className={`p-5 text-left transition-colors ${active ? "bg-secondary" : "bg-card hover:bg-secondary/60"}`}
              >
                {/* mini skica modela */}
                <span className="flex h-8 items-center gap-1 border border-border bg-background px-2">
                  <span
                    className={`h-2 w-6 bg-foreground/70 ${m.key === "centrirani" ? "mx-auto" : ""}`}
                  />
                  {m.key === "centrirani" ? (
                    <span className="flex w-full justify-between">
                      <span className="flex gap-1">
                        <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                        <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                      </span>
                      <span className="flex gap-1">
                        <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                        <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                      </span>
                    </span>
                  ) : m.key === "minimalni" ? (
                    <span className="ml-auto flex gap-0.5 border border-muted-foreground/40 px-1 py-0.5">
                      <i className="block h-1 w-2.5 bg-muted-foreground/60" />
                      <i className="block h-1 w-2.5 bg-muted-foreground/60" />
                    </span>
                  ) : (
                    <span className="ml-auto flex gap-1">
                      <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                      <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                      <i className="block h-1.5 w-3 bg-muted-foreground/50" />
                    </span>
                  )}
                </span>
                <span className="mt-3 flex items-center justify-between">
                  <span className="text-sm font-medium">{m.label}</span>
                  {active && (
                    <span className="font-mono-label text-[10px] uppercase tracking-widest text-primary">
                      Aktivan
                    </span>
                  )}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {m.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TIPOGRAFIJA */}
      <div className="mt-10">
        <h2 className="font-display text-2xl">Tipografija</h2>
        <div className="mt-4 space-y-px border border-border bg-border">
          {FONT_PAIRS.map((p, i) => {
            const active =
              activeFontPair === i ||
              (activeFontPair === -1 && i === 0 && !current["--font-display"]);
            return (
              <button
                key={p.label}
                onClick={() => {
                  setOverride(theme, "--font-display", `'${p.display}'`);
                  setOverride(theme, "--font-body", `'${p.body}'`);
                }}
                className={`flex w-full items-center justify-between bg-card p-5 text-left transition-colors hover:bg-secondary ${active ? "border-l-2 border-l-primary" : ""}`}
              >
                <span className="text-sm">{p.label}</span>
                <span
                  className="text-2xl"
                  style={{ fontFamily: `'${p.display}', serif` }}
                >
                  Aa
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Savjet: kliknite "Vrati zadano" za povratak na izvorne tokenе teme.
        </p>
      </div>
    </div>
  );
}
