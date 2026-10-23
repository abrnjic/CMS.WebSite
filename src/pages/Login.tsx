import { useState } from "react";
import { useNavigate } from "react-router";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "@/lib/firebase";
import { trpc } from "@/providers/trpc";
import { useSeo } from "@/hooks/use-seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Login() {
  useSeo({ title: "Prijava", noindex: true });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const utils = trpc.useUtils();
  const navigate = useNavigate();
  async function login() {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      const user = await utils.auth.me.fetch();
      if (!user || user.role !== "admin") {
        await signOut(auth);
        utils.auth.me.setData(undefined, null);
        setError(
          "Ovaj račun nema administratorski pristup. Obratite se vlasniku stranice.",
        );
        return;
      }
      await utils.invalidate();
      const setup = await utils.setup.status.fetch();
      navigate(setup.completed ? "/admin" : "/postavljanje");
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : "";
      const messages: Record<string, string> = {
        "auth/unauthorized-domain":
          "Prijava s ove domene još nije omogućena. Obratite se administratoru.",
        "auth/operation-not-allowed":
          "Google prijava još nije omogućena. Obratite se administratoru.",
        "auth/popup-blocked":
          "Preglednik je blokirao prozor za prijavu. Dopustite skočne prozore i pokušajte ponovno.",
        "auth/popup-closed-by-user":
          "Prozor za prijavu je zatvoren. Pokušajte ponovno.",
      };
      setError(
        messages[code] ||
          "Prijava trenutačno nije dostupna. Pokušajte ponovno ili kontaktirajte administratora.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-2xl">Prijava</CardTitle>
          <p className="text-sm text-muted-foreground">
            Prijavite se za upravljanje sadržajem i rezervacijama.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="w-full" size="lg" onClick={login} disabled={busy}>
            {busy ? "Prijava…" : "Nastavi s Googleom"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
