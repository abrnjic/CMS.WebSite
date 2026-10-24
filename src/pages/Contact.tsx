import { useState, type FormEvent } from "react";
import { trpc } from "@/providers/trpc";
import { useSeo, useSiteSettings } from "@/hooks/use-seo";

export default function ContactPage() {
  useSeo({ title: "Kontakt" });
  const settings = useSiteSettings();
  const [sent, setSent] = useState(false);
  const submit = trpc.contact.submit.useMutation({
    onSuccess: () => setSent(true),
  });
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submit.isPending) return;
    const data = new FormData(event.currentTarget);
    submit.mutate({
      name: String(data.get("name")),
      email: String(data.get("email")),
      message: String(data.get("message")),
      website: String(data.get("website") ?? ""),
    });
  }
  const field =
    "mt-2 w-full border border-input bg-card px-3 py-3 outline-none focus:border-primary";
  return (
    <div className="mx-auto max-w-[900px] px-6 pb-20 pt-32 lg:px-10">
      <h1 className="font-display text-4xl">Kontakt</h1>
      <p className="mt-4 text-muted-foreground">
        Imate pitanje o smještaju ili rezervaciji? Pošaljite nam poruku.
      </p>
      {(settings.contactEmail || settings.contactPhone) && (
        <p className="mt-4">
          {settings.contactEmail} {settings.contactPhone}
        </p>
      )}
      {sent ? (
        <div role="status" className="mt-8 border border-primary bg-card p-6">
          <h2 className="font-display text-2xl">Upit je poslan</h2>
          <p className="mt-2">
            Vaša poruka je spremljena. Javit ćemo vam se na navedenu e-mail
            adresu.
          </p>
          <button
            className="mt-5 underline"
            onClick={() => {
              setSent(false);
              submit.reset();
            }}
          >
            Pošalji novi upit
          </button>
        </div>
      ) : (
        <form onSubmit={send} className="mt-8 space-y-5">
          <label className="block">
            Ime i prezime
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={255}
              className={field}
            />
          </label>
          <label className="block">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={320}
              className={field}
            />
          </label>
          <label className="block">
            Poruka
            <textarea
              name="message"
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              className={field}
            />
          </label>
          <div className="hidden" aria-hidden="true">
            <label>
              Web stranica
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <p className="text-sm text-muted-foreground">
            Podatke koristimo za obradu i odgovor na vaš upit.
          </p>
          {submit.error && (
            <p role="alert" className="text-destructive">
              {submit.error.data?.code === "TOO_MANY_REQUESTS"
                ? "Pričekajte minutu prije slanja novog upita."
                : "Upit nije poslan. Pokušajte ponovno."}
            </p>
          )}
          <button
            disabled={submit.isPending}
            className="bg-primary px-6 py-3 text-primary-foreground disabled:opacity-50"
          >
            {submit.isPending ? "Slanje…" : "Pošalji upit"}
          </button>
        </form>
      )}
    </div>
  );
}
