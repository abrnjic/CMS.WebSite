import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { trpc } from "@/providers/trpc";
import type { ThemeKey, ThemeDef } from "@/types";

export const THEMES: ThemeDef[] = [
  { key: "mediteran", label: "Mediteran", swatch: "#716a4b" },
  { key: "obala", label: "Obala", swatch: "#2f5d63" },
  { key: "noc", label: "Noć", swatch: "#c9a86a" },
];

export type ThemeOverrides = Partial<Record<string, string>>;
type OverridesByTheme = Partial<Record<ThemeKey, ThemeOverrides>>;

interface AppState {
  theme: ThemeKey;
  setTheme: (t: ThemeKey) => void;
  setSiteTheme: (t: ThemeKey) => void;
  savingTheme: boolean;
  themeError: string | null;
  overrides: OverridesByTheme;
  setOverride: (theme: ThemeKey, token: string, value: string) => void;
  resetOverrides: (theme: ThemeKey) => void;
}

const Ctx = createContext<AppState | null>(null);

const LS_THEME = "adriatic-stays-theme-preference";
const EMPTY_OVERRIDES: OverridesByTheme = {};

/** tokeni koje theme editor smije mijenjati */
const OVERRIDABLE = [
  "--primary",
  "--background",
  "--foreground",
  "--surface-warm",
  "--font-display",
  "--font-body",
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<ThemeKey | null>(() => {
    const t = localStorage.getItem(LS_THEME);
    return t === "mediteran" || t === "obala" || t === "noc" ? t : null;
  });
  const activeQuery = trpc.theme.active.useQuery(undefined, {
    staleTime: 15_000,
  });
  const theme = preference ?? activeQuery.data?.theme ?? "mediteran";

  // overridei iz baze (javni upit — tema mora raditi i za neprijavljene)
  const overridesQuery = trpc.theme.getAll.useQuery(undefined, {
    staleTime: 30_000,
  });
  const overrides = (overridesQuery.data ??
    EMPTY_OVERRIDES) as OverridesByTheme;

  const utils = trpc.useUtils();
  const setMutation = trpc.theme.set.useMutation({
    onSuccess: () => utils.theme.getAll.invalidate(),
  });
  const resetMutation = trpc.theme.reset.useMutation({
    onSuccess: () => utils.theme.getAll.invalidate(),
  });
  const activeMutation = trpc.theme.setActive.useMutation({
    onSuccess: (result) => {
      localStorage.removeItem(LS_THEME);
      setPreference(null);
      utils.theme.active.setData(undefined, result);
      utils.theme.active.invalidate();
    },
  });

  // primjena teme + overridea (inline stil nadjacava stylesheet)
  useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    OVERRIDABLE.forEach((k) => el.style.removeProperty(k));
    const o = overrides[theme] ?? {};
    Object.entries(o).forEach(([k, v]) => {
      if (OVERRIDABLE.includes(k) && v) el.style.setProperty(k, String(v));
    });
  }, [theme, overrides]);

  return (
    <Ctx.Provider
      value={{
        theme,
        setTheme: (t) => {
          localStorage.setItem(LS_THEME, t);
          setPreference(t);
        },
        setSiteTheme: (t) => activeMutation.mutate({ themeKey: t }),
        savingTheme:
          activeMutation.isPending ||
          setMutation.isPending ||
          resetMutation.isPending,
        themeError:
          activeMutation.error?.message ??
          setMutation.error?.message ??
          resetMutation.error?.message ??
          null,
        overrides,
        setOverride: (t, token, value) =>
          setMutation.mutate({ themeKey: t, token, value }),
        resetOverrides: (t) => resetMutation.mutate({ themeKey: t }),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp izvan AppProvidera");
  return ctx;
}
